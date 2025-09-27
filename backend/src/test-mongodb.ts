import mongoose from 'mongoose';
import './config/env';

async function testMongoDBConnection() {
  console.log('🧪 Testing MongoDB Atlas Connection...');
  console.log('📋 Configuration:');
  console.log(`   MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
  console.log(`   MONGODB_DB_NAME: ${process.env.MONGODB_DB_NAME}`);

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  // Sanitize URI for logging (hide password)
  const sanitizedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  console.log(`   Connecting to: ${sanitizedUri}`);

  try {
    console.log('\n⏳ Attempting connection...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'tik-in-de-buurt',
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });

    console.log('✅ Connected successfully!');
    console.log('📊 Connection details:');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Ready State: ${mongoose.connection.readyState}`);

    // Test database operations
    console.log('\n🔍 Testing database operations...');
    
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`   Collections found: ${collections.length}`);
      collections.forEach(col => console.log(`   - ${col.name}`));

      // Test write operation
      const testCollection = mongoose.connection.db.collection('test_connection');
      const testDoc = {
        message: 'Test connection successful',
        timestamp: new Date(),
        server: 'stable-backend'
      };

      const insertResult = await testCollection.insertOne(testDoc);
      console.log(`   ✅ Test document inserted with ID: ${insertResult.insertedId}`);
      
      // Clean up test document
      await testCollection.deleteOne({ _id: insertResult.insertedId });
      console.log('   🧹 Test document cleaned up');
    } else {
      console.log('   ⚠️ Database connection object not available');
    }
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.codeName) {
      console.error(`   Error name: ${error.codeName}`);
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 Connection closed');
  }
}

// Run the test
testMongoDBConnection().catch(console.error);