import { LatLng } from "leaflet";

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
    public effort_series: EffortSeries[] = [];

    // View model
    public polyline: string = "";
}

export class ActivityEffort {
    public id: number = 0;    
    public segment: ActivitySegment = new ActivitySegment();
    public name: String = "";     
}

export default class Activity {
    public _id: number = 0;    
    public master_activity_id: number = 0;
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

    // View Model
    public activities: number[] = [];
    public coords_center: LatLng = new LatLng(0,0);
}