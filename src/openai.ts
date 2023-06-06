
export type onGPTResponse = (responseObj?: any) => void;

export default class GPTCommunicator {
    readonly queryContext = `### MongoDB collections, with their properties:
    #Activity (id, distance, speed, duration, elevation_gain, city, location_country, start_time, efforts, athlete_count, segment_efforts[id, name, average_gradient, distance, city, country])
    #Efforts (id, duration, segment_id, start_time, activity_id)
    ### The database holds sports activities for an athlete.  the activities collection stores all the sports activities of the athlete. All id fields are numeric values.
    #Create a query by using aggregate for `;

    public async query(searchQuery: string, cbkOk: onGPTResponse, cbkErr: onGPTResponse) {
        if (!cbkOk)
            return;

            let response = `db.activities.aggregate([
                {$match: {distance: {$gt: 10000}}},
                {$project: {
                    distance: 1,
                    speed: 1,
                    duration: 1,
                    elevation_gain: 1,
                    city: 1,
                    location_country: 1,
                    start_time: 1,
                    efforts: 1,
                    athlete_count: 1,
                    segment_efforts: 1
                }}
            ])`;

            let r = {'choices': [{'text': response}]};

            let ret = this.handle_gpt_response(r);
console.log(ret)
            cbkOk(ret);
        return;
        await fetch('https://the-world-covered.vercel.app/api/genq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'prompt': this.queryContext + searchQuery })
        }).then(response => response.json())
            .then(data => {
                console.log(data);
                let obj_query = this.handle_gpt_response(data);

                if (!obj_query && cbkErr) {
                    cbkErr();
                    return;
                }

                cbkOk(obj_query);
            })
            .catch(err => {
                console.log(err);
                if (cbkErr)
                    cbkErr(err);
            })
    }

    parse_gpt_response(query: string): any {
        if (query.includes("db.activities.aggregate(")) {
            query = query.replace("db.activities.aggregate(", '').slice(0, -1);

            let iso_date = query.indexOf("ISODate(\"");
            if (iso_date != -1) {
                query = query.replace(/ISODate\(\"/gm, "\"ISODate('");
                query = query.replace(/Z\"\)/gm, "Z'\)\"");
            }

            let re = new RegExp(/(("|]|}|\.|(\d|\.|-|:)\s*\d)\s*,|{)*\s*(")?([^"{:\n]+?)(")?\s*:/g);
            query = query.replace(re, `$1"$5":`);
            console.log(query)
            return JSON.parse(query);            
        }

        return null;
    }

    handle_gpt_response(response: any): any {
        if (response.choices.length) {
            let query = response.choices[0].text;//.replace(/(\r\n|\n|\r|\s)/gm, "");

            return this.parse_gpt_response(query);
        }

        return null;
    }
}