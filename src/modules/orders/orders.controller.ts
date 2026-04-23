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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateManualOrderDto } from './dto/create-manual-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constants/roles.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Create order', description: 'Create a new order (clients can create orders)' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request (invalid items, insufficient stock, etc.)' })
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: User) {
    return this.ordersService.create(createOrderDto, user.id);
  }

  @Post('manual')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create manual order (admin)',
    description: 'Admin creates an order on behalf of a client with optional discount',
  })
  @ApiResponse({ status: 201, description: 'Manual order created', type: OrderResponseDto })
  createManual(@Body() dto: CreateManualOrderDto) {
    return this.ordersService.createManualOrder(dto);
  }

  @Post('from-cart')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ 
    summary: 'Create order from cart', 
    description: 'Create a new order from the current user\'s cart. Cart will be cleared after order creation.' 
  })
  @ApiResponse({ status: 201, description: 'Order created successfully from cart', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request (cart is empty, insufficient stock, etc.)' })
  createFromCart(@Body() createOrderDto: Partial<CreateOrderDto>, @CurrentUser() user: User) {
    return this.ordersService.createFromCart(createOrderDto, user.id);
  }

  @Get()
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ 
    summary: 'Get all orders', 
    description: 'Get all orders (clients see only their own, admins see all)' 
  })
  @ApiResponse({ status: 200, description: 'List of orders', type: [OrderResponseDto] })
  findAll(@CurrentUser() user: User) {
    return this.ordersService.findAll(user.id, user.role);
  }

  @Get(':id')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ 
    summary: 'Get order by ID', 
    description: 'Get a specific order (clients can only access their own orders)' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Forbidden (client trying to access another user\'s order)' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.findOne(+id, user.id, user.role);
  }

  @Patch(':id')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ 
    summary: 'Update order', 
    description: 'Update order (clients can only cancel their own orders, admins can update any order)' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.update(+id, updateOrderDto, user.id, user.role, `${user.firstName} ${user.lastName}`);
  }

  @Get(':id/history')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Get order status history' })
  @ApiParam({ name: 'id', type: 'number' })
  getHistory(@Param('id') id: string) {
    return this.ordersService.getStatusHistory(+id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete order', description: 'Delete an order (admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Forbidden (only admins can delete orders)' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.remove(+id, user.id, user.role);
  }
}