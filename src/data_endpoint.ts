import type Activity from "./data_types/activity";
import type Effort from "./data_types/effort";
import { Route } from "@/data_types/route";
import * as Realm from "realm-web";
import type { HistoryStatistics } from "./data_types/statistics";
const {
    BSON: { ObjectId },
} = Realm;

interface DataRetriever {
    query_routes(query: any): Promise<Route[]>;
    query_activities(query: any): Promise<Activity[]>;
    query_efforts(query: any): Promise<Effort[]>;
    query_statistics(): Promise<HistoryStatistics[]>;
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

    async query_routes(query: any): Promise<Route[]> {
        return this.post_data('/query_routes/', query);
    }

    async query_activities(query: any): Promise<Activity[]> {
        return this.post_data('/query_activities', query);
    }

    async query_efforts(query: any): Promise<Effort[]> {
        return this.post_data('/query_efforts', query);
    }

    async query_statistics(): Promise<HistoryStatistics[]> {
        return this.post_data('/query_statistics');
    }
}

class RemoveServer implements DataRetriever {
    private mongo: globalThis.Realm.Services.MongoDB | undefined;
    private app = new Realm.App({ id: "application-0-mlous" });
    private credentials = Realm.Credentials.anonymous();

    public async authenticate() {
        try {
            if (!this.app.currentUser || !this.app.currentUser.isLoggedIn)
                await this.app.logIn(this.credentials);

            if (!this.mongo && this.app.currentUser) {
                this.mongo = this.app.currentUser.mongoClient("mongodb-atlas");
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

    async query_routes(query: any): Promise<Route[]> {
        return this.query("gc_db", "routes", query);
    }

    async query_activities(query: any): Promise<Activity[]> {
        return this.query("strava_db", "activities", query);
    }

    async query_efforts(query: any): Promise<Effort[]> {
        return this.query("gc_db", "efforts", query);
    }

    async query_statistics(): Promise<HistoryStatistics[]> {
        return this.query("gc_db", "statistics", [{ "$match": { "_id": 0 } }]);
    }
}

export default class DataEndpoint {
    data_server: DataRetriever = new LocalServer();

    constructor() {
        let is_local = false;

        if (!is_local)
            this.data_server = new RemoveServer();
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

    async query_statistics(): Promise<HistoryStatistics[]> {
        return this.data_server.query_statistics();
    }
}