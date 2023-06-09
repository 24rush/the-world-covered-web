<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import DataEndpoint from '@/data_endpoint';
import LeafletMap from '@/leaflet/map';
import Route, { Gradient } from '@/data_types/route';
import ActivitiesList from './ActivitiesList.vue';
import Statistics from './Statistics.vue';
import Segments from './Segments.vue';
import GPTChart from './GPTChart.vue'
import QueryGen from '@/query_gen';
import Activity, { EffortSeriesData } from '@/data_types/activity';
import type { DocumentId } from '@/data_types/activity';
import { LatLng, LatLngBounds } from 'leaflet';
import PolylineDecoder from '@/data_types/polyline_decode';
import { ActivityMetaData } from '@/data_types/metadata';
import Gradients from './Gradients.vue';
import { HistoryStatistics } from '@/data_types/statistics';
import { Toast } from 'bootstrap'
import GPTCommunicator from '@/openai';

var activities_db = new Map<number, Activity>();
var statistics = ref<HistoryStatistics>(new HistoryStatistics());
var metadata = reactive<ActivityMetaData[]>([]);
var gpt_chart_data = ref<any>(null);

// Toggles the appearance of the Statistics component
var is_on_statistics_page = ref(false);

// true for as long as the user searched once and did not click on predefined queries
// used to keep the button queries disabled
var is_in_search_context = ref(false);

// true as long as the countdown for search is running
// used for disabling the search bar
var is_search_query_ongoing = ref(false);
var search_bar_btn_text = ref("GO");
var searchQuery = ref("");

var selected_activity = ref<ActivityMetaData>(new ActivityMetaData());
var hovered_id = ref(0);
var selected_id = ref(0);
var selected_seg_id = 0;

var map: LeafletMap;
var errorToast: bootstrap.Toast;
var endpoint: DataEndpoint;
var gptcomm: GPTCommunicator = new GPTCommunicator();

// Query related data
var query_gen: QueryGen = new QueryGen(4399230); // Athlete id which is required for some queries
var radius_end: number = 3;
var radius_start: number = 0;
var current_page = 0;
var current_route_type = "";
var has_more_data = ref(true);
var toast_message = ref("");

var gradient_idx = Math.floor(Math.random() * 174967);

onMounted(async () => {
    errorToast = new Toast("#errorToast", {
        animation: true,
        autohide: true,
        delay: 4000
    });

    endpoint = new DataEndpoint();
    map = new LeafletMap("map");

    // Events coming from map
    map.register_hovered_handler((id: number, state: boolean) => {
        if (selected_id.value == 0) bring_activity_into_view(id);
        state ? onActivityHovered(id) : onActivityUnhovered(id);
    });

    map.register_poly_clicked_handler((id: number) => {
        if (selected_id.value == 0) bring_activity_into_view(id);
        onActivitySelected(id);
    });

    map.register_map_centered_at_cbk((new_center: LatLng, bounds: LatLngBounds) => {
        if (selected_id.value == 0 && metadata && metadata.length > 0) {
            // If no activity is selected then move to closest one
            let closest_act = find_activity_closest_to(new_center);

            if (closest_act) {
                bring_activity_into_view(closest_act._id);
            }
        }

        if (bounds.isValid() && current_route_type == "unique_routes") {
            let dist_from_capital = calcCrow(bounds.getNorthWest(), new LatLng(44.439663, 26.096306));

            if (dist_from_capital / 100 > radius_end) {
                radius_start = radius_end;
                radius_end = Math.ceil(dist_from_capital / 100);

                let query = query_gen.set_query_for_type("unique_routes", radius_start, radius_end);

                endpoint.query_routes(query).then(res_routes => {
                    res_routes.forEach(r => on_new_route_retrieved(r));

                    // Unique routes have no limit
                    has_more_data.value = false;
                });
            }
        }
    });

    // Verify if we have a special URL
    // 1. actid=<>
    let act_id = (new URL(window.location.href)).searchParams.get("actid");
    if (act_id) {
        // Send it to center in case activity id does not exist
        map.center_at_latlng(new LatLng(44.4, 26));
        onRouteTypeRequested("activity_id", parseInt(act_id));
    }
    else {
        onRouteTypeRequested("unique_routes");
        (document.getElementById('btnradio_unique') as HTMLInputElement).checked = true;
    }
})

function bring_activity_into_view(resource_id: number) {
    document.getElementById("activity_" + resource_id)?.parentElement?.scrollIntoView(true);
}

function onActivityUnselected(resource_id: DocumentId) {
    if (resource_id == 0)
        return;

    // If Selected then hovered so unhover it
    hover_polyline_of_id(resource_id, false);
    // Unselect current segment
    onSegmentUnselected(selected_seg_id);

    selected_activity.value = new ActivityMetaData();
    selected_seg_id = 0;
    map.show_all();
}

function generate_segment_polylines(activity: Activity) {
    if (activity.segment_efforts.length && activity.segment_efforts[0].polyline)
        return;

    let seg_cache: Map<number, string> = new Map();

    let coords = PolylineDecoder.decodePolyline(activity.map.polyline).getLatLngs();

    activity.segment_efforts.forEach(effort => {
        let existing_seg = seg_cache.get(effort.segment.id);

        if (existing_seg) {
            effort.polyline = existing_seg;
        } else {
            let spliced_poly = coords.slice(effort.start_index_poly, effort.end_index_poly + 1);
            effort.polyline = PolylineDecoder.encodePolyline(spliced_poly)

            seg_cache.set(effort.segment.id, effort.polyline);
        }
    });
}

async function onActivitySelected(resource_id: DocumentId) {
    let metadata_for_activity = metadata.find(a => a._id == resource_id);
    if (!metadata_for_activity) {
        console.log('WARNING: No metadata for ' + resource_id);
        return;
    }

    let master_activity_id = metadata_for_activity.master_activity_id;

    let select_activity = (resource_id: number, activity?: Activity) => {
        selected_id.value = resource_id;
        selected_activity.value = metadata_for_activity ?? new ActivityMetaData();

        //map.hide_all();
        //map.show_only(resource_id);
        map.center_view(resource_id);

        hovered_id.value = resource_id;
        hover_polyline_of_id(resource_id, true);

        // Gradients don't have an associated activity
        if (activity) {
            generate_segment_polylines(activity);
            highlight_first_segment(activity);
        }
    };

    onActivityUnselected(selected_id.value);

    if (selected_id.value == resource_id) {
        selected_id.value = 0;
        return;
    }

    if (metadata_for_activity.type.includes("Gradient")) {
        select_activity(resource_id);
    }
    else {

        let cached_act = activities_db.get(master_activity_id);

        if (!cached_act) {
            await endpoint.query_activities(query_gen.docs_with_ids([master_activity_id])).then(res_activities => {
                cached_act = res_activities[0];
                // Retrieve the activity associated with the Route
                on_new_activity_retrieved(cached_act);
            });
        }

        select_activity(metadata_for_activity._id, cached_act);
    }
}

function highlight_first_segment(activity: Activity) {
    if (activity.segment_efforts && activity.segment_efforts.length) {
        onSegmentSelected(activity.segment_efforts[0].segment.id)
    }
}

function onActivityHovered(resource_id: DocumentId) {
    if (selected_id.value != 0)
        return;

    hovered_id.value = resource_id;
    hover_polyline_of_id(resource_id, true);
}

function onActivityUnhovered(resource_id: DocumentId) {
    if (selected_id.value != 0)
        return;

    hovered_id.value = 0;
    hover_polyline_of_id(resource_id, false);
}

function onSegmentSelected(seg_id: DocumentId) {
    if (selected_seg_id != 0) {
        onSegmentUnselected(selected_seg_id);
        selected_seg_id = 0;
    }

    let seg = selected_activity.value.segment_efforts.find(se => se.segment.id == seg_id);

    if (seg && seg.polyline) {
        selected_seg_id = seg_id;
        map.register_polyline(seg_id, seg.polyline, {
            "weight": 5.4,
            "color": "#fc5200".toString()
        });
    }
}

function onSegmentUnselected(seg_id: DocumentId) {
    map.unregister_polyline(selected_seg_id);
    let seg = selected_activity.value.segment_efforts.find(se => se.segment.id == seg_id);

    if (seg && seg.polyline) {
        selected_seg_id = 0;
        map.unregister_polyline(seg_id);
    }
}

function onNextGradient(gradient_id: number) {
    let curr_gradient_index = metadata.findIndex(meta => meta._id == gradient_id);

    if (curr_gradient_index != -1 && curr_gradient_index + 1 < metadata.length)
        onActivitySelected(metadata[curr_gradient_index + 1]._id);
}

function onPreviousGradient(gradient_id: number) {
    let curr_gradient_index = metadata.findIndex(meta => meta._id == gradient_id);

    if (curr_gradient_index != -1 && curr_gradient_index - 1 >= 0)
        onActivitySelected(metadata[curr_gradient_index - 1]._id);
}

function onNextPageRequested(page: number) {
    current_page = page;
    query_gen.set_next_page_of_current_query();
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

function find_activity_closest_to(point: LatLng): ActivityMetaData | undefined {
    let curr_min = 0;
    let curr_min_act: ActivityMetaData | undefined = undefined;

    metadata.forEach((act) => {
        let dist = calcCrow(point, act.coords_center);

        if (curr_min == 0 || dist < curr_min) {
            curr_min = dist;
            curr_min_act = act;
        }
    });

    return curr_min_act;
}

function create_metadata_for_route(route: Route): ActivityMetaData {
    let metadata = new ActivityMetaData();

    metadata._id = route._id;
    metadata.type = route.type;
    metadata.master_activity_id = route.master_activity_id;
    metadata.activities = route.activities;

    metadata.polyline = route.polyline;
    metadata.description = route.description;
    metadata.location_city = route.location_city;
    metadata.location_country = route.location_country;

    metadata.distance = route.distance;
    metadata.elevation_gain = route.total_elevation_gain;
    metadata.average_speed = route.average_speed;

    if (route.center_coord)
        metadata.coords_center = new LatLng(route.center_coord.y, route.center_coord.x);
    else {
        console.log("Missing center:" + metadata.master_activity_id);
        console.log(route)
    }
    metadata.count_times = route.activities.length;

    // No counterpart fields    
    metadata.athlete_count = 0;
    metadata.start_date_local = "";

    // To be filled later when master activity is retrieved
    metadata.segment_efforts = [];

    return metadata;
}

function create_metadata_for_activity(activity: Activity): ActivityMetaData {
    let metadata = new ActivityMetaData();

    metadata._id = activity._id;
    metadata.type = activity.type;
    metadata.master_activity_id = activity._id;
    metadata.activities = [];

    metadata.polyline = activity.map.polyline;
    metadata.description = activity.description;
    metadata.location_city = activity.location_city ?? "";
    if (metadata.location_city === "") {
        let effort_with_city = activity.segment_efforts.find(se => se.segment.city && se.segment.city != "");
        if (effort_with_city) metadata.location_city = effort_with_city.segment.city;
    }

    metadata.location_country = activity.location_country;
    if (metadata.location_country === "Romania") {
        let effort_with_country = activity.segment_efforts.find(se => se.segment.country && se.segment.country != "");
        if (effort_with_country) metadata.location_country = effort_with_country.segment.country;
    }

    metadata.athlete_count = activity.athlete_count;

    metadata.distance = activity.distance;
    metadata.elevation_gain = activity.total_elevation_gain;
    metadata.average_speed = activity.average_speed;
    metadata.start_date_local = activity.start_date_local;
    metadata.segment_efforts = activity.segment_efforts;

    // No counterpart fields
    metadata.count_times = 1;

    // To be filled later when master activity is retrieved    
    metadata.coords_center = new LatLng(0, 0);

    return metadata;
}

function create_metadata_for_gradient(route: Route, filter: (g: Gradient) => boolean): ActivityMetaData[] {
    let metadata_gradients: ActivityMetaData[] = [];

    for (let gradient of route.gradients) {
        if (!filter(gradient))
            continue;

        let metadata = new ActivityMetaData();

        metadata._id = (gradient_idx++);
        gradient.id = metadata._id;
        metadata.type = "Gradient" + route.type;
        metadata.master_activity_id = route.master_activity_id;
        metadata.activities = route.activities;

        metadata.description = route.description;
        metadata.location_city = gradient.location_city != "" ? route.location_city : gradient.location_city;
        metadata.location_country = gradient.location_country != "" ? route.location_country : gradient.location_country;

        metadata.distance = gradient.length;
        metadata.elevation_gain = gradient.elevation_gain;
        metadata.average_speed = route.average_speed;

        metadata.coords_center = new LatLng(route.center_coord.y, route.center_coord.x);
        metadata.count_times = route.activities.length;

        gradient.incline = [];
        gradient.altitude.forEach((altitude, index) => {
            if (index == 0) {
                gradient.incline[0] = 0;
                return;
            }

            gradient.incline[index] = 100 * ((gradient.altitude[index] - gradient.altitude[index - 1]) * 1.) / (gradient.distance[index] - gradient.distance[index - 1])
        });

        metadata.gradients = [gradient];

        // Special mapping for polyline which is the actual gradient
        let coords = PolylineDecoder.decodePolyline(route.polyline).getLatLngs();
        let gradient_coords = coords.slice(gradient.start_index, gradient.end_index + 1);

        metadata.polyline = PolylineDecoder.encodePolyline(gradient_coords);

        // No counterpart fields    
        metadata.athlete_count = 0;
        metadata.start_date_local = "";
        metadata.segment_efforts = [];

        metadata_gradients.push(metadata);
    }

    return metadata_gradients;
}

function on_new_route_retrieved(route: Route): boolean {
    let metadata_for_route = create_metadata_for_route(route);
    metadata.push(metadata_for_route);

    map.register_polyline(metadata_for_route._id, metadata_for_route.polyline);

    return true;
}

function on_new_activity_retrieved(activity: Activity): boolean {
    if (activities_db.get(activity._id)) {
        return false;
    }

    let activity_meta_data = metadata.find(meta => meta.master_activity_id == activity._id);

    if (!activity_meta_data) {
        activity_meta_data = create_metadata_for_activity(activity);
        metadata.push(create_metadata_for_activity(activity));
    }

    activity_meta_data.segment_efforts = activity.segment_efforts;
    activity_meta_data.segment_efforts.forEach(se => {
        se.segment.effort_series = reactive([]);
    });

    if (activity.map && activity.map.polyline) {
        let coords = map.register_polyline(activity._id, activity.map.polyline);
        activity_meta_data.coords_center = coords.getCenter();
    }

    activities_db.set(activity._id, activity);
    return true;
}

async function retrieve_query_type(type: string, activity_id?: DocumentId) {
    searchQuery.value = "";
    is_on_statistics_page.value = false;
    is_in_search_context.value = false;
    is_search_query_ongoing.value = false;

    let highlight_new_item_received = () => {
        if (metadata.length) {
            if (current_page == 0)
                onActivitySelected(metadata[0]._id);
            else
                setTimeout(() => { bring_activity_into_view(metadata[metadata.length - 1]._id); });
        }
    }

    let query: any = query_gen.get_current_query();

    switch (type) {
        case "unique_routes": {
            await endpoint.query_routes(query).then(res_routes => {
                res_routes.forEach(r => on_new_route_retrieved(r));

                // Unique routes have no limit
                has_more_data.value = false;
            });
            break;
        }
        case "best_ascents": {
            await endpoint.query_routes(query).then(res_routes => {
                res_routes.forEach(r => {
                    let metadatas_for_gradient = create_metadata_for_gradient(r, (g) => g.avg_gradient >= 7);
                    for (let metadata_gradient of metadatas_for_gradient) {
                        metadata.push(metadata_gradient);
                        map.register_polyline(metadata_gradient._id, metadata_gradient.polyline);
                    }

                    metadata = metadata.sort((a, b) => b.gradients[0].elevation_gain - a.gradients[0].elevation_gain)
                });

                has_more_data.value = res_routes.length == query_gen.get_results_per_page();
            });
            break;
        }
        case "statistics": {
            is_on_statistics_page.value = true;

            if (!statistics.value.stats.length) {
                await endpoint.query_statistics().then(res_stats => {
                    let history = res_stats[0];
                    history.stats = history.stats.reverse();
                    statistics.value = history;
                });
            }
            break;
        }

        default: {
            if (type == "activity_id" && activity_id) {
                query = query_gen.docs_with_ids([activity_id]);
            }
            await endpoint.query_activities(query).then(res_activities => {
                res_activities.forEach(a => on_new_activity_retrieved(a));
                has_more_data.value = res_activities.length == query_gen.get_results_per_page();
            });
        }
    }

    highlight_new_item_received();
}

function reset_routes() {
    // Cleares all state data except for statistics which are readonly
    metadata.splice(0)
    activities_db.clear();
    map.clear_all();

    current_page = 0;
    query_gen.reset();
    has_more_data.value = true;

    hovered_id.value = 0;
    selected_seg_id = 0;
    selected_id.value = 0;

    selected_activity.value = new ActivityMetaData();
}

async function onRouteTypeRequested(type: string, activity_id?: DocumentId) {
    if (current_route_type == type)
        return;

    reset_routes();
    current_route_type = type.toString();
    query_gen.set_query_for_type(current_route_type, radius_start, radius_end);

    retrieve_query_type(type, activity_id);
}

function onSegmentEffortsRequested(activity: Activity, seg_id: number) {
    let segment = activity.segment_efforts.find(se => se.segment.id == seg_id);
    if (segment && segment.segment.effort_series.length > 0) {
        return;
    }

    // Retrieve all efforts for this activity
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

enum GPTReponseType {
    Unknown,
    Activity,
    ActivityArray,
    ObjectArray,
    Text
}

function determine_result_type(result: any): GPTReponseType {
    switch (typeof result) {
        case "object":
            let obj_to_parse = result.length && result.length > 0 ? result[0] : result;

            if (Activity.canParseFromObject(obj_to_parse))
                return result.length > 0 ? GPTReponseType.ActivityArray : GPTReponseType.Activity;
            else
                return GPTReponseType.ObjectArray;
        case "string": {
            return GPTReponseType.Text;
        }
        default:
            return GPTReponseType.Unknown;
    }
}

function showErrorMessage() {
    toast_message.value = "Ohh no! ChatGPT couldn't decipher this query. Try rephrasing!";
    errorToast.show();
}

function showNoResultsMessage() {
    toast_message.value = "The query did not return any results. Try something else!";
    errorToast.show();
}

function try_interpret_searchRequest(): boolean {
    let search_query = searchQuery.value.toLowerCase();

    let matches = search_query.match(/(rides|runs)\sin\s(\w*)/);
    if (matches) {
        let type = "Ride";
        switch (matches[1].toLowerCase()) {
            case "run":
            case "runs":
                type = "Run";
                break;
            case "ride":
            case "rides":
                type = "Ride";
                break;
            case "hike":
            case "hikes":
                type = "Hike";
                break;
            default:
                return false;
        }

        let place = "Romania";
        switch (matches[2].toLowerCase()) {
            case "nl":
            case "netherlands":
            case "the netherlands":
            case "holland":
                place = "Netherlands";
                break;
            case "campina":
                place = "Câmpina"
                break;
            case "bucuresti":
                place = "Bucharest"
                break;
            default:
                place = matches[2].charAt(0).toUpperCase() + matches[2].toLowerCase().slice(1);
        }

        query_gen.set_query("custom", query_gen.act_type_in_country(type, place));
        return true;
    }

    return false;
}

async function onSearchRequest() {
    if (searchQuery.value == "")
        return;

    is_on_statistics_page.value = false;
    is_search_query_ongoing.value = true;
    is_in_search_context.value = true;
    let start_count_down = 10;

    let reset_countdown = () => {
        search_bar_btn_text.value = "GO";
        is_search_query_ongoing.value = false;
        start_count_down = 10;
    }

    let count_down = () => {
        if (is_search_query_ongoing.value) {
            start_count_down--;
            search_bar_btn_text.value = start_count_down.toString();
        }

        if (start_count_down > 0 && is_search_query_ongoing.value)
            setTimeout(count_down, 1000);
        else {
            reset_countdown();
        }
    };

    setTimeout(count_down);

    let result_has_data = (result: any): boolean => {
        let res_type = determine_result_type(result);

        if ((res_type == GPTReponseType.ActivityArray || res_type == GPTReponseType.ObjectArray) && result.length == 0) {
            return false;
        }

        return true;
    };

    let display_result = (result: any) => {
        reset_countdown();

        if (!result_has_data(result)) {
            showNoResultsMessage();
            return;
        }

        switch (determine_result_type(result)) {
            case GPTReponseType.ObjectArray: {
                reset_routes();
                current_route_type = "gpt";

                console.log('Parsing response as object list')
                gpt_chart_data.value = result;

                break;
            }
            case GPTReponseType.ActivityArray: {
                reset_routes();
                current_route_type = "gpt";

                console.log('Parsing response as activity list')

                result.forEach((a: Activity) => on_new_activity_retrieved(a));
                onActivitySelected(result[0]._id);
                has_more_data.value = result.length == query_gen.get_results_per_page();

                break;
            }
            default:
                showErrorMessage();
        }
    }

    let needs_gpt = true;

    if (try_interpret_searchRequest()) {
        let result = await endpoint.data_server.query_activities(query_gen.get_current_query());
        if (result_has_data(result)) {
            display_result(result);
            needs_gpt = false;
        }
    }

    if (needs_gpt) {
        gptcomm.query(searchQuery.value, (obj_query: any) => {
            query_gen.set_query("gpt", obj_query);

            endpoint.data_server.query_activities(query_gen.get_current_query()).then(result => {
                display_result(result);
            });

        }, (err) => {
            reset_countdown();
            showErrorMessage()
        });
    }
}
</script>
<template>
    <div id="map" style="z-index: 0;"> </div>

    <ActivitiesList class="absolute" v-bind:activities="metadata" v-bind:has_more_data="has_more_data"
        v-bind:hovered_id="hovered_id" v-bind:selected_id="selected_id" v-on:selectedActivity="onActivitySelected"
        v-on:hoveredActivity="onActivityHovered" v-on:unhoveredActivity="onActivityUnhovered"
        v-on:on-next-page-requested="onNextPageRequested">
    </ActivitiesList>

    <div class="absolute menu-bar" style="margin-top: 4em; display: flex; flex-wrap: wrap; height: 200px;">
        <div class="input-group mb-2 rounded-pill">
            <input type="text" v-model="searchQuery" class="form-control" placeholder="Search my activities using AI"
                @keyup.enter.native="onSearchRequest" aria-describedby="button-addon2"
                :disabled="is_search_query_ongoing" style="border-top-left-radius: 50px;border-bottom-left-radius: 50px;">
            <button v-on:click="onSearchRequest" class="btn btn-secondary" type="button" id="button-addon2"
                style="border-top-right-radius: 50px; border-bottom-right-radius: 50px;">{{ search_bar_btn_text }}</button>
        </div>

        <div class="queries-bar btn-group mb-3" role="group" aria-label="Basic radio toggle button group">
            <input type="radio" class="btn-check" name="btnradio" id="btnradio_unique" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:class="{ 'force_btn_unselect': is_in_search_context }"
                v-bind:onClick="() => onRouteTypeRequested('unique_routes')" for="btnradio_unique">all routes</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:class="{ 'force_btn_unselect': is_in_search_context }"
                v-bind:onClick="() => onRouteTypeRequested('epic_rides')" for="btnradio2">epic rides</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio3" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:class="{ 'force_btn_unselect': is_in_search_context }"
                v-bind:onClick="() => onRouteTypeRequested('with_friends')" for="btnradio3">with friends</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio4" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:class="{ 'force_btn_unselect': is_in_search_context }"
                v-bind:onClick="() => onRouteTypeRequested('abroad')" for="btnradio4">abroad</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio5" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:class="{ 'force_btn_unselect': is_in_search_context }"
                v-bind:onClick="() => onRouteTypeRequested('best_ascents')" for="btnradio5">best ascents</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio6" autocomplete="off">
            <label class="btn btn-light buttons-bar-btn rounded-pill"
                v-bind:class="{ 'force_btn_unselect': is_in_search_context }"
                v-bind:onClick="() => onRouteTypeRequested('statistics')" for="btnradio6">statistics</label>
        </div>
        <Segments v-bind:activity="selected_activity" v-on:segmentEffortsRequested="onSegmentEffortsRequested"
            v-on:segment-selected="onSegmentSelected" v-on:segment-unselected="onSegmentUnselected">
        </Segments>

        <Gradients v-bind:route="selected_activity" v-on:on-next-gradient="onNextGradient"
            v-on:on-previous-gradient="onPreviousGradient">
        </Gradients>

        <Statistics v-if="is_on_statistics_page" v-bind:statistics="statistics">
        </Statistics>

        <GPTChart v-if="gpt_chart_data" :results_data="gpt_chart_data">
        </GPTChart>

        <div id="errorToast" class="toast align-items-center"
            style="width: 100%!important; border-radius: 50px;margin-top: 10px;" role="alert" aria-live="assertive"
            aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    {{ toast_message }}
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>

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

.menu-bar {
    z-index: 1;
    top: 4em;
    left: 50%;
    transform: translate(-50%, -50%);

    display: flex;
    flex-wrap: wrap;

    align-content: flex-start;
    align-items: center;
}

.buttons-bar-btn {
    margin-right: 0.5em;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.queries-bar {
    z-index: 1;    
    margin: auto
}

.force_btn_unselect {
    background-color: var(--bs-btn-bg) !important;
}

@media (min-width: 1024px) {}
</style>
