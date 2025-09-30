const { MongoClient, ServerApiVersion } = require('mongodb');

// Dokładnie taki URI jak podałeś
const uri = "mongodb+srv://***REMOVED***@cluster0.bnzcc6v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    
    console.log('🏓 Pinging deployment...');
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    // Test accessing the actual database
    const db = client.db("tik-in-de-buurt");
    const collections = await db.listCollections().toArray();
    console.log(`📁 Database 'tik-in-de-buurt' collections:`, collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('🔌 Connection closed');
  }
}

run().catch(console.dir);