
export type onGPTResponse = (responseObj?: any) => void;

export default class GPTCommunicator {
  readonly queryContext = `### MongoDB collections, with their properties:
    #Activities (_id, type, distance, average_speed, elapsed_time, total_elevation_gain, location_city, location_country, start_date_local, athlete_count)
    ### The database holds rides and run activities for an athlete. 
    #Create a query by using aggregate for `;

  readonly sample_response0 = `"
  db.activities.aggregate([
      {$match: {location_country: {$ne: "Romania"}, type: "Ride", }},
      {$group: {_id: null, count: {$sum: 1}} }
  ])`;

  readonly sample_response1 = `db.activities.aggregate([
      {$match: {start_date_local: {$gte: ISODate("2023-01-01T00:00:00.000Z"), $lt: ISODate("2023-12-31T23:59:59.999Z")}}},
      {$group: {_id: {$month: "$start_date_local"}, count: {$sum: 1}}}
  ])`;

  readonly sample_response2 = `db.activities.aggregate([
    {$match: {start_date_local: {$gte: ISODate("2023-01-01T00:00:00.000Z"), $lt: ISODate("2023-04-01T00:00:00.000Z")}}},
    {$group: {_id: {$dateToString: {format: "%Y-%m-%d", date: "$start_date_local"}}, count: {$sum: 1}}}
])`;

  public async query(searchQuery: string, cbkOk: onGPTResponse, cbkErr: onGPTResponse) {
    if (!cbkOk)
      return;

    let handle_gpt_response = (response: any) => {
      // GPT response
      //console.log(data);
      let obj_query = this.parse_gpt_response(response);

      if (obj_query)
        cbkOk(obj_query);
      else if (cbkErr)
        cbkErr();
    }

    let bypassGPT = false;

    if (bypassGPT) {
      handle_gpt_response({ 'choices': [{ 'text': this.sample_response2 }] });
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
          handle_gpt_response(data);
        })
        .catch(err => {
          if (cbkErr)
            cbkErr(err);
        });
    }
  }

  parse_gpt_response(response: any): any {
    if (response.choices.length == 0)
      return null;

    let query = response.choices[0].text.replace(/(\r\n|\n|\r|\s)/gm, "");

    let begin_query_idx = query.indexOf("db.activities.aggregate(");

    // Sometime OpenAI might complete something (like city names) before it dumps the actual query
    if (begin_query_idx != -1) {
      query = query.slice(begin_query_idx);
      query = query.replace("db.activities.aggregate(", '').slice(0, -1);
      query = query.replace("},}", "}}")
      query = query.replace("},]", "}]")
      query = query.replace(",}}", "}}")
      query = query.replace(/ISODate\("([^"]+)"\)/gm, `"$1"`);
      query = query.replace(/\$start_date_local/gm, `$start_date_local_date`);

      // Add " to keys
      let re = new RegExp(/({|,)(?:\s*)(?:')?([A-Za-z_$\.][A-Za-z0-9_ \-\.$]*)(?:')?(?:\s*):/g);
      query = query.replace(re, `$1"$2":`);

      try {
        return JSON.parse(query);
      }
      catch (err) {
        return null;
      }
    }

    return null;
  }
}