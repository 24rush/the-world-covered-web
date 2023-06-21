import DataEndpoint from '@/data_endpoint';
import Activity from '@/data_types/activity';
import { Gradient, Route } from '@/data_types/route'

var endpoint = new DataEndpoint();

onmessage = async (event) => {
    switch (event.data.query_type) {
        case "activities": {
            await endpoint.data_server.query_activities(event.data.query).then(res_activities => {
                res_activities.forEach(activity => {
                    postbackItemMessage(event, Activity.create_metadata(activity));
                });

                postbackDoneMessage(event, res_activities.length);
            });

            break;
        }
        case "unique_routes":
        case "most_ridden": {
            await endpoint.query_routes(event.data.query).then(res_routes => {
                res_routes.forEach(route => {
                    postbackItemMessage(event, Route.create_metadata(route));
                });

                postbackDoneMessage(event, res_routes.length);
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

        case "best_ascents":
        case "best_descents": {
            await endpoint.query_routes(event.data.query).then(res_routes => {
                let metadata = [];
                let comparator = event.data.query_type == "best_ascents" ? (g) => g.avg_gradient >= 7 : (g) => g.avg_gradient <= -4;

                res_routes.forEach(route => {

                    for (let gradient of route.gradients) {
                        if (!comparator(gradient))
                            continue;

                        metadata.push(Gradient.create_metadata(route, gradient));
                    }
                });

                let C = event.data.query_type == "best_ascents" ? 1 : -1;
                metadata = metadata.sort((a, b) => C * b.gradients[0].elevation_gain - C * a.gradients[0].elevation_gain)

                for (let metadata_for_gradient of metadata) {
                    postbackItemMessage(event, metadata_for_gradient);
                }

                postbackDoneMessage(event, res_routes.length);
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