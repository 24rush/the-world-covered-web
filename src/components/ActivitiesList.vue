<script setup lang="ts">
import ActivityVue from './Activity.vue';
import MiniActivityVue from './MiniActivity.vue';
import type { DocumentId } from '@/data_types/activity';
import type { ActivityMetaData } from '@/data_types/metadata';
import Cycling from '@/icons/cycling.vue';
import Running from '@/icons/running.vue';
import { computed, ref } from 'vue';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity', 'onNextPageRequested'])

const props = defineProps({
    activities: Array<ActivityMetaData>,
    hovered_id: Number,
    selected_id: Number,
    has_more_data: Boolean,
});

var current_page = 0;

var show_rides = ref(true);
var show_runs = ref(true);

function isMobile() {
    return screen.width <= 760;
}

function onSelectedActivity(resource_id: DocumentId) {
    emit('selectedActivity', resource_id)
}

function onHoveredActivity(resource_id: DocumentId) {
    emit('hoveredActivity', resource_id);
}

function onUnhoveredActivity(resource_id: DocumentId) {
    emit('unhoveredActivity', resource_id)
}

function onNextPageRequested() {
    current_page++;
    emit('onNextPageRequested', current_page);
}

const activity_type_filter = computed(() => {
    return (show_rides.value ? "" : "ride") + "|" + (show_runs.value ? "" : "run|hike");
});

const shouldHaveFilter = computed(() => {
    return props.activities?.find((a) => a.type.toLowerCase().includes('ride')) &&
        (props.activities?.find((a) => a.type.toLowerCase().includes('run')) || props.activities?.find((a) => a.type.toLowerCase().includes('hike')));
});

function onFilterRides() {
    if (show_rides.value == true && show_runs.value == false) {
        show_runs.value = true;
    }
}

function onFilterRuns() {
    if (show_rides.value == false && show_runs.value == true) {
        show_rides.value = true;
    }
}


</script>

<template>
    <div class="routeList" :class="{ 'routeList-mobile': isMobile() }">
        <div v-if="activities?.length && shouldHaveFilter" class="btn-group route_type_buttons"
            :class="{ 'route_type_buttons_mobile': isMobile() }"
            style="display: flex; justify-content: flex-end; border-radius: 50rem;" role="group">
            <input v-model="show_rides" type="checkbox" class="btn-check" id="checkfilterRides" autocomplete="off">
            <label v-on:click="onFilterRides" class="btn btn-light route_type_button route_type_button_left"
                style="padding-top: 2px;" for="checkfilterRides">
                <cycling />
            </label>

            <input v-model="show_runs" type="checkbox" class="btn-check" id="checkfilterRuns" autocomplete="off">
            <label v-on:click="onFilterRuns" class="btn btn-light route_type_button route_type_button_right"
                style="padding-top: 2px;" for="checkfilterRuns">
                <running />
            </label>
        </div>

        <ul class="list-group scrollable">
            <div v-if="isMobile()" class="activity_container-mobile" style="cursor: pointer" v-for="activity in activities"
                :key="activity._id">
                <MiniActivityVue :activity-meta="activity" :id="activity._id" :selected_id="selected_id"
                    v-on:selected-activity="onSelectedActivity" :count_times="activity.activities.length" />
            </div>
            <div v-else class="activity_container" style="cursor: pointer" v-for="activity in activities">
                <ActivityVue :activity-meta="activity" :id="activity._id" v-bind:hovered_id="hovered_id"
                    :filter_type="activity_type_filter" :selected_id="selected_id"
                    v-on:selected-activity="onSelectedActivity" v-on:hovered-activity="onHoveredActivity"
                    v-on:unhovered-activity="onUnhoveredActivity" :count_times="activity.activities.length" />
            </div>

            <li v-if="has_more_data && (activities?.length)">
                <div :class="{ 'activity_container-mobile scroll_more_items_container-mobile': isMobile(), 'activity_container scroll_more_items_container': !isMobile() }"
                    class="list-group-item list-group-item-action d-flex justify-content-center align-items-center scroll_more_items_container"
                    style="margin:auto;" v-on:click="onNextPageRequested">
                    <i class="bi bi-chevron-down scroll_more_items"></i>
                </div>
            </li>
        </ul>
    </div>
</template>

<style>
.routeList {
    right: 0.5em;
    top: 14.5em;
    width: 100%;
    max-width: 300px;
    height: 72%;
}

.routeList-mobile {
    right: 0em !important;
    max-width: 100px !important;
    padding-right: 1em;
}

.activity_container-mobile {
    border-radius: 50px !important;
    margin-bottom: 0.25em;
    margin-top: 0.7em;
    max-width: 75px;
}

.scrollable {
    overflow-y: scroll;
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
    margin: 0;
    padding: 0.25em !important;
    border: none;
    height: 50px;
    width: 50px;
}

.route_type_buttons {
    width: 50%;
    margin: auto;
    margin-bottom: 5px;
    background: white;
}

.route_type_buttons_mobile {
    width: 100% !important;
}

.route_type_button {
    height: 30px;
    padding: 5px;
}

.route_type_button_left {
    border-top-left-radius: 50rem;
    border-bottom-left-radius: 50rem;
}

.route_type_button_right {
    border-top-right-radius: 50rem;
    border-bottom-right-radius: 50rem;
}
</style>
