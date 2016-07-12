// toc.vue
<style>
    #toc {
        position: absolute;
        top: 10px;
        left: 10px;
        width: 260px;
        background: white;
        box-shadow: 0 1px 3px #666, 0 6px 5px -5px #666;
    }
    .title, .description, .legend {
      position: relative;
      z-index: 10;
    }

    .title {
      padding: 20px 20px 15px;
      border-bottom: 1px solid rgba(0,0,0,0.15);
      word-wrap: break-word;
    }

    .description {
      padding: 10px 20px 15px;
    }

    h1, h2 {
        margin: 0;
    }
    h1 {
        font-size: 15px;
        font-weight: bold;
        line-height: 20px;
    }

    h2 {
        font-size: 12px;
        font-weight: normal;
    }

    svg {
        display: block;
        width: 100%;
        height: auto;
        max-height: 27px;
    }

    .legendText {
        font-family:'Roboto Condensed', sans-serif;
        font-size:11px;
        letter-spacing:0px;
        line-height:100%;
        stroke-width:1px;
        text-align:start;
        text-anchor:start;
        word-spacing:0px;
    }
</style>

<template>
    <div id="toc">
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=" class="background-print-img" alt="white background for printing">
        <h1 class="title">{{ title }}</h3>
        <h2 class="description">{{ year }} {{ description }}<span v-if="units"> ({{ units }})</span>.</h4>
        <div class="legend">
            <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 248.4 25" id="maplegend" role="img" aria-labelledby="svgTitle">
        		<title id="svgTitle">Choropleth legend</title>
                <g transform="translate(20.714293 -865.93365)">
                    <rect y="865.9" x="-20.7" height="25" width="50" v-bind:style="{fill: color[0]}"/>
                    <rect width="50" height="25" x="28.9" y="865.9" v-bind:style="{fill: color[1]}"/>
                    <rect width="50" height="25" x="78.5" y="865.9" v-bind:style="{fill: color[2]}"/>
                    <rect y="865.9" x="128.1" height="25" width="50" v-bind:style="{fill: color[3]}"/>
                    <rect width="50" height="25" x="177.6" y="865.9" v-bind:style="{fill: color[4]}"/>
                    <text x="-19.5" y="882.9" class="legendText" preserveAspectRatio="xMidYMax meet">
                        <tspan x="-19.5" y="882.9">{{breaks[0] | abbrNumber sigfigs}}</tspan>
                    </text>
                    <text y="882.9" x="29.2" class="legendText">
                        <tspan y="882.9" x="29.2">{{breaks[1] | abbrNumber sigfigs}}</tspan>
                    </text>
                    <text x="79.5" y="882.9" class="legendText">
                        <tspan x="79.5" y="882.9">{{breaks[2] | abbrNumber sigfigs}}</tspan>
                    </text>
                    <text y="882.9" x="129.1" class="legendText" style="fill:#f9f9f9;">
                        <tspan y="882.9" x="129.1">{{breaks[3] | abbrNumber sigfigs}}</tspan>
                    </text>
                    <text x="179.2" y="882.9" class="legendText" style="fill:#f9f9f9;">
                        <tspan x="179.2" y="882.9">{{breaks[4] | abbrNumber sigfigs}}</tspan>
                    </text>
               </g>
          </svg>
        </div>
    </div>
</template>

<script>
import abbrNum from '../modules/abbreviate-number';

export default {
    name: 'Toc',
    filters: {
        abbrNumber: function (value, dec = 0) {
            return abbrNum(value, 2, dec);
        }
    }
}
</script>
