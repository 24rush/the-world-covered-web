<script setup lang="ts">
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import hiking from '@/icons/hiking.vue';
import strava from '@/icons/strava.vue';
import { ActivityMetaData } from '@/data_types/metadata';

const emit = defineEmits(['selectedActivity'])

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
    selected_id: Number,
});

function country_formatter(country: String): String {
    switch (country.toLowerCase()) {
        case "romania": return "RO"
        case "spain": return "ES"
        case "portugal": return "PT"
        case "the netherlands": return "NL"
        case "netherlands": return "NL"
        case "switzerland": return "CH"
        case "bulgaria": return "BG"
        case "belgium": return "BE"
    }

    return country;
}

</script>

<template>
    <div class="activity_container list-group-item list-group-item-action"
        :class="{ 'list-group-item-selected-mobile': selected_id === activityMeta._id }" :key="activityMeta._id"
        v-on:mousedown="emit('selectedActivity', activityMeta._id)">

        <div class="d-flex justify-content-between align-items-center" style="line-height: 1.2; flex-direction: column;"
            v-bind:id="'activity_' + id">
            <span v-if="count_times > 1"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark badge-times">{{ count_times
                }}x</span>

            <span v-if="activityMeta.athlete_count > 1 && count_times <= 1"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark badge-times">{{
                    activityMeta.athlete_count
                }}p</span>

            <span class="fw-bold">{{ country_formatter(activityMeta.location_country) }}</span>
            <div>
                <span class="stats-item">{{ Math.ceil(activityMeta.distance / 1000) }}km</span>
            </div>
            <span style="vertical-align: top;">
                <running v-if="activityMeta.type.toLowerCase().includes('run')" />
                <cycling v-if="activityMeta.type.toLowerCase().includes('ride')" />
                <hiking v-if="activityMeta.type.toLowerCase().includes('hike')" />
            </span>

            <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-dark" style="max-width: 24px; margin-right: -1.2em;">
                <span class=""><a v-on:mousedown.stop
                        v-bind:href="`https://www.strava.com/activities/${activityMeta.master_activity_id}`"
                        target="_blank">
                        <strava style="height: 15px; width: 15px; margin-left: -0.2em;"/>
                    </a></span>
            </span>

        </div>
    </div>
</template>

<style scoped>
.stats-item {
    font-weight: 300;
}

.list-group-item-selected-mobile {
    border-width: 2px;
    border-color: #fd7e148c;

    background-color: bisque !important;
}

.badge-times {
    max-width: 24px;
    height: 24px;
    padding-top: 6px;
    padding-right: 18px;
    margin-top: 1em;
    font-weight: 500;
}
</style>
