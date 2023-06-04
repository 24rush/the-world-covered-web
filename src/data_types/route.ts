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
}