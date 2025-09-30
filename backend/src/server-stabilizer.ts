#!/usr/bin/env node

/**
 * 🚀 STABLE SERVER RUNNER SCRIPT
 * Rozwiązuje problemy z:
 * - Konfliktami portów
 * - Niestabilnymi połączeniami MongoDB
 * - Node.js procesami zombie
 * - Socket.io dependency issues
 */

import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

// Configuration
const BACKEND_DIR = path.resolve(__dirname);
const SERVER_FILE = path.join(BACKEND_DIR, 'dist', 'stable-server.js');
const PREFERRED_PORT = process.env.PORT || '8080';
const FALLBACK_PORTS = ['8081', '8082', '3001', '3002'];

class ServerStabilizer {
  private serverProcess: ChildProcess | null = null;
  private currentPort: string = PREFERRED_PORT;
  private restartCount: number = 0;
  private maxRestarts: number = 5;

  constructor() {
    this.setupSignalHandlers();
  }

  /**
   * Kill all existing Node.js processes
   */
  private async killExistingProcesses(): Promise<void> {
    console.log('🔪 Killing existing Node.js processes...');
    
    try {
      if (process.platform === 'win32') {
        await this.executeCommand('taskkill', ['/F', '/IM', 'node.exe']);
      } else {
        await this.executeCommand('pkill', ['-f', 'node']);
      }
      
      // Wait for cleanup
      await this.sleep(2000);
      console.log('✅ Existing processes cleaned up');
    } catch (error) {
      console.log('ℹ️ No processes to kill or cleanup completed');
    }
  }

  /**
   * Find available port
   */
  private async findAvailablePort(): Promise<string> {
    const testPorts = [PREFERRED_PORT, ...FALLBACK_PORTS];
    
    for (const port of testPorts) {
      const isAvailable = await this.isPortAvailable(port);
      if (isAvailable) {
        console.log(`✅ Port ${port} is available`);
        return port;
      }
      console.log(`❌ Port ${port} is occupied`);
    }
    
    throw new Error('No available ports found');
  }

  /**
   * Check if port is available
   */
  private async isPortAvailable(port: string): Promise<boolean> {
    return new Promise((resolve) => {
      const command = process.platform === 'win32' 
        ? `netstat -ano | findstr :${port}`
        : `lsof -i :${port}`;
        
      const child = spawn(command, [], { shell: true });
      
      child.on('close', (code) => {
        // If netstat/lsof finds nothing, port is available
        resolve(code !== 0);
      });
      
      child.on('error', () => resolve(true));
    });
  }

  /**
   * Build TypeScript files
   */
  private async buildProject(): Promise<void> {
    console.log('🔨 Building TypeScript files...');
    
    try {
      await this.executeCommand('npm', ['run', 'build'], { 
        cwd: BACKEND_DIR,
        stdio: 'inherit'
      });
      console.log('✅ Build completed successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error}`);
    }
  }

  /**
   * Start server process
   */
  private async startServer(): Promise<void> {
    if (!existsSync(SERVER_FILE)) {
      throw new Error(`Server file not found: ${SERVER_FILE}`);
    }

    console.log(`🚀 Starting server on port ${this.currentPort}...`);
    
    // Set environment variables for the server process
    const env = {
      ...process.env,
      PORT: this.currentPort,
      NODE_ENV: process.env.NODE_ENV || 'development',
      DB_ENABLED: 'true',
      MOCK_MODE: 'false'
    };

    this.serverProcess = spawn('node', [SERVER_FILE], {
      cwd: BACKEND_DIR,
      env,
      stdio: ['inherit', 'pipe', 'pipe']
    });

    // Handle server output
    this.serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log(`[Server] ${output.trim()}`);
      
      // Check if server started successfully
      if (output.includes('SERWER DZIAŁA POPRAWNIE') || output.includes('Server is running')) {
        console.log('🎉 Server started successfully!');
        this.restartCount = 0; // Reset restart counter on success
      }
    });

    this.serverProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      console.error(`[Server Error] ${error.trim()}`);
      
      // Handle port conflicts
      if (error.includes('EADDRINUSE')) {
        console.log('⚠️ Port conflict detected, trying next port...');
        this.handlePortConflict();
      }
    });

    this.serverProcess.on('close', (code) => {
      console.log(`[Server] Process exited with code ${code}`);
      
      if (code !== 0 && this.restartCount < this.maxRestarts) {
        console.log(`🔄 Attempting restart (${this.restartCount + 1}/${this.maxRestarts})...`);
        this.restartCount++;
        setTimeout(() => this.restart(), 3000);
      } else if (this.restartCount >= this.maxRestarts) {
        console.error('💥 Max restart attempts reached. Server stability compromised.');
        process.exit(1);
      }
    });

    this.serverProcess.on('error', (error) => {
      console.error('💥 Failed to start server process:', error);
    });
  }

  /**
   * Handle port conflicts by trying next available port
   */
  private async handlePortConflict(): Promise<void> {
    try {
      const nextPort = await this.findAvailablePort();
      if (nextPort !== this.currentPort) {
        this.currentPort = nextPort;
        console.log(`🔄 Switching to port ${this.currentPort}`);
        
        // Kill current process and restart with new port
        if (this.serverProcess) {
          this.serverProcess.kill();
        }
        
        setTimeout(() => this.startServer(), 2000);
      }
    } catch (error) {
      console.error('💥 Failed to find alternative port:', error);
    }
  }

  /**
   * Restart server
   */
  private async restart(): Promise<void> {
    console.log('🔄 Restarting server...');
    
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    
    await this.sleep(2000);
    await this.start();
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      if (this.serverProcess) {
        this.serverProcess.kill();
      }
      
      setTimeout(() => {
        console.log('👋 Server shutdown complete');
        process.exit(0);
      }, 2000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  /**
   * Execute command as promise
   */
  private executeCommand(command: string, args: string[], options: any = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, options);
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
      
      child.on('error', reject);
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  private async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:${this.currentPort}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Main start method
   */
  public async start(): Promise<void> {
    try {
      console.log('🚀 Server Stabilizer Starting...');
      
      // Step 1: Clean up existing processes
      await this.killExistingProcesses();
      
      // Step 2: Find available port
      this.currentPort = await this.findAvailablePort();
      
      // Step 3: Build project
      await this.buildProject();
      
      // Step 4: Start server
      await this.startServer();
      
      // Step 5: Wait and perform health check
      await this.sleep(3000);
      const isHealthy = await this.healthCheck();
      
      if (isHealthy) {
        console.log(`🎉 Server is healthy and running on http://localhost:${this.currentPort}`);
        console.log(`🔍 Health check: http://localhost:${this.currentPort}/health`);
      } else {
        console.log('⚠️ Server started but health check failed. Monitoring...');
      }
      
    } catch (error) {
      console.error('💥 Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the stabilizer if this file is run directly
if (require.main === module) {
  const stabilizer = new ServerStabilizer();
  stabilizer.start().catch(console.error);
}

export default ServerStabilizer;