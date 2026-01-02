import { Activity } from "./data_types/activity";
import { Route } from "@/data_types/route";
import type { HistoryStatistics } from "./data_types/statistics";

interface DataRetriever {
    query_routes(query: any): Promise<Route[]>;
    query_activities(query: any): Promise<Activity[]>;
    query_efforts(query: any): Promise<Activity[]>;
    query_statistics(): Promise<HistoryStatistics[]>;
}

class LocalServer implements DataRetriever {
    url: string = "http://localhost:8080";

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
        return this.post_data('/query_routes', query);
    }

    async query_activities(query: any): Promise<Activity[]> {
        return this.post_data('/query_activities', query);
    }

    async query_efforts(query: any): Promise<Activity[]> {
        return this.post_data('/query_efforts', query);
    }

    async query_statistics(): Promise<HistoryStatistics[]> {
        return this.post_data('/query_statistics');
    }
}

class RemoteServer implements DataRetriever {
    private readonly THE_WORLD_COVERED_URL = "https://the-world-covered.vercel.app/api/mongodbaccess";

    async query(database: string, collection: string, query: any) {
        let result = fetch(this.THE_WORLD_COVERED_URL, {
            mode: 'cors',
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                'dbName': database,
                'collectionName': collection,
                'pipeline': query
            }),
        });

        return (await result).json();
    }

    async query_routes(query: any): Promise<Route[]> {
        return this.query("gc_db", "routes", query);
    }

    async query_activities(query: any): Promise<Activity[]> {
        return this.query("strava_db", "activities", query);
    }

    async query_efforts(query: any): Promise<Activity[]> {
        return this.query("strava_db", "activities", query);
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
            this.data_server = new RemoteServer();
    }

    async query_routes(query: any): Promise<Route[]> {
        return this.data_server.query_routes(query);
    }

    async query_activities(query: any): Promise<Activity[]> {
        return this.data_server.query_activities(query);
    }

    async query_efforts(query: any): Promise<Activity[]> {
        return this.data_server.query_efforts(query);
    }

    async query_statistics(): Promise<HistoryStatistics[]> {
        return this.data_server.query_statistics();
    }
}