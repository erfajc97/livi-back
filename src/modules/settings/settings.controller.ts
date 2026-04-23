import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'List of all settings' })
  findAll() {
    return this.settingsService.getAll();
  }

  @Get(':key')
  @Public()
  @ApiOperation({ summary: 'Get a single setting by key' })
  @ApiResponse({ status: 200, description: 'Setting value' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async findOne(@Param('key') key: string) {
    const value = await this.settingsService.get(key);
    if (value === null) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }
    return { key, value };
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create or update a setting (admin only)' })
  @ApiResponse({ status: 200, description: 'Setting updated' })
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.set(key, dto.value, dto.description);
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a setting (admin only)' })
  @ApiResponse({ status: 200, description: 'Setting deleted' })
  async remove(@Param('key') key: string) {
    await this.settingsService.delete(key);
    return { message: `Setting "${key}" deleted` };
  }
}
