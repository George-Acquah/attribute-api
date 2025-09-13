import { ConversionService } from './conversion.service';
import { CreateConversionDto } from './dtos/create-conversion.dto';
import { instanceToPlain } from 'class-transformer';
import { _ICreateConversion } from 'src/shared/interfaces/conversion.interface';
import { ApiTags } from '@nestjs/swagger';
import { Fingerprint } from 'src/shared/decorators/fingerprints.decorator';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
import { Body } from '@nestjs/common/decorators/http/route-params.decorator';
import { Controller } from '@nestjs/common/decorators/core/controller.decorator';
import { Post } from '@nestjs/common/decorators/http/request-mapping.decorator';
import { Session } from 'src/shared/decorators/session.decorator';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';

@ApiTags('Conversion')
@Controller('conversion')
@UseGuards(SessionAuthGuard)
@Session('user', 'local')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Post()
  async createConversion(
    @Body() dto: CreateConversionDto,
    @Fingerprint('fingerprint') fingerprint: string,
  ) {
    return await this.conversionService.createConversion(
      instanceToPlain(dto) as _ICreateConversion,
      fingerprint,
    );
  }
}
