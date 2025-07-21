import { Controller } from '@nestjs/common';
import { ConversionService } from './conversion.service';

@Controller('conversion')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}
}
