import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Bill } from './entities/bill.entity';
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
    Object.assign(bill, dto);
    return this.billsRepository.save(bill);
  }

  async removeBill(id: number): Promise<void> {
    const bill = await this.billsRepository.findOne({ where: { id } });
    if (!bill) throw new NotFoundException(`Bill ${id} not found`);
    await this.billsRepository.remove(bill);
  }

  // ── Stats ─────────────────────────────────────────────

  async getStats(month?: string) {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    if (month) {
      // month format: "2026-02"
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

    const transactions = await this.transactionsRepository.find({
      where: { date: Between(startDate, endDate) },
      order: { date: 'DESC' },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const grossProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;

    // Expenses by category
    const expensesByCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount);
      });

    // Cash flow: group by date
    const cashFlowMap: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      if (!cashFlowMap[t.date]) cashFlowMap[t.date] = { income: 0, expense: 0 };
      if (t.type === 'income') cashFlowMap[t.date].income += Number(t.amount);
      else cashFlowMap[t.date].expense += Number(t.amount);
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
    const expensesMonth = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      grossProfit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      expensesByCategory,
      cashFlow,
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
      expensesMonth,
      transactions,
    };
  }
}
