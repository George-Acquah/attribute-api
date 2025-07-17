import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { RedisService } from 'src/shared/services/redis/redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get('health')
  async healthCheck(@Res() res: Response) {
    const isHealthy = await this.redisService.healthCheck();

    return res
      .status(isHealthy ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({ redisNew: isHealthy ? 'healthy new' : 'unhealthy' });
  }
}
