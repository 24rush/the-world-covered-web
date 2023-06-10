import DataEndpoint from '@/data_endpoint';
import Activity from '@/data_types/activity';
import { ActivityMetaData, LatLngMeta } from '@/data_types/metadata';
import PolylineDecoder from '@/data_types/polyline_decode';

var gradient_idx = Math.floor(Math.random() * 174967);

var endpoint = new DataEndpoint();

onmessage = async (event) => {
    switch (event.data.query_type) {
        case "activities": {
            await endpoint.data_server.query_activities(event.data.query).then(res_activities => {
                res_activities.forEach(activity => {
                    let metadata_for_activity = Activity.create_metadata(activity);
                    postbackItemMessage(event, metadata_for_activity);
                });

                postbackDoneMessage(event, res_activities.length);
            });

            break;
        }
        case "unique_routes": {
            await endpoint.query_routes(event.data.query).then(res_routes => {
                res_routes.forEach(route => {
                    let metadata_for_route = create_metadata_for_route(route);
                    postbackItemMessage(event, metadata_for_route);
                });

                postbackDoneMessage(event, res_routes.length);
            });
            break;
        }

        case "best_ascents":
        case "best_descents": {
            await endpoint.query_routes(event.data.query).then(res_routes => {
                let metadata = [];

                res_routes.forEach(r => {
                    let comparator = event.data.type == "best_ascents" ? (g) => g.avg_gradient >= 7 : (g) => g.avg_gradient <= -4;
                    let metadatas_for_gradient = create_metadata_for_gradient(r, comparator);
                    for (let metadata_gradient of metadatas_for_gradient) {
                        metadata.push(metadata_gradient);
                    }
                });

                let C = event.data.type == "best_ascents" ? 1 : -1;
                metadata = metadata.sort((a, b) => C * b.gradients[0].elevation_gain - C * a.gradients[0].elevation_gain)

                for (let metadata_gradient of metadata) {
                    postbackItemMessage(event, metadata_gradient);
                }

                postbackDoneMessage(event, metadata.length);
            });
            break;
        }

        case "statistics": {
            await endpoint.query_statistics().then(res_stats => {
                res_stats.forEach(history => postbackItemMessage(event, history));

                postbackDoneMessage(event, res_stats.length);    
            });

            break;
        }
    }
}

function postbackItemMessage(event, metadata) {
    self.postMessage({
        type: "item",
        query_type: event.data.query_type,
        reqNo: event.data.reqNo,
        metadata: metadata
    });
}

function postbackDoneMessage(event, length) {
    self.postMessage({
        type: "done",
        query_type: event.data.query_type,
        reqNo: event.data.reqNo,
        noItems: length
    });
}

function create_metadata_for_route(route) {
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
    metadata.coords_center = new LatLngMeta(route.center_coord.y, route.center_coord.x);

    metadata.count_times = route.activities.length;

    // No counterpart fields    
    metadata.athlete_count = 0;
    metadata.start_date_local = "";

    // To be filled later when master activity is retrieved
    metadata.segment_efforts = [];

    return metadata;
}

function create_metadata_for_gradient(route, filter) {
    let metadata_gradients = [];

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

        metadata.coords_center = new LatLngMeta(route.center_coord.y, route.center_coord.x);
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
        let coords = PolylineDecoder.decodePolyline(route.polyline);
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