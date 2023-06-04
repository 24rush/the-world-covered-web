import { LatLng } from "leaflet";
import type { ActivityEffort } from "./activity";
import type { Gradient } from "./route";

export class ActivityMetaData {
    public _id: number = 0;
    public type: String = "";

    public master_activity_id: number = 0;
    public activities: number[] = [];

    public polyline: string = "";
    public description: String = "";
    public location_city: String = "";
    public location_country: String = "";
    
    public start_date_local: String = "";
    
    public distance: number = 0.0;
    public elevation_gain: number = 0.0;
    public average_speed: number = 0.0;

    public count_times: number = 0;
    public athlete_count: number = 0;

    public segment_efforts: ActivityEffort[] = [];   
    public gradients: Gradient[] = [];
    public coords_center: LatLng = new LatLng(0,0);

    public isRoute() : boolean { return this.type.toLowerCase().includes('route');}
    public isRun() : boolean { return this.type.toLowerCase().includes('run'); }
    public isRide() : boolean { return this.type.toLowerCase().includes('ride'); }
    public isHike() : boolean { return this.type.toLowerCase().includes('hike'); }
}