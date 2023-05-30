<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import DataEndpoint from '@/data_endpoint';
import LeafletMap from '@/leaflet/map';
import Route from '@/data_types/route';
import ActivitiesList from './ActivitiesList.vue';
import Segments from './Segments.vue';
import QueryGen from '@/query_gen';
import Activity, { EffortSeriesData } from '@/data_types/activity';
import type { DocumentId } from '@/data_types/activity';
import type { LatLng } from 'leaflet';

var routes_db = new Map<number, Route>();
var routes = reactive<Route[]>([]);

var activities_db = new Map<number, Activity>();
var activities = reactive<Activity[]>([]);

var selected_activity = ref<Activity>(new Activity());
var hovered_id = ref(0);
var selected_id = ref(0);

var map: LeafletMap;
var endpoint: DataEndpoint;
var query_gen: QueryGen = new QueryGen(4399230); // Athlete id which is required for some queries
var current_page = 0;
var current_route_type = "unique_routes";
var has_more_data = ref(true);

onMounted(async () => {
    endpoint = new DataEndpoint();
    map = new LeafletMap("map");

    // Events coming from map
    map.register_hovered_handler((id: number, state: boolean) => {
        bring_activity_into_view(id);
        state ? onActivityHovered(id) : onActivityUnhovered(id);
    });

    map.register_poly_clicked_handler((id: number) => {
        bring_activity_into_view(id);
        onActivitySelected(id);
    });

    map.register_map_centered_at_cbk((new_center: LatLng) => {
        if (selected_id.value != 0) {
            return
        }

        let closest_act = find_activity_closest_to(new_center);

        if (closest_act) {
            bring_activity_into_view(closest_act._id);
        }
    });

    onRouteTypeRequested("unique_routes");
})

function bring_activity_into_view(activity_id: number) {
    document.getElementById("activity_" + activity_id)?.parentElement?.scrollIntoView(true);
}

function onActivityUnselected(activity_id: DocumentId) {
    selected_activity.value = new Activity();
    selected_id.value = 0;
    hovered_id.value = activity_id;
    map.show_all();
}

function onActivitySelected(activity_id: DocumentId) {
    if (selected_id.value == activity_id) {
        onActivityUnselected(activity_id);
        return;
    }

    let select_activity = (activity: Activity) => {
        hovered_id.value = 0;
        selected_activity.value = activity;
        selected_id.value = activity_id;

        map.hide_all();
        map.show_only(activity_id);
        map.center_view(activity_id);

        hover_polyline_of_id(activity_id, true);
    };

    let cached_act = activities_db.get(activity_id);

    if (!cached_act) {
        retrieve_activity(activity_id).then(activity => {
            select_activity(activity);
        });
    } else {
        select_activity(cached_act);
    }
}

function onActivityHovered(activity_id: DocumentId) {
    if (selected_id.value != 0)
        return;

    hovered_id.value = activity_id;
    hover_polyline_of_id(activity_id, true);
}

function onActivityUnhovered(activity_id: DocumentId) {
    if (selected_id.value != 0)
        return;

    map.show_all();
    hovered_id.value = 0;
    hover_polyline_of_id(activity_id, false);
}

function onNextPageRequested(page: number) {
    current_page = page;
    query_gen.set_page(current_page);
    retrieve_query_type(current_route_type);
}

function hover_polyline_of_id(id: number, hover: boolean) {
    hover ? map.highlight_elem_id(id) : map.unhighlight_elem_id(id);
}

function calcCrow(a: LatLng, b: LatLng) {
    var R = 6371; // km
    var dLat = toRad(b.lat - a.lat);
    var dLon = toRad(b.lng - a.lng);
    var lat1 = toRad(a.lat);
    var lat2 = toRad(b.lat);

    let A = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(value: number): number {
    return value * Math.PI / 180;
}

function find_activity_closest_to(point: LatLng): Activity | undefined {
    let curr_min = 0;
    let curr_min_act: Activity | undefined = undefined;

    activities_db.forEach((act) => {
        let dist = calcCrow(point, act.coords_center);

        if (curr_min == 0 || dist < curr_min) {
            curr_min = dist;
            curr_min_act = act;
        }
    });

    return curr_min_act;
}

function register_new_activity(activity: Activity): boolean {
    if (activities_db.get(activity._id)) {
        return false;
    }

    activity.segment_efforts.forEach(se => {
        se.segment.effort_series = reactive([]);
    });

    activity.master_activity_id = activity._id;
    activity.activities = [];
    activities_db.set(activity._id, activity);

    let coords = map.add_polyline(activity._id, activity.map.polyline);
    activity.coords_center = coords.getCenter();

    return true;
}

function retrieve_activity(id: number): Promise<Activity> {
    return endpoint.get_activities_with_id([id]).then(activities => {
        register_new_activity(activities[0]);

        return activities[0];
    });
}

async function retrieve_query_type(type: string) {
    let query = "";
    switch (type) {
        case "with_friends":
            query = query_gen.acts_with_friends();
            break;
        case "abroad":
            query = query_gen.act_abroad()
            break;
        case "epic_rides":
            query = query_gen.act_epic_rides()
            break;
        case "best_bang":
            query = query_gen.act_best_bang()
            break;
        case "unique_routes":
            query = query_gen.unique_routes_routes()
            break;
        default:
            console.log("WARNING: Unknown route type")
            query = "";
    }

    if (type === "unique_routes") {
        await endpoint.query_routes(query).then(res_routes => {
            res_routes.forEach(route => {
                if (routes_db.get(route._id))
                    return;

                routes_db.set(route._id, route);
                routes.push(route);

                // Routes contain the polyline of the master activity
                map.add_polyline(route.master_activity_id, route.polyline);
            });

            has_more_data.value = res_routes.length == query_gen.get_results_per_page();

            if (routes.length) {
                if (current_page == 0)
                    onActivitySelected(routes[0].master_activity_id);
                else
                    setTimeout(() => { bring_activity_into_view(routes[routes.length - 1].master_activity_id); });
            }
        });
    }
    else {
        await endpoint.query_activities(query).then(res_activities => {
            res_activities.forEach(activity => {
                if (register_new_activity(activity)) {
                    activities.push(activity);
                }
            });

            has_more_data.value = res_activities.length == query_gen.get_results_per_page();

            if (activities.length) {
                if (current_page == 0)
                    onActivitySelected(activities[0]._id);
                else
                    setTimeout(() => { bring_activity_into_view(activities[activities.length - 1]._id); });
            }

        });
    }
}

async function onRouteTypeRequested(type: String) {
    activities.splice(0)
    routes.splice(0);
    activities_db.clear();
    routes_db.clear();
    map.clear_all();
    
    current_route_type = type.toString();
    current_page = 0;
    query_gen.set_page(current_page);
    has_more_data.value = true;

    retrieve_query_type(current_route_type);
}

function onSegmentEffortsRequested(activity: Activity, seg_id: number) {
    let segment = activity.segment_efforts.find(se => se.segment.id == seg_id);
    if (segment && segment.segment.effort_series.length > 0) {
        return;
    }

    endpoint.query_efforts(query_gen.efforts_on_seg_id(seg_id)).then(efforts => {
        let moving_time_data: EffortSeriesData[] = [];
        let distance_from_start_data: EffortSeriesData[] = [];

        for (let effort of efforts) {
            let date = (new Date(effort.start_date_local.toString())).toLocaleDateString('ro-RO', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
            });

            moving_time_data.push({ 'x': date, 'y': effort.moving_time as number, 'activity_id': effort.activity_id as number });
            distance_from_start_data.push({ 'x': date, 'y': parseFloat((effort.distance_from_start as number).toFixed(1)), 'activity_id': effort.activity_id as number });
        }

        let segment = activity.segment_efforts.find(se => se.segment.id == seg_id);
        if (!segment) return;

        segment.segment.effort_series.push({ type: 'line', name: "Distance from home", data: distance_from_start_data });
        segment.segment.effort_series.push({ type: 'area', name: "Moving time", data: moving_time_data });
    });
}

</script>

<template>
    <div id="map" style="z-index: 0;"> </div>

    <ActivitiesList class="absolute" style="z-index: 2;" v-bind:activities="activities" v-bind:routes="routes" v-bind:has_more_data="has_more_data"
        v-bind:hovered_id="hovered_id" v-bind:selected_id="selected_id" v-on:selectedActivity="onActivitySelected"
        v-on:hoveredActivity="onActivityHovered" v-on:unhoveredActivity="onActivityUnhovered"
        v-on:on-next-page-requested="onNextPageRequested">
    </ActivitiesList>

    <div class="absolute buttons-bar" style="display: flex; flex-wrap: wrap;">
        <div class="btn-group" style="z-index: 1; flex-basis: 100%;" role="group"
            aria-label="Basic radio toggle button group">
            <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked>
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:onClick="() => onRouteTypeRequested('unique_routes')" for="btnradio1">all routes</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:onClick="() => onRouteTypeRequested('epic_rides')" for="btnradio2">epic rides</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio3" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:onClick="() => onRouteTypeRequested('with_friends')" for="btnradio3">with friends</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio4" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill" v-bind:onClick="() => onRouteTypeRequested('abroad')"
                for="btnradio4">abroad</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio5" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:onClick="() => onRouteTypeRequested('best_bang')" for="btnradio5">best bang</label>
        </div>
        <Segments v-bind:activity="selected_activity" v-on:segmentEffortsRequested="onSegmentEffortsRequested">
        </Segments>
    </div>
</template>

<style>
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
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

@media (min-width: 1024px) {}
</style>
