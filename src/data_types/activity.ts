import Effort from "./effort";

class Map {
    public polyline: string = "";
}

class EffortSeries {
    public type: String = "";
    public name: String = "";
    public data: number[] = [];
}

class ActivitySegment {
    public id: number = 0;   
    public distance: number = 0;
    public average_grade: number = 0;

    public effort_series: EffortSeries[] = [];
}

export class ActivityEffort {
    public id: number = 0;    
    public segment: ActivitySegment = new ActivitySegment();
    public name: String = "";     
}

export default class Activity {
    public _id: number = 0;    
    public map: Map = new Map;

    public athlete_count: number = 0;
    public location_city?: String = "";
    public location_country: String = "";

    public type: String = "";
    public distance: number = 0.0;
    public average_speed: number = 0.0;
    public elapsed_time: number = 0;
    public total_elevation_gain: number = 0.0;

    public segment_efforts: ActivityEffort[] = [];
}