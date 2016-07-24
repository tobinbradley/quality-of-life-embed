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
import config from '../../data/config/config';
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
let metricId = 6;
if (getURLParameter('m') !== null && config.metricConfig[`m${getURLParameter('m')}`]) {
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
} else {
    mapTitle = config.metricConfig[`m${metricId}`].title;
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
    units: config.metricConfig[`m${metricId}`].label ? config.metricConfig[`m${metricId}`].label : null,
    sigfigs: config.metricConfig[`m${metricId}`].decimals ? config.metricConfig[`m${metricId}`].decimals : 0
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
document.querySelector('.attribution a').href = `http://mcmap.org/qol?m=m${metricId}&n=${selected.join(',')}`;

// get meta
getMeta(`data/meta/m${metricId}.html`)
    .then(function(meta) {
        appData.description = metaDescription(meta.data).replace('<p>', '').replace('</p>', '').trim();
    });

// Get data
axios
    .all([
        getData(`data/metric/map${metricId}.json`),
        getGeoJSON('data/npa.geojson.json')
    ])
    .then(axios.spread(function (data, geojson) {
        // fix year if it doesn't exist
        let objTest = data.data[Object.keys(data.data)[0]];
        if (!objTest[`y_${year}`]) {
            let keys = Object.keys(objTest);
            appData.year = keys[keys.length - 1].replace('y_', '');
        }

        // add data to geojson and drop into Jenks array
        let jenksData = makeJenksArray(data.data, [appData.year]);
        let jenksBreaks = jenks(jenksData, 5);
        let thegeoJSON = geojsonDataMerge(geojson.data, data.data, appData.year);

        // toc breaks
        appData.breaks = jenksBreaks;

        // Create map
        let mapOptions = {
            container: 'map',
            style: "./style/style.json",
            attributionControl: false,
            zoom: 9.5,
            center: [-80.815,35.31],
            maxBounds: [[-78.255, 37.384],[-83.285, 33.180]],
            minZoom: 8,
            preserveDrawingBuffer: navigator.userAgent.toLowerCase().indexOf('firefox') > -1  // fix for Firefox print
        };
        let map = new Map(mapOptions, thegeoJSON, jenksBreaks, colors.breaksGnBu5, bounds, selected);
        map.createMap();

    })
);
