<script setup lang="ts">
import Activity from '@/data_types/activity';
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import mountain from '@/icons/mountain.vue';
import strava from '@/icons/strava.vue';
import hiking from '@/icons/hiking.vue';

const props = defineProps({
    activity: {
        type: Activity,
        required: true
    },
    count_times: {
        type: Number,
        required: true
    }
});

</script>

<template>
    <div class="ms-2 me-auto">
        <span class="fw-bold" v-if="activity.location_city">{{ activity.location_city
        }}, </span>
        <span class="fw-bold">{{ activity.location_country }}</span>
        <div>
            <span class="stats-item">{{ Math.ceil(activity.distance / 1000) }}km</span>
            <span class="stats-item">
                <mountain style="height: 17px;" />
            </span>
            <span class="stats-item">{{ Math.ceil(activity.total_elevation_gain) }}m </span>
            <span class="stats-item" v-if="activity.type === 'Ride'">{{ parseFloat((activity.average_speed *
                3.6).toString()).toFixed(1) }}km/h</span>
            <span class="stats-item" v-if="activity.type === 'Hike' || activity.type === 'Run'">{{
                parseFloat((16.667 / activity.average_speed).toString()).toFixed(2) }}min/km</span>
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
        <span v-if="count_times > 1" class="badge bg-primary rounded-pill">{{ count_times }} times</span>

    </div>
</template>
<style>
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
</style>