<script setup lang="ts">
import Activity from '@/data_types/activity';
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import mountain from '@/icons/mountain.vue';
import strava from '@/icons/strava.vue';
import hiking from '@/icons/hiking.vue';
import { type PropType } from 'vue';
import Route from '@/data_types/route';

const props = defineProps({
    activity: {
        type: [Activity, Route] as PropType<Activity | Route>,
        required: true
    },
    id: {
        type: Number,
        required: true
    },
    count_times: {
        type: Number,
        required: true
    },
});

function pace_formatter(m_per_sec: number): String {
    var pace = 16.667 / m_per_sec;
    var leftover = pace % 1;
    var minutes = pace - leftover;
    var seconds = Math.round(leftover * 60);

    return minutes + ":" + (seconds < 10 ? '0' + seconds : seconds)
}

</script>

<template>
    <div style="width: 100%;" v-bind:id="'activity_'+ id">
        <div class=" d-flex">
        <div>
            <span class="fw-bold" v-if="activity.location_city">{{ activity.location_city
            }}, </span>
            <span class="fw-bold">{{ activity.location_country }}</span>
            <div>
                <span v-if="activity.description && activity.activities.length <= 1" class="">{{ activity.description }}</span>
            </div>
            <div>
                <span class="stats-item">{{ Math.ceil(activity.distance / 1000) }}km</span>
                <span class="stats-item">
                    <mountain style="height: 17px;" />
                </span>
                <span class="stats-item">{{ Math.ceil(activity.total_elevation_gain) }}m </span>
                <span class="stats-item" v-if="activity.type === 'Ride'">{{ parseFloat((activity.average_speed *
                    3.6).toString()).toFixed(1) }}km/h</span>
                <span class="stats-item" v-if="activity.type === 'Hike' || activity.type === 'Run'">{{
                    pace_formatter(activity.average_speed) }}min/km</span>
            </div>
        </div>
        <div class="ml-auto">
            <span class="badge-item"><a class="strava_logo" v-bind:href="`https://www.strava.com/activities/${id}`"
                    target="_blank">
                    <strava />
                </a></span>
            <span class="badge-item" style="vertical-align: top;">
                <running v-if="activity.type === 'Run'" />
                <cycling v-if="activity.type === 'Ride'" />
                <hiking v-if="activity.type === 'Hike'" />
            </span>
            <span v-if="activity.athlete_count > 1 && count_times <= 1" class="badge bg-primary rounded-pill">{{
                activity.athlete_count
            }} people</span>
            <span v-if="count_times > 1" class="badge bg-primary rounded-pill">{{ count_times }} times</span>
        </div>
    </div>
</div>
</template>

<style>
.badge-item {
    padding-right: 0.3em;
}

.stats-item {
    padding-right: 0.3em;
    font-weight: 300;
}

.strava_logo:hover {
    opacity: 0.5;
    background-color: transparent;
}
</style>
