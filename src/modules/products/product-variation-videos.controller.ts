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
import { ProductVariationVideosService } from './product-variation-videos.service';
import { UpdateProductVideoDto } from './dto/update-product-video.dto';
import { ProductVideoResponseDto } from './dto/product-video-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';

@ApiTags('product-variation-videos')
@ApiBearerAuth('JWT-auth')
@Controller('product-variations/:variationId/videos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductVariationVideosController {
  constructor(private readonly variationVideosService: ProductVariationVideosService) {}

  @Post()
  @ApiOperation({ summary: 'Upload product variation videos', description: 'Upload one or more videos for a product variation (Admin only)' })
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
  @ApiResponse({ status: 201, description: 'Videos uploaded successfully', type: [ProductVideoResponseDto] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product variation not found' })
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  uploadVideos(
    @Param('variationId', ParseIntPipe) variationId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.variationVideosService.uploadVideos(variationId, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product variation videos', description: 'Get all videos for a product variation (Admin only)' })
  @ApiParam({ name: 'variationId', type: 'number', description: 'Product Variation ID' })
  @ApiResponse({ status: 200, description: 'List of product variation videos', type: [ProductVideoResponseDto] })
  findAll(@Param('variationId', ParseIntPipe) variationId: number) {
    return this.variationVideosService.findAll(variationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product variation video by ID', description: 'Get a specific product variation video (Admin only)' })
  @ApiParam({ name: 'variationId', type: 'number', description: 'Product Variation ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Video ID' })
  @ApiResponse({ status: 200, description: 'Video found', type: ProductVideoResponseDto })
  @ApiResponse({ status: 404, description: 'Video not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.variationVideosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product variation video', description: 'Update product variation video metadata (Admin only)' })
  @ApiParam({ name: 'variationId', type: 'number', description: 'Product Variation ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Video ID' })
  @ApiResponse({ status: 200, description: 'Video updated successfully', type: ProductVideoResponseDto })
  @ApiResponse({ status: 404, description: 'Video not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProductVideoDto) {
    return this.variationVideosService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product variation video', description: 'Delete a product variation video from S3 and database (Admin only)' })
  @ApiParam({ name: 'variationId', type: 'number', description: 'Product Variation ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Video ID' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.variationVideosService.remove(id);
  }
}
