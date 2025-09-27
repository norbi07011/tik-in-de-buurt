import mongoose from 'mongoose';

const testConnection = async () => {
  console.log('🔍 Testing MongoDB Atlas connection...');
  
  const connectionStrings = [
    // Try existing user from screenshot (Database Access)
    'mongodb+srv://***REMOVED***:***REMOVED***@cluster0.bnzcc6v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    // Try new user being created  
    'mongodb+srv://servicenorbs_db_user:***REMOVED***@cluster0.bnzcc6v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    // With tik-in-de-buurt database
    'mongodb+srv://***REMOVED***:***REMOVED***@cluster0.bnzcc6v.mongodb.net/tik-in-de-buurt?retryWrites=true&w=majority&appName=Cluster0'
  ];
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const url = connectionStrings[i];
    console.log(`\n🔗 Testing connection ${i + 1}/${connectionStrings.length}:`);
    console.log(`   URL: ${url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);
    
    try {
      await mongoose.connect(url, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      
      console.log('✅ Connection successful!');
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log(`   Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
      console.log(`   Ready state: ${mongoose.connection.readyState}`);
      
      await mongoose.disconnect();
      console.log('✅ Disconnected successfully');
      return;
      
    } catch (error: any) {
      console.error(`❌ Connection failed: ${error.message}`);
      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }
      if (error.codeName) {
        console.error(`   Error code name: ${error.codeName}`);
      }
      
      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }
  
  console.log('\n❌ All connection attempts failed');
};

testConnection().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test script error:', error);
  process.exit(1);
});