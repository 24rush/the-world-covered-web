<script setup lang="ts">
import Activity from '@/data_types/activity';
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import mountain from '@/icons/mountain.vue';
import strava from '@/icons/strava.vue';
import hiking from '@/icons/hiking.vue';
import { type PropType } from 'vue';
import Route from '@/data_types/route';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity'])

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
    hovered_id: Number,
    selected_id: Number,
});

function pace_formatter(m_per_sec: number): String {
    var pace = 16.667 / m_per_sec;
    var leftover = pace % 1;
    var minutes = pace - leftover;
    var seconds = Math.round(leftover * 60);

    return minutes + ":" + (seconds < 10 ? '0' + seconds : seconds)
}

function date_formatter(date_str: String): String {
    if (!date_str) return "";

    let langCode = "ro-RO";
    let date = new Date(date_str.toString());

    var day = date.toLocaleString(langCode, { day: '2-digit' });   // DD
    var month = date.toLocaleString(langCode, { month: 'short' }); // MMM
    var year = date.toLocaleString(langCode, { year: 'numeric' }); // YYYY

    return ` ${month} ${year}`;
}

</script>

<template>
    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
        :class="{ 'list-group-item-hover': hovered_id === activity.master_activity_id && selected_id == 0, 'list-group-item-selected': selected_id === activity.master_activity_id }"
        :key="activity.master_activity_id" v-on:mouseenter="emit('hoveredActivity', activity.master_activity_id)"
        v-on:mouseleave="emit('unhoveredActivity', activity.master_activity_id)"
        v-on:mousedown="emit('selectedActivity', activity.master_activity_id)">

        <div style="width: 100%;" v-bind:id="'activity_' + id">
            <div class=" d-flex">
                <div>
                    <span class="fw-bold" v-if="activity.location_city">{{ activity.location_city
                    }}, </span>
                    <span class="fw-bold">{{ activity.location_country }}</span>
                    <span class="fs-small">{{ date_formatter(activity.start_date_local) }}</span>
                    <div>
                        <span v-if="activity.description && activity.activities.length <= 1" class="">{{
                            activity.description }}</span>
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
                    }}p</span>
                    <span v-if="count_times > 1" class="badge bg-primary text-bg-danger rounded-pill">{{ count_times
                    }}x</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.badge-item {
    padding-right: 0.3em;
}

.stats-item {
    padding-right: 0.3em;
    font-weight: 300;
}

.fs-small {
    font-size: small;
}

.strava_logo:hover {
    opacity: 0.5;
    background-color: transparent;
}

.list-group-item-hover {
    border-width: 0px 0px 0px 5px;
    border-color: var(--bs-blue);

    transform: translateX(0px);
    transition: transform .2s;

    background-color: aliceblue !important;
}

.list-group-item-selected {
    border-width: 0px 0px 0px 5px;
    border-color: #fd7e148c;

    transform: translateX(0px);
    transition: transform .2s;

    background-color: bisque !important;
}
</style>
