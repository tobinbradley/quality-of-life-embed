import getURLParameter from './modules/geturlparams';

// set defaults
let b = [];
let s = [];
let m = 6;
let y = 2015;
let t = '';
let container = document.querySelector("textarea");


// get map extent
if (getURLParameter('b') !== 'null') {
    b = getURLParameter('b').split(',');
}

// get variable
if (getURLParameter('m') !== 'null') {
    m = getURLParameter('m');
}

// get year
if (getURLParameter('y') !== 'null') {
    y = getURLParameter('y');
}

// get selected
if (getURLParameter('s') !== 'null') {
    s = getURLParameter('s').split(",");
}

// get title
if (getURLParameter('t') !== 'null') {
    t = getURLParameter('t');
}

// set iframe src
document.querySelector('.embed iframe').src = setURL(m, y, b, s, t);
setEmbed(setURL(m, y, b, s, t), container);

function setURL(m, y, b, s, t) {
    let url = `${window.location.href.substring(0, window.location.href.lastIndexOf("/")) + '/embed.html'}?m=${m}&y=${y}&b=${b}&s=${s}&t=${encodeURI(t)}`;
    return url;
}

function setEmbed(url, con) {
    con.value = `<iframe src="${url}" width="500px" height="600px"></iframe>`;
}

window.titleChange = function (title) {
    t = title;
    document.querySelector("iframe").contentWindow.postMessage(t, '*');
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
