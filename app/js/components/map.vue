<template lang="html">
    <div class="" style="position: relative; width: 100%; height: 100%">
        <div id="map"></div>
    </div>
</template>

<script>
//import mapboxgl from 'mapbox-gl';
import mapboxgl from 'mapbox-gl/src/index.js';
import axios from 'axios';
import geojsonDataMerge from '../modules/geojsondatamerge';
import {prettyNumber} from '../modules/number_format';
import dataSummary from '../modules/datasummary';

export default {
    name: 'sc-map',
    watch: {
        'sharedState.selected': 'selectNeighborhoods',
        'sharedState.breaks': 'updateBreaks',
        'sharedState.year': 'updateYear',
        'sharedState.zoomSelected': 'zoomSelected'
    },
    methods: {
        initMap: function() {
            let _this = this;
            _this.privateState.map = new mapboxgl.Map(_this.privateState.mapOptions);

            let map = _this.privateState.map;

            // add nav control
            //var nav = new mapboxgl.NavigationControl();
            //map.addControl(nav, 'top-right');    

            // add pitch toggle control
            //map.addControl(new PitchToggle({minpitchzoom: 10}));
            //map.addControl(new mapboxgl.FullscreenControl());         

            // after map initiated, grab geography and intiate/style neighborhoods
            map.on('load', function () {
                axios.get('data/geography.geojson.json')
                    .then(function(response) {
                        _this.privateState.mapLoaded = true;
                        _this.privateState.geoJSON = response.data;

                        _this.initNeighborhoods();
                        _this.selectNeighborhoods();
                        _this.styleNeighborhoods();
                        _this.zoomSelected(); 
                        _this.mapUIEvents();

                        setTimeout(() => {
                            map.easeTo({
                            duration: 2000,
                            pitch: 30,
                            bearing: 7,
                            easing: (t) => {
                                return t * (2 - t);
                            }
                            });
                        }, 500)
                    });
            });

            

        },
        mapUIEvents: function() {
            let _this = this;
            let map = _this.privateState.map;           

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
                    let val = prettyNumber(feature.properties.choropleth, _this.sharedState.metric.config.decimals, _this.sharedState.metric.config.prefix, _this.sharedState.metric.config.suffix);

                    popup.setLngLat(map.unproject(e.point))
                        .setHTML(`<div style="text-align: center; margin: 0; padding: 0;"><h3 style="font-size: 12px; margin: 0; padding: 0; line-height: 1em; font-weight: bold; color: #727272;">NBHD ${feature.properties.id}</h1><span style="font-size: 16px; font-weight: bold; margin: 5px 0; display: block;">${val}</span></div>`)
                        .addTo(map);

                });
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
            
            map.addLayer({
                'id': 'neighborhoods-fill-selected',
                'type': 'fill-extrusion',
                'source': 'neighborhoods',
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
                'id': 'neighborhoods-fill-extrude',
                'type': 'fill-extrusion',
                'source': 'neighborhoods',                
                // 'filter': ['!=', 'choropleth', 'null'],
                'paint': {
                    'fill-extrusion-opacity': 1,
                    'fill-extrusion-height': {
                        'type': 'identity',
                        'property': 'height'
                    }
                }
            }, 'neighborhoods-fill-selected');

        },
        selectNeighborhoods: function() {
            let _this = this;
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

                
                map.setFilter("neighborhoods-fill-selected", filter);

            }
        },
        zoomSelected: function() {
            let bounds;
            let _this = this;
            let flyOptions = {padding: 50};
            if (_this.sharedState.selected.length === 0) {
                bounds = _this.getFullBounds();
            } else {
                bounds = _this.getSelectedBounds();
            }
            _this.privateState.map.fitBounds(bounds, flyOptions);
        },
        styleNeighborhoods: function() {
                let map = this.privateState.map;
                let breaks = this.sharedState.breaks;
                let colors = this.sharedState.colors;
                let _this = this;

                let fillColor = {
                    property: 'id',
                    default: '#ccc',
                    type: 'categorical',
                    stops: _this.getColorStops()
                };
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
        },
        getColor: function(value) {
            const begin = {red: 255, green: 255, blue: 204};
            const end = {red: 128, green: 0, blue: 38};
            const percentage = this.getPercentage(value) / 100;

            const red = begin.red + Math.floor(percentage * (end.red - begin.red));
            const green = begin.green + Math.floor(percentage * (end.green - begin.green));
            const blue = begin.blue + Math.floor(percentage * (end.blue - begin.blue));
            
            return `rgb(${red},${green},${blue})`;
        },
        getColorStops: function () {
            const stops = [];
            let _this = this;
            let min = this.sharedState.breaks[0];
            let max = this.sharedState.breaks[this.sharedState.breaks.length - 1];
            let data = _this.sharedState.metric.data.map;

            Object.keys(data).forEach(id => {
                const value = data[id][`y_${_this.sharedState.year}`];

                if (!value || isNaN(value)) {
                return;
                }

                const color = this.getColor(value, min, max);
                stops.push([id, color]);
            });

            return stops;
        },
        getPercentage: function(value) {
            if (!Number(value)) {
                return 0;
            }

            let min = this.sharedState.breaks[0];
            let max = this.sharedState.breaks[this.sharedState.breaks.length - 1];

            const totalDiff = max - min,
                valueDiff = value - min;
            let percentage = valueDiff / totalDiff * 100;

            percentage = Math.max(percentage, 0);
            percentage = Math.min(percentage, 100);

            return percentage;
        }
    },
    mounted: function () {
        this.initMap();
    }

};
</script>

