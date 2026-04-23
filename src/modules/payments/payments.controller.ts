import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constants/roles.enum';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-transaction')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({
    summary: 'Create order and payment',
    description:
      'Creates an order and, if paymentMethod is PAYPHONE, returns the PayPhone redirect URL. For TRANSFERENCIA, returns the order directly.',
  })
  @ApiResponse({ status: 201, description: 'Order created, payment URL returned if PayPhone' })
  async createTransaction(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.createOrderAndPayment(dto, user);
  }

  @Get('verify')
  @Public()
  @ApiOperation({
    summary: 'Verify PayPhone payment (redirect callback)',
    description:
      'Called when PayPhone redirects back after payment. Confirms the transaction and updates order status.',
  })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  async verifyPayment(
    @Query('id') paymentId: string,
    @Query('clientTransactionId') clientTransactionId: string,
  ) {
    if (!paymentId || !clientTransactionId) {
      throw new BadRequestException('Missing id or clientTransactionId');
    }
    return this.paymentsService.verifyAndConfirmPayment(
      paymentId,
      clientTransactionId,
    );
  }

  @Post(':orderId/upload-receipt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.CLIENT, Role.ADMIN)
  @UseInterceptors(FileInterceptor('receipt'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload transfer receipt for an order' })
  async uploadReceipt(
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.paymentsService.uploadTransferReceipt(+orderId, file, user);
  }
}
