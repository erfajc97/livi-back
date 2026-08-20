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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CoerceBoolInterceptor } from '../../common/interceptors/coerce-bool.interceptor';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { ProductResponseDto } from '../products/dto/product-response.dto';

/**
 * Dos artes por categoría/marca: `image` (escritorio) y `mobileImage`
 * (vertical). Ambos opcionales: editar solo el nombre no obliga a re-subir.
 */
const IMAGE_FIELDS = FileFieldsInterceptor([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 },
]);

interface UploadedImages {
  image?: Express.Multer.File[];
  mobileImage?: Express.Multer.File[];
}

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Category endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @UseInterceptors(IMAGE_FIELDS, CoerceBoolInterceptor)
  @ApiConsumes('multipart/form-data')
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFiles() files?: UploadedImages,
  ) {
    return this.categoriesService.createCategory(
      createCategoryDto,
      files?.image?.[0],
      files?.mobileImage?.[0],
    );
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Retrieve all categories with optional pagination. Filter by bajoPedido to get pre-order categories.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (for pagination)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (for pagination)' })
  @ApiQuery({ name: 'bajoPedido', required: false, type: Boolean, description: 'Filter by bajo pedido status' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAllCategories(@Query() query: CategoryQueryDto) {
    const { page, limit, bajoPedido: bajoPedidoRaw } = query;
    const bajoPedido = bajoPedidoRaw === 'true' ? true : bajoPedidoRaw === 'false' ? false : undefined;
    return this.categoriesService.findAllCategories({ page, limit }, bajoPedido);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieve detailed information about a specific category including its marcas'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOneCategory(@Param('id') id: string) {
    return this.categoriesService.findOneCategory(+id);
  }

  @Get(':id/products')
  @Public()
  @ApiOperation({
    summary: 'Get products in category',
    description: 'Retrieve paginated list of products in a specific category'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Paginated list of products', type: PaginatedResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  getProductsByCategory(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.categoriesService.getProductsByCategory(+id, paginationDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @UseInterceptors(IMAGE_FIELDS, CoerceBoolInterceptor)
  @ApiConsumes('multipart/form-data')
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFiles() files?: UploadedImages,
  ) {
    return this.categoriesService.updateCategory(
      +id,
      updateCategoryDto,
      files?.image?.[0],
      files?.mobileImage?.[0],
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  removeCategory(@Param('id') id: string) {
    return this.categoriesService.removeCategory(+id);
  }

  // Marca endpoints
  @Post('marcas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @UseInterceptors(IMAGE_FIELDS, CoerceBoolInterceptor)
  @ApiConsumes('multipart/form-data')
  createMarca(
    @Body() createMarcaDto: CreateMarcaDto,
    @UploadedFiles() files?: UploadedImages,
  ) {
    return this.categoriesService.createMarca(
      createMarcaDto,
      files?.image?.[0],
      files?.mobileImage?.[0],
    );
  }

  @Get('marcas/all')
  @Public()
  findAllMarcas() {
    return this.categoriesService.findAllMarcas();
  }

  @Get('marcas/category/:categoryId')
  @Public()
  @ApiOperation({
    summary: 'Get marcas by category',
    description: 'Retrieve all marcas for a specific category with optional pagination'
  })
  @ApiParam({ name: 'categoryId', type: 'number', description: 'Category ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (for pagination)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (for pagination)' })
  @ApiResponse({ status: 200, description: 'List of marcas' })
  findMarcasByCategory(
    @Param('categoryId') categoryId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.categoriesService.findMarcasByCategory(+categoryId, paginationDto);
  }

  @Get('marcas/:id')
  @Public()
  @ApiOperation({
    summary: 'Get marca by ID',
    description: 'Retrieve detailed information about a specific marca including its parent category'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Marca ID' })
  @ApiResponse({ status: 200, description: 'Marca found' })
  @ApiResponse({ status: 404, description: 'Marca not found' })
  findOneMarca(@Param('id') id: string) {
    return this.categoriesService.findOneMarca(+id);
  }

  @Get('marcas/:id/products')
  @Public()
  @ApiOperation({
    summary: 'Get products in marca',
    description: 'Retrieve paginated list of products in a specific marca'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Marca ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Paginated list of products', type: PaginatedResponseDto })
  @ApiResponse({ status: 404, description: 'Marca not found' })
  getProductsByMarca(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.categoriesService.getProductsByMarca(+id, paginationDto);
  }

  @Patch('marcas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @UseInterceptors(IMAGE_FIELDS, CoerceBoolInterceptor)
  @ApiConsumes('multipart/form-data')
  updateMarca(
    @Param('id') id: string,
    @Body() updateMarcaDto: UpdateMarcaDto,
    @UploadedFiles() files?: UploadedImages,
  ) {
    return this.categoriesService.updateMarca(
      +id,
      updateMarcaDto,
      files?.image?.[0],
      files?.mobileImage?.[0],
    );
  }

  @Delete('marcas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  removeMarca(@Param('id') id: string) {
    return this.categoriesService.removeMarca(+id);
  }
}
