import { ActivityMetaData, LatLngMeta } from "./metadata";

export type DocumentId = number;

class Map {
    public polyline: string = "";
}

export class EffortSeriesData {
    public x: String = "";
    public y: number = 0;
    public activity_id: DocumentId = 0;
}

export class EffortSeries {
    public type: String = "";
    public name: String = "";
    public data: EffortSeriesData[] = [];
}

class ActivitySegment {
    public id: number = 0;   
    public distance: number = 0;
    public average_grade: number = 0;
    public maximum_grade: number = 0;
    public city: String = "";
    public country: String = "";

    // View model
    public effort_series: EffortSeries[] = [];
}

export class ActivityEffort {
    public id: number = 0;    
    public segment: ActivitySegment = new ActivitySegment();
    public name: String = "";
    public start_index_poly: number = 0;
    public end_index_poly: number = 0;

    // View model - filled in by client
    public polyline: string = "";
}

export default class Activity {
    public _id: number = 0;    
    public map: Map = new Map;

    public athlete_count: number = 0;
    public description: String = "";
    public location_city?: String = "";
    public location_country: String = "";
    public start_date_local: String = "";
    
    public type: String = "";
    public distance: number = 0.0;
    public average_speed: number = 0.0;
    public elapsed_time: number = 0;
    public total_elevation_gain: number = 0.0;

    public segment_efforts: ActivityEffort[] = [];

    public static canParseFromObject(obj: any) : boolean {
        let required_props = ['map', 'type', 'distance', 'location_city', 'location_country'];

        Object.keys(obj).forEach(prop => {
            required_props.splice(required_props.findIndex(rp => rp == prop), 1);
            return prop in required_props;
        });
        
        return required_props.length == 0;
    }

    public static create_metadata(activity: Activity) {    
        let metadata = new ActivityMetaData();
    
        metadata._id = activity._id;
        metadata.type = activity.type;
        metadata.master_activity_id = activity._id;
        metadata.activities = [];
    
        metadata.polyline = activity.map.polyline;
        metadata.description = activity.description;
        metadata.location_city = activity.location_city ?? "";
        metadata.location_country = activity.location_country;
        metadata.athlete_count = activity.athlete_count;
    
        metadata.distance = activity.distance;
        metadata.elevation_gain = activity.total_elevation_gain;
        metadata.average_speed = activity.average_speed;
        metadata.start_date_local = activity.start_date_local;
        metadata.segment_efforts = activity.segment_efforts;
        metadata.polyline = activity.map.polyline;
    
        // No counterpart fields
        metadata.count_times = 1;
    
        // To be filled later when master activity is retrieved    
        metadata.coords_center = new LatLngMeta(0, 0);
    
        return metadata;
    }
}