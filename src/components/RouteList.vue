<script setup lang="ts">
import Route from '@/data_types/route';
import ActivityVue from './Activity.vue';

const emit = defineEmits(['selectedRoute', 'hoveredRoute', 'unhoveredRoute'])

const props = defineProps({
    routes: {
        type: Array<Route>,
    },
    hovered_id: Number
});

</script>

<template>
    <div class="container">
        <ul class="list-group">
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                :class="{ activity_container_hover: hovered_id === route.master_activity._id }" style="cursor: pointer"
                v-for="route in routes" v-on:mouseover="emit('hoveredRoute', route)"
                v-on:mousedown="emit('selectedRoute', route)"
                v-on:mouseleave="emit('unhoveredRoute', route.master_activity)">

                <ActivityVue :activity="route.master_activity" :count_times="route.activities.length" />
            </div>
        </ul>
    </div>
</template>

<style scoped>
.badge-item {
    padding-right: 0.5em;
}
</style>
