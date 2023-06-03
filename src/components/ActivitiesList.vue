<script setup lang="ts">
import type Activity from '@/data_types/activity';
import ActivityVue from './Activity.vue';
import MiniActivityVue from './MiniActivity.vue';
import type Route from '@/data_types/route';
import type { DocumentId } from '@/data_types/activity';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity', 'onNextPageRequested'])

const props = defineProps({
    activities: Array<Activity>,
    routes: Array<Route>,
    hovered_id: Number,
    selected_id: Number,
    has_more_data: Boolean,
});

var current_page = 0;

function isMobile() {
    return screen.width <= 760;
}

function onSelectedActivity(activity_id: DocumentId) {
    emit('selectedActivity', activity_id)
}

function onHoveredActivity(activity_id: DocumentId) {
    emit('hoveredActivity', activity_id);
}

function onUnhoveredActivity(activity_id: DocumentId) {
    emit('unhoveredActivity', activity_id)
}

function onNextPageRequested() {
    current_page++;
    emit('onNextPageRequested', current_page);
}

</script>

<template>
    <div class="routeList" :class="{ 'routeList-mobile': isMobile() }">
        <ul class="list-group">
            <div :class="{ 'activity_container-mobile': isMobile(), 'activity_container': !isMobile() }"
                style="cursor: pointer" v-for="activity in (activities?.length ? activities : routes)"
                :key="activity.master_activity_id">
                <MiniActivityVue v-if="isMobile()" :activity="activity" :id="activity.master_activity_id"
                    :selected_id="selected_id" v-on:selected-activity="onSelectedActivity"
                    :count_times="activity.activities.length" />
                <ActivityVue v-else :activity="activity" :id="activity.master_activity_id" v-bind:hovered_id="hovered_id"
                    :selected_id="selected_id" v-on:selected-activity="onSelectedActivity"
                    v-on:hovered-activity="onHoveredActivity" v-on:unhovered-activity="onUnhoveredActivity"
                    :count_times="activity.activities.length" />
            </div>
            <li v-if="has_more_data && (activities?.length || routes?.length)">
                <div :class="{ 'activity_container-mobile scroll_more_items_container-mobile': isMobile(), 'activity_container scroll_more_items_container': !isMobile() }"
                    class="list-group-item list-group-item-action d-flex justify-content-center align-items-center scroll_more_items_container"
                    style="margin:auto;"
                    v-on:click="onNextPageRequested">
                    <i class="bi bi-chevron-down scroll_more_items"></i>
                </div>
            </li>
        </ul>
    </div>
</template>

<style>
.badge-item {
    padding-right: 0.2em;
}

.routeList {
    right: 0.5em;
    top: 14em;
    max-width: 400px;
    height: 70%;
    overflow-y: scroll;
}

.routeList-mobile {
    max-width: 100px !important;    
    padding-right: 1em;
}

.activity_container-mobile {
    border-radius: 50px !important;
    margin-bottom: 0.25em;
    margin-top: 0.7em;
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
</style>
