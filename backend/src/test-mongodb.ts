import mongoose from 'mongoose';import mongoose from 'mongoose';

import './config/env';import './config/      // Clean up test document

      await testCollection.deleteOne({ _id: insertResult.insertedId });

async function testMongoDBConnection() {      console.log('   🧹 Test document cleaned up');

  console.log('🧪 Testing MongoDB Atlas Connection...');    } else {

  console.log('📋 Configuration:');      console.log('   ⚠️ Database connection object not available');

  console.log(`   MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);    }

  console.log(`   MONGODB_DB_NAME: ${process.env.MONGODB_DB_NAME}`);    

    } catch (error: any) {

  if (!process.env.MONGODB_URI) {

    console.error('❌ MONGODB_URI not found in environment variables');async function testMongoDBConnection() {

    return;  console.log('🧪 Testing MongoDB Atlas Connection...');

  }  console.log('📋 Configuration:');

  console.log(`   MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);

  // Sanitize URI for logging (hide password)  console.log(`   MONGODB_DB_NAME: ${process.env.MONGODB_DB_NAME}`);

  const sanitizedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');  

  console.log(`   URI: ${sanitizedUri}`);  if (!process.env.MONGODB_URI) {

    console.error('❌ MONGODB_URI not found in environment variables');

  try {    return;

    console.log('\n⏳ Attempting connection...');  }

    

    await mongoose.connect(process.env.MONGODB_URI, {  // Sanitize URI for logging (hide password)

      dbName: process.env.MONGODB_DB_NAME || 'tik-in-de-buurt',  const sanitizedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');

      serverSelectionTimeoutMS: 10000, // 10 second timeout  console.log(`   URI: ${sanitizedUri}`);

      connectTimeoutMS: 10000,

      socketTimeoutMS: 10000,  try {

    });    console.log('\n⏳ Attempting connection...');

    

    console.log('✅ Connected successfully!');    await mongoose.connect(process.env.MONGODB_URI, {

    console.log(`   Database: ${mongoose.connection.name}`);      dbName: process.env.MONGODB_DB_NAME || 'tik-in-de-buurt',

    console.log(`   Host: ${mongoose.connection.host}`);      serverSelectionTimeoutMS: 10000, // 10 second timeout

    console.log(`   Ready State: ${mongoose.connection.readyState}`);      connectTimeoutMS: 10000,

          socketTimeoutMS: 10000,

    // Test a simple operation    });

    console.log('\n🔍 Testing database operations...');

    if (mongoose.connection.db) {    console.log('✅ Connected successfully!');

      const collections = await mongoose.connection.db.listCollections().toArray();    console.log(`   Database: ${mongoose.connection.name}`);

      console.log(`   Found ${collections.length} collections:`);    console.log(`   Host: ${mongoose.connection.host}`);

      collections.forEach(col => console.log(`   - ${col.name}`));    console.log(`   Ready State: ${mongoose.connection.readyState}`);

          

      // Test write operation    // Test a simple operation

      const testCollection = mongoose.connection.db.collection('connection-test');    console.log('\n🔍 Testing database operations...');

      const testDoc = {    if (mongoose.connection.db) {

        timestamp: new Date(),      const collections = await mongoose.connection.db.listCollections().toArray();

        test: 'MongoDB Atlas connection successful',      console.log(`   Found ${collections.length} collections:`);

        server: 'stable-backend'      collections.forEach(col => console.log(`   - ${col.name}`));

      };      

            // Test write operation

      const insertResult = await testCollection.insertOne(testDoc);      const testCollection = mongoose.connection.db.collection('connection-test');

      console.log(`   ✅ Test document inserted: ${insertResult.insertedId}`);    const testDoc = {

            timestamp: new Date(),

      // Clean up test document      test: 'MongoDB Atlas connection successful',

      await testCollection.deleteOne({ _id: insertResult.insertedId });      server: 'stable-backend'

      console.log('   🧹 Test document cleaned up');    };

    } else {    

      console.log('   ⚠️ Database connection object not available');    const insertResult = await testCollection.insertOne(testDoc);

    }    console.log(`   ✅ Test document inserted: ${insertResult.insertedId}`);

        

  } catch (error: any) {    // Clean up test document

    console.error('❌ Connection failed:');    await testCollection.deleteOne({ _id: insertResult.insertedId });

    console.error(`   Error: ${error.message}`);    console.log('   🧹 Test document cleaned up');

    console.error(`   Code: ${error.code}`);    

      } catch (error: any) {

    if (error.message.includes('Authentication failed')) {    console.error('❌ Connection failed:');

      console.error('\n🔐 Authentication Issue Detected:');    console.error(`   Error: ${error.message}`);

      console.error('   1. Check if user "servicenorbs_db_user" exists in MongoDB Atlas');    console.error(`   Code: ${error.code}`);

      console.error('   2. Verify password is correct');    

      console.error('   3. Ensure user has proper database permissions');    if (error.message.includes('Authentication failed')) {

      console.error('   4. Check if IP address is whitelisted');      console.error('\n🔐 Authentication Issue Detected:');

    }      console.error('   1. Check if user "servicenorbs_db_user" exists in MongoDB Atlas');

          console.error('   2. Verify password is correct');

    if (error.message.includes('network')) {      console.error('   3. Ensure user has proper database permissions');

      console.error('\n🌐 Network Issue Detected:');      console.error('   4. Check if IP address is whitelisted');

      console.error('   1. Check internet connection');    }

      console.error('   2. Verify MongoDB Atlas cluster is running');    

      console.error('   3. Check firewall settings');    if (error.message.includes('network')) {

    }      console.error('\n🌐 Network Issue Detected:');

  } finally {      console.error('   1. Check internet connection');

    console.log('\n🔄 Closing connection...');      console.error('   2. Verify MongoDB Atlas cluster is running');

    await mongoose.connection.close();      console.error('   3. Check firewall settings');

    console.log('✅ Connection closed');    }

    process.exit(0);  } finally {

  }    console.log('\n🔄 Closing connection...');

}    await mongoose.connection.close();

    console.log('✅ Connection closed');

// Handle unhandled promise rejections    process.exit(0);

process.on('unhandledRejection', (reason, promise) => {  }

  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);}

  process.exit(1);

});// Handle unhandled promise rejections

process.on('unhandledRejection', (reason, promise) => {

testMongoDBConnection();  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

testMongoDBConnection();