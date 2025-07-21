import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { ApiGlobalResponses } from 'src/shared/decorators/swagger.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { LocalAuthGuard } from 'src/shared/guards/local-auth.guard';
import { Request } from 'express';

@ApiGlobalResponses()
@Controller('interaction')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @UseGuards(LocalAuthGuard)
  @Get(':code')
  async trackInteraction(
    @Param('code') code: string,
    @Req() req: Request,
    @CurrentUser('id') userId?: string,
  ) {
    const metadata = {
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    };

    console.log(metadata, userId);

    return await this.interactionService.trackInteraction({
      code,
      userId,
      metadata,
    });
  }
}
