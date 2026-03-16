import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProductVariationImagesService } from './product-variation-images.service';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImageResponseDto } from './dto/product-image-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';

@ApiTags('product-variation-images')
@ApiBearerAuth('JWT-auth')
@Controller('product-variations/:variationId/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductVariationImagesController {
  constructor(private readonly variationImagesService: ProductVariationImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Upload product variation images', description: 'Upload one or more images for a product variation (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiParam({ name: 'variationId', type: 'number', description: 'Product Variation ID' })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully', type: [ProductImageResponseDto] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product variation not found' })
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  uploadImages(
    @Param('variationId', ParseIntPipe) variationId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.variationImagesService.uploadImages(variationId, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product variation images', description: 'Get all images for a product variation (Admin only)' })
  @ApiParam({ name: 'variationId', type: 'number', description: 'Product Variation ID' })
  @ApiResponse({ status: 200, description: 'List of product variation images', type: [ProductImageResponseDto] })
  findAll(@Param('variationId', ParseIntPipe) variationId: number) {
    return this.variationImagesService.findAll(variationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product variation image by ID', description: 'Get a specific product variation image (Admin only)' })
  @ApiParam({ name: 'variationId', type: 'number', description: 'Product Variation ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image found', type: ProductImageResponseDto })
  @ApiResponse({ status: 404, description: 'Image not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.variationImagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product variation image', description: 'Update product variation image metadata (Admin only)' })
  @ApiParam({ name: 'variationId', type: 'number', description: 'Product Variation ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image updated successfully', type: ProductImageResponseDto })
  @ApiResponse({ status: 404, description: 'Image not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProductImageDto) {
    return this.variationImagesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product variation image', description: 'Delete a product variation image from S3 and database (Admin only)' })
  @ApiParam({ name: 'variationId', type: 'number', description: 'Product Variation ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.variationImagesService.remove(id);
  }
}
