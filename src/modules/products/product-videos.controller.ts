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
import { ProductVideosService } from './product-videos.service';
import { UpdateProductVideoDto } from './dto/update-product-video.dto';
import { ProductVideoResponseDto } from './dto/product-video-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';

@ApiTags('product-videos')
@ApiBearerAuth('JWT-auth')
@Controller('products/:productId/videos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductVideosController {
  constructor(private readonly productVideosService: ProductVideosService) {}

  @Post()
  @ApiOperation({ summary: 'Upload product videos', description: 'Upload one or more videos for a product (Admin only)' })
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
  @ApiResponse({ status: 201, description: 'Videos uploaded successfully', type: [ProductVideoResponseDto] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  uploadVideos(
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productVideosService.uploadVideos(productId, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product videos', description: 'Get all videos for a product (Admin only)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'List of product videos', type: [ProductVideoResponseDto] })
  findAll(@Param('productId', ParseIntPipe) productId: number) {
    return this.productVideosService.findAll(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product video by ID', description: 'Get a specific product video (Admin only)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Video ID' })
  @ApiResponse({ status: 200, description: 'Video found', type: ProductVideoResponseDto })
  @ApiResponse({ status: 404, description: 'Video not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productVideosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product video', description: 'Update product video metadata (Admin only)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Video ID' })
  @ApiResponse({ status: 200, description: 'Video updated successfully', type: ProductVideoResponseDto })
  @ApiResponse({ status: 404, description: 'Video not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProductVideoDto) {
    return this.productVideosService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product video', description: 'Delete a product video from S3 and database (Admin only)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Product ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Video ID' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productVideosService.remove(id);
  }
}
