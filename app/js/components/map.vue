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

            // after map initiated, grab geography and intiate/style neighborhoods
            map.on('load', function () {
                axios.get('data/geography.geojson.json')
                    .then(function(response) {
                        _this.privateState.mapLoaded = true;
                        _this.privateState.geoJSON = response.data;

                        // zoom to stuff;
                        let bounds;
                        let flyOptions = {padding: 50};
                        if (_this.sharedState.selected.length === 0) {
                            bounds = _this.getFullBounds();
                        } else {
                            bounds = _this.getSelectedBounds();
                            if (_this.privateState.smaxzoom) {
                                flyOptions.maxZoom = _this.privateState.smaxzoom;
                            }
                        }
                        _this.privateState.map.fitBounds(bounds, flyOptions);

                        _this.initNeighborhoods();
                        _this.selectNeighborhoods();
                        _this.styleNeighborhoods();
                    });
            });

            map.on('rotate', function(e) {
                if (map.getPitch() > 25) {
                    map.setLayoutProperty('neighborhoods-fill-extrude', 'visibility', 'visible');
                    map.setLayoutProperty('neighborhoods-fill-selected', 'visibility', 'visible');
                } else {
                    map.setLayoutProperty('neighborhoods-fill-extrude', 'visibility', 'none');
                    map.setLayoutProperty('neighborhoods-fill-selected', 'visibility', 'none');
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
                'type': 'fill-extrusion',
                'source': 'neighborhoods',
                'layout': {
                    'visibility': 'none'
                },
                "filter": ["in", "id", "-999999"],
                'paint': {
                    'fill-extrusion-color': '#ba00e4',
                    'fill-extrusion-opacity': 0.7,
                    'fill-extrusion-height': {
                        'type': 'identity',
                        'property': 'height'
                    }
                }
            }, 'water_label');

            map.addLayer({
                'id': 'neighborhoods-fill',
                'type': 'fill',
                'source': 'neighborhoods',
                'filter': ['!=', 'choropleth', 'null'],
                'paint': {
                }
            }, 'neighborhoods-line');

            map.addLayer({
                'id': 'neighborhoods-fill-extrude',
                'type': 'fill-extrusion',
                'source': 'neighborhoods',
                'layout': {
                    'visibility': 'none'
                },
                'filter': ['!=', 'choropleth', 'null'],
                'paint': {
                    'fill-extrusion-opacity': 0.7,
                    'fill-extrusion-height': {
                        'type': 'identity',
                        'property': 'height'
                    }
                }
            }, 'neighborhoods-fill-selected');

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
                map.setPaintProperty("neighborhoods-fill-extrude", 'fill-extrusion-color', fillColor);
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
        getFullBounds: function() {
            let bounds = new mapboxgl.LngLatBounds();
            let _this = this;

            this.privateState.geoJSON.features.forEach(function(feature) {
                feature.geometry.coordinates.forEach(function(coord) {
                    coord.forEach(function(el) {
                        bounds.extend(el);
                    })
                });
            });

            return bounds;
        },
        getSelectedBounds: function() {
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

            return bounds;
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
