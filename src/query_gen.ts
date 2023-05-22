export default class QueryGen {

    constructor(private ath_id: number) { }

    public acts_in_ids(ids: number[]): any {
        return [{ "$match": { "_id": { "$in": ids } } }];
    }

    public acts_with_friends(): any {
        return [{ "$match": { "athlete_count": { "$gt": 1 } } }, { "$limit": 5 }];
    }

    public act_abroad() : any {
        return [{ "$match": { "timezone": { "$ne": "(GMT+02:00) Europe/Bucharest" } } }, { "$limit": 15 }];
    }

    public act_epic_rides() : any {
        return [{ "$match": { "distance": { "$gt": 100000 }, "total_elevation_gain" : {"$gt": 1500} } }, {"$sort": {"total_elevation_gain" : -1}}, { "$limit": 15 }];
    }
}