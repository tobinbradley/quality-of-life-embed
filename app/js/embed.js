/*
____________________________________
/ The embed JS file, using babel and \
\ browserify.                       /
------------------------------------
       \   ^__^
        \  (oo)\_______
           (__)\       )\/\
               ||----w |
               ||     ||
*/

require('es6-promise').polyfill();  // fix for Axois on IE11
import axios from 'axios';
import getURLParameter from './modules/geturlparams';
import {getMeta, getData, getGeoJSON} from './modules/fetch';
import {metaDescription} from './modules/meta';
import dataConfig from '../../data/config/data';
import mapConfig from '../../data/config/map';
import jenks from './modules/jenks';
import colors from './modules/breaks';
import Map from './modules/map';
import geojsonDataMerge from './modules/geojsondatamerge';
import makeJenksArray from './modules/jenksbreaks';
import webglCheck from './modules/webglcheck';
import Vue from 'vue';
import Toc from './components/toc.vue';


webglCheck();  // Make sure WebGL is in da house

// Get URL arguments if passed
//     b   bounds sw.lng, sw.lat, ne.lng, le.lat
//     m   metric number
//     y   year
//     s   selected
//     t   map title
let bounds = [];
if (getURLParameter('b') !== null) {
    bounds = getURLParameter('b').split(',');
}
let metricId = '';
if (getURLParameter('m') !== null && dataConfig[`m${getURLParameter('m')}`]) {
    metricId = getURLParameter('m');
}
let year = 2015;
if (getURLParameter('y') !== null) {
    year = getURLParameter('y');
}
let selected = [];
if (getURLParameter('s') !== null) {
    selected = getURLParameter('s').split(",");
}
let mapTitle = '';
if (getURLParameter('t') !== null) {
    mapTitle = getURLParameter('t');
} else if (dataConfig[`m${metricId}`]) {
    mapTitle = dataConfig[`m${metricId}`].title;
}


// parent/iframe communications
window.onmessage = function(e){
    if (e.data.title) {
        appData.title = e.data.title;
    }
};
if (window!=window.top) {
    parent.postMessage({"maptitle": mapTitle}, "*");
}


// app data cache
let appData = {
    title: mapTitle,
    breaks: null,
    color: colors.breaksGnBu5,
    description: '',
    year: year,
    units: dataConfig[`m${metricId}`] && dataConfig[`m${metricId}`].label ? dataConfig[`m${metricId}`].label : null,
    sigfigs: dataConfig[`m${metricId}`] && dataConfig[`m${metricId}`].decimals ? dataConfig[`m${metricId}`].decimals : 0
};
//window.appData = appData; // for debugging etc.

// set up vue components
Toc.data = function() { return appData; };
new Vue({
    el: 'body',
    components: {
        'sc-toc': Toc
    }
});

// attribution link
if (selected.length > 0 && document.querySelector('.attribution a')) {
    document.querySelector('.attribution a').href = `http://mcmap.org/qol?m=m${metricId}&n=${selected.join(',')}`;
}


// set routes and get meta
let fetchRoutes = [getGeoJSON('data/geography.geojson.json')];
if (metricId.length > 0) {
    fetchRoutes.push(getData(`data/metric/map${metricId}.json`));
    getMeta(`data/meta/m${metricId}.html`)
        .then(function(meta) {
            appData.description = metaDescription(meta.data).replace('<p>', '').replace('</p>', '').trim();
        });
}

// Get data
axios
    .all(fetchRoutes)
    .then(axios.spread(function (geojson, data) {
        let thegeoJSON = geojson.data;
        if (data) {
            // fix year if it doesn't exist
            let objTest = data.data[Object.keys(data.data)[0]];
            if (!objTest[`y_${year}`]) {
                let keys = Object.keys(objTest);
                appData.year = keys[keys.length - 1].replace('y_', '');
            }

            // add data to geojson and drop into Jenks array
            var jenksData = makeJenksArray(data.data, [appData.year]);
            var jenksBreaks = jenks(jenksData, 5);
            thegeoJSON = geojsonDataMerge(geojson.data, data.data, appData.year);

            // toc breaks
            appData.breaks = jenksBreaks;
        }

        // Create map
        let mapOptions = {
            container: 'map',
            style: mapConfig.style,
            attributionControl: false,
            zoom: mapConfig.zoom,
            center: mapConfig.center,
            maxBounds: mapConfig.maxBounds,
            minZoom: mapConfig.minZoom,
            preserveDrawingBuffer: mapConfig.preserveDrawingBuffer
        };
        let map = new Map(mapOptions, thegeoJSON, appData.breaks, colors.breaksGnBu5, bounds, selected);
        map.createMap();
    })
);
