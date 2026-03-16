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
import { ProductVariationsService } from './product-variations.service';
import { CreateProductVariationDto } from './dto/create-product-variation.dto';
import { UpdateProductVariationDto } from './dto/update-product-variation.dto';
import { ProductVariationResponseDto } from './dto/product-variation-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';

@ApiTags('product-variations')
@Controller('product-variations')
export class ProductVariationsController {
  constructor(private readonly productVariationsService: ProductVariationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  create(@Body() createVariationDto: CreateProductVariationDto) {
    return this.productVariationsService.create(createVariationDto);
  }

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Get variants', 
    description: 'Get all variants or filter by product ID' 
  })
  @ApiQuery({ name: 'productId', required: false, type: Number, description: 'Filter variants by product ID' })
  @ApiResponse({ status: 200, description: 'List of variants', type: [ProductVariationResponseDto] })
  findAll(@Query('productId') productId?: string) {
    if (productId) {
      return this.productVariationsService.findByProduct(+productId);
    }
    return this.productVariationsService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ 
    summary: 'Get variant by ID', 
    description: 'Retrieve detailed information about a specific product variation/variant including option values' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Product Variation ID' })
  @ApiResponse({ status: 200, description: 'Variant found', type: ProductVariationResponseDto })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  findOne(@Param('id') id: string) {
    return this.productVariationsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateVariationDto: UpdateProductVariationDto) {
    return this.productVariationsService.update(+id, updateVariationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productVariationsService.remove(+id);
  }
}
