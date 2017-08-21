# Quality of Life Embed/Print

An independent project related to the [Quality of Life Dashboard](https://github.com/tobinbradley/Mecklenburg-County-Quality-of-Life-Dashboard).

[DEMO](http://mcmap.org/qol-mecklenburg/embed/)

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

## Parent/Iframe Communication

The embed listens for three different JSON messages from the parent. `{"selected": ["2", "3"]}` will change the currently selected set, including clearing all selected if an empty array is sent. `{"year": "2012"}` will change the year being shown unless that year isn't present in the data. `{"metric": "3"}` will change the metric being displayed if the metric id number is in the data config.

In addition, the embed passes back information to the parent - the years available, the current year, selected neighborhoods, values for the selected neighborhood(s), and values summarized by items specified in the data's `config/selectgroup.js` file, if any.

```json
{
    "years": [
        "2011",
        "2013",
        "2015",
        "2016"
    ],
    "year": "2016",
    "selected": [
        "396"
    ],
    "values": {
        "Jurisdiction": {
            "Cornelius": [
                "4%",
                "4%",
                "3%",
                "4%"
            ],
            "Huntersville": [
                "5%",
                "4%",
                "4%",
                "4%"
            ],
            "Pineville": [
                "17%",
                "15%",
                "15%",
                "16%"
            ],
            "Mint Hill": [
                "11%",
                "11%",
                "11%",
                "12%"
            ],
            "Matthews": [
                "5%",
                "5%",
                "5%",
                "6%"
            ],
            "Davidson": [
                "2%",
                "1%",
                "0%",
                "0%"
            ],
            "Charlotte": [
                "18%",
                "17%",
                "18%",
                "18%"
            ],
            "County": [
                "16%",
                "15%",
                "16%",
                "16%"
            ]
        },
        "City Council": {
            "District 1": [
                "24%",
                "22%",
                "22%",
                "23%"
            ],
            "District 2": [
                "24%",
                "23%",
                "25%",
                "26%"
            ],
            "District 3": [
                "26%",
                "24%",
                "25%",
                "25%"
            ],
            "District 4": [
                "15%",
                "14%",
                "15%",
                "16%"
            ],
            "District 5": [
                "25%",
                "24%",
                "26%",
                "27%"
            ],
            "District 6": [
                "8%",
                "8%",
                "7%",
                "8%"
            ],
            "District 7": [
                "3%",
                "3%",
                "3%",
                "3%"
            ]
        },
        "County Commission": {
            "District 1": [
                "7%",
                "6%",
                "6%",
                "6%"
            ],
            "District 2": [
                "29%",
                "27%",
                "29%",
                "30%"
            ],
            "District 3": [
                "23%",
                "22%",
                "23%",
                "24%"
            ],
            "District 4": [
                "25%",
                "23%",
                "24%",
                "25%"
            ],
            "District 5": [
                "7%",
                "7%",
                "6%",
                "7%"
            ],
            "District 6": [
                "7%",
                "6%",
                "6%",
                "6%"
            ]
        },
        "Neighborhood": [
            "9%",
            "10%",
            "9%",
            "9%"
        ]
    }
}
```
