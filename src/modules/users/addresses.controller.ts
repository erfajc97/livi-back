import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UserAddress } from './entities/user-address.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constants/roles.enum';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users/me/addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT, Role.ADMIN)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({
    summary: 'List my addresses',
    description: 'Retrieve the saved delivery addresses of the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'List of addresses', type: [UserAddress] })
  findAll(@CurrentUser() user: User) {
    return this.addressesService.findAll(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create address',
    description:
      'Save a new delivery address. The first address is always set as default; passing isDefault=true unmarks the others.',
  })
  @ApiResponse({ status: 201, description: 'Address created', type: UserAddress })
  create(@CurrentUser() user: User, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(user.id, createAddressDto);
  }

  @Patch(':id/default')
  @ApiOperation({
    summary: 'Set default address',
    description: 'Mark an address as the default one (unmarks the others)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Default address updated', type: UserAddress })
  @ApiResponse({ status: 404, description: 'Address not found' })
  setDefault(@CurrentUser() user: User, @Param('id') id: string) {
    return this.addressesService.setDefault(user.id, +id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update address',
    description: 'Edit one of the authenticated user addresses',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address updated', type: UserAddress })
  @ApiResponse({ status: 404, description: 'Address not found' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.id, +id, updateAddressDto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Delete address',
    description: 'Delete one of the authenticated user addresses',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.addressesService.remove(user.id, +id);
  }
}
