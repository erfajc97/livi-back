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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';
import { BannerType } from './entities/banner.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';

/**
 * Dos artes por banner: `image` (escritorio) y `mobileImage` (vertical). Ambos
 * opcionales, así una edición que solo cambia el texto no obliga a re-subir.
 */
const BANNER_IMAGE_FIELDS = FileFieldsInterceptor([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 },
]);

interface BannerUploadedFiles {
  image?: Express.Multer.File[];
  mobileImage?: Express.Multer.File[];
}

@ApiTags('banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @UseInterceptors(BANNER_IMAGE_FIELDS)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create banner',
    description:
      'Create a new banner. `image` es el arte de escritorio y `mobileImage` el vertical ' +
      'para teléfono; si falta el móvil, el front reutiliza el de escritorio.',
  })
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  create(
    @Body() createBannerDto: CreateBannerDto,
    @UploadedFiles() files?: BannerUploadedFiles,
  ) {
    return this.bannersService.create(
      createBannerDto,
      files?.image?.[0],
      files?.mobileImage?.[0],
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all banners (admin)' })
  @ApiResponse({ status: 200, description: 'List of all banners' })
  findAll() {
    return this.bannersService.findAll();
  }

  @Get('visible')
  @Public()
  @ApiOperation({ summary: 'Get visible hero banners (public)' })
  @ApiResponse({ status: 200, description: 'List of visible hero banners' })
  findVisible() {
    return this.bannersService.findVisible();
  }

  @Get('by-type')
  @Public()
  @ApiOperation({ summary: 'Get visible banners by type (public)' })
  @ApiQuery({ name: 'type', enum: BannerType })
  @ApiResponse({ status: 200, description: 'List of visible banners of the given type' })
  findByType(@Query('type') type: BannerType) {
    return this.bannersService.findByType(type);
  }

  @Get('category/:categoryId')
  @Public()
  @ApiOperation({ summary: 'Get banner for a specific category (public)' })
  @ApiParam({ name: 'categoryId', type: 'number' })
  findByCategoryId(@Param('categoryId') categoryId: string) {
    return this.bannersService.findByCategoryId(+categoryId);
  }

  @Get('marca/:marcaId')
  @Public()
  @ApiOperation({ summary: 'Get banner for a specific marca (public)' })
  @ApiParam({ name: 'marcaId', type: 'number' })
  findByMarcaId(@Param('marcaId') marcaId: string) {
    return this.bannersService.findByMarcaId(+marcaId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get banner by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Banner found' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  findOne(@Param('id') id: string) {
    return this.bannersService.findOne(+id);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reorder banners by providing ordered IDs' })
  @ApiResponse({ status: 200, description: 'Banners reordered successfully' })
  reorder(@Body() reorderDto: ReorderBannersDto) {
    return this.bannersService.reorder(reorderDto.orderedIds);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @UseInterceptors(BANNER_IMAGE_FIELDS)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update banner' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Banner updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @UploadedFiles() files?: BannerUploadedFiles,
  ) {
    return this.bannersService.update(
      +id,
      updateBannerDto,
      files?.image?.[0],
      files?.mobileImage?.[0],
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete banner' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Banner deleted successfully' })
  remove(@Param('id') id: string) {
    return this.bannersService.remove(+id);
  }
}
