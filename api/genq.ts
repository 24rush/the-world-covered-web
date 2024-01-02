
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'https://the-world-covered.vercel.app')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return;
  }

  let queryContext = `### MongoDB collection, with its properties:
  #Activities (_id, type, distance, average_speed, elapsed_time, total_elevation_gain, location_city, location_country, start_date_local, athlete_count)
  ### The database stores ride and run activities for an athlete. Distance units are meters. Time units are seconds.
  #Create a query by using only aggregate for `;

  const { prompt } = req.body;  

  const payload = {
    model: "gpt-3.5-turbo-instruct",
    prompt: queryContext + prompt,
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 200,
    n: 1,
    stop: ['#', ';']
  };

  const response = await fetch("https://api.openai.com/v1/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  res.status(200).end(JSON.stringify(json));
}