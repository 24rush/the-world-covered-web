<script setup lang="ts">
import type Activity from '@/data_types/activity';
import ActivityVue from './Activity.vue';
import type Route from '@/data_types/route';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity', 'segmentEffortsRequested'])

const props = defineProps({
    activities: Array<Activity>,
    routes: Array<Route>,
    hovered_id: Number,
    selected_id: Number,
});

function onSegmentEffortsRequested(activity: Activity, seg_id: number) {
    emit('segmentEffortsRequested', activity, seg_id);
}
</script>

<template>
    <div class="container">
        <ul class="list-group">
            <div class="activity_container list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                :class="{ 'list-group-item-hover': hovered_id === activity.master_activity_id && selected_id == 0, 'list-group-item-selected': selected_id === activity.master_activity_id }"                 
                style="cursor: pointer"
                v-for="activity in (activities?.length ? activities : routes)" :key="activity.master_activity_id"
                v-on:mouseover="emit('hoveredActivity', activity.master_activity_id)"
                v-on:mouseleave="emit('unhoveredActivity', activity.master_activity_id)"
                v-on:mousedown="emit('selectedActivity', activity.master_activity_id)">
                
                <ActivityVue :activity="activity" :id="activity.master_activity_id"
                    :count_times="activity.activities.length" v-on:segmentEffortsRequested="onSegmentEffortsRequested" />
            </div>
        </ul>
    </div>
</template>

<style>
.badge-item {
    padding-right: 0.5em;
}

.list-group-item-hover {
    border-width: 0px 0px 0px 5px;
    border-color: var(--bs-blue);

    transform: translateX(-5px);
    transition: transform .2s;

    background-color: aliceblue!important;
}

.list-group-item-selected {
    border-width: 0px 0px 0px 5px;
    border-color: var(--bs-orange);
    
    transform: translateX(-5px);
    transition: transform .2s;

    background-color: bisque!important;
}

</style>
