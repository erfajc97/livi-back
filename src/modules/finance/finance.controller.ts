import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';

@ApiTags('finance')
@ApiBearerAuth('JWT-auth')
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ── Stats ─────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get finance dashboard stats' })
  getStats(@Query('month') month?: string) {
    return this.financeService.getStats(month);
  }

  // ── Transactions ──────────────────────────────────────

  @Get('transactions')
  @ApiOperation({ summary: 'List all transactions' })
  findAllTransactions() {
    return this.financeService.findAllTransactions();
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create a transaction' })
  createTransaction(@Body() dto: CreateTransactionDto) {
    return this.financeService.createTransaction(dto);
  }

  @Patch('transactions/:id')
  @ApiOperation({ summary: 'Update a transaction' })
  updateTransaction(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.financeService.updateTransaction(+id, dto);
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Delete a transaction' })
  removeTransaction(@Param('id') id: string) {
    return this.financeService.removeTransaction(+id);
  }

  // ── Bills ─────────────────────────────────────────────

  @Get('bills')
  @ApiOperation({ summary: 'List all bills' })
  findAllBills() {
    return this.financeService.findAllBills();
  }

  @Post('bills')
  @ApiOperation({ summary: 'Create a bill' })
  createBill(@Body() dto: CreateBillDto) {
    return this.financeService.createBill(dto);
  }

  @Patch('bills/:id')
  @ApiOperation({ summary: 'Update a bill' })
  updateBill(@Param('id') id: string, @Body() dto: UpdateBillDto) {
    return this.financeService.updateBill(+id, dto);
  }

  @Delete('bills/:id')
  @ApiOperation({ summary: 'Delete a bill' })
  removeBill(@Param('id') id: string) {
    return this.financeService.removeBill(+id);
  }
}
