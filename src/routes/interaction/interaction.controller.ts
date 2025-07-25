import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { ApiGlobalResponses } from 'src/shared/decorators/swagger.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { LocalAuthGuard } from 'src/shared/guards/local-auth.guard';
import { Fingerprint } from 'src/shared/decorators/fingerprints.decorator';
import { _IFingerprintWithMeta } from 'src/shared/interfaces/interactions.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Interaction')
@ApiGlobalResponses()
@Controller('interaction')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @UseGuards(LocalAuthGuard)
  @Get(':code')
  async trackInteraction(
    @Param('code') code: string,
    @Fingerprint() fingerprintWithMeta: _IFingerprintWithMeta,
    @CurrentUser('id') userId?: string,
  ) {
    return await this.interactionService.trackInteraction({
      code,
      userId,
      fingerprintWithMeta,
    });
  }
}
