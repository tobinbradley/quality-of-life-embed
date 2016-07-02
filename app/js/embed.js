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
import nullSwap from './modules/objectNullSwap';
import {metaDescription} from './modules/meta';
import config from '../../data/config/config';
import jenks from './modules/jenks';
import colors from './modules/breaks';
import abbrNum from './modules/abbreviate-number';
import Map from './modules/map';
import geojsonDataMerge from './modules/geojsondatamerge';
import makeJenksArray from './modules/jenksbreaks';

// set defaults
let selected = [];
let metricId = 6;
let year = 2015;
let mapTitle = '';
let bounds = [];

// Take title change from parent
window.onmessage = function(e){
    document.querySelector('.title').innerHTML = e.data;
};

// Get URL arguments if passed
//     b   bounds sw.lng, sw.lat, ne.lng, le.lat
//     m   metric number
//     y   year
//     s   selected
//     t   map title
if (getURLParameter('b') !== 'null') {
    bounds = getURLParameter('b').split(',');
}
if (getURLParameter('m') !== 'null') {
    metricId = getURLParameter('m');
}
if (getURLParameter('y') !== 'null') {
    year = getURLParameter('y');
}
if (getURLParameter('s') !== 'null') {
    selected = getURLParameter('s').split(",");
}
if (getURLParameter('t') !== 'null') {
    mapTitle = getURLParameter('t');
}

// set legend colors
for (let i = 0; i < colors.breaksGnBu5.length; i++) {
    document.querySelector(`.legend-rect-${i}`).style.fill = colors.breaksGnBu5[i];
}

// Map title
if (mapTitle.length === 0) {
    mapTitle = year + ' ' + config.metricConfig[`m${metricId}`].title;
    document.querySelector('.title').innerHTML = mapTitle;
} else {
    document.querySelector('.title').innerHTML = mapTitle;
}
if (window!=window.top) {
    parent.postMessage({"maptitle": mapTitle}, "*");
}

// set attribution link
document.querySelector('.attribution a').href = `http://mcmap.org/qol?m=m${metricId}&n=${selected.join(',')}`;

// set map options
let mapOptions = {
    container: 'map',
    style: "./style/style.json",
    attributionControl: false,
    zoom: 9.5,
    center: [-80.83062,35.29418],
    maxBounds: [[-78.255, 37.384],[-83.285, 33.180]],
    minZoom: 8,
    preserveDrawingBuffer: navigator.userAgent.toLowerCase().indexOf('firefox') > -1  // fix for Firefox print
};

// get meta
getMeta(`data/meta/m${metricId}.html`)
    .then(function(meta) {
        // short description
        let description = metaDescription(meta.data).replace('</p>', '').trim();
        let label = nullSwap(config.metricConfig[`m${metricId}`].label);
        if (label.length > 0) {
            label = ` (${label})`;
        }
        document.querySelector('.description').innerHTML = `${description}${label}.</p>`;
    });

// Get data
axios.all([
    getData(`data/metric/map${metricId}.json`),
    getGeoJSON('data/npa.geojson.json')
])
    .then(axios.spread(function (data, geojson) {
        // add data to geojson and drop into Jenks array
        let jenksData = makeJenksArray(data.data, [year]);
        let jenksBreaks = jenks(jenksData, 5);
        let thegeoJSON = geojsonDataMerge(geojson.data, data.data, year);

        // Create map
        let map = new Map(mapOptions, thegeoJSON, jenksBreaks, colors.breaksGnBu5, bounds, selected);
        map.createMap();

        // legend labels from jenks breaks
        let dec = 0;
        if (config.metricConfig[`m${metricId}`].decimals) {
            dec = config.metricConfig[`m${metricId}`].decimals;
        }
        for (let i = 0; i < jenksBreaks.length - 1; i++) {
            document.querySelector(`.legend-label-${i}`).textContent  = abbrNum(jenksBreaks[i], 2, dec);
        }
    })
);
