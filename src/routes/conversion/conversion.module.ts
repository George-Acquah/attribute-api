import { Module } from '@nestjs/common';
import { ConversionService } from './conversion.service';
import { ConversionController } from './conversion.controller';
import { AttributionService } from '../attribution/attribution.service';

@Module({
  controllers: [ConversionController],
  providers: [ConversionService, AttributionService],
})
export class ConversionModule {}
