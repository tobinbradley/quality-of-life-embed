<template>
    <span class="attribution"><a :href="privateState.attributionURL" target="_blank">Quality of Life</a></span>
</template>

<script>
    export default {
        name: 'sc-attribution',
        mounted () {
            this.updateLink;
        },
        watch: {
            'sharedState.metric': 'updateLink'
        },
        methods: {
            updateLink: function() {
                let _this = this;
                _this.privateState.attributionURL = `http://mcmap.org/qol/?m=m${_this.sharedState.metric.config.metric}`;
            }
        }
    }
</script>