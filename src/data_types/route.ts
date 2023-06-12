import { ActivityMetaData, LatLngMeta } from "./metadata";
import PolylineDecoder from "./polyline_decode";

var gradient_idx = Math.floor(Math.random() * 174967);

class Coord {
    public x: number = 0;
    public y: number = 0;
}

export class Gradient {
    public id: number = 0;
    public start_index: number = 0;
    public end_index: number = 0;
    public location_city: String = "";
    public location_country: String = "";
    public gradient: number = 0;
    public length: number = 0;
    public avg_gradient: number = 0;
    public max_gradient: number = 0;
    public elevation_gain: number = 0;
    public altitude: number[] = [];
    public distance: number[] = [];

    // View model
    public incline: number[] = [];

    public static create_metadata(route: Route, gradient: Gradient): ActivityMetaData {        
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

        return metadata;
    }
}

export class Route {
    public _id: number = 0;
    public master_activity_id: number = 0;
    public type: String = "";

    public athlete_id: number = 0;

    public activities: number[] = [];

    public distance: number = 0.0;
    public average_speed: number = 0.0;
    public total_elevation_gain: number = 0;

    public description: string = "";
    public location_city: String = "";
    public location_country: String = "";
    public polyline: string = "";

    public gradients: Gradient[] = [];
    public dist_from_capital: number = 0;
    public center_coord: Coord = new Coord();

    public static create_metadata(route: Route): ActivityMetaData {
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
        metadata.gradients = [];

        // To be filled later when master activity is retrieved
        metadata.segment_efforts = [];

        return metadata;
    }
}