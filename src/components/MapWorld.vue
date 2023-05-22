<script setup lang="ts">
import { ref, onMounted, reactive, toRefs } from 'vue'
import DataEndpoint from '@/data_endpoint';
import LeafletMap from '@/leaflet/map';
import Route from '@/data_types/route';
import RouteList from './RouteList.vue'
import ActivitiesList from './ActivitiesList.vue';
import QueryGen from '@/query_gen';
import type Activity from '@/data_types/activity';

var routes = reactive<Route[]>([]);
var activities = reactive<Activity[]>([]);

var map: LeafletMap;
var endpoint: DataEndpoint;
var query_gen: QueryGen = new QueryGen(4399230);

onMounted(async () => {
    endpoint = new DataEndpoint("localhost");
    map = new LeafletMap("map");

    onRouteTypeRequested("most_ridden");
})

function onRouteSelected(route: Route) {
}

function onRouteHovered(route: Route) {
    map.center_view(route.master_activity.map.polyline);
}

function onActivitySelected(activity: Activity) {
}

function onActivityHovered(activity: Activity) {
    map.center_view(activity.map.polyline);
}

async function onRouteTypeRequested(type: String) {
    activities.splice(0);
    routes.splice(0);

    switch (type) {
        case "most_ridden":
            await endpoint.get_routes(4399230).then(db_routes => {
                for (let route of db_routes) {
                    let query = query_gen.acts_in_ids([route.master_activity_id]);
                    console.log(query);
                    endpoint.query_activities(query).then(activities => {
                        let activity = activities[0];
                        route.master_activity = activity;
                        routes.push(route);

                        map.add_polyline(activity.map.polyline);
                    })
                }
            });
            break;

        case "with_friends":
            await endpoint.query_activities(query_gen.acts_with_friends()).then(acts => {
                for (let activity of acts) {
                    activities.push(activity);
                    map.add_polyline(activity.map.polyline);
                }
            })
            break;

            case "abroad":
            await endpoint.query_activities(query_gen.act_abroad()).then(acts => {
                for (let activity of acts) {
                    activities.push(activity);
                    map.add_polyline(activity.map.polyline);
                }
            })
            break;

            case "epic_rides":
            await endpoint.query_activities(query_gen.act_epic_rides()).then(acts => {
                for (let activity of acts) {
                    activities.push(activity);
                    map.add_polyline(activity.map.polyline);
                }
            })
            break;

        default:
            break;
    }
}

</script>

<template>
    <RouteList class="absolute routeList" style="z-index: 2;" v-bind:routes="routes" v-on:selectedRoute="onRouteSelected"
        v-on:hoveredRoute="onRouteHovered"></RouteList>

    <ActivitiesList class="absolute routeList" style="z-index: 2;" v-bind:activities="activities"
        v-on:selectedActivity="onActivitySelected" v-on:hoveredActivity="onActivityHovered"></ActivitiesList>

    <div class="absolute buttons-bar btn-group" style="z-index: 1;" role="group"
        aria-label="Basic radio toggle button group">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked>
        <label class="btn btn-light buttons-bar-btn rounded-pill" v-bind:onClick="() => onRouteTypeRequested('most_ridden')"
            for="btnradio1">most ridden</label>

        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off">
        <label class="btn btn-light buttons-bar-btn rounded-pill" v-bind:onClick="() => onRouteTypeRequested('epic_rides')"
            for="btnradio2">epic rides</label>

        <input type="radio" class="btn-check" name="btnradio" id="btnradio3" autocomplete="off">
        <label class="btn btn-light buttons-bar-btn rounded-pill"
            v-bind:onClick="() => onRouteTypeRequested('with_friends')" for="btnradio3">with friends</label>

        <input type="radio" class="btn-check" name="btnradio" id="btnradio3" autocomplete="off">
        <label class="btn btn-light buttons-bar-btn rounded-pill" v-bind:onClick="() => onRouteTypeRequested('abroad')"
            for="btnradio3">abroad</label>
    </div>

    <div id="map" style="z-index: 0;">
    </div>
</template>

<style scoped>
#map {
    width: 100%;
    height: 100%;
}

.buttons-bar label:hover {
    opacity: 0.9;
    transition: transform .25s;
    transform: scale(1.05);
    border-color: rgba(173, 173, 173, 0.477);
}

.absolute {
    position: absolute;
}

.buttons-bar {
    z-index: 1;
    top: 4em;
    left: 50%;
    transform: translate(-50%, -50%);
}

.buttons-bar-btn {
    margin-right: 0.5em;
    font-weight: 300;
}

.routeList {
    right: 1em;
    top: 6em;
    max-width: 400px;
}

@media (min-width: 1024px) {}
</style>
