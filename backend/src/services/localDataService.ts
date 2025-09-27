import fs from 'fs/promises';
import path from 'path';

/**
 * Local Data Service - Zarządzanie danymi w trybie fallback
 * Używane gdy MongoDB nie jest dostępny
 */

interface LocalDataOptions {
  dataDir?: string;
  enablePersistence?: boolean;
  autoSave?: boolean;
}

export class LocalDataService {
  private dataDir: string;
  private enablePersistence: boolean;
  private autoSave: boolean;
  private data: Map<string, any[]> = new Map();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(options: LocalDataOptions = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.enablePersistence = options.enablePersistence ?? true;
    this.autoSave = options.autoSave ?? true;
  }

  async initialize(): Promise<void> {
    if (!this.enablePersistence) return;

    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log(`📁 Local data directory initialized: ${this.dataDir}`);

      // Load existing data files
      await this.loadAllData();
    } catch (error) {
      console.warn('⚠️  Failed to initialize local data service:', error);
    }
  }

  private async loadAllData(): Promise<void> {
    try {
      const files = await fs.readdir(this.dataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const collection = file.replace('.json', '');
        await this.loadCollection(collection);
      }
    } catch (error) {
      console.warn('⚠️  Failed to load existing data files:', error);
    }
  }

  private async loadCollection(collection: string): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, `${collection}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      this.data.set(collection, Array.isArray(data) ? data : []);
      console.log(`📄 Loaded ${collection}: ${this.data.get(collection)?.length || 0} items`);
    } catch (error) {
      // File doesn't exist or invalid JSON - start with empty array
      this.data.set(collection, []);
    }
  }

  async create(collection: string, document: any): Promise<any> {
    const items = this.data.get(collection) || [];
    
    // Generate simple ID if not provided
    const newDoc = {
      _id: document._id || this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...document
    };

    items.push(newDoc);
    this.data.set(collection, items);
    
    if (this.autoSave) {
      this.scheduleSave(collection);
    }

    return newDoc;
  }

  async find(collection: string, query: any = {}): Promise<any[]> {
    const items = this.data.get(collection) || [];
    
    if (Object.keys(query).length === 0) {
      return items;
    }

    // Simple query matching
    return items.filter(item => {
      return Object.entries(query).every(([key, value]) => {
        if (key === '_id' && typeof value === 'string') {
          return item._id?.toString() === value;
        }
        return item[key] === value;
      });
    });
  }

  async findOne(collection: string, query: any = {}): Promise<any | null> {
    const results = await this.find(collection, query);
    return results[0] || null;
  }

  async findById(collection: string, id: string): Promise<any | null> {
    return this.findOne(collection, { _id: id });
  }

  async updateById(collection: string, id: string, update: any): Promise<any | null> {
    const items = this.data.get(collection) || [];
    const index = items.findIndex(item => item._id?.toString() === id);
    
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...update,
      updatedAt: new Date().toISOString()
    };

    this.data.set(collection, items);
    
    if (this.autoSave) {
      this.scheduleSave(collection);
    }

    return items[index];
  }

  async deleteById(collection: string, id: string): Promise<boolean> {
    const items = this.data.get(collection) || [];
    const index = items.findIndex(item => item._id?.toString() === id);
    
    if (index === -1) return false;

    items.splice(index, 1);
    this.data.set(collection, items);
    
    if (this.autoSave) {
      this.scheduleSave(collection);
    }

    return true;
  }

  async count(collection: string, query: any = {}): Promise<number> {
    const results = await this.find(collection, query);
    return results.length;
  }

  private scheduleSave(collection: string): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      await this.saveCollection(collection);
    }, 1000); // Save after 1 second of inactivity
  }

  private async saveCollection(collection: string): Promise<void> {
    if (!this.enablePersistence) return;

    try {
      const items = this.data.get(collection) || [];
      const filePath = path.join(this.dataDir, `${collection}.json`);
      await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to save collection ${collection}:`, error);
    }
  }

  async saveAll(): Promise<void> {
    if (!this.enablePersistence) return;

    for (const [collection] of this.data) {
      await this.saveCollection(collection);
    }
    console.log('💾 All collections saved to local files');
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Statistics and management
  getStats(): { [collection: string]: number } {
    const stats: { [collection: string]: number } = {};
    for (const [collection, items] of this.data) {
      stats[collection] = items.length;
    }
    return stats;
  }

  async clearCollection(collection: string): Promise<void> {
    this.data.set(collection, []);
    if (this.enablePersistence) {
      await this.saveCollection(collection);
    }
  }

  async clearAll(): Promise<void> {
    this.data.clear();
    if (this.enablePersistence) {
      try {
        const files = await fs.readdir(this.dataDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        for (const file of jsonFiles) {
          await fs.unlink(path.join(this.dataDir, file));
        }
      } catch (error) {
        console.warn('Failed to clear local data files:', error);
      }
    }
  }
}

// Singleton instance for global use
export const localDataService = new LocalDataService({
  dataDir: path.join(process.cwd(), 'data'),
  enablePersistence: true,
  autoSave: true
});