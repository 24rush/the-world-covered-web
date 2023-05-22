import Activity from "./activity";

export default class Route {
    public _id: number = 0;
    public athlete_id: number = 0;
    public polyline: string = "";
    public activities: number[] = [];

    public master_activity_id: number = 0;
    public master_activity: Activity  = new Activity();
}