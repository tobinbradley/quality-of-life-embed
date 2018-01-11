<template lang="html">
    <div class="" style="position: relative; width: 100%; height: 100%">
        <div id="map"></div>
    </div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import geojsonDataMerge from '../modules/geojsondatamerge';
import {prettyNumber} from '../modules/number_format';
import getURLParameter from '../modules/geturlparams';
import {scaleLinear} from 'd3-scale';

export default {
    name: 'sc-map',
    watch: {
        'sharedState.selected': 'selectNeighborhoods',
        'sharedState.breaks': 'updateBreaks',
        'sharedState.year': 'updateYear',
        'sharedState.selected': 'styleNeighborhoods',
        'sharedState.highlight': 'styleNeighborhoods',
        'sharedState.breaks': 'updateBreaks',
        'sharedState.year': 'updateYear'
    },
    methods: {
        initMap: function() {
            let _this = this;
            _this.privateState.map = new mapboxgl.Map(_this.privateState.mapOptions);

            let map = _this.privateState.map;

            // add nav control
            var nav = new mapboxgl.NavigationControl();
            map.addControl(nav, 'top-right');

            // disable map rotation using right click + drag and touch
            if (_this.privateState.pitch === false) {
                //map.dragRotate.disable();
                map.touchZoomRotate.disableRotation();
            }

            // after map initiated, grab geography and intiate/style neighborhoods
            map.on('load', function () {
                axios.get('data/geography.geojson.json')
                    .then(function(response) {                                              
                        _this.privateState.mapLoaded = true;
                        _this.privateState.geoJSON = response.data;
                        _this.initNeighborhoods();
                        _this.styleNeighborhoods();
                        _this.initMapEvents();
                        
                        if (_this.sharedState.selected.length > 0) {
                            _this.zoomNeighborhoods();
                        }
                    });
            });
            
                     

        },
        initMapEvents: function() {
            let map = this.privateState.map;
            let _this = this;
            
            map.on('rotate', function(e) {
                if (map.getPitch() >= 20) {
                    _this.toggle3D();
                } else {
                    _this.toggle3D();
                }
            });   
        },
        toggle3D: function() {
            let _this = this;
            let map = _this.privateState.map;
            let pitched;
            
            map.getPitch() >= 20 ? pitched = true: pitched = false;
            
            if (pitched) {
                map.setLayoutProperty('neighborhoods', 'visibility', 'none');
                map.moveLayer('neighborhoods-fill-extrude');
                map.setPaintProperty("neighborhoods-fill-extrude", 'fill-extrusion-height', _this.getHeight());
            } else {
                map.setLayoutProperty('neighborhoods', 'visibility', 'visible');
                map.moveLayer('neighborhoods-fill-extrude', 'building');
                map.setPaintProperty("neighborhoods-fill-extrude", 'fill-extrusion-height', 0);
            }
        },
        initNeighborhoods: function() {
            let map = this.privateState.map;
            let _this = this;
            let geoJSON =  _this.privateState.geoJSON;

            map.addSource('neighborhoods', {
                type: 'geojson',
                data: geoJSON
            });

            // neighborhood boundaries
            map.addLayer({
                'id': 'neighborhoods',
                'type': 'line',
                'source': 'neighborhoods',
                'layout': {},
                'paint': {}
            }, 'place_other');

            map.addLayer({
                'id': 'neighborhoods-fill-extrude',
                'type': 'fill-extrusion',
                'source': 'neighborhoods',
                //'filter': ['!=', 'choropleth', 'null'],
                'paint': {
                    'fill-extrusion-opacity': 1
                }
            }, 'building');

            // markers layer
             map.addSource("markers", {
                 "type": "geojson",
                 "data": {
                     "type": "FeatureCollection",
                     "features": []
                 }
             });
             map.addLayer({
                 "id": "markers",
                 "type": "symbol",
                 "source": "markers",
                 "layout": {
                     "icon-image": "star-11",
                     "icon-size": 1.7
                 }
            });

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
            let _this = this;

            map.setPaintProperty("neighborhoods-fill-extrude", 'fill-extrusion-color', _this.getColors());
            map.setPaintProperty("neighborhoods", 'line-color', _this.getOutlineColor());
            map.setPaintProperty("neighborhoods", 'line-width', _this.getOutlineWidth());
            if (_this.privateState.isPitched3D) {
                map.setPaintProperty("neighborhoods-fill-extrude", 'fill-extrusion-height', _this.getHeight());
            }
        },
        updateChoropleth: function() {
            let _this = this;
            if (this.privateState.mapLoaded) {
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

            this.privateState.map.fitBounds(bounds, {padding: 100});
        },
        getOutlineColor: function() {
            const stops = [];
            let _this = this;

            _this.sharedState.selected.forEach(id => {
                stops.push([id, '#ba00e4']);
            });

            let outline = {
                property: 'id',
                default: 'rgba(0,0,0,1)',
                type: 'categorical',
                stops: stops
            }

            if (stops.length > 0) {
                return outline;
            } else {
                return outline.default
            }
        },
        getOutlineWidth: function() {
            const stops = [];
            let _this = this;

            _this.sharedState.selected.forEach(id => {
                stops.push([id, 4]);
            });

            let outlineSize = {
                property: 'id',
                default: 0.4,
                type: 'categorical',
                stops: stops
            }

            if (stops.length > 0) {
                return outlineSize;
            } else {
                return outlineSize.default;
            }

            return stops;
        },
        getColors: function () {
            const stops = [];
            let _this = this;
            let data = _this.sharedState.metric.data.map;
            let breaks = this.sharedState.breaks;
            let colors = this.sharedState.colors;

            let color = function(val) {
                if (val <= breaks[1]) {
                    return colors[0];
                } else if (val <= breaks[2]) {
                    return colors[1];
                }
                 else if (val <= breaks[3]) {
                    return colors[2];
                }
                 else if (val <= breaks[4]) {
                    return colors[3];
                }
                 else if (val <= breaks[5]) {
                    return colors[4];
                }
            };

            Object.keys(data).forEach(id => {
                const value = data[id][`y_${_this.sharedState.year}`];

                if (_this.sharedState.highlight.indexOf(id) !== -1) {
                  stops.push([id, '#F7E55B']);
                } else if (value !== null) {
                    stops.push([id, color(value)]);
                }
            });

            let fillColor = {
                property: 'id',
                default: 'rgb(242,243,240)',
                type: 'categorical',
                stops: stops
            };

            return fillColor;
        },
        getHeight: function() {
            let _this = this;
            const stops = [];
            let data = _this.sharedState.metric.data.map;

            let heightAdjust = scaleLinear()
                    .domain([_this.sharedState.breaks[0], _this.sharedState.breaks[this.sharedState.breaks.length - 1]])
                    .range([0, 3000]);

            Object.keys(data).forEach(id => {
                const value = data[id][`y_${_this.sharedState.year}`];
                if (value !== null) {
                    stops.push([id, heightAdjust(value)]);
                }
            });

            let height = {
                property: 'id',
                default: 0,
                type: 'categorical',
                stops: stops
            }


            return height;
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
