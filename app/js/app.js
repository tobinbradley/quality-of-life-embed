/*
____________________________________
/ The index JS file, using babel and \
\ browserify.                       /
------------------------------------
       \   ^__^
        \  (oo)\_______
           (__)\       )\/\
               ||----w |
               ||     ||
*/

import getURLParameter from './modules/geturlparams';
import dataConfig from '../../data/config/data';

// set defaults
let s = [];
let m = '';
let y = 2015;
let t = '';


// Get URL arguments if passed
//     m   metric number
//     y   year
//     s   selected
//     t   map title
let keys = Object.keys(dataConfig);
m = keys[Math.floor(Math.random() * keys.length)].replace('m', '');
if (getURLParameter("m")) {
    let passedMetric = getURLParameter("m").replace('m', '');
    if (keys.indexOf(`m${passedMetric}`) !== -1) {
        m = passedMetric;
    }
}
if (getURLParameter('y') !== null) {
    y = getURLParameter('y');
}
if (getURLParameter('s') !== null) {
    s = getURLParameter('s').split(",");
}
if (getURLParameter('t') !== null) {
    t = getURLParameter('t');
}

// set iframe src
document.querySelector('.embed iframe').src = setURL(m, y, s, t);

// URL for the iframe
function setURL(m, y, s, t) {
    let url = `${window.location.href.substring(0, window.location.href.lastIndexOf("/")) + '/embed.html'}?m=${m}&y=${y}&s=${s}&t=${encodeURI(t)}&tocp=true&pitch=false`;
    return url;
}

// parent/iframe communications
window.titleChange = function (title) {
    document.querySelector("iframe").contentWindow.postMessage({"title": title}, '*');
};
window.onmessage = function(e){
    let data = e.data;
    if (data.maptitle) {
        t = data.maptitle;
        document.querySelector("#maptitle").value = t;
    }
};
