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
let b = [];
let s = [];
let m = '';
let y = 2015;
let t = '';
let container = document.querySelector("textarea");


// Get URL arguments if passed
//     b   bounds sw.lng, sw.lat, ne.lng, le.lat
//     m   metric number
//     y   year
//     s   selected
//     t   map title
if (getURLParameter('b') !== null) {
    b = getURLParameter('b').split(',');
}
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
document.querySelector('.embed iframe').src = setURL(m, y, b, s, t);
setEmbed(setURL(m, y, b, s, t), container);

// URL for the iframe
function setURL(m, y, b, s, t) {
    let url = `${window.location.href.substring(0, window.location.href.lastIndexOf("/")) + '/embed.html'}?m=${m}&y=${y}&b=${b}&s=${s}&t=${encodeURI(t)}`;
    return url;
}

// iframe tag for copying by user
function setEmbed(url, con) {
    con.value = `<iframe src="${url}" style="width: 500px; height: 500px; border: 1px solid #595959"></iframe>`;
}

// handle metric dropdown
// let mapmetric = document.querySelector('#mapmetric');
// mapmetric.value = m;
// mapmetric.onchange = function() {
//     m = this.value;
//     setEmbed(setURL(m, y, b, s, t), container);
// };

// parent/iframe communications
window.titleChange = function (title) {
    t = title;
    document.querySelector("iframe").contentWindow.postMessage({"title": t}, '*');
    setEmbed(setURL(m, y, b, s, t), container);
};
window.onmessage = function(e){
    let data = e.data;
    if (data.bounds) {
        b = data.bounds;
    }
    if (data.maptitle) {
        t = data.maptitle;
        document.querySelector("#maptitle").value = t;
    }
    setEmbed(setURL(m, y, b, s, t), container);
};
