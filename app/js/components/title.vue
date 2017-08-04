<template lang="html">
    <div id="mapTitle" v-if="sharedState.metric.config">
        <h1>
            <a href="javascript:void(0)" v-on:click="launchPortal" v-html="privateState.metaDesc"></a>
        </h1>
        <h2>
            <svg class="icon" v-bind:style="{fill: getBreakColor(0)}"><use xlink:href="#icon-stop2"></use></svg>
            <span>{{privateState.dataMin | formatNumber(sharedState.metric)}}</span> to 
            <svg class="icon" v-bind:style="{fill: getBreakColor(1)}"><use xlink:href="#icon-stop2"></use></svg>
            <span>{{privateState.dataMax | formatNumber(sharedState.metric)}}</span> 
            <span v-if="sharedState.metric.config.label">{{ sharedState.metric.config.label.toLowerCase() }}</span>
        </h2>
        <h3>
            County: {{ privateState.area }}
            <span v-if="sharedState.selected.length > 0" style="margin-left: 10px;"> Neighborhood: {{ privateState.selected }}</span>
        </h3>
        <Years></Years>
        <svg style="position: absolute; width: 0; height: 0; overflow: hidden;" version="1.1" xmlns="http://www.w3.org/2000/svg"
	    xmlns:xlink="http://www.w3.org/1999/xlink">
		    <defs>
                <symbol id="icon-stop2" viewBox="0 0 32 32">
                    <path d="M4 4h24v24h-24z"></path>
                </symbol>        
            </defs>
        </svg>
    </div>
</template>

<script>
import {abbrNum, round, prettyNumber} from '../modules/number_format';
import {metaDescription} from '../modules/meta';
import isNumeric from '../modules/isnumeric';
import {calcValue, wValsToArray, sum, valsToArray} from '../modules/metric_calculations';
import dataSummary from '../modules/datasummary';
import Years from './years.vue';
import {breaksRange} from '../modules/breaks';


export default {
    name: 'sc-title',
    components: {
            Years: Years
    },
    watch: {
        'sharedState.metric': 'processData',
        'sharedState.year': 'processData',
        'sharedState.metadata': 'getMetaDesc',
        'sharedState.selected': 'processSelected'
    },
    filters: {
        formatNumber: function(value, metric) {
            return prettyNumber(value, metric.config.decimals, metric.config.prefix, metric.config.suffix);
        }
    },
    methods: {
        abbrNumber: function (value) {
            let num = abbrNum(value, 1);
            if (isNumeric(num)) {
                return round(num, this.sharedState.metric.config.decimals);
            } else {
                return num;
            }
        },
        getBreakColor: function(index) {
            return breaksRange[index];
        },
        launchPortal: function () {
            let _this = this;
            window.open(`http://mcmap.org/geoportal/?q=qualityoflife&qolm=${_this.sharedState.metric.config.metric}`);
        },
        getMetaDesc: function() {
            this.privateState.metaDesc = metaDescription(this.sharedState.metadata).replace('<p>', '').replace('</p>','').trim();
        },
        updateYear(y) {
            let _this = this;
            _this.sharedState.year = y;
            parent.postMessage({"summary": dataSummary(_this.sharedState)}, "*");
        },
        processData: function() {
            this.processArea();
            this.processSelected();
        },
        processSelected: function() {
            let metric = this.sharedState.metric;

            let selectedValue = calcValue(metric.data, metric.config.type, this.sharedState.year, this.sharedState.selected);
            this.privateState.selected = prettyNumber(selectedValue, metric.config.decimals, metric.config.prefix, metric.config.suffix);
            if (metric.config.raw_label) {
                let rawArray = wValsToArray(metric.data.map, metric.data.w, [this.sharedState.year], this.sharedState.selected);
                let rawValue = sum(rawArray);
                this.privateState.selectedRaw = prettyNumber(rawValue, 0);
            }
        },
        processArea: function() {
            let metric = this.sharedState.metric;
            let keys = Object.keys(metric.data.map);
            if (metric.config.world_val && metric.config.world_val[`y_${this.sharedState.year}`]) {
                this.privateState.area = prettyNumber(metric.config.world_val[`y_${this.sharedState.year}`], metric.config.decimals, metric.config.prefix, metric.config.suffix);
            } else {
                let areaValue = calcValue(metric.data, metric.config.type, this.sharedState.year, keys);
                this.privateState.area = prettyNumber(areaValue, metric.config.decimals, metric.config.prefix, metric.config.suffix);
            }
            if (metric.config.raw_label) {
                let rawArray = wValsToArray(metric.data.map, metric.data.w, [this.sharedState.year], keys);
                let rawValue = sum(rawArray);
                this.privateState.areaRaw = prettyNumber(rawValue, 0);
            }

            this.privateState.dataMin =  this.sharedState.breaks[0];
            this.privateState.dataMax = this.sharedState.breaks[this.sharedState.breaks.length - 1];
        },
        processYear: function() {
            this.processArea();
            this.processSelected();
        }

    }
}
</script>

<style lang="css" scoped>
a {
    transition: 0.6s; 
    color: rgb(230, 230, 230);
}
a:hover {
    color: #176ADF;
}
.icon {
  display: inline-block;
  vertical-align: text-bottom;
  width: 1.2em;
  height: 1.2em;  
}
#mapTitle {
    position: absolute;
    width: 60%;
    max-width: 960px;
    min-width: 480px;
    text-align: center;
    margin: 0 auto;
    left: 0;
    right: 0;
    top: 0;
    background: rgba(46,45,44,0.8);
}

h1 {
    font-size: 1em;
    line-height: 1.15em;
    margin: 5px 0;
}
h2 {
    font-size: 0.9em;
    font-weight: normal;
    margin: 8px 0 0;
}
h3 {
    font-size: 0.8em;
    font-weight: normal;
    margin: 5px 0 2px;
}

@media all and (max-width: 480px) {
    #mapTitle {
        min-width: 100%;
        /* padding-right: 50px; */
    }
}

</style>
