<script setup lang="ts">
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import hiking from '@/icons/hiking.vue';
import strava from '@/icons/strava.vue';
import { ActivityMetaData } from '@/data_types/metadata';
import { computed } from 'vue';

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
    hovered_id: Number,
    filter_type: String,
});

const shouldShow = computed(() => {
    let shouldShow = true;
    let filter_tokens = props.filter_type?.split('|');

    filter_tokens?.forEach(token => {
        if (token && props.activityMeta.type.toLowerCase().includes(token)) {
            shouldShow = false;
        }

    });

    return shouldShow;
});

function country_formatter(country: String): String {
    if (!country)
        return "RO";

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
    <div v-if="shouldShow" class="activity_container-mobile list-group-item list-group-item-action"
        :class="{ 'list-group-item-selected-mobile': selected_id === activityMeta._id,  
        'list-group-item-hover-mobile': hovered_id === activityMeta._id && selected_id == 0,
        'list-group-item-hover-mobile-ride': hovered_id === activityMeta._id && selected_id == 0 && activityMeta.type.toLowerCase().includes('ride'),
        'list-group-item-hover-mobile-run': hovered_id === activityMeta._id && selected_id == 0 && activityMeta.type.toLowerCase().includes('run'),
        'list-group-item-hover-mobile-hikewalk': hovered_id === activityMeta._id && selected_id == 0 && (activityMeta.type.toLowerCase().includes('hike') || activityMeta.type.toLowerCase().includes('walk')),

        }" :key="activityMeta._id"
        v-on:mousedown="emit('selectedActivity', activityMeta._id)">

        <div class="d-flex justify-content-between align-items-center" style="flex-direction: column;"
            v-bind:id="'activity_' + id">
            <span v-if="count_times > 1 && false"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark badge-times">{{
                    count_times
                }}x</span>

            <span v-if="activityMeta.athlete_count > 1 && count_times <= 1 && false"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark badge-times">{{
                    activityMeta.athlete_count
                }}p</span>

            <span class="fw-bold" style="display: none;">{{ country_formatter(activityMeta.location_country) }}</span>
            <div>
                <span class="stats-item" style="padding-right: 0px;">{{ Math.ceil(activityMeta.distance / 1000) }}km</span>
            </div>

            <div>
                <span style="vertical-align: middle;margin-right: 0.5em;">
                    <running v-if="activityMeta.type.toLowerCase().includes('run')" />
                    <cycling v-if="activityMeta.type.toLowerCase().includes('ride')" />
                    <hiking
                        v-if="activityMeta.type.toLowerCase().includes('hike') || activityMeta.type.toLowerCase().includes('walk')" />
                </span>

                <span class="badge rounded-pill"
                    style="max-width: 24px;background-color: #c0e2ff;">
                    <span class=""><a v-on:mousedown.stop
                            v-bind:href="`https://www.strava.com/activities/${activityMeta.master_activity_id}`"
                            target="_blank">
                            <strava style="height: 15px; width: 15px; margin-left: -0.2em;" />
                        </a></span>
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.activity_container-mobile {    
    padding-left: 0!important;
    padding-right: 0!important;
    padding-top: 1px;
    margin-top: 1px;
    padding-bottom: 4px;
}

.stats-item {
    font-weight: 300;
}

.list-group-item-selected-mobile {
    border-width: 0px 0px 0px 3px;
    border-color: #fd7e148c;

    transform: translateX(0px);
    transition: transform .2s;

    background-color: bisque !important;
}

.list-group-item-hover-mobile-ride {
    border-color: var(--color-ride);
}

.list-group-item-hover-mobile-hikewalk {
    border-color: var(--color-hikewalk);
}

.list-group-item-hover-mobile-run {
    border-color: var(--color-run);
}

.list-group-item-hover-mobile {    
    border-width: 0px 0px 0px 3px;

    transform: translateX(0px);
    transition: transform .2s;

    background-color: aliceblue !important;
}

.badge-times {
    display: flex;
    justify-content: center;
    max-width: 24px;
    height: 24px;
    align-items: center;
    margin-top: 1em;
}
</style>
