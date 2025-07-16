import Redis from 'ioredis';

export interface IRedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  tls?: object;
}

export type RedisClient = Redis;
