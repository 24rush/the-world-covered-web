<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataEndpoint from '@/data_endpoint';
import LeafletMap from '@/leaflet/map';

onMounted(async () => {
  let endpoint = new DataEndpoint("localhost");
  await endpoint.get_routes(4399230).then((routes => {

    let map = new LeafletMap("map");

    for (let route of routes) {
      map.add_polyline(route.polyline);
    }
  }));

})
</script>

<template>
  <div id="map">
  </div>
</template>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}

@media (min-width: 1024px) {}
</style>
