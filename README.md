# Quality of Life Embed/Print

This project hasn't yet been deployed to [our public site](http://mcmap.org/qol/) and is still in development.

## Setup

``` bash
git clone https://github.com/tobinbradley/quality-of-life-embed.git
cd quality-of-life-embed
git clone https://github.com/tobinbradley/mecklenburg-quality-of-life-data data
npm run datagen
npm run build
```

## Start the project

``` bash
npm run start
```

## URL Arguments

*   *m*: metric id (integer)
*   *t*: title
*   *b*: map bounds (sw.lng, sw.lat, ne.lng, ne.lat)
*   *s*: selected geography (id1, id2, ...)
*   *y*: metric year (i.e. 2010)
