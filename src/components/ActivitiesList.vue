<script setup lang="ts">
import type Activity from '@/data_types/activity';
import ActivityVue from './Activity.vue';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity', 'segmentEffortsRequested'])

const props = defineProps({
    activities: Array<Activity>,
    hovered_id: Number
});

function onSegmentEffortsRequested(activity: Activity, seg_id: number) {
    emit('segmentEffortsRequested', activity, seg_id);
}
</script>

<template>
    <div class="container">
        <ul class="list-group">
            <div class="activity_container list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                :class="{ 'list-group-item-hover': hovered_id === activity._id }" style="cursor: pointer"
                v-for="activity in activities" :key="activity._id" v-on:mouseover="emit('hoveredActivity', activity._id)"
                v-on:mouseleave="emit('unhoveredActivity', activity._id)" v-on:mousedown="emit('selectedActivity', activity._id)">
                <ActivityVue :activity="activity" :id="activity._id" :count_times="activity.activities ? activity.activities.length : 1"
                    v-on:segmentEffortsRequested="onSegmentEffortsRequested" />
            </div>
        </ul>
    </div>
</template>

<style>
.list-group-item-hover {
    border-width: 0px 0px 0px 3px;
    border-color:var(--bs-blue);
}

.activity_container_hover {
    transition: transform .1s;
    transition-delay: 0s;
    transition-timing-function: linear;
    border-color: rgba(173, 173, 173, 0.477);
}

.activity_container:hover {
    transition: transform .1s;
    transition-delay: 0s;
    transition-timing-function: linear;
    border-color: rgba(173, 173, 173, 0.477);
}
</style>
