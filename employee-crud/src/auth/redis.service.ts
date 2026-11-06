import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

interface MemorySession {
  data: string;
  expiresAt: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private memoryStore = new Map<string, MemorySession>();
  
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    this.client.on('error', (err: unknown) =>
      console.log(
        'Redis error:',
        err instanceof Error ? err.message : 'Unknown error',
      ),
    );
  }

  async onModuleInit(){
    try {
      await this.client.connect();
      console.log('Redis connected successfully');
    } catch (err: unknown) {
      console.log(
        'Redis connection error (using in-memory session fallback):',
        err instanceof Error ? err.message : 'Unknown error',
      );
    }
  }

  async onModuleDestroy(){
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async setSession(
    sessionId: string,
    data: any,
    ttl = 3600,     
  ){
    const serialized = JSON.stringify(data);

    if (this.client.isOpen) {
      try {
        await this.client.setEx(`session:${sessionId}`, ttl, serialized);
      } catch (err) {
        console.log(
          'Failed to write to Redis:',
          err instanceof Error ? err.message : 'Unknown error',
        ); 
      }
    }

    // Always keep in memory store as fallback
    this.memoryStore.set(sessionId, {
      data: serialized,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async getSession(
    sessionId: string,
  ){
    if (this.client.isOpen) {
      try {
        const data = await this.client.get(`session:${sessionId}`);
        if (typeof data === 'string') {
          return JSON.parse(data);
        }
      } catch (err: unknown) {
        console.log(
          'Failed to read from Redis:',
          err instanceof Error ? err.message : 'Unknown error',
        );
      }
    }

    // Fallback to in-memory store
    const item = this.memoryStore.get(sessionId);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.memoryStore.delete(sessionId);
      return null;
    }

    return JSON.parse(item.data);
  }

  async deleteSession(sessionId: string){
    if (this.client.isOpen) {
      try {
        await this.client.del(`session:${sessionId}`);
      } catch (err: unknown) {
        console.log(
          'Failed to delete from Redis:',
          err instanceof Error ? err.message : 'Unknown error',
        );
      }
    }
    this.memoryStore.delete(sessionId);
  }
}
