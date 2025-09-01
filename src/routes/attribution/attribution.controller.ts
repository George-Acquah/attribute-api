import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AttributionService } from './attribution.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiGlobalResponses } from 'src/shared/decorators/swagger.decorator';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { Fingerprint } from 'src/shared/decorators/fingerprints.decorator';
import { AttributeInteractionDto } from './dtos/attribute-interaction.dto';
import { instanceToPlain } from 'class-transformer';
import { IAttributeInteraction } from 'src/shared/interfaces/attribution.interface';

@ApiTags('Attribution')
@Controller('attribution')
@ApiBearerAuth()
@ApiGlobalResponses()
@UseGuards(FirebaseAuthGuard)
export class AttributionController {
  constructor(private readonly attributionService: AttributionService) {}

  @Post('attribute-interaction/:interactionId')
  async attributeConversion(
    @Param('interactionId') interactionId: string,
    @Body() dto: AttributeInteractionDto,
    @Fingerprint('fingerprint') fingerprint: string,
  ) {
    return await this.attributionService.attributeInteraction(
      interactionId,
      fingerprint,
      instanceToPlain(dto) as IAttributeInteraction,
    );
  }
}
