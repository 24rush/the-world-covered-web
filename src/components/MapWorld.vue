<script setup lang="ts">
import { ref, onMounted } from 'vue'
import L from 'leaflet'

onMounted(() => {
  var map = L.map('map').setView([51.505, -0.09], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map); 
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
