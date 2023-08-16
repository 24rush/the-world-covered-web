

class ActivityMonthlyStats {
    type = "";
    total_km = 0;
    mins_per_week = 0;
}

class ActivityYearlyStats {
    type = "";
    count = 0;

    total_km = 0;
    total_elevation_gain = 0;
    mins_per_week = 0;
    avg_speed = 0;

    calories = 0;

    hardest_ride_id = 0;
    longest_ride_id = 0;
}

class YearStats {
    year = 0;
    sports : ActivityYearlyStats[] = [];

    vo2max_run = 0;
    best_12min_act_id = 0;

    total_kudos = 0;
    most_kudos_activity = 0;
    rides_with_friends = 0;
    runs_over_20k = 0;
    rides_over_100k = 0;
    rides_over_160k = 0;

    current_month : ActivityMonthlyStats[] = [];   
}

class WholeStats {
    years_of_sports: YearStats[] = [];
}

export class HistoryStatistics {
    public stats: WholeStats = new WholeStats();    
}