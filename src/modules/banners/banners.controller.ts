import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
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
  @ApiOperation({ summary: 'Create banner', description: 'Create a new promotional banner' })
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannersService.create(createBannerDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all banners', description: 'Retrieve all banners (admin)' })
  @ApiResponse({ status: 200, description: 'List of all banners' })
  findAll() {
    return this.bannersService.findAll();
  }

  @Get('visible')
  @Public()
  @ApiOperation({ summary: 'Get visible banners', description: 'Retrieve only visible banners (public)' })
  @ApiResponse({ status: 200, description: 'List of visible banners' })
  findVisible() {
    return this.bannersService.findVisible();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get banner by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Banner ID' })
  @ApiResponse({ status: 200, description: 'Banner found' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  findOne(@Param('id') id: string) {
    return this.bannersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update banner' })
  @ApiParam({ name: 'id', type: 'number', description: 'Banner ID' })
  @ApiResponse({ status: 200, description: 'Banner updated successfully' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
    return this.bannersService.update(+id, updateBannerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete banner' })
  @ApiParam({ name: 'id', type: 'number', description: 'Banner ID' })
  @ApiResponse({ status: 200, description: 'Banner deleted successfully' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  remove(@Param('id') id: string) {
    return this.bannersService.remove(+id);
  }
}
