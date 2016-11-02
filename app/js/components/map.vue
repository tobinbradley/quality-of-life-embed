<template lang="html">
    <div class="" style="position: relative; width: 100%; height: 100%">
        <div id="map"></div>
        <button v-show="privateState.pitch" class="mdl-button" id="btnPitch" v-on:click="togglePitch()">
            2D/3D
        </button>
    </div>

</template>

<script>
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import geojsonDataMerge from '../modules/geojsondatamerge';
import {prettyNumber} from '../modules/number_format';
import getURLParameter from '../modules/geturlparams';

export default {
    name: 'sc-map',
    watch: {
        'sharedState.selected': 'selectNeighborhoods',
        'sharedState.breaks': 'updateBreaks',
        'sharedState.year': 'updateYear'
    },
    methods: {
        initMap: function() {
            let _this = this;
            _this.privateState.map = new mapboxgl.Map(_this.privateState.mapOptions);

            let map = _this.privateState.map;

            // disable map rotation using right click + drag and touch
            if (_this.privateState.pitch === false) {
                map.dragRotate.disable();
                map.touchZoomRotate.disableRotation();
            }

            // send new bounds to parent on move end
            if (window!=window.top) {
                map.on('moveend', function() {
                    let bounds = map.getBounds();
                    parent.postMessage({"bounds": `${bounds._sw.lng.toFixed(4)},${bounds._sw.lat.toFixed(4)},${bounds._ne.lng.toFixed(4)},${bounds._ne.lat.toFixed(4)}`},"*");
                 });
            }

            // after map initiated, grab geography and intiate/style neighborhoods
            map.on('load', function () {
                axios.get('data/geography.geojson.json')
                    .then(function(response) {
                        _this.privateState.mapLoaded = true;
                        _this.privateState.geoJSON = response.data;

                        if (_this.privateState.bounds.length === 4) {
                            let bounds = _this.privateState.bounds;
                            map.fitBounds([[bounds[0],bounds[3]], [bounds[2],bounds[1]]]);
                        }
                        else if (_this.sharedState.selected.length > 0) {
                            _this.zoomNeighborhoods();
                        }

                        _this.initNeighborhoods();
                        _this.selectNeighborhoods();
                        _this.styleNeighborhoods();
                    });
            });

            map.on('rotate', function(e) {
                if (map.getPitch() > 25) {
                    map.setPaintProperty("neighborhoods-fill", 'fill-extrude-height',
                    {
                        'type': 'identity',
                        'property': 'height'
                    });
                    map.setPaintProperty("neighborhoods-fill-selected", 'fill-extrude-height',
                    {
                        'type': 'identity',
                        'property': 'height'
                    });
                    map.setPaintProperty("neighborhoods-fill-selected", 'fill-opacity', 0.8);
                } else {
                    map.setPaintProperty("neighborhoods-fill", 'fill-extrude-height',
                    {
                        'type': 'identity',
                        'property': ''
                    });
                    map.setPaintProperty("neighborhoods-fill-selected", 'fill-extrude-height',
                    {
                        'type': 'identity',
                        'property': ''
                    });
                    map.setPaintProperty("neighborhoods-fill-selected", 'fill-opacity', 0);
                }
            });

        },
        togglePitch: function() {
            let _this = this;
            if (this.privateState.map.getPitch() === 0) {
                this.privateState.map.easeTo({pitch: 75, bearing: -40, zoom: 10});
            } else {
                this.privateState.map.easeTo({pitch: 0, bearing: 0});
            }
        },
        initNeighborhoods: function() {
            let map = this.privateState.map;
            let _this = this;
            let geoJSON =  _this.geoJSONMerge();

            map.addSource('neighborhoods', {
                type: 'geojson',
                data: geoJSON
            });

            // neighborhood boundaries
            map.addLayer({
                'id': 'neighborhoods-line',
                'type': 'line',
                'source': 'neighborhoods',
                'layout': {},
                'paint': {
                    'line-color': '#666',
                    'line-width': 0.8
                }
            }, 'building');

            // neighborhood boundaries highlight
            map.addLayer({
                'id': 'neighborhoods-line-selected',
                'type': 'line',
                'source': 'neighborhoods',
                'layout': {},
                "filter": ["in", "id", "-999999"],
                'paint': {
                    'line-color': '#ba00e4',
                    'line-width': {
                        "base": 2,
                        "stops": [
                            [
                                7,
                                2
                            ],
                            [
                                13,
                                5
                            ],
                            [
                                16,
                                8
                            ]
                        ]
                    }
                }
            }, 'water_label');
            map.addLayer({
                'id': 'neighborhoods-fill-selected',
                'type': 'fill',
                'source': 'neighborhoods',
                'layout': {},
                "filter": ["in", "id", "-999999"],
                'paint': {
                    'fill-color': '#ba00e4',
                    'fill-opacity': 0,
                    'fill-extrude-base': 0
                }
            }, 'water_label');

            map.addLayer({
                'id': 'neighborhoods-fill',
                'type': 'fill',
                'source': 'neighborhoods',
                'layout': {},
                'filter': ['!=', 'choropleth', 'null'],
                'paint': {
                    'fill-opacity': 1,
                    'fill-extrude-base': 0
                }
            }, 'neighborhoods-line');

        },
        selectNeighborhoods: function() {
            if (this.privateState.mapLoaded === true) {
                let map = this.privateState.map;
                let selected = this.sharedState.selected;
                let filter;

                if (selected.length > 0) {
                    filter = ["in", "id"];
                    for (let i = 0; i < selected.length; i++) {
                        filter.push(selected[i]);
                    }
                } else {
                    filter = ["in", "id", "-999999"];
                }

                // push selected state
                let linkMetric = '';
                if (getURLParameter("m")) {
                    linkMetric = getURLParameter("m");
                }

                map.setFilter("neighborhoods-line-selected", filter);
                map.setFilter("neighborhoods-fill-selected", filter);
            }
        },
        styleNeighborhoods: function() {
                let map = this.privateState.map;
                let breaks = this.sharedState.breaks;
                let colors = this.sharedState.colors;

                let fillColor = {
                    property: 'choropleth',
                    stops: [
                        [breaks[1], colors[0]],
                        [breaks[2], colors[1]],
                        [breaks[3], colors[2]],
                        [breaks[4], colors[3]],
                        [breaks[5], colors[4]]
                    ]
                };
                map.setPaintProperty("neighborhoods-fill", 'fill-color', fillColor);
        },
        updateChoropleth: function() {
            let _this = this;
            if (this.privateState.mapLoaded) {
                let geoJSON =  _this.geoJSONMerge();

                this.privateState.map.getSource('neighborhoods').setData(geoJSON);

                this.styleNeighborhoods();
            }
        },
        updateBreaks: function() {
            this.privateState.metricId = this.sharedState.metricId;
            this.updateChoropleth();
        },
        updateYear: function() {
            if (this.sharedState.metricId === this.privateState.metricId) {
                this.updateChoropleth();
            }
        },
        geoJSONMerge: function() {
            let _this = this;
            let geoObj = geojsonDataMerge(_this.privateState.geoJSON, _this.sharedState.metric.data.map, _this.sharedState.year);
            return geoObj;
        },
        zoomNeighborhoods: function () {
            let bounds = new mapboxgl.LngLatBounds();
            let _this = this;

            this.privateState.geoJSON.features.forEach(function(feature) {
                if (_this.sharedState.selected.indexOf(feature.properties.id) !== -1) {
                    feature.geometry.coordinates.forEach(function(coord) {
                        coord.forEach(function(el) {
                            bounds.extend(el);
                        })
                    });
                }
            });

            let flyOptions = {padding: 100};
            if (this.privateState.smaxzoom) {
                flyOptions = {padding: 100, maxZoom: this.privateState.smaxzoom};
            }

            this.privateState.map.fitBounds(bounds, flyOptions);
        }
    },
    mounted: function () {
        this.initMap();
    }

};
</script>

<style lang="css">
    #btnPitch {
        position: absolute;
        top: 4px;
        right: 4px;
        background-color: rgba(158,158,158, 0.30);
    }
</style>
