export default class QueryGen {

    constructor(private ath_id: number) { }

    public acts_in_ids(ids: number[]): any {
        return [{ "$match": { "_id": { "$in": ids } } }];
    }

    public acts_with_friends(): any {
        return [{ "$match": { "athlete_count": { "$gt": 1 } } }, { "$limit": 5 }];
    }

    public act_abroad(): any {
        return [{ "$match": { "timezone": { "$ne": "(GMT+02:00) Europe/Bucharest" } } }, { "$limit": 15 }];
    }

    public act_epic_rides(): any {
        return [{ "$match": { "distance": { "$gt": 100000 }, "total_elevation_gain": { "$gt": 1500 } } }, { "$sort": { "total_elevation_gain": -1 } }, { "$limit": 15 }];
    }

    public act_best_bang(): any {
        return [{ $addFields: { bestBang: { $divide: ["$total_elevation_gain", "$elapsed_time"] } } }, { "$sort": { bestBang: -1 } }, { "$limit": 10 }];
    }

    public efforts_on_seg_id(seg_id: number): any {
        return [{ $match: { "segment_id": seg_id } }]
    }
}