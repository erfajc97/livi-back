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
import { ProductsService } from './products.service';
import { StockService } from './stock.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockService: StockService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create product', description: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: ProductResponseDto })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Get products with pagination and filters', 
    description: 'Retrieve products with pagination, filtering, and sorting. Returns paginated results.' 
  })
  @ApiResponse({ status: 200, description: 'Paginated list of products' })
  findAll(@Query() filterDto: FilterProductsDto) {
    return this.productsService.findWithFilters(filterDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieve a specific product by ID with all details including variations'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiQuery({ name: 'includeVariations', required: false, type: Boolean, description: 'Include product variations in response (default: true)' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(
    @Param('id') id: string,
    @Query('includeVariations') includeVariations?: string,
  ) {
    const include = includeVariations !== 'false';
    return this.productsService.findOne(+id, include);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update product', description: 'Update product information' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete product', description: 'Delete a product' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete product with existing decants' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  // ── Inventory / Stock Management ──────────────────────

  @Post(':id/open-bottle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Open a sealed bottle', description: 'Opens a sealed bottle for decanting. Decreases stock by 1, adds ml to open bottle.' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  async openBottle(
    @Param('id') id: string,
    @Body() body: { mlRemaining?: number; note?: string },
    @CurrentUser() user: any,
  ) {
    return this.stockService.openBottle(+id, {
      mlRemaining: body.mlRemaining,
      note: body.note,
      createdBy: user?.email || 'admin',
    });
  }

  @Patch(':id/adjust-ml')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Adjust open bottle ml', description: 'Manually adjust the ml remaining in the open bottle.' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  async adjustMl(
    @Param('id') id: string,
    @Body() body: { newOpenMl: number; note?: string },
    @CurrentUser() user: any,
  ) {
    return this.stockService.adjustOpenMl(+id, body.newOpenMl, {
      note: body.note,
      createdBy: user?.email || 'admin',
    });
  }

  @Get(':id/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get inventory detail', description: 'Get detailed inventory info including bottle events and order history.' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  async getInventory(@Param('id') id: string) {
    return this.productsService.getInventoryDetail(+id);
  }
}
