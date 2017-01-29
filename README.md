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

*   *m*: metric id (integer), if none passed will select random
*   *s*: selected geography (id1, id2, ...)
*   *y*: metric year (integer), if none passed will get most recent year available
