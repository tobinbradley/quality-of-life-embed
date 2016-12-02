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
let container = document.querySelector("textarea");


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
setEmbed(setURL(m, y, s, t), container);

// URL for the iframe
function setURL(m, y, s, t) {
    let url = `${window.location.href.substring(0, window.location.href.lastIndexOf("/")) + '/embed.html'}?m=${m}&y=${y}&s=${s}&t=${encodeURI(t)}&tocp=true`;
    return url;
}

// iframe tag for copying by user
function setEmbed(url, con) {
    con.value = `<iframe src="${url}" style="width: 500px; height: 500px; border: 1px solid #595959"></iframe>`;
}

// parent/iframe communications
window.titleChange = function (title) {
    t = title;
    document.querySelector("iframe").contentWindow.postMessage({"title": t}, '*');
    setEmbed(setURL(m, y, s, t), container);
};
window.onmessage = function(e){
    let data = e.data;
    if (data.maptitle) {
        t = data.maptitle;
        document.querySelector("#maptitle").value = t;
    }
    setEmbed(setURL(m, y, s, t), container);
};
