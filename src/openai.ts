
export type onGPTResponse = (responseObj?: any) => void;

export default class GPTCommunicator {
  readonly queryContext = `### MongoDB collections, with their properties:
    #Activities (_id, type, distance, average_speed, elapsed_time, total_elevation_gain, location_city, location_country, start_date_local_date, athlete_count)
    ### The database holds rides and run activities for an athlete. 
    #Create a query by using aggregate and no project for `;

  readonly sample_response = `db.activities.aggregate([        {$sort: {total_elevation_gain: -1}},        {$limit: 2}    ])`;

  public async query(searchQuery: string, cbkOk: onGPTResponse, cbkErr: onGPTResponse) {
    if (!cbkOk)
      return;

    let on_ok = (query: any) => {
      cbkOk(query);
    };

    let on_error = (err?: any) => {
      if (cbkErr)
        cbkErr(err);
    };

    let bypassGPT = false;

    if (bypassGPT) {
      let q = this.handle_gpt_response({ 'choices': [{ 'text': this.sample_response }] });
      if (q)
        on_ok(q);
      else
        on_error();
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
          let obj_query = this.handle_gpt_response(data);

          if (obj_query)
            on_ok(obj_query);
          else
            on_error();
        })
        .catch(err => {
          on_error(err);
        });
    }
  }

  parse_gpt_response(query: string): any {
    let begin_query_idx = query.indexOf("db.activities.aggregate(");

    // Sometime OpenAI might complete something (like city names) before it dumps the actual query
    if (begin_query_idx != -1) {
      query = query.slice(begin_query_idx);
      query = query.replace("db.activities.aggregate(", '').slice(0, -1);
      query = query.replace("},}", "}}")
      query = query.replace(/ISODate\("([^"]+)"\)/gm, `"ISODate('$1')"`);

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

  handle_gpt_response(response: any): any {
    if (response.choices.length == 0)
      return null;

    return this.parse_gpt_response(response.choices[0].text.replace(/(\r\n|\n|\r|\s)/gm, ""));
  }
}