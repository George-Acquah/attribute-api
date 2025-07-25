import { Injectable, Logger } from '@nestjs/common';
import { _ICreateConversion } from 'src/shared/interfaces/conversion.interface';
import {
  OkResponse,
  InternalServerErrorResponse,
} from 'src/shared/res/api.response';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { AttributionService } from '../attribution/attribution.service';

@Injectable()
export class ConversionService {
  private logger = new Logger(ConversionService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly attributionService: AttributionService,
  ) {}

  async createConversion({
    type,
    value,
    fingerprint,
    userId,
  }: _ICreateConversion) {
    try {
      // Create Conversion
      const conversion = await this.prisma.conversion.create({
        data: {
          type,
          value,
          userId,
        },
      });

      await this.attributionService.attributeConversion(
        conversion.id,
        userId,
        fingerprint,
      );

      return new OkResponse(conversion, 'Conversion created.');
    } catch (err) {
      this.logger.error('Error creating conversion', err);
      return new InternalServerErrorResponse('Failed to create conversion');
    }
  }
}
