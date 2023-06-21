
class YearStats {
    public year = 0;
    public rides_with_friends = 0;
    public runs = 0;
    public rides = 0;
    public total_elevation_gain = 0;

    public total_km_rides = 0;
    public total_km_runs = 0;

    public mins_per_week_rides = 0;
    public mins_per_week_runs = 0;

    public calories_runs = 0;
    public calories_rides = 0;
    
    public avg_speed_rides = 0;
    public avg_speed_runs = 0;

    public total_kudos = 0;
    public most_kudos_activity = 0;

    public vo2max = 0;
    public best_12min_act_id = 0;
    ////

    //TODO distribution per days of week
    countries_visited = 0;
    states_visited = 0;


    hardest_ride_id = 0;
    longest_ride_id = 0;
}

export class HistoryStatistics {
    public stats: YearStats[] = [];    
}