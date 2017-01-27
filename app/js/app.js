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
import getURLParameter from './modules/geturlparams';
import fetchData from './modules/fetch';
import dataConfig from '../../data/config/data';
import mapConfig from '../../data/config/map';
//import siteConfig from '../../data/config/site';
import colors from './modules/breaks';
import webglCheck from './modules/webglcheck';
import Vue from 'vue';
import ToC from './components/toc.vue';
import MapGL from './components/map.vue';


webglCheck();  // Make sure WebGL is in da house

// Get URL arguments if passed
//     m   metric number
//     y   year
//     s   selected


// get random metric if none provided and validate provided
let keys = Object.keys(dataConfig);
let metricId = keys[Math.floor(Math.random() * keys.length)].replace('m', '');
if (getURLParameter("m")) {
    let passedMetric = getURLParameter("m").replace('m', '');
    if (keys.indexOf(`m${passedMetric}`) !== -1) {
        metricId = passedMetric;
    }
}
let year = 2015;
if (getURLParameter('y') !== null) {
    year = getURLParameter('y');
}
let selected = [];
if (getURLParameter('s') !== null) {
    selected = getURLParameter('s').split(",");
}

// the shared state between components
let appState = {
    metric: {
        config: null,
        years: [],
        data: null
    },
    colors: colors.breaksGnBu5,
    breaks: null,
    selected: selected,
    zoomSelected: [],
    year: year,
    metadata: null,
    title: dataConfig[`m${metricId}`].title
};

// for debugging
window.appState = appState;

// parent/iframe communications
window.onmessage = function(e){
    if (e.data.selected) {
        appState.selected = e.data.selected;
        appState.zoomSelected = e.data.selected.slice(0);
    }
    if (e.data.year) {
        appState.year = e.data.year;
    }
    if (e.data.metric) {
        appState.title = dataConfig[`m${e.data.metric}`].title;
        fetchData(appState, e.data.metric);
        parent.postMessage({"maptitle": appState.title}, "*");
    }
};



// grab initial data
fetchData(appState, metricId);

// set up vue components
ToC.data = function() {
    return {
        sharedState: appState,
        privateState: {
            metaDesc: null,
            selected: null,
            area: null,
            selectedRaw: null,
            areaRaw: null
        }
    };
};

MapGL.data = function() {
    return {
        sharedState: appState,
        privateState: {
            locate: null,
            mapOptions: {
                container: 'map',
                style: mapConfig.style,                
                attributionControl: false,
                zoom: mapConfig.zoomEmbed,
                center: mapConfig.centerEmbed,
                maxBounds: mapConfig.maxBounds,
                minZoom: mapConfig.minZoom,
                preserveDrawingBuffer: mapConfig.preserveDrawingBuffer
            },
            mapLoaded: false,
            metricId: null,
            geoJSON: null
        }
    };
};

new Vue({
    el: 'sc-toc',
    render: h => h(ToC)
});
new Vue({
    el: 'sc-map',
    render: h => h(MapGL)
});


