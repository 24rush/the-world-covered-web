<script setup lang="ts">
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import hiking from '@/icons/hiking.vue';
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
    }

    return country;
}

</script>

<template>
    <div class="activity_container list-group-item list-group-item-action"
        :class="{ 'list-group-item-selected-mobile': selected_id === activityMeta._id }"
        :key="activityMeta._id" v-on:mousedown="emit('selectedActivity', activityMeta._id)">

        <div class="d-flex justify-content-between align-items-center" style="line-height: 1.2; flex-direction: column;" v-bind:id="'activity_' + id">
            <span v-if="count_times > 1"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">{{ count_times
                }}x</span>

            <span v-if="activityMeta.athlete_count > 1 && count_times <= 1" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">{{
                activityMeta.athlete_count
            }}p</span>

            <span class="fw-bold">{{ country_formatter(activityMeta.location_country) }}</span>
            <div>
                <span class="stats-item">{{ Math.ceil(activityMeta.distance / 1000) }}km</span>
            </div>
            <span style="vertical-align: top;">
                <running v-if="activityMeta.isRun()" />
                <cycling v-if="activityMeta.isRide()" />
                <hiking v-if="activityMeta.isHike()" />
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

</style>
