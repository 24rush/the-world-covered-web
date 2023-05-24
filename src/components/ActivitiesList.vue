<script setup lang="ts">
import type Activity from '@/data_types/activity';
import ActivityVue from './Activity.vue';

const emit = defineEmits(['selectedActivity', 'hoveredActivity', 'unhoveredActivity', 'segmentEffortsRequested'])

const props = defineProps({
    activities: Array<Activity>,
    hovered_id: Number
});

</script>

<template>
    <div class="container">
        <ul class="list-group">
            <div class="activity_container list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                :class="{ activity_container_hover: hovered_id === activity._id }" style="cursor: pointer"
                v-for="activity in activities" :key="activity._id" v-on:mouseover="emit('hoveredActivity', activity)"
                v-on:mouseleave="emit('unhoveredActivity', activity)" v-on:mousedown="emit('selectedActivity', activity)">
                <ActivityVue :activity="activity" :count_times="1" v-on:segmentEffortsRequested="emit('segmentEffortsRequested', $event)"/>
            </div>
        </ul>
    </div>
</template>

<style>
.activity_container_hover {
    opacity: 0.99;
    transition: transform .1s;
    transition-delay: 0s;
    transition-timing-function: linear;
    transform: scale(1.05);
    border-color: rgba(173, 173, 173, 0.477);
}

.activity_container:hover {
    opacity: 0.99;
    transition: transform .1s;
    transition-delay: 0s;
    transition-timing-function: linear;
    transform: scale(1.05);
    border-color: rgba(173, 173, 173, 0.477);
}
</style>
