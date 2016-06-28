import mapboxgl from 'mapbox-gl';

let Map = class {
    constructor(mapOptions, geoJSON, breaks, colors, selected = []) {
        this.mapOptions = mapOptions;
        this.geoJSON = geoJSON;
        this.breaks = breaks;
        this.colors = colors;
        this.selected = selected;
    }

    // initialize the map
    createMap() {
        this.map = new mapboxgl.Map(this.mapOptions);
        let map = this.map;
        let component = this;
        map.on('moveend', function() {
            let center = map.getCenter();
            if (window!=window.top) {
                parent.postMessage({"mapzoom": map.getZoom(), "mapcenter": [center.lng, center.lat]},"*");
            }
        });
        map.on('load', function () {
            component.neighborhoodInit();
            component.neighborhoodStyle();
            component.neighborhoodSelected();
        });
    }

    // create neighborhood layers (choropleth, regular outline, highlight outline)
    neighborhoodInit() {
        let map = this.map;
        let geoJSON = this.geoJSON;

        this.choroplethSource = map.addSource('neighborhoods', {
            'type': 'geojson',
            'data': geoJSON
        });

        map.addLayer({
            'id': 'neighborhoods-line',
            'type': 'line',
            'source': 'neighborhoods',
            'layout': {},
            'paint': {
                'line-color': '#cccccc',
                'line-width': 0.5
            }
        }, 'building');

        map.addLayer({
            'id': 'neighborhoods-line-selected',
            'type': 'line',
            'source': 'neighborhoods',
            'layout': {},
            "filter": ["in", "id", "-999999"],
            'paint': {
                'line-color': '#FFA400',
                'line-width': 5
            }
        }, 'building');

        map.addLayer({
            'id': 'neighborhoods-fill',
            'type': 'fill',
            'source': 'neighborhoods',
            'layout': {},
            'filter': ['!=', 'choropleth', 'null'],
            'paint': {
                'fill-opacity': 1
            }
        }, 'neighborhoods-line');
    }

    // filter the neighborhood line highlights
    neighborhoodSelected() {
        let map = this.map;
        let selected = this.selected;
        let filter;

        if (selected.length > 0) {
            filter = ["in", "id"];
            for (let i = 0; i < selected.length; i++) {
                filter.push(selected[i]);
            }
        } else {
            filter = ["in", "id", "-999999"];
        }

        map.setFilter("neighborhoods-line-selected", filter);
    }

    // style the neighborhood polygons
    neighborhoodStyle() {
        let breaks = this.breaks;
        let colors = this.colors;
        let map = this.map;
        let fillColor = {
            property: 'choropleth',
            stops: [
                [breaks[1], colors[0]],
                [breaks[2], colors[1]],
                [breaks[3], colors[2]],
                [breaks[4], colors[3]],
                [breaks[5], colors[4]]
            ]
        };
        map.setPaintProperty("neighborhoods-fill", 'fill-color', fillColor);
    }

};

export default Map;
