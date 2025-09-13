import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { ApiGlobalResponses } from 'src/shared/decorators/swagger.decorator';
import { Fingerprint } from 'src/shared/decorators/fingerprints.decorator';
import { _IFingerprintWithMeta } from 'src/shared/interfaces/interactions.interface';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
import { Session } from 'src/shared/decorators/session.decorator';

@ApiTags('Interaction')
@ApiGlobalResponses()
@UseGuards(SessionAuthGuard)
@Session('user', 'local')
@Controller('interaction')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Get(':code')
  async trackInteraction(
    @Param('code') code: string,
    @Fingerprint() fingerprintWithMeta: _IFingerprintWithMeta,
  ) {
    return await this.interactionService.trackInteraction({
      code,
      fingerprintWithMeta,
    });
  }
}
