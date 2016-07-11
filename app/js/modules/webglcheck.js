function webglCheck() {
    try {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    }
    catch (e) {
        let el = document.querySelector('body');
        let elChild = document.createElement('div');
        elChild.classList.add('oldie');
        elChild.innerHTML = 'You are using an outdated browser. <a href="http://whatbrowser.org/" target="_blank">Upgrade your browser today</a> to better experience this site.';
        el.insertBefore(elChild, el.firstChild);
    }
}

export default webglCheck;
