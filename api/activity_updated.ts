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

    const { aspect_type, object_type, owner_id, object_id } = req.body;

    const payload = {};    

    if (object_type == "activity" && (aspect_type == "create" || aspect_type == "delete")) {
        payload[aspect_type == "create" ? "create" : "delete"] = object_id;
        payload["athlete_id"] = owner_id;

        fetch(process.env.GCP_SRV_THE_WORLD_COVERED_URL + "/on_activity_updated", {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(payload),
        });    
    }

    res.status(200).end(JSON.stringify("OK"));
}