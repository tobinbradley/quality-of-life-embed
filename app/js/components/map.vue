<template lang="html">
    <div class="" style="position: relative; width: 100%; height: 100%">
        <div id="map"></div>
    </div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import {breaksRange} from '../modules/breaks';
import {prettyNumber} from '../modules/number_format';
import dataSummary from '../modules/datasummary';
import {scaleLinear} from 'd3-scale';

export default {
    name: 'sc-map',
    watch: {
        'sharedState.selected': 'styleNeighborhoods',
        'sharedState.breaks': 'updateBreaks',
        'sharedState.year': 'updateYear',
        'sharedState.zoomSelected': 'zoomSelected',
        'privateState.isPitched3D': 'toggle3D'
    },
    methods: {
        initMap: function() {
            let _this = this;
            _this.privateState.map = new mapboxgl.Map(_this.privateState.mapOptions);

            let map = _this.privateState.map;        

            // after map initiated, grab geography and intiate/style neighborhoods
            map.on('load', function () {
                axios.get('data/geography.geojson.json')
                    .then(function(response) {
                        _this.privateState.mapLoaded = true;
                        _this.privateState.geoJSON = response.data;

                        _this.initNeighborhoods();
                        //_this.selectNeighborhoods();
                        _this.styleNeighborhoods();
                        _this.zoomSelected(); 
                        _this.mapUIEvents();

                        // setTimeout(() => {
                        //     map.easeTo({
                        //     duration: 2000,
                        //     pitch: 20,
                        //     bearing: 5,
                        //     easing: (t) => {
                        //         return t * (2 - t);
                        //     }
                        //     });
                        // }, 500)
                    });
            });            

        },
        toggle3D: function() {
            let _this = this;
            let map = _this.privateState.map;
            let pitched = this.privateState.isPitched3D;


            if (pitched) {
                map.setLayoutProperty('neighborhoods', 'visibility', 'none');
                map.moveLayer('neighborhoods-fill-extrude');
                map.setPaintProperty("neighborhoods-fill-extrude", 'fill-extrusion-height', _this.getHeight());
            } else {
                map.setLayoutProperty('neighborhoods', 'visibility', 'visible');
                map.moveLayer('neighborhoods-fill-extrude', 'neighborhoods');
                map.setPaintProperty("neighborhoods-fill-extrude", 'fill-extrusion-height', 0);
            }
        },
        mapUIEvents: function() {
            let _this = this;
            let map = _this.privateState.map;        
            
            map.on('rotate', function(e) {
                if (map.getPitch() >= 20) {
                    _this.privateState.isPitched3D = true;
                } else {
                    _this.privateState.isPitched3D = false;
                }
            });

            // on feature click add or remove from selected set
            if (_this.sharedState.clickEvent === true) {
                map.on('click', function (e) {
                    var features = map.queryRenderedFeatures(e.point, { layers: ['neighborhoods-fill-extrude'] });
                    if (!features.length) {
                        return;
                    }

                    let feature = features[0];
                    let featureIndex = _this.sharedState.selected.indexOf(feature.properties.id);

                    if (featureIndex === -1) {
                        _this.sharedState.selected.push(feature.properties.id);
                    } else {
                        _this.sharedState.selected.splice(featureIndex, 1);
                    }

                    // post back to parent
                    parent.postMessage({"summary": dataSummary(_this.sharedState)}, "*");
                });
            }

            // fix for popup cancelling click event on iOS
            let iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (!iOS) {
                let popup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false
                });
                // show feature info on mouse move
                map.on('mousemove', function (e) {
                    var features = map.queryRenderedFeatures(e.point, { layers: ['neighborhoods-fill-extrude'] });
                    map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

                    if (!features.length) {
                        popup.remove();
                        return;
                    }

                    let feature = features[0];
                    let id = feature.properties.id;
                    let data = _this.sharedState.metric.data.map[id][`y_${_this.sharedState.year}`];

                    let val = prettyNumber(data, _this.sharedState.metric.config.decimals, _this.sharedState.metric.config.prefix, _this.sharedState.metric.config.suffix);

                    popup.setLngLat(map.unproject(e.point))
                        .setHTML(`<div style="text-align: center; margin: 0; padding: 0;"><h3 style="font-size: 12px; margin: 0; padding: 0; line-height: 1em; font-weight: bold; color: #727272;">NBHD ${id}</h3><div style="font-size: 16px; font-weight: bold; margin: 5px 0 0;">${val}</div></div>`)
                        .addTo(map);

                });
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

            map.addLayer({
                'id': 'neighborhoods',
                'type': 'line',
                'source': 'neighborhoods',
                'layout': {},
                'paint': {}
            }, 'highway_motorway_casing');

            map.addLayer({
                'id': 'neighborhoods-fill-extrude',
                'type': 'fill-extrusion',
                'source': 'neighborhoods',                
                'paint': {
                    'fill-extrusion-opacity': 1
                }
            }, 'neighborhoods');

        },        
        zoomSelected: function() {
            let _this = this;
            let flyOptions = {padding: {top: 65, bottom: 10, left: 10, right: 10} };          
            _this.privateState.map.fitBounds(_this.getFullBounds(), flyOptions);
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
        getOutlineColor: function() {
            const stops = [];
            let _this = this;

            _this.sharedState.selected.forEach(id => {
                stops.push([id, '#176ADF']);
            });

            let outline = {
                property: 'id',
                default: 'rgba(46,45,44,1)',
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
                default: 0.3,
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
            let color = scaleLinear()
                    .domain([_this.sharedState.breaks[0], _this.sharedState.breaks[this.sharedState.breaks.length - 1]])
                    .range(breaksRange);

            Object.keys(data).forEach(id => {
                const value = data[id][`y_${_this.sharedState.year}`];
                
                if (value !== null) {                                
                    stops.push([id, color(value)]);
                }
            });

            let fillColor = {
                property: 'id',
                default: 'rgb(30,29,28)',
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
.mapboxgl-popup-content {
    padding: 10px 10px 5px;
    color: #555;
}
</style>
