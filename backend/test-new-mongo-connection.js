const { MongoClient, ServerApiVersion } = require('mongodb');

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
    console.log('🔄 Connecting to MongoDB Atlas...');
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    // Test database access
    const db = client.db("tik-in-de-buurt");
    const collections = await db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections in database`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('🔌 Connection closed');
  }
}

run().catch(console.dir);