import { Body, Controller, Post } from '@nestjs/common';
import { ConversionService } from './conversion.service';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { CreateConversionDto } from './dtos/create-conversion.dto';
import { instanceToPlain } from 'class-transformer';
import { _ICreateConversion } from 'src/shared/interfaces/conversion.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Conversion')
@Controller('conversion')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Post()
  async createConversion(
    @Body() dto: CreateConversionDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.conversionService.createConversion({
      ...(instanceToPlain(dto) as Omit<_ICreateConversion, 'userId'>),
      userId,
    });
  }
}
