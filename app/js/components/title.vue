<template lang="html">
    <div id="mapTitle" v-if="sharedState.metric.config" class="top left">
        <div>
            <h1>
                <span v-html="privateState.metaDesc"></span><span v-if="sharedState.metric.config.label"></span>
            </h1>
            <h2>
                <span style="color: rgb(255,242,0);">■</span> <span>{{privateState.dataMin | formatNumber(sharedState.metric)}}</span> to 
                <span style="color: rgb(237,66,100);">■</span> <span>{{privateState.dataMax | formatNumber(sharedState.metric)}}</span> 
                <span v-if="sharedState.metric.config.label">{{ sharedState.metric.config.label.toLowerCase() }}</span>
            </h2>
        </div>
    </div>
</template>

<script>
import {abbrNum, round, prettyNumber} from '../modules/number_format';
import {metaDescription} from '../modules/meta';
import isNumeric from '../modules/isnumeric';
import {calcValue, wValsToArray, sum, valsToArray} from '../modules/metric_calculations';
import dataSummary from '../modules/datasummary';


export default {
    name: 'sc-title',
    watch: {
        'sharedState.metric': 'processData',
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

            // get min and max
            //this.privateState.dataMin = 
            //let valArray = valsToArray(metric.data.map, metric.years, keys);
            // console.log(valArray);
            // console.log(Math.max.apply(Math, valArray), Math.min.apply(Math, valArray));
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

#mapTitle {
    position: absolute;
    top: 0;
    left: 5px;
    right: 5px;
    text-align: center;
    
}
#mapTitle div {
    background: rgba(255,255,255,0.8);
    display: inline-block;
    padding-left: 8px;
    padding-right: 8px;
}
h1 {
    font-size: 1.2em;
    line-height: 1.1em;
}
h2 {
    font-size: 1em;
     line-height: 0.5em; 
    font-weight: normal;
}

</style>
