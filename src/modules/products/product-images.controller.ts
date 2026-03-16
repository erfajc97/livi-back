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
import { ProductImagesService } from './product-images.service';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImageResponseDto } from './dto/product-image-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';

@ApiTags('product-images')
@ApiBearerAuth('JWT-auth')
@Controller('products/:productId/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Upload product images', description: 'Upload one or more images for a product (Admin only)' })
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
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully', type: [ProductImageResponseDto] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  uploadImages(
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productImagesService.uploadImages(productId, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product images', description: 'Get all images for a product (Admin only)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'List of product images', type: [ProductImageResponseDto] })
  findAll(@Param('productId', ParseIntPipe) productId: number) {
    return this.productImagesService.findAll(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product image by ID', description: 'Get a specific product image (Admin only)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image found', type: ProductImageResponseDto })
  @ApiResponse({ status: 404, description: 'Image not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productImagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product image', description: 'Update product image metadata (Admin only)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image updated successfully', type: ProductImageResponseDto })
  @ApiResponse({ status: 404, description: 'Image not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProductImageDto) {
    return this.productImagesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product image', description: 'Delete a product image from S3 and database (Admin only)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productImagesService.remove(id);
  }
}
