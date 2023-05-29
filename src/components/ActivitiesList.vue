<script setup lang="ts">
import type Activity from '@/data_types/activity';
import ActivityVue from './Activity.vue';
import MiniActivityVue from './MiniActivity.vue';
import type Route from '@/data_types/route';
import type { DocumentId } from '@/data_types/activity';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity', 'segmentEffortsRequested'])

const props = defineProps({
    activities: Array<Activity>,
    routes: Array<Route>,
    hovered_id: Number,
    selected_id: Number,
});

function isMobile() {
    return screen.width <= 760;
}

function onSegmentEffortsRequested(activity: Activity, seg_id: number) {
    emit('segmentEffortsRequested', activity, seg_id);
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
</script>

<template>
    <div class="routeList" :class="{ 'routeList-mobile': isMobile() }">
        <ul class="list-group">
            <div style="cursor: pointer" v-for="activity in (activities?.length ? activities : routes)"
                :key="activity.master_activity_id">                
                <MiniActivityVue v-if="isMobile()" :activity="activity" :id="activity.master_activity_id" :selected_id="selected_id"
                    v-on:selected-activity="onSelectedActivity" :count_times="activity.activities.length"                    
                    v-on:segmentEffortsRequested="onSegmentEffortsRequested" />
                <ActivityVue v-else :activity="activity" :id="activity.master_activity_id" v-bind:hovered_id="hovered_id" :selected_id="selected_id"               
                    v-on:selected-activity="onSelectedActivity" v-on:hovered-activity="onHoveredActivity"
                    v-on:unhovered-activity="onUnhoveredActivity" :count_times="activity.activities.length"
                    v-on:segmentEffortsRequested="onSegmentEffortsRequested" />
            </div>
        </ul>
    </div>
</template>

<style>
.badge-item {
    padding-right: 0.5em;
}

.routeList {
    right: 0.5em;
    top: 11em;
    max-width: 400px;
    height: 90%;
    overflow-y: auto;
}

.routeList-mobile {
    max-width: 100px !important;
    padding-top: 1em;
    padding-right: 1.4em;
}
</style>
