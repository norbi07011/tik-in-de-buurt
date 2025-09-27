import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const uri = process.env.MONGODB_URI!;

(async () => {
  if (!uri) {
    console.error("❌ MONGODB_URI not found in environment variables");
    process.exit(1);
  }

  console.log("🔍 Testing MongoDB Atlas connection...");
  console.log(`🔗 URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);

  const client = new MongoClient(uri);
  
  try {
    console.log("⏳ Connecting to MongoDB Atlas...");
    await client.connect();
    
    console.log("📡 Pinging database...");
    await client.db("admin").command({ ping: 1 });
    
    console.log("✅ Atlas reachable - connection successful!");
    
    // Test database access
    const dbName = process.env.MONGODB_DB_NAME || 'tik-in-de-buurt';
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Database: ${dbName}`);
    console.log(`📁 Collections found: ${collections.length}`);
    if (collections.length > 0) {
      console.log(`   ${collections.map(c => c.name).join(', ')}`);
    }
    
  } catch (e) {
    console.error("❌ MongoDB ping failed:", e);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Connection closed");
  }
})();