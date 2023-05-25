<script setup lang="ts">
import Route from '@/data_types/route';
import ActivityVue from './Activity.vue';
import type Activity from '@/data_types/activity';

const emit = defineEmits(['selectedRoute', 'hoveredRoute', 'unhoveredRoute', 'segmentEffortsRequested'])

const props = defineProps({
    routes: {
        type: Array<Route>,
    },
    hovered_id: Number,
});

function onSegmentEffortsRequested(activity: Activity, seg_id: number) {
    emit('segmentEffortsRequested', activity, seg_id);
}

</script>

<template>
    <div class="container">
        <ul class="list-group">
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                :class="{ activity_container_hover: hovered_id === route.master_activity._id }" style="cursor: pointer"
                v-for="route in routes" v-on:mouseover="emit('hoveredRoute', route)"
                v-on:mousedown="emit('selectedRoute', route)"
                v-on:mouseleave="emit('unhoveredRoute', route.master_activity)">

                <ActivityVue :activity="route.master_activity" :count_times="route.activities.length"
                v-on:segmentEffortsRequested="onSegmentEffortsRequested" />
            </div>
        </ul>
    </div>
</template>

<style>
.list-group-item:hover {
    border-width: 0px 3px 0px 0px;
    border-color:var(--bs-blue);
}

.badge-item {
    padding-right: 0.5em;
}
</style>
