import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CombosService } from './combos.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('combos')
@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new combo' })
  @ApiResponse({ status: 201, description: 'Combo created successfully' })
  create(
    @Body() createComboDto: CreateComboDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.combosService.create(createComboDto, file);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all combos (admin)' })
  findAll() {
    return this.combosService.findAll();
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get active combos (public)' })
  findActive() {
    return this.combosService.findActive();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get combo by ID' })
  findOne(@Param('id') id: string) {
    return this.combosService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a combo' })
  update(
    @Param('id') id: string,
    @Body() updateComboDto: UpdateComboDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.combosService.update(+id, updateComboDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a combo' })
  remove(@Param('id') id: string) {
    return this.combosService.remove(+id);
  }
}
