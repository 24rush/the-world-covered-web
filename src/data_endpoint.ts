import type Activity from "./data_types/activity";
import type Effort from "./data_types/effort";
import type Route from "./data_types/route";
import * as Realm from "realm-web";
import QueryGen from "./query_gen";
const {
    BSON: { ObjectId },
} = Realm;

class LocalServer {
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
        return this.post_data('/query_activities', QueryGen.acts_in_ids(ids));
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
}

class RemoveServer {
    private mongo :  globalThis.Realm.Services.MongoDB | undefined;

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

    async get_activities_with_id(ids: number[]): Promise<Activity[]> {
        await this.authenticate();

        const collection = this.mongo?.db("strava_db").collection("activities");
        
        if (collection)
            return await collection.aggregate(QueryGen.acts_in_ids(ids));

        return [];
    }

    async query_routes(query: any): Promise<Route[]> {
        await this.authenticate();

        const collection = this.mongo?.db("gc_db").collection("routes");
        
        if (collection)
            return await collection.aggregate(query);

        return [];
    }

    async query_activities(query: any): Promise<Activity[]> {
        await this.authenticate();

        const collection = this.mongo?.db("strava_db").collection("activities");
        
        if (collection)
            return await collection.aggregate(query);

        return [];
    }

    async query_efforts(query: any): Promise<Effort[]> {
        await this.authenticate();

        const collection = this.mongo?.db("gc_db").collection("efforts");
        
        if (collection)
            return await collection.aggregate(query);

        return [];
    }
}

export default class DataEndpoint {
    is_local: boolean;
    local_server: LocalServer = new LocalServer();
    remove_server: RemoveServer = new RemoveServer();

    constructor() {        
        this.is_local = true;
    }

    async get_activities_with_id(ids: number[]): Promise<Activity[]> {
        if (this.is_local)
            return this.local_server.get_activities_with_id(ids);
        else
            return this.remove_server.get_activities_with_id(ids);
    }

    async query_routes(query: any): Promise<Route[]> {
        if (this.is_local)
            return this.local_server.query_routes(query);       
        else
            return this.remove_server.query_routes(query);
    }

    async query_activities(query: any): Promise<Activity[]> {
        if (this.is_local)
            return this.local_server.query_activities(query);        
        else
            return this.remove_server.query_activities(query);
    }

    async query_efforts(query: any): Promise<Effort[]> {
        if (this.is_local)
            return this.local_server.query_efforts(query);        
        else
            return this.remove_server.query_efforts(query);
    }

   
}