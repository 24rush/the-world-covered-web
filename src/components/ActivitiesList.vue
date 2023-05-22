<script setup lang="ts">
import Activity from '@/data_types/activity';
import { reactive, toRefs } from 'vue';
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import mountain from '@/icons/mountain.vue';
import strava from '@/icons/strava.vue';
import hiking from '@/icons/hiking.vue';

const emit = defineEmits(['selectedActivity', 'hoveredActivity'])

const props = defineProps({
    activities: {
        type: Array<Activity>,
    },
});

const { activities } = toRefs(props);

</script>

<template>
    <div class="container">
        <ul class="list-group">
            <div class="activity_container list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                style="cursor: pointer" v-for="activity in activities" v-on:mouseover="emit('hoveredActivity', activity)"
                v-on:mousedown="emit('selectedActivity', activity)">

                <div class="ms-2 me-auto">
                    <span class="fw-bold" v-if="activity.location_city">{{ activity.location_city
                    }}, </span>
                    <span class="fw-bold">{{ activity.location_country }}</span>
                    <div>
                        <span class="stats-item">{{ Math.ceil(activity.distance / 1000) }}km</span>
                        <span class="stats-item"><mountain style="height: 17px;" /></span>
                        <span class="stats-item">{{ Math.ceil(activity.total_elevation_gain) }}m </span>
                        <span class="stats-item" v-if="activity.type === 'Ride'">{{ parseFloat((activity.average_speed * 3.6).toString()).toFixed(1) }}km/h</span>
                        <span class="stats-item" v-if="activity.type === 'Hike' || activity.type === 'Run'">{{ parseFloat((16.667 / activity.average_speed).toString()).toFixed(2) }}min/km</span>
                    </div>
                </div>

                <div>
                    <span class="badge-item"><a class="strava_logo" v-bind:href="`https://www.strava.com/activities/${activity._id}`"
                            target="_blank">
                            <strava />
                        </a></span>
                    <span class="badge-item" style="vertical-align: top;">
                        <running v-if="activity.type === 'Run'" />
                        <cycling v-if="activity.type === 'Ride'" />
                        <hiking v-if="activity.type === 'Hike'" />
                    </span>
                    <span v-if="activity.athlete_count > 1" class="badge bg-primary rounded-pill">{{ activity.athlete_count
                    }} people</span>
                </div>
            </div>
        </ul>
    </div>
</template>

<style scoped>
.badge-item {
    padding-right: 0.7em;
}

.stats-item {
    padding-right: 0.3em;
}
.strava_logo:hover {
    opacity: 0.5;
    background-color: transparent;
}

.activity_container:hover {
    opacity: 0.99;
    transition: transform .2s;
    transition-delay: 0s;
    transition-timing-function: linear;
    transform: scale(1.05);
    border-color: rgba(173, 173, 173, 0.477);
}
</style>
