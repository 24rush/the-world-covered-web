<script setup lang="ts">
import Route from '@/data_types/route';
import { reactive, toRefs } from 'vue';
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import mountain from '@/icons/mountain.vue';

const emit = defineEmits(['selectedRoute', 'hoveredRoute'])

const props = defineProps({
    routes: {
        type: Array<Route>,
    },
});

const { routes } = toRefs(props);

</script>

<template>
    <div class="container">
        <ul class="list-group">
            <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                style="cursor: pointer" v-for="route in routes" v-on:mouseover="emit('hoveredRoute', route)"
                v-on:mousedown="emit('selectedRoute', route)">
               
                <div class="ms-2 me-auto">
                    <span class="fw-bold" v-if="route.master_activity?.location_city">{{ route.master_activity.location_city
                    }}, </span>
                    <span class="fw-bold">{{ route.master_activity?.location_country }}</span>
                    <div>
                        {{ Math.ceil(route.master_activity.distance / 1000) }} km
                        <mountain style="height: 17px;"/>
                        {{ Math.ceil(route.master_activity.total_elevation_gain) }} m
                    </div>
                </div>

                <div>
                    <span class="badge-item" style="vertical-align: top;">
                        <running v-if="route.master_activity?.type === 'Run'" />
                        <cycling v-if="route.master_activity?.type === 'Ride'" />
                    </span>
                    <span class="badge bg-primary rounded-pill">{{ route.activities.length }} times</span>
                </div>                
            </a>
        </ul>
    </div>
</template>

<style scoped>
.badge-item {
    padding-right: 0.5em;
}

</style>
