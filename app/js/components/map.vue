// map.vue
<style>
    #map {
        width: 100%;
        height: 100%;
        border: 1px solid #ccc;
    }
</style>

<template>
    <div id="map"></div>
</template>

<script>


export default {
    name: 'sc-map',
    filters: {
        abbrNumber: function (value, dec = 0) {
            return abbrNum(value, 2, dec);
        }
    }
}
</script>
