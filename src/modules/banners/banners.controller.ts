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
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

@ApiTags('banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create banner', description: 'Create a new banner with optional image upload' })
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  create(
    @Body() createBannerDto: CreateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bannersService.create(createBannerDto, file);
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
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update banner' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Banner updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bannersService.update(+id, updateBannerDto, file);
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
