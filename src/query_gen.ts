export enum RouteTypes {
    Unique = "unique_routes",
    MostRidden = "most_ridden",
    Epic = "epic_rides",
    Abroad = "abroad",
    Descents = "best_descents",
    Ascents = "best_ascents"
};

export default class QueryGen {
    readonly RESULTS_LIMIT: number = 31;
    private current_page: number = 0;
    private current_query: any = undefined;
    private current_type: string = "";

    constructor(private ath_id: number) { }

    public set_query(type: string, query: any, dontApplyLimits?: boolean) {
        this.current_type = type;
        this.current_query = dontApplyLimits ? query : this.apply_limits(query);

        this.remove_projection();
    }

    public get_current_query(): any {
        return this.current_query;
    }

    public get_query_type(): string {
        return this.current_type;
    }

    public reset() {
        this.current_query = undefined;
        this.current_page = 0;
        this.current_type = "";
    }

    public set_next_page_of_current_query(): any {
        if (!this.current_query)
            return null;

        this.current_page += 1;

        for (let stage of this.current_query) {
            if ('$skip' in stage) {
                stage['$skip'] = this.current_page * this.RESULTS_LIMIT
            }
        }

        return this.current_query;
    }

    private apply_limits(query: any) {
        if (!query || !query.length)
            return;

        let skip_applied = false;
        let limit_applied = false;

        for (let stage of query) {
            if ('$skip' in stage) {
                stage['$skip'] = this.current_page * this.RESULTS_LIMIT
                skip_applied = true;
            }

            if ('$limit' in stage && parseInt(stage['$limit']) > this.RESULTS_LIMIT) {
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

    private remove_projection() {
        let new_query: any[] = [];
        for (let stage of this.current_query) {
            if ('$project' in stage)
                continue;

            new_query.push(stage);
        }

        this.current_query = new_query;
    }

    public get_results_per_page(): number {
        return this.RESULTS_LIMIT;
    }

    public set_query_for_type(type: string, rad_start?: number, rad_end?: number): any {
        this.reset();
        this.current_type = type;

        switch (type) {
            case "with_friends":
                this.current_query = this.acts_with_friends();
                this.apply_limits(this.current_query);
                break;
            case RouteTypes.Abroad:
                this.current_query = this.act_abroad();
                this.apply_limits(this.current_query);
                break;
            case RouteTypes.Epic:
                this.current_query = this.act_epic_rides()
                this.apply_limits(this.current_query);
                break;
            case RouteTypes.Ascents:
                this.current_query = this.routes_gradients_over(7)
                this.apply_limits(this.current_query);
                break;
            case RouteTypes.Descents:
                this.current_query = this.routes_gradients_below(-4)
                this.apply_limits(this.current_query);
                break;
            case RouteTypes.Unique:
                this.current_query = this.unique_routes(rad_start, rad_end);
                break;
            case RouteTypes.MostRidden:
                this.current_query = this.most_ridden();
                this.apply_limits(this.current_query);
                break;
            default:
                console.log("WARNING: Unknown query type " + type);
                this.current_page = 0;
                this.current_type = type;
                this.current_query = undefined;
        }

        return this.current_query;
    }

    public docs_with_ids(ids: number[]): any {
        this.current_query = [{ "$match": { "_id": { "$in": ids } } }];
        return this.current_query;
    }

    public acts_with_friends(): any {
        this.current_query = [{ "$match": { "athlete_count": { "$gt": 1 } } }];
        return this.current_query;
    }

    public act_abroad(): any {
        this.current_query = [{ "$match": { "timezone": { "$ne": "(GMT+02:00) Europe/Bucharest" } } }];
        return this.current_query;
    }

    public act_epic_rides(): any {
        this.current_query = [{ "$match": { "distance": { "$gt": 100000 }, "total_elevation_gain": { "$gt": 1500 } } }, { "$sort": { "total_elevation_gain": -1 } }];
        return this.current_query;
    }

    public act_best_bang(): any {
        this.current_query = [{ $addFields: { bestBang: { $divide: ["$total_elevation_gain", "$elapsed_time"] } } }, { "$sort": { bestBang: -1 } }];
        return this.current_query;
    }

    public efforts_on_seg_id(seg_id: number): any {
        this.current_query = [{ $match: { "segment_id": seg_id } }, { $sort: { "start_date_local": 1 } }]
        return this.current_query;
    }

    public unique_routes(radius_start?: number, radius_end?: number): any {
        if (radius_start == undefined || radius_end == undefined)
            return;

        this.current_query = [{ $match: { "athlete_id": this.ath_id, "dist_from_capital": { $gte: radius_start, $lt: radius_end } } }, {
            $addFields: { act_count: { $size: { "$ifNull": ["$activities", []] } } }
        }, {
            $sort: { "act_count": -1 }
        }];
        return this.current_query;
    }

    public most_ridden(): any {
        this.current_query = [{ $match: { "athlete_id": this.ath_id } }, {
            $addFields: { act_count: { $size: { "$ifNull": ["$activities", []] } } }
        },
        {
            $match: { act_count: { $gt: 1 } }
        },
        {
            $sort: { "act_count": -1 }
        }];
        return this.current_query;
    }

    public routes_gradients_over(gradient: number): any {
        this.current_query = [{
            $match: {
                'gradients.gradient': { $gte: gradient },
                'type': "RouteRide"
            }
        }, { $sort: { 'gradients.elevation_gain': -1 } }
        ];

        return this.current_query;
    }

    public routes_gradients_below(gradient: number): any {
        this.current_query = [{
            $match: {
                'gradients.gradient': { $lte: gradient },
                'type': "RouteRide"
            }
        }, { $sort: { 'gradients.elevation_gain': 1 } }
        ];

        return this.current_query;
    }

    public act_type_in_country(type: string, country: string) {
        this.current_query = [{
            $match: {
                $and: [{ type: type },
                { $or: [{ location_country: { $regex: country } }, { location_city: { $regex: country } }] }]
            }
        }
        ];

        return this.current_query;
    }
}