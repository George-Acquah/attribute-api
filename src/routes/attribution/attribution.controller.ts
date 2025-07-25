import { Controller } from '@nestjs/common';
import { AttributionService } from './attribution.service';

@Controller('attribution')
export class AttributionController {
  constructor(private readonly attributionService: AttributionService) {}
}
