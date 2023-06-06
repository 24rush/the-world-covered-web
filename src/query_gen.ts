export default class QueryGen {
    readonly RESULTS_LIMIT: number = 10;
    private current_page: number = 0;
    private current_query: any = undefined;
    private current_type: string = "";

    constructor(private ath_id: number) { }

    public set_query(type: string, query: any, applyLimits?: boolean) {
        this.current_type = type;
        this.current_query = applyLimits ? this.apply_limits(query) : query;
    }

    public get_current_query(): any {
        return this.current_query;
    }

    public get_query_type() : string {
        return this.current_type;
    }

    public reset() {
        this.current_query = undefined;
        this.current_page = 0;
        this.current_type = "";
    }

    public get_next_page_of_current_query(): any {
        if (!this.current_query)
            return null;

        this.current_page += 1;

        for (let stage of this.current_query) {
            if ('$skip' in stage) {
                stage['$skip'] = this.current_page * this.RESULTS_LIMIT
            }
        }
    }

    private apply_limits(query: any) {
        let skip_applied = false;
        let limit_applied = false;

        for (let stage of query) {
            if ('$skip' in stage) {
                stage['$skip'] = this.current_page * this.RESULTS_LIMIT
                skip_applied = true;
            }

            if ('$limit' in stage) {
                stage['$limit'] = this.RESULTS_LIMIT
                limit_applied = true;
            }
        }

        if (!skip_applied) {
            query.push({ "$skip": this.current_page * this.RESULTS_LIMIT });
        }

        if (!limit_applied) {
            query.push({ "$limit": this.RESULTS_LIMIT });
        }

        return query;
    }

    public get_results_per_page(): number {
        return this.RESULTS_LIMIT;
    }

    public set_query_for_type(type: string): any {
        this.current_type = type;

        switch (type) {
            case "with_friends":
                return this.acts_with_friends();
            case "abroad":
                return this.act_abroad()
            case "epic_rides":
                return this.act_epic_rides()
            case "best_ascents":
                return this.routes_gradients_over(7)
            case "unique_routes":
                return this.unique_routes_routes()
            default:
                console.log("WARNING: Unknown query type " + type);
                this.reset();
                this.current_type = type;
                return undefined;
        }
    }

    public docs_with_ids(ids: number[]): any {
        this.current_query = [{ "$match": { "_id": { "$in": ids } } }];
        return this.current_query;
    }

    public acts_with_friends(): any {
        this.current_query = [{ "$match": { "athlete_count": { "$gt": 1 } } }, { "$skip": this.current_page * this.RESULTS_LIMIT }, { "$limit": this.RESULTS_LIMIT }];
        return this.current_query;
    }

    public act_abroad(): any {
        this.current_query = [{ "$match": { "timezone": { "$ne": "(GMT+02:00) Europe/Bucharest" } } }, { "$skip": this.current_page * this.RESULTS_LIMIT }, { "$limit": this.RESULTS_LIMIT }];
        return this.current_query;
    }

    public act_epic_rides(): any {
        this.current_query = [{ "$match": { "distance": { "$gt": 100000 }, "total_elevation_gain": { "$gt": 1500 } } }, { "$sort": { "total_elevation_gain": -1 } }, { "$skip": this.current_page * this.RESULTS_LIMIT }, { "$limit": this.RESULTS_LIMIT }];
        return this.current_query;
    }

    public act_best_bang(): any {
        this.current_query = [{ $addFields: { bestBang: { $divide: ["$total_elevation_gain", "$elapsed_time"] } } }, { "$sort": { bestBang: -1 } }, { "$skip": this.current_page * this.RESULTS_LIMIT }, { "$limit": this.RESULTS_LIMIT }];
        return this.current_query;
    }

    public efforts_on_seg_id(seg_id: number): any {
        this.current_query = [{ $match: { "segment_id": seg_id } }, { $sort: { "start_date_local": 1 } }]
        return this.current_query;
    }

    public unique_routes_routes(): any {
        this.current_query = [{ $match: { "athlete_id": this.ath_id } }, {
            $addFields: { act_count: { $size: { "$ifNull": ["$activities", []] } } }
        }, {
            $sort: { "act_count": -1 }
        }, { "$skip": this.current_page * this.RESULTS_LIMIT }, { "$limit": this.RESULTS_LIMIT }];
        return this.current_query;
    }

    public routes_gradients_over(gradient: number): any {
        this.current_query = [{
            $match: {
                'gradients.gradient': { $gt: gradient }
            }
        }, { $sort: { 'gradients.gradient': -1 } }, { "$skip": this.current_page * this.RESULTS_LIMIT }, { "$limit": this.RESULTS_LIMIT }
        ];

        return this.current_query;
    }
}