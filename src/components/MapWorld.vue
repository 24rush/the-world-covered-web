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
var hovered_id = ref(0);

var map: LeafletMap;
var endpoint: DataEndpoint;
var query_gen: QueryGen = new QueryGen(4399230);

onMounted(async () => {
    endpoint = new DataEndpoint("localhost");
    map = new LeafletMap("map");
    map.register_hovered_handler(onPolylineHovered);

    onRouteTypeRequested("most_ridden");
})

function onPolylineHovered(id: number, state: boolean) {
    hovered_id.value = state ? id : 0;
}

function onRouteSelected(route: Route) {
    map.hide_all();
    map.show_only(route.master_activity._id);
    hoverPolylineOfId(route.master_activity._id, true);
    map.center_view(route.master_activity._id);
}

function onRouteHovered(route: Route) {
    //hoverPolylineOfId(route.master_activity._id, true);
}

function onRouteUnhovered(activity: Activity) {
    //map.show_all();
    hoverPolylineOfId(activity._id, false);
}

function onActivitySelected(activity: Activity) {
    hoverPolylineOfId(activity._id, true);
}

function onActivityHovered(activity: Activity) {
    //hoverPolylineOfId(activity._id, true);
}

function onActivityUnhovered(activity: Activity) {
    hoverPolylineOfId(activity._id, false);
}

function hoverPolylineOfId(id: number, hover: boolean) {
    if (hover) {
        map.highlight_elem_id(id);
        map.center_view(id);
    }
    else {
        map.unhighlight_elem_id(id);
    }
}

function get_query(type: String): String {
    switch (type) {
        case "with_friends":
            return query_gen.acts_with_friends();
        case "abroad":
            return query_gen.act_abroad()
        case "epic_rides":
            return query_gen.act_epic_rides()
        case "best_bang":
            return query_gen.act_best_bang()
        default:
            console.log("WARNING: Unknown route type")
            return "";
    }
}

function add_polyline(id: number, polyline: string) {
    map.add_polyline(id, polyline);
}

async function onRouteTypeRequested(type: String) {
    activities.splice(0);
    routes.splice(0);
    if (type === "most_ridden") {
        await endpoint.get_routes(4399230).then(db_routes => {
            for (let route of db_routes) {
                let query = query_gen.acts_in_ids([route.master_activity_id]);
                endpoint.query_activities(query).then(activities => {
                    let master_activity = activities[0];
                    master_activity.segment_efforts.forEach(se => {
                        se.segment.effort_series = reactive([]);
                    });

                    route.master_activity = master_activity;
                    routes.push(route);

                    add_polyline(master_activity._id, master_activity.map.polyline);
                })
            }
        });
    }
    else {
        let query = get_query(type);
        if (!query) return;

        await endpoint.query_activities(query).then(db_activities => {
            db_activities.forEach(activity => {
                activity.segment_efforts.forEach(se => {
                    se.segment.effort_series = reactive([]);
                });
                
                activities.push(activity);

                add_polyline(activity._id, activity.map.polyline);
            })
        });
    }
}

function onSegmentEffortsRequested(activity: Activity, seg_id: number) {
    let segment = activity.segment_efforts.find(se => se.segment.id == seg_id);
    if (segment && segment.segment.effort_series.length > 0) {
        return;
    }

    endpoint.query_efforts(query_gen.efforts_on_seg_id(seg_id)).then(efforts => {        
        let moving_time_data: any[] = [];
        let distance_from_start_data: any[] = [];

        for (let effort of efforts) {
            let date = (new Date(effort.start_date_local.toString())).toLocaleDateString('ro-RO', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
            });

            moving_time_data.push({ 'x': date, 'y': effort.moving_time as number });
            distance_from_start_data.push({ 'x': date, 'y': (effort.distance_from_start as number).toFixed(1) });
        }

        let segment = activity.segment_efforts.find(se => se.segment.id == seg_id);
        if (!segment) return;

        segment.segment.effort_series.push({ type: 'line', name: "Distance from start", data: distance_from_start_data });
        segment.segment.effort_series.push({ type: 'bar', name: "Moving time", data: moving_time_data });
    });
}

</script>

<template>
    <RouteList class="absolute routeList" style="z-index: 2;" v-bind:routes="routes" v-on:selectedRoute="onRouteSelected"
        v-on:hoveredRoute="onRouteHovered" v-bind:hovered_id="hovered_id" v-on:unhoveredRoute="onRouteUnhovered"
        v-on:segmentEffortsRequested="onSegmentEffortsRequested"></RouteList>

    <ActivitiesList class="absolute routeList" style="z-index: 2;" v-bind:activities="activities"
        v-bind:hovered_id="hovered_id" v-on:selectedActivity="onActivitySelected" v-on:hoveredActivity="onActivityHovered"
        v-on:unhoveredActivity="onActivityUnhovered" v-on:segmentEffortsRequested="onSegmentEffortsRequested">
    </ActivitiesList>

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

        <input type="radio" class="btn-check" name="btnradio" id="btnradio4" autocomplete="off">
        <label class="btn btn-light buttons-bar-btn rounded-pill" v-bind:onClick="() => onRouteTypeRequested('abroad')"
            for="btnradio4">abroad</label>

        <input type="radio" class="btn-check" name="btnradio" id="btnradio5" autocomplete="off">
        <label class="btn btn-light buttons-bar-btn rounded-pill" v-bind:onClick="() => onRouteTypeRequested('best_bang')"
            for="btnradio5">best bang</label>
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
