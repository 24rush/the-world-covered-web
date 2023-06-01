import type Activity from "./data_types/activity";
import type Effort from "./data_types/effort";
import type Route from "./data_types/route";
import * as Realm from "realm-web";
import QueryGen from "./query_gen";
import type { SegmentPolyline } from "./data_types/segment";
const {
    BSON: { ObjectId },
} = Realm;

interface DataRetriever {
    get_activities_with_id(ids: number[]): Promise<Activity[]>;
    query_routes(query: any): Promise<Route[]>;
    query_activities(query: any): Promise<Activity[]>;
    query_efforts(query: any): Promise<Effort[]>;
    query_segments(query: any): Promise<SegmentPolyline[]>;
}

class LocalServer implements DataRetriever {
    url: string = "http://localhost:8000";

    get_data<T>(path: string): Promise<T> {
        return fetch(this.url + path, {
            mode: 'cors',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.statusText)
                }
                return response.json() as Promise<T>
            });
    }

    post_data<T>(path: string, body?: any): Promise<T> {
        return fetch(this.url + path, {
            mode: 'cors',
            method: "POST",
            body: JSON.stringify(body)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.statusText)
                }
                return response.json() as Promise<T>
            });
    }

    async get_activities_with_id(ids: number[]): Promise<Activity[]> {
        return this.post_data('/query_activities', QueryGen.docs_with_ids(ids));
    }

    async query_routes(query: any): Promise<Route[]> {
        return this.post_data('/query_routes/', query);
    }

    async query_activities(query: any): Promise<Activity[]> {
        return this.post_data('/query_activities', query);
    }

    async query_efforts(query: any): Promise<Effort[]> {
        return this.post_data('/query_efforts', query);
    }

    async query_segments(query: any): Promise<SegmentPolyline[]> {
        return this.post_data('/query_segments', query);
    }
}

class RemoveServer implements DataRetriever {
    private mongo: globalThis.Realm.Services.MongoDB | undefined;

    public async authenticate() {
        const app = new Realm.App({ id: "application-0-mlous" });
        const credentials = Realm.Credentials.anonymous();
        try {
            const user = await app.logIn(credentials);

            if (app.currentUser) {
                this.mongo = app.currentUser.mongoClient("mongodb-atlas");
            }

        } catch (err) {
            console.error("Failed to log in", err);
        }
    }    

    async query(database: string, collection: string, query: any) {
        await this.authenticate();

        const coll = this.mongo?.db(database).collection(collection);

        if (coll)
            return await coll.aggregate(query);

        return [];

    }

    async get_activities_with_id(ids: number[]): Promise<Activity[]> {
        return this.query("strava_db", "activities", QueryGen.docs_with_ids(ids));        
    }

    async query_routes(query: any): Promise<Route[]> {
        return this.query("gc_db", "routes", query);
    }

    async query_activities(query: any): Promise<Activity[]> {
        return this.query("strava_db", "activities", query);       
    }

    async query_efforts(query: any): Promise<Effort[]> {
        return this.query("gc_db", "efforts", query);             
    }

    async query_segments(query: any): Promise<SegmentPolyline[]> {
        return this.query("gc_db", "segments", query);    
    }
}

export default class DataEndpoint {
    data_server: DataRetriever = new LocalServer();

    constructor() {
        let is_local = true;

        if (!is_local)
            this.data_server = new RemoveServer();
    }

    async get_activities_with_id(ids: number[]): Promise<Activity[]> {        
        return this.data_server.get_activities_with_id(ids);        
    }

    async query_routes(query: any): Promise<Route[]> {
        return this.data_server.query_routes(query);
    }

    async query_activities(query: any): Promise<Activity[]> {
        return this.data_server.query_activities(query);
    }

    async query_efforts(query: any): Promise<Effort[]> {
        return this.data_server.query_efforts(query);
    }

    async query_segments(query: any): Promise<SegmentPolyline[]> {
        return this.data_server.query_segments(query);      
    }
}