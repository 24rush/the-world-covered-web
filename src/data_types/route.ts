import Activity, { ActivityEffort } from "./activity";

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

    // View model
    public athlete_count: number = 0;
    public segment_efforts: ActivityEffort[] = [];
}