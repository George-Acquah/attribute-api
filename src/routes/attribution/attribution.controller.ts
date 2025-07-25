import { Controller } from '@nestjs/common';
import { AttributionService } from './attribution.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Attribution')
@Controller('attribution')
export class AttributionController {
  constructor(private readonly attributionService: AttributionService) {}
}
