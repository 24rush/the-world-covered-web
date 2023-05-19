import type Route from "./data_types/route";
import * as Realm from "realm-web";
const {
    BSON: { ObjectId },
  } = Realm;

export default class DataEndpoint {
    is_local: boolean;
    url: string;

    constructor(private endpoint: string) {
        this.is_local = endpoint === "localhost";
        this.url = "";

        if (!this.is_local) {
            this.authenticate_mongo();
        } else {
            this.url = "http://localhost:8000/";
        }
    }

    fetch_data<T>(path: string): Promise<T> {
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


    async get_routes(ath_id: number) : Promise<Route[]> {
        return this.fetch_data('/routes/' + ath_id);        
    }

    private async authenticate_mongo() {
        const app = new Realm.App({ id: "application-0-mlous" });
        const credentials = Realm.Credentials.anonymous();
        try {
            const user = await app.logIn(credentials);
            console.log(user.id);

            if (app.currentUser) {
                const mongo = app.currentUser.mongoClient("mongodb-atlas");
                const collection = mongo.db("sample_airbnb").collection("listingsAndReviews");

                const res = await collection.findOne({ name: "Apt Linda Vista Lagoa - Rio" });

                console.log("res=", res);
            }

        } catch (err) {
            console.error("Failed to log in", err);
        }
    }
}