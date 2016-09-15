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
import colors from './modules/breaks';
import webglCheck from './modules/webglcheck';
import Vue from 'vue';
import ToC from './components/toc.vue';
import MapGL from './components/map.vue';


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
    year: year,
    metadata: null
};

// for debugging
window.appState = appState;

// parent/iframe communications
window.onmessage = function(e){
    if (e.data.title) {
        appState.title = e.data.title;
    }
};
if (window!=window.top) {
    parent.postMessage({"maptitle": mapTitle}, "*");
}


//window.appData = appData; // for debugging etc.

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
            geoJSON: null,
            bounds: bounds
        }
    };
};

new Vue({
    el: 'body',
    components: {
        'sc-toc': ToC,
        'sc-map': MapGL
    }
});

// attribution link
if (selected.length > 0 && document.querySelector('.attribution a')) {
    document.querySelector('.attribution a').href = `http://mcmap.org/qol?m=m${metricId}&n=${selected.join(',')}`;
}
