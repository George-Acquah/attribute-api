import { Controller, Delete, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { OkResponse } from 'src/shared/res/api.response';
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

  @Delete('cache')
  async deleteCache() {
    const result =
      process.env.NODE_ENV === 'development'
        ? await this.redisService.flushAll()
        : 'This action is only available in development mode';

    return new OkResponse(result);
  }
}
