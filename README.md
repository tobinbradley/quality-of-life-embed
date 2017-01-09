# Quality of Life Embed/Print

An independent project related to the [Quality of Life Dashboard](https://github.com/tobinbradley/Mecklenburg-County-Quality-of-Life-Dashboard).

[DEMO](http://mcmap.org/qol-embed/)

## Setup

``` bash
git clone https://github.com/tobinbradley/quality-of-life-embed.git
cd quality-of-life-embed
git clone https://github.com/tobinbradley/mecklenburg-quality-of-life-data data
npm install
npm run datagen
npm run build
```

## Start the project

``` bash
npm run start
```

## Build for production

``` bash
npm run build
```

## URL Arguments

All URL arguments are optional. If no metric is passed, a random metric appears. If no year is passed, the most recent year for the given metric is shown. 

Metrics and years are validated. If a bad metric ID is passed, a random metric is selected. If an unavailable year is passed, the most recent year is selected.

*   *m*: metric id (integer)
*   *t*: title
*   *b*: map bounds (sw.lng, sw.lat, ne.lng, ne.lat)
*   *s*: selected geography (id1, id2, ...)
*   *y*: metric year (integer)
*   *pitch*: allow 3d pitching of map and show 2d/3d button (default false)
*   *smaxzoom*: set maximum zoom level when zooming in to selected geography
*   *tocp*: show table of contents positioning arrows (default false)


// Get URL arguments if passed
//     m   metric number
//     y   year
//     s   selected
//     t   map title
//     pitch    whether map can pitch or not (default false)
//     smaxzoom  sets maximum zoom level when flying to selected neighborhoods
//     tocp set whether TOC position icons appear (default false)