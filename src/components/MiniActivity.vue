<script setup lang="ts">
import Activity from '@/data_types/activity';
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import mountain from '@/icons/mountain.vue';
import strava from '@/icons/strava.vue';
import hiking from '@/icons/hiking.vue';
import { type PropType } from 'vue';
import Route from '@/data_types/route';

const emit = defineEmits(['selectedActivity', 'segmentEffortsRequested'])

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
    selected_id: Number,
});

function pace_formatter(m_per_sec: number): String {
    var pace = 16.667 / m_per_sec;
    var leftover = pace % 1;
    var minutes = pace - leftover;
    var seconds = Math.round(leftover * 60);

    return minutes + ":" + (seconds < 10 ? '0' + seconds : seconds)
}

function country_formatter(country: String): String {
    switch (country.toLowerCase()) {
        case "romania": return "RO"
        case "spain": return "ES"
        case "portugal": return "PT"
        case "the netherlands": return "NL"
        case "netherlands": return "NL"
    }

    return country;
}

</script>

<template>
    <div class="activity_container list-group-item list-group-item-action"
        :class="{ 'list-group-item-selected-mobile': selected_id === activity.master_activity_id }"
        :key="activity.master_activity_id" v-on:mousedown="emit('selectedActivity', activity.master_activity_id)">

        <div class="d-flex justify-content-between align-items-center" style="line-height: 1.2; flex-direction: column;" v-bind:id="'activity_' + id">
            <span v-if="count_times > 1"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">{{ count_times
                }}x</span>

            <span v-if="activity.athlete_count > 1 && count_times <= 1" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">{{
                activity.athlete_count
            }}p</span>

            <span class="fw-bold">{{ country_formatter(activity.location_country) }}</span>
            <div>
                <span class="stats-item">{{ Math.ceil(activity.distance / 1000) }}km</span>
            </div>
            <span style="vertical-align: top;">
                <running v-if="activity.type === 'Run'" />
                <cycling v-if="activity.type === 'Ride'" />
                <hiking v-if="activity.type === 'Hike'" />
            </span>

        </div>
    </div>
</template>

<style scoped>
.stats-item {    
    font-weight: 300;
}

.activity_container {
    border-radius: 50px;
    margin-bottom: 0.25em;
}

.list-group-item-selected-mobile {
    border-width: 2px;
    border-color: var(--bs-orange);
    
    background-color: bisque !important;
}

</style>
