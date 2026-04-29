import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Bill } from './entities/bill.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Bill)
    private billsRepository: Repository<Bill>,
    private dataSource: DataSource,
  ) {}

  // ── Transactions ──────────────────────────────────────

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionsRepository.create(dto);
    return this.transactionsRepository.save(transaction);
  }

  async findAllTransactions(): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findTransactionById(id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({ where: { id } });
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  async updateTransaction(id: number, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findTransactionById(id);
    Object.assign(transaction, dto);
    return this.transactionsRepository.save(transaction);
  }

  async removeTransaction(id: number): Promise<void> {
    const transaction = await this.findTransactionById(id);
    await this.transactionsRepository.remove(transaction);
  }

  // ── Bills ─────────────────────────────────────────────

  async createBill(dto: CreateBillDto): Promise<Bill> {
    const bill = this.billsRepository.create(dto);
    return this.billsRepository.save(bill);
  }

  async findAllBills(): Promise<Bill[]> {
    return this.billsRepository.find({
      order: { dueDate: 'ASC' },
    });
  }

  async updateBill(id: number, dto: UpdateBillDto): Promise<Bill> {
    const bill = await this.billsRepository.findOne({ where: { id } });
    if (!bill) throw new NotFoundException(`Bill ${id} not found`);

    // REQ-A11: When marking bill as paid, auto-create expense in transactions
    if (dto.status === 'paid' && bill.status !== 'paid') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const expense = this.transactionsRepository.create({
        type: 'expense' as const,
        category: 'Cuenta por Pagar',
        amount: Number(bill.amount),
        date: today,
        paymentMethod: dto.paymentMethod || bill.paymentMethod || 'Transferencia',
        status: 'Pagado',
        description: bill.name,
        notes: `Pago de cuenta: ${bill.name}${bill.description ? ` — ${bill.description}` : ''}`,
        accountName: bill.bank || undefined,
      });
      await this.transactionsRepository.save(expense);

      bill.paidAt = now;
    }

    Object.assign(bill, dto);
    return this.billsRepository.save(bill);
  }

  async removeBill(id: number): Promise<void> {
    const bill = await this.billsRepository.findOne({ where: { id } });
    if (!bill) throw new NotFoundException(`Bill ${id} not found`);
    await this.billsRepository.remove(bill);
  }

  // ── Stats (REQ-A12) ──────────────────────────────────

  async getStats(month?: string) {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    if (month) {
      startDate = `${month}-01`;
      const [y, m] = month.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      endDate = `${month}-${lastDay}`;
    } else {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      startDate = `${y}-${m}-01`;
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      endDate = `${y}-${m}-${lastDay}`;
    }

    // Finance transactions (manual income/expenses)
    const transactions = await this.transactionsRepository.find({
      where: { date: Between(startDate, endDate) },
      order: { date: 'DESC' },
    });

    // REQ-A12: Online + manual sales as income (from orders)
    const orderRepo = this.dataSource.getRepository(Order);
    const paidOrders = await orderRepo
      .createQueryBuilder('order')
      .where('order.createdAt >= :start AND order.createdAt <= :endFull', {
        start: `${startDate}T00:00:00`,
        endFull: `${endDate}T23:59:59`,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['order_received', 'order_accepted', 'order_shipped', 'order_delivered'],
      })
      .getMany();

    const salesIncome = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const onlineSalesCount = paidOrders.filter(o => !o.notes?.includes('[Venta manual]')).length;
    const manualSalesCount = paidOrders.filter(o => o.notes?.includes('[Venta manual]')).length;
    const onlineSalesTotal = paidOrders
      .filter(o => !o.notes?.includes('[Venta manual]'))
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const manualSalesTotal = paidOrders
      .filter(o => o.notes?.includes('[Venta manual]'))
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Manual income transactions (registered in finance module directly)
    const manualIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIncome = salesIncome + manualIncome;

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const grossProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;

    // Expenses by category (REQ-A10: for pie chart)
    const expensesByCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount);
      });

    // Cash flow: group by date (include sales)
    const cashFlowMap: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      if (!cashFlowMap[t.date]) cashFlowMap[t.date] = { income: 0, expense: 0 };
      if (t.type === 'income') cashFlowMap[t.date].income += Number(t.amount);
      else cashFlowMap[t.date].expense += Number(t.amount);
    });
    paidOrders.forEach((o) => {
      const date = new Date(o.createdAt).toISOString().split('T')[0];
      if (!cashFlowMap[date]) cashFlowMap[date] = { income: 0, expense: 0 };
      cashFlowMap[date].income += Number(o.total || 0);
    });
    const cashFlow = Object.entries(cashFlowMap)
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Bills
    const allBills = await this.billsRepository.find({ order: { dueDate: 'ASC' } });
    const today = now.toISOString().split('T')[0];
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const pendingBills = allBills.filter((b) => b.status !== 'paid');
    const overdueBills = pendingBills.filter((b) => b.dueDate < today);
    const upcomingBills = pendingBills.filter(
      (b) => b.dueDate >= today && b.dueDate <= in7days,
    );
    const pendingTotal = pendingBills.reduce((s, b) => s + Number(b.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      grossProfit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      // Income breakdown
      salesIncome,
      onlineSalesCount,
      onlineSalesTotal,
      manualSalesCount,
      manualSalesTotal,
      manualIncome,
      // Expense breakdown
      expensesByCategory,
      // Cash flow
      cashFlow,
      // Bills
      bills: {
        all: allBills,
        pending: pendingBills,
        overdue: overdueBills,
        upcoming: upcomingBills,
        pendingTotal,
        overdueCount: overdueBills.length,
        upcomingCount: upcomingBills.length,
        pendingCount: pendingBills.length,
      },
      // Raw data
      transactions,
    };
  }
}
