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
import { SectionPlacement } from './entities/landing-section.entity';
import { LandingSectionsService } from './landing-sections.service';
import { CreateLandingSectionDto } from './dto/create-landing-section.dto';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';
import { LandingSectionResponseDto } from './dto/landing-section-response.dto';
import { ReorderSectionProductsDto } from './dto/reorder-section-products.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';

@ApiTags('landing-sections')
@Controller('landing-sections')
export class LandingSectionsController {
  constructor(private readonly landingSectionsService: LandingSectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create landing section', description: 'Create a new landing section' })
  @ApiResponse({ status: 201, description: 'Section created successfully', type: LandingSectionResponseDto })
  create(@Body() createLandingSectionDto: CreateLandingSectionDto) {
    return this.landingSectionsService.create(createLandingSectionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all landing sections', description: 'Retrieve all landing sections for admin' })
  @ApiResponse({ status: 200, description: 'List of all sections', type: [LandingSectionResponseDto] })
  findAll() {
    return this.landingSectionsService.findAll();
  }

  @Get('active')
  @Public()
  @ApiOperation({
    summary: 'Get active landing sections',
    description: 'Retrieve active landing sections for public view, optionally filtered by placement (home | cart)',
  })
  @ApiQuery({ name: 'placement', enum: SectionPlacement, required: false })
  @ApiResponse({ status: 200, description: 'List of active sections', type: [LandingSectionResponseDto] })
  findActive(@Query('placement') placement?: SectionPlacement) {
    return this.landingSectionsService.findActive(placement);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get landing section by ID', description: 'Retrieve a specific landing section' })
  @ApiParam({ name: 'id', type: 'number', description: 'Section ID' })
  @ApiResponse({ status: 200, description: 'Section found', type: LandingSectionResponseDto })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async findOne(@Param('id') id: string) {
    const section = await this.landingSectionsService.findOne(+id);
    return new LandingSectionResponseDto(section);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update landing section', description: 'Update section information including products' })
  @ApiParam({ name: 'id', type: 'number', description: 'Section ID' })
  @ApiResponse({ status: 200, description: 'Section updated successfully', type: LandingSectionResponseDto })
  @ApiResponse({ status: 404, description: 'Section not found' })
  update(@Param('id') id: string, @Body() updateLandingSectionDto: UpdateLandingSectionDto) {
    return this.landingSectionsService.update(+id, updateLandingSectionDto);
  }

  @Post(':id/products/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add product to section', description: 'Add a product to landing section' })
  @ApiParam({ name: 'id', type: 'number', description: 'Section ID' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product added successfully', type: LandingSectionResponseDto })
  addProduct(@Param('id') id: string, @Param('productId') productId: string) {
    return this.landingSectionsService.addProduct(+id, +productId);
  }

  @Patch(':id/products/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reorder products in section', description: 'Set display order of products in a landing section' })
  @ApiParam({ name: 'id', type: 'number', description: 'Section ID' })
  @ApiResponse({ status: 200, description: 'Products reordered', type: LandingSectionResponseDto })
  reorderProducts(@Param('id') id: string, @Body() dto: ReorderSectionProductsDto) {
    return this.landingSectionsService.reorderProducts(+id, dto.productIds);
  }

  @Delete(':id/products/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove product from section', description: 'Remove a product from landing section' })
  @ApiParam({ name: 'id', type: 'number', description: 'Section ID' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product removed successfully', type: LandingSectionResponseDto })
  removeProduct(@Param('id') id: string, @Param('productId') productId: string) {
    return this.landingSectionsService.removeProduct(+id, +productId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete landing section', description: 'Delete a landing section' })
  @ApiParam({ name: 'id', type: 'number', description: 'Section ID' })
  @ApiResponse({ status: 200, description: 'Section deleted successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  remove(@Param('id') id: string) {
    return this.landingSectionsService.remove(+id);
  }
}
