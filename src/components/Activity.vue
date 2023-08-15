<script setup lang="ts">
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import mountain from '@/icons/mountain.vue';
import strava from '@/icons/strava.vue';
import hiking from '@/icons/hiking.vue';
import settings from '@/icons/settings.vue';
import { ActivityMetaData } from '@/data_types/metadata';
import { Formatters } from '@/components/formatters'
import { computed } from '@vue/reactivity';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity', 'settingsClicked'])

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

</script>

<template>
    <div v-if="shouldShow" class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
        :class="{ 'list-group-item-hover': hovered_id === activityMeta._id && selected_id == 0, 'list-group-item-selected': selected_id === activityMeta._id }"
        style="padding-left: 8px;padding-right: 8px;"
        :key="activityMeta._id" v-on:mouseenter="emit('hoveredActivity', activityMeta._id)"
        v-on:mouseleave="emit('unhoveredActivity', activityMeta._id)"
        v-on:mousedown="emit('selectedActivity', activityMeta._id)">

        <div style="width: 100%;" v-bind:id="'activity_' + id">
            <div class="d-flex">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-right: 0.5em;">
                    <span class="badge-item" style="vertical-align: top;">
                        <running v-if="activityMeta.type.toLowerCase().includes('run')" />
                        <cycling v-if="activityMeta.type.toLowerCase().includes('ride')" />
                        <hiking v-if="activityMeta.type.toLowerCase().includes('hike')" />
                    </span>
                    <span v-if="activityMeta.athlete_count > 1 && count_times <= 1" class="badge bg-primary rounded-pill">{{
                        activityMeta.athlete_count
                    }}p</span>
                    <span v-if="count_times > 1" class="badge bg-primary text-bg-danger rounded-pill">{{ count_times
                    }}x</span>
                </div>
                <div style="max-width: 90%;  margin-right: 0.2em;">
                    <span class="fw-bold" v-if="activityMeta.location_city">{{ activityMeta.location_city
                    }}, </span>
                    <span class="fw-bold badge-item">{{ activityMeta.location_country }}</span>
             
                    <span class="fs-small">{{ Formatters.date_formatter(activityMeta.start_date_local) }}</span>

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
                        <span class="stats-item" v-if="activityMeta.type === 'Ride'"> {{
                            Formatters.speed_formatter(activityMeta.average_speed) }} </span>
                        <span class="stats-item" v-if="activityMeta.type === 'Hike' || activityMeta.type === 'Run'">{{
                            Formatters.pace_formatter(activityMeta.average_speed) }} </span>
                    </div>
                </div>
                <div class="ml-auto" style="display: flex;flex-direction: column;">
                    <span class="badge-item" :class="{ 'hoverable_icon': selected_id == activityMeta._id }">
                        <settings v-on:mousedown="emit('settingsClicked', activityMeta._id)" v-on:mousedown.stop />
                    </span>
                    <span class="badge-item"><a class="hoverable_icon" v-on:mousedown.stop
                            v-bind:href="`https://www.strava.com/activities/${activityMeta.master_activity_id}`"
                            target="_blank">
                            <strava />
                        </a></span>

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
    -webkit-user-select: none;
    /* Safari */
    -moz-user-select: none;
    /* Firefox */
    -ms-user-select: none;
    /* IE10+/Edge */
    user-select: none;
}

.fs-small {
    font-size: small;
}

.hoverable_icon:hover {
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
