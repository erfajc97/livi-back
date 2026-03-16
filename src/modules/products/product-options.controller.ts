import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductOptionsService } from './product-options.service';
import { CreateProductOptionDto } from './dto/create-product-option.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';
import { CreateProductOptionValueDto } from './dto/create-product-option-value.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';

@ApiTags('product-options')
@Controller('product-options')
export class ProductOptionsController {
  constructor(private readonly productOptionsService: ProductOptionsService) {}

  // ProductOption endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  createOption(@Body() createOptionDto: CreateProductOptionDto) {
    return this.productOptionsService.createOption(createOptionDto);
  }

  @Get()
  @Public()
  findAllOptions(@Query('productType') productType?: string) {
    if (productType) {
      return this.productOptionsService.findOptionsByType(productType);
    }
    return this.productOptionsService.findAllOptions();
  }

  @Get(':id')
  @Public()
  findOneOption(@Param('id') id: string) {
    return this.productOptionsService.findOneOption(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  updateOption(@Param('id') id: string, @Body() updateOptionDto: UpdateProductOptionDto) {
    return this.productOptionsService.updateOption(+id, updateOptionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  removeOption(@Param('id') id: string) {
    return this.productOptionsService.removeOption(+id);
  }

  // ProductOptionValue endpoints
  @Post('values')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  createOptionValue(@Body() createValueDto: CreateProductOptionValueDto) {
    return this.productOptionsService.createOptionValue(createValueDto);
  }

  @Get('values/all')
  @Public()
  findAllOptionValues() {
    return this.productOptionsService.findAllOptionValues();
  }

  @Get('values/option/:optionId')
  @Public()
  findOptionValuesByOption(@Param('optionId') optionId: string) {
    return this.productOptionsService.findOptionValuesByOption(+optionId);
  }

  @Get('values/:id')
  @Public()
  findOneOptionValue(@Param('id') id: string) {
    return this.productOptionsService.findOneOptionValue(+id);
  }

  @Patch('values/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  updateOptionValue(
    @Param('id') id: string,
    @Body() updateValueDto: Partial<CreateProductOptionValueDto>,
  ) {
    return this.productOptionsService.updateOptionValue(+id, updateValueDto);
  }

  @Delete('values/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  removeOptionValue(@Param('id') id: string) {
    return this.productOptionsService.removeOptionValue(+id);
  }
}
