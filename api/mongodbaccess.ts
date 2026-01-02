const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_DB_URL;
let cachedClient = null;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', "https://the-world-covered.vercel.app/");
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return;
    }

    let { dbName, collectionName, pipeline } = req.body; // pipeline is expected as an array
    
    if (!dbName || !collectionName) {
        res.status(401).end(JSON.stringify({ error: 'Database name, collection name, and pipeline are required.' }));
        return;
    }

    if (!cachedClient) {
        const client = new MongoClient(uri);
        await client.connect();
        cachedClient = client;
    }
    
    const collection = cachedClient.db(dbName).collection(collectionName);    
    const data = await collection.aggregate(pipeline).toArray();    

    return res.status(200).json(data);
}
