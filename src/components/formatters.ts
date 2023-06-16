export class Formatters {
    public static time_formatter(time_sec: number): String {
        if (time_sec >= 3600)
            return new Date(time_sec * 1000).toISOString().substring(11, 19) + "s"
        else
            return new Date(time_sec * 1000).toISOString().substring(14, 19) + "s"
    }

    public static distance_formatter(distance_m: number): String {
        if (distance_m > 1000)
            return (distance_m / 1000).toFixed(1) + "km"
    
        return distance_m.toFixed(0) + 'm';
    }

    public static hours_per_week_formatter(value: number): string {
        if (value < 60)
            return Math.ceil(value).toString();
        else {
            return (Math.floor(value / 60)).toString() + "h" + Math.floor((value % 60)).toString() + "m";
        }
    }

    public static hours_per_week_label_formatter(value: number): string {
        if (value < 60)
            return "min/week"
        else {
            return "hours/week"
        }
    }

    public static pace_formatter(m_per_sec: number): String {
        var pace = 16.667 / m_per_sec;
        var leftover = pace % 1;
        var minutes = pace - leftover;
        var seconds = Math.round(leftover * 60);
    
        return minutes + ":" + (seconds < 10 ? '0' + seconds : seconds) + "min/km"
    }
    
    public static date_formatter(date_str: String): String {
        if (!date_str) return "";
    
        let langCode = "ro-RO";
        let date = new Date(date_str.toString());
    
        var month = date.toLocaleString(langCode, { month: 'short' }); // MMM
        var year = date.toLocaleString(langCode, { year: 'numeric' }); // YYYY
    
        return ` ${month} ${year}`;
    }

    public static speed_formatter(m_per_sec: number): string {
        return (m_per_sec * 3.6).toFixed(1) + "km/h";
    }
}