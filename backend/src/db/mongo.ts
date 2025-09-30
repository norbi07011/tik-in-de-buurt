import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { config } from '../config/env';

class MongoConnection {
  private static instance: MongoConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private isMock = false;

  private constructor() {}

  public static getInstance(): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
    }
    return MongoConnection.instance;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async connectMongo(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    if (!config.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI not found, falling back to MOCK_MODE');
      this.isMock = true;
      return;
    }

    const maxRetries = 5;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log(`🔗 Attempting MongoDB connection (${retryCount + 1}/${maxRetries})...`);
        
        this.client = new MongoClient(config.MONGODB_URI, {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
          },
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });

        await this.client.connect();
        await this.client.db('admin').command({ ping: 1 });
        
        this.db = this.client.db(config.MONGODB_DB_NAME);
        this.isConnected = true;
        this.isMock = false;

        console.log(`✅ MongoDB connected successfully to ${config.MONGODB_DB_NAME}`);
        return;

      } catch (error) {
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
        
        console.error(`❌ MongoDB connection attempt ${retryCount} failed:`, error instanceof Error ? error.message : error);
        
        if (retryCount < maxRetries) {
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    console.error('❌ All MongoDB connection attempts failed, falling back to MOCK_MODE');
    this.isMock = true;
  }

  public getDb(): Db | null {
    if (this.isMock) {
      console.warn('⚠️ Database in MOCK_MODE - operations will be simulated');
      return null;
    }
    return this.db;
  }

  public isConnectedToMongo(): boolean {
    return this.isConnected && !this.isMock;
  }

  public isMockMode(): boolean {
    return this.isMock;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('🔌 MongoDB connection closed');
    }
  }
}

const mongoConnection = MongoConnection.getInstance();

export const connectMongo = () => mongoConnection.connectMongo();
export const getDb = () => mongoConnection.getDb();
export const isConnectedToMongo = () => mongoConnection.isConnectedToMongo();
export const isMockMode = () => mongoConnection.isMockMode();
export const disconnectMongo = () => mongoConnection.disconnect();

export default mongoConnection;