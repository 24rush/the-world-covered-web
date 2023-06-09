<script setup lang="ts">
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import mountain from '@/icons/mountain.vue';
import strava from '@/icons/strava.vue';
import hiking from '@/icons/hiking.vue';
import { ActivityMetaData } from '@/data_types/metadata';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity'])

const props = defineProps({
    activityMeta: {
        type: ActivityMetaData,
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

    var month = date.toLocaleString(langCode, { month: 'short' }); // MMM
    var year = date.toLocaleString(langCode, { year: 'numeric' }); // YYYY

    return ` ${month} ${year}`;
}

</script>

<template>
    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
        :class="{ 'list-group-item-hover': hovered_id === activityMeta._id && selected_id == 0, 'list-group-item-selected': selected_id === activityMeta._id }"
        :key="activityMeta._id" v-on:mouseenter="emit('hoveredActivity', activityMeta._id)"
        v-on:mouseleave="emit('unhoveredActivity', activityMeta._id)"
        v-on:mousedown="emit('selectedActivity', activityMeta._id)">

        <div style="width: 100%;" v-bind:id="'activity_' + id">
            <div class="d-flex">
                <div style="max-width: 80%;">
                    <span class="fw-bold" v-if="activityMeta.location_city">{{ activityMeta.location_city
                    }}, </span>
                    <span class="fw-bold">{{ activityMeta.location_country }}</span>
                    <span class="fs-small">{{ date_formatter(activityMeta.start_date_local) }}</span>
                    <div>
                        <span v-if="activityMeta.description && activityMeta.activities.length <= 1" class="">{{
                            activityMeta.description }}</span>
                    </div>
                    <div>
                        <span class="stats-item">{{ Math.ceil(activityMeta.distance / 1000) }}km</span>
                        <span class="stats-item">
                            <mountain style="height: 17px;" />
                        </span>
                        <span class="stats-item">{{ Math.ceil(activityMeta.elevation_gain) }}m </span>
                        <span class="stats-item" v-if="activityMeta.type === 'Ride'">{{ parseFloat((activityMeta.average_speed *
                            3.6).toString()).toFixed(1) }}km/h</span>
                        <span class="stats-item" v-if="activityMeta.type === 'Hike' || activityMeta.type === 'Run'">{{
                            pace_formatter(activityMeta.average_speed) }}min/km</span>
                    </div>
                </div>
                <div class="ml-auto">
                    <span class="badge-item"><a class="strava_logo" v-on:mousedown.stop v-bind:href="`https://www.strava.com/activities/${activityMeta.master_activity_id}`"
                            target="_blank">
                            <strava />
                        </a></span>
                    <span class="badge-item" style="vertical-align: top;">
                        <running v-if="activityMeta.isRun()" />
                        <cycling v-if="activityMeta.isRide()" />
                        <hiking v-if="activityMeta.isHike()" />
                    </span>
                    <span v-if="activityMeta.athlete_count > 1 && count_times <= 1" class="badge bg-primary rounded-pill">{{
                        activityMeta.athlete_count
                    }}p</span>
                    <span v-if="count_times > 1" class="badge bg-primary text-bg-danger rounded-pill">{{ count_times
                    }}x</span>
                </div>
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
