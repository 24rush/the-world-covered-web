import Activity, { ActivityEffort } from "./activity";

class Coord {
    public x: number = 0;
    public y: number = 0;
}

class Gradient {
    public start_index: number = 0;
    public end_index: number = 0;
    public gradient: number = 0;
    public length: number = 0;
    public avg_gradient: number = 0;
    public max_gradient: number = 0;
    public elevation_gain: number = 0;
    public altitudes: number[] = [];
}

export default class Route {
    public _id: number = 0;
    public athlete_id: number = 0;
    public polyline: string = "";
    public description: string = "";
    public activities: number[] = [];

    public master_activity_id: number = 0;
    public type: String = "";
    public distance: number = 0.0;
    public average_speed: number = 0.0;
    public total_elevation_gain: number = 0;

    public location_city: String = "";
    public location_country: String = "";
    public start_date_local: String = "";
    public dist_from_capital: number = 0;
    public center_coord: Coord = new Coord();
    public gradients: Gradient[] = [];

    // View model
    public athlete_count: number = 0;
    public segment_efforts: ActivityEffort[] = [];
}