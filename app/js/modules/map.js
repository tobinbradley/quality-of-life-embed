import mapboxgl from 'mapbox-gl';

let Map = class {
    constructor(mapOptions, geoJSON, breaks, colors, bounds = [], selected = []) {
        this.mapOptions = mapOptions;
        this.geoJSON = geoJSON;
        this.breaks = breaks;
        this.colors = colors;
        this.selected = selected;
        this.bounds = bounds;
    }

    // initialize the map
    createMap() {
        this.map = new mapboxgl.Map(this.mapOptions);
        let map = this.map;
        let component = this;
        let bounds = this.bounds;

        // send new bounds to parent on move end
        if (window!=window.top) {
            map.on('moveend', function() {
                let bounds = map.getBounds();
                parent.postMessage({"bounds": `${bounds._sw.lng.toFixed(4)},${bounds._sw.lat.toFixed(4)},${bounds._ne.lng.toFixed(4)},${bounds._ne.lat.toFixed(4)}`},"*");
            });
        }

        // after map initiated, intiate and style neighborhoods and zoom to bounds
        map.on('load', function () {
            component.neighborhoodInit();
            component.neighborhoodStyle();
            component.neighborhoodSelected();
            if (bounds.length === 4) {
                map.fitBounds([[bounds[0],bounds[1]],[bounds[2],bounds[3]]]);
            }
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

        // neighborhood boundaries
        map.addLayer({
            'id': 'neighborhoods-line',
            'type': 'line',
            'source': 'neighborhoods',
            'layout': {},
            'paint': {
                'line-color': '#ffffff',
                'line-width': 0.8
            }
        }, 'building');

        // neighborhood boundaries highlight
        map.addLayer({
            'id': 'neighborhoods-line-selected',
            'type': 'line',
            'source': 'neighborhoods',
            'layout': {},
            "filter": ["in", "id", "-999999"],
            'paint': {
                'line-color': '#ba00e4',
                'line-width': {
                    "base": 2,
                    "stops": [
                        [
                            7,
                            2
                        ],
                        [
                            13,
                            5
                        ],
                        [
                            16,
                            8
                        ]
                    ]
                }
            }
        }, 'water_label');

        // neighborhoods choropleth
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
