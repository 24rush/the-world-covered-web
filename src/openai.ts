
export type onGPTResponse = (responseObj?: any) => void;

export default class GPTCommunicator {
    readonly queryContext = `### MongoDB collections, with their properties:
    #Activities (_id, type, distance, average_speed, elapsed_time, total_elevation_gain, location_city, location_country, start_date_local_date, athlete_count)
    ### The database holds rides and run activities for an athlete. 
    #Create a query by using aggregate and no project for `;

    readonly response1 = `db.activities.aggregate([
        {$match: {distance: {$gt: 10000}}},
        {$project: {
            distance: 1,
            map: 1,
            speed: 1,
            duration: 1,
            elevation_gain: 1,
            type: 1,
            location_country: 1,
            location_city: 1,
            start_time: 1,
            efforts: 1,
            athlete_count: 1,
            segment_efforts: 1
        }}
    ])`;

    readonly response2 = `db.activities.aggregate([
        {
          $group: {
            _id: { 
              year: {$year: "$start_date_local_date" },
          },              
          total_elevation_gain: { $sum: "$total_elevation_gain" }
         }  
        }
      ])`;

    readonly response3 = `db.activities.aggregate([
        {
          $match: {
            start_date_local: {
              $gte: "2021-01-01",
              $lt: "2022-01-01"
            }
          }
        },
        {
          $group:
          {
            _id: {
              month: {$month: "$start_date_local_date"},
              year: {$year: "$start_date_local_date"}
            },
            activities: {$sum: 1}
          }
        },
        {
          $project: {
            _id: 0,
            month: "$_id.month",
            year: "$_id.year",
            activities: 1
          }
        }
        ])`;

    readonly response4 = `db.activities.aggregate([
        { $sort: { "distance": -1 } },{$limit: 1}
      ])`;

    readonly response5 = `db.activities.aggregate([
        {
          $group: {
            _id: "$location_city" 
         }  
        },
        {$sort: {_id: 1}}
      ])`;

    readonly response6 = `
    db.activities.aggregate([
        {$match: {distance: {$lt: 5000}}},
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

    readonly response7 = `db.activities.aggregate([        {$sort: {total_elevation_gain: -1}},        {$limit: 1}    ])`;

    public async query(searchQuery: string, cbkOk: onGPTResponse, cbkErr: onGPTResponse) {
        if (!cbkOk)
            return;

        let bypassGPT = false;

        if (bypassGPT) {
            let r = { 'choices': [{ 'text': this.response7 }] };
            cbkOk(this.handle_gpt_response(r));
        }
        else {
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
                });
        }
    }

    parse_gpt_response(query: string): any {
        if (query.includes("db.activities.aggregate(")) {
            query = query.replace("db.activities.aggregate(", '').slice(0, -1);
            query = query.replace("},}", "}}")
            query = query.replace(/ISODate\("([^"]+)"\)/gm, `"ISODate('$1')"`);

            // Add " to keys
            let re = new RegExp(/({|,)(?:\s*)(?:')?([A-Za-z_$\.][A-Za-z0-9_ \-\.$]*)(?:')?(?:\s*):/g);
            query = query.replace(re, `$1"$2":`);

            return JSON.parse(query);
        }

        return null;
    }

    handle_gpt_response(response: any): any {
        if (response.choices.length) {
            let query = response.choices[0].text.replace(/(\r\n|\n|\r|\s)/gm, "");

            return this.parse_gpt_response(query);
        }

        return null;
    }
}