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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { ProductResponseDto } from '../products/dto/product-response.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Category endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Get all categories', 
    description: 'Retrieve all categories with optional pagination. Returns list of categories with their subcategories.' 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (for pagination)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (for pagination)' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAllCategories(@Query() paginationDto: PaginationDto) {
    return this.categoriesService.findAllCategories(paginationDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ 
    summary: 'Get category by ID', 
    description: 'Retrieve detailed information about a specific category including its subcategories' 
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
  updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(+id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  removeCategory(@Param('id') id: string) {
    return this.categoriesService.removeCategory(+id);
  }

  // Subcategory endpoints
  @Post('subcategories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  createSubcategory(@Body() createSubcategoryDto: CreateSubcategoryDto) {
    return this.categoriesService.createSubcategory(createSubcategoryDto);
  }

  @Get('subcategories/all')
  @Public()
  findAllSubcategories() {
    return this.categoriesService.findAllSubcategories();
  }

  @Get('subcategories/category/:categoryId')
  @Public()
  @ApiOperation({ 
    summary: 'Get subcategories by category', 
    description: 'Retrieve all subcategories for a specific category with optional pagination' 
  })
  @ApiParam({ name: 'categoryId', type: 'number', description: 'Category ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (for pagination)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (for pagination)' })
  @ApiResponse({ status: 200, description: 'List of subcategories' })
  findSubcategoriesByCategory(
    @Param('categoryId') categoryId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.categoriesService.findSubcategoriesByCategory(+categoryId, paginationDto);
  }

  @Get('subcategories/:id')
  @Public()
  @ApiOperation({ 
    summary: 'Get subcategory by ID', 
    description: 'Retrieve detailed information about a specific subcategory including its parent category' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Subcategory ID' })
  @ApiResponse({ status: 200, description: 'Subcategory found' })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  findOneSubcategory(@Param('id') id: string) {
    return this.categoriesService.findOneSubcategory(+id);
  }

  @Get('subcategories/:id/products')
  @Public()
  @ApiOperation({ 
    summary: 'Get products in subcategory', 
    description: 'Retrieve paginated list of products in a specific subcategory' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Subcategory ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Paginated list of products', type: PaginatedResponseDto })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  getProductsBySubcategory(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.categoriesService.getProductsBySubcategory(+id, paginationDto);
  }

  @Patch('subcategories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  updateSubcategory(
    @Param('id') id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
  ) {
    return this.categoriesService.updateSubcategory(+id, updateSubcategoryDto);
  }

  @Delete('subcategories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  removeSubcategory(@Param('id') id: string) {
    return this.categoriesService.removeSubcategory(+id);
  }
}
