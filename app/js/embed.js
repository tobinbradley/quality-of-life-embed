/*
____________________________________
/ The main JS file, using babel and \
\ browserify.                       /
------------------------------------
       \   ^__^
        \  (oo)\_______
           (__)\       )\/\
               ||----w |
               ||     ||
*/


// Fix for axios on IE11
require('es6-promise').polyfill();

//import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import getURLParameter from './modules/geturlparams';
import {getMeta, getData, getGeoJSON} from './modules/fetch';
import isNumeric from './modules/validate-number';
import getSubstringIndex from './modules/substring-nth';
import config from '../../data/config/config';
import jenks from './modules/jenks';
import colors from './modules/breaks';
import abbrNum from './modules/abbreviate-number';
import Map from './modules/map';

// set defaults
let mapCenter = [-80.8044, 35.2585];
let mapZoom = 9;
let selected = [];
let metricId = 6;
let year = 2015;
let mapTitle = '';


// get map extent
if (getURLParameter('c') !== 'null') {
    mapCenter = getURLParameter('c').split(',');
}
if (getURLParameter('z') !== 'null') {
    mapZoom = getURLParameter('z');
}
// get metric
if (getURLParameter('m') !== 'null') {
    metricId = getURLParameter('m');
}
// get year
if (getURLParameter('y') !== 'null') {
    year = getURLParameter('y');
}
// get selected
if (getURLParameter('s') !== 'null') {
    selected = getURLParameter('s').split(",");
}
// get title
if (getURLParameter('t') !== 'null') {
    mapTitle = getURLParameter('t');
}


// set attribution
document.querySelector('.attribution a').href = `http://mcmap.org/qol?m=m${metricId}`;

// Firefox won't print a GL map unless preserveDrawingBuffer is set to true,
// so check for Firefox here.
function fixFirefoxPrint() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

// map options
let mapOptions = {
    container: 'map', // container id
    style: "./style/style.json", //stylesheet location
    attributionControl: false,
    zoom: mapZoom,
    center: mapCenter,
    maxBounds: [[-78.255, 37.384],[-83.285, 33.180]],
    minZoom: 7,
    preserveDrawingBuffer: fixFirefoxPrint()
};


// Fetch data and do all the things
axios.all([
    getMeta(`data/meta/m${metricId}.html`),
    getData(`data/metric/map${metricId}.json`),
    getGeoJSON('data/npa.geojson.json')
])
.then(axios.spread(function (meta, data, geojson) {
    // add data to geojson and drop into Jenks array
    let jenksData = [];
    for (let i = 0; i < geojson.data.features.length; i++) {
        if (isNumeric(data.data[geojson.data.features[i].properties.id][`y_${year}`])) {
            geojson.data.features[i].properties.choropleth = data.data[geojson.data.features[i].properties.id][`y_${year}`];
            jenksData.push(data.data[geojson.data.features[i].properties.id][`y_${year}`]);
        } else  {
            geojson.data.features[i].properties.choropleth = 'null';
        }
    }
    let jenksBreaks = jenks(jenksData, 5);

    // Create map
    let map = new Map(mapOptions, geojson.data, jenksBreaks, colors.breaksGnBu5, selected);
    map.createMap();

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

    // short description
    let description = meta.data.substring(getSubstringIndex(meta.data, '</h2>', 1) + 5, getSubstringIndex(meta.data, '<h3', 1));
    document.querySelector('.description').innerHTML = description;
    let label = '';
    if ( config.metricConfig[`m${metricId}`].label) {
        label += ` (${ config.metricConfig[`m${metricId}`].label})`;
    }
    label += '.';
    document.querySelector('.description p').innerHTML = document.querySelector('.description p').innerHTML + label;

    // legend labels
    let dec = 0;
    if (config.metricConfig[`m${metricId}`].decimals) {
        dec = config.metricConfig[`m${metricId}`].decimals;
    }
    for (let i = 0; i < colors.breaksGnBu5.length; i++) {
        document.querySelector(`.legend-rect-${i}`).style.fill = colors.breaksGnBu5[i];
    }
    for (let i = 0; i < jenksBreaks.length; i++) {
        document.querySelector(`.legend-label-${i}`).textContent  = abbrNum(jenksBreaks[i], 2, dec);
    }

}));


// Take title change from parent
window.onmessage = function(e){
    document.querySelector('.title').innerHTML = e.data;
};
