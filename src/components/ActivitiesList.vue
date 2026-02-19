<script setup lang="ts">
import ActivityVue from './Activity.vue';
import MiniActivityVue from './MiniActivity.vue';
import type { DocumentId } from '@/data_types/activity';
import type { ActivityMetaData } from '@/data_types/metadata';
import Cycling from '@/icons/cycling.vue';
import Running from '@/icons/running.vue';
import Hiking from "@/icons/hiking.vue";

import { computed, ref } from 'vue';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity', 'onNextPageRequested', 'settingsClicked', 'filterChange'])

const props = defineProps({
    activities: Array<ActivityMetaData>,
    hovered_id: Number,
    selected_id: Number,
    has_more_data: Boolean,
});

var current_page = 0;

var show_rides = ref(true);
var show_runs = ref(true);
var show_hikes = ref(true);
var distance_filter = ref(400);

function isMobile() {
    return screen.width <= 760;
}

function onSelectedActivity(resource_id: DocumentId) {
    emit('selectedActivity', resource_id)
}

function onHoveredActivity(resource_id: DocumentId) {
    emit('hoveredActivity', resource_id);
}

function onSettingsClicked(resource_id: DocumentId) {
    emit('settingsClicked', resource_id);
}

function onUnhoveredActivity(resource_id: DocumentId) {
    emit('unhoveredActivity', resource_id)
}

function onNextPageRequested() {
    current_page++;
    emit('onNextPageRequested', current_page);
}

function onFilterChange(show_rides: boolean, show_runs: boolean, show_hikes: boolean, max_distance: number) {
    emit('filterChange', show_rides, show_runs, show_hikes, max_distance);
}

// Hike filter based on selected activity type
const activity_type_filter = computed(() => {
    let filter = "";

    if (!show_rides.value) filter += "ride";
    filter += "|";
    if (!show_runs.value) filter += "run";
    filter += "|";
    if (!show_hikes.value) filter += "hike|walk";
    
    filter += "|" + distance_filter.value;

    return filter;
});

const shouldHaveFilter = computed(() => {
    return props.activities?.find((a) => a.type.toLowerCase().includes('ride')) ||
        props.activities?.find((a) => a.type.toLowerCase().includes('run')) || props.activities?.find((a) => a.type.toLowerCase().includes('hike'));
});

// Filter out activity types, called before the switch of the model
function isAtLeastOneActivityTypeSelected(runs: boolean, rides: boolean, hikes: boolean) {
    return runs || rides || hikes;
}

function onFilterRides() {
    if (!isAtLeastOneActivityTypeSelected(show_runs.value, !show_rides.value, show_hikes.value)) {
        show_rides.value = !show_rides.value;
    }

    onFilterChange(!show_rides.value, show_runs.value, show_hikes.value, distance_filter.value);
}

function onFilterRuns() {
    if (!isAtLeastOneActivityTypeSelected(!show_runs.value, show_rides.value, show_hikes.value)) {
        show_runs.value = !show_runs.value;
    }

    onFilterChange(show_rides.value, !show_runs.value, show_hikes.value, distance_filter.value);
}

function onFilterHikes() {
    if (!isAtLeastOneActivityTypeSelected(show_runs.value, show_rides.value, !show_hikes.value)) {
        show_hikes.value = !show_hikes.value;
    }

    onFilterChange(show_rides.value, show_runs.value, !show_hikes.value, distance_filter.value);
}

function onDistanceFilterChanged() {
    onFilterChange(show_rides.value, show_runs.value, show_hikes.value, distance_filter.value ?? 0);
}

</script>

<template>
    <div class="routeList prevent-select" :class="{ 'd-flex': isMobile(), 'routeList-mobile': isMobile() }">

        <ul class="list-group scrollable">
            <div v-if="isMobile()" class="d-flex" v-for="activity in activities"
                :key="activity._id">
                <MiniActivityVue :activity-meta="activity" :id="activity._id" :selected_id="selected_id"
                    :hovered_id="hovered_id" :filter_type="activity_type_filter" v-on:selected-activity="onSelectedActivity"
                    :count_times="activity.activities.length" />
            </div>
            <div v-else style="cursor: pointer" v-for="activity in activities">
                <ActivityVue :activity-meta="activity" :id="activity._id" v-bind:hovered_id="hovered_id"
                    :filter_type="activity_type_filter" :selected_id="selected_id"
                    v-on:selected-activity="onSelectedActivity" v-on:hovered-activity="onHoveredActivity"
                    v-on:settings-clicked="onSettingsClicked" v-on:unhovered-activity="onUnhoveredActivity"
                    :count_times="activity.activities.length" />
            </div>

            <li v-if="has_more_data && (activities?.length)">
                <div :class="{ 'scroll_more_items_container-mobile': isMobile(), 'scroll_more_items_container': !isMobile() }"
                    class="list-group-item list-group-item-action d-flex justify-content-center align-items-center scroll_more_items_container"
                    style="margin:auto;" v-on:click="onNextPageRequested">
                    <i class="bi bi-chevron-down scroll_more_items"></i>
                </div>
            </li>
        </ul>
        
        <div v-if="activities?.length && shouldHaveFilter" class="btn-group route_type_buttons"
            :class="{ 'route_type_buttons_mobile': isMobile() }"
            style="border-radius: 50rem;margin-top: 0.5em;" role="group">

            <input v-model="show_rides" type="checkbox" class="btn-check" id="checkfilterRides" autocomplete="off">
            <label v-on:click="onFilterRides" class="btn btn-light route_type_button" style="padding-top: 2px;"
                for="checkfilterRides">
                <cycling fill="var(--color-ride)" />
            </label>

            <input v-model="show_runs" type="checkbox" class="btn-check" id="checkfilterRuns" autocomplete="off">
            <label v-on:click="onFilterRuns" class="btn btn-light route_type_button" style="padding-top: 2px;"
                for="checkfilterRuns">
                <running fill="var(--color-run)" />
            </label>

            <input v-model="show_hikes" type="checkbox" class="btn-check" id="checkfilterHikes" autocomplete="off">
            <label v-on:click="onFilterHikes" class="btn btn-light route_type_button" style="padding-top: 1px;"
                for="checkfilterHikes">
                <hiking fill="var(--color-hikewalk)" />
            </label>
        </div>

        <div v-if="activities?.length && shouldHaveFilter" class="form-floating route_type_buttons">
            <input type="number" class="form-control" id="distanceFltrInput" v-model="distance_filter"
                @input="onDistanceFilterChanged()">
            <label for="distanceFltrInput">Max km</label>
        </div>                
    </div>
</template>

<style>
.routeList {
    right: 0.25em;
    top: 7.5em;
    width: 100%;
    max-width: 300px;
    height: 72%;
    z-index: 0;
}

.routeList-mobile {
    max-width: none !important;
    width: 100% !important;
    height: auto;
    left: 0 !important;
    top: 4em !important;
    display: flex !important;
    flex-direction: column !important;   
    padding: 0.2em; 
    align-items: flex-end;
}

.routeList-mobile .scrollable {
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    width: 100% !important;    
    padding-bottom: 5px;
}

.routeList-mobile .list-group-item {
    border-radius: 4px !important;
    margin-right: 2px;
}

.route_type_buttons {
    width: 100% !important;        
    margin-top: 0.3em;
}

.routeList-mobile .route_type_buttons {
    width: 25% !important;    
    margin-top: 0.5em;
}


.scrollable {
    overflow-y: auto;
    height: 100%;
}

.scroll_more_items {
    transform: scale(1.3);
    padding: 0;
    margin-top: 0.2em;
}

.scroll_more_items_container {
    margin: 0;
    padding: 0.25em !important;
    border: none;
}

.scroll_more_items_container-mobile {
    padding: 0.25em !important;
    border-radius: 10px !important;
    border: none;
    height: 100%;
    width: 40px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.route_type_button {
    height: 30px;
    padding: 5px;
}

.prevent-select {
    -webkit-user-select: none;
    /* Safari */
    -ms-user-select: none;
    /* IE 10 and IE 11 */
    user-select: none;
    /* Standard syntax */
}
</style>
