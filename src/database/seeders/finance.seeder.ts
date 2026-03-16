import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Transaction } from '../../modules/finance/entities/transaction.entity';
import { Bill } from '../../modules/finance/entities/bill.entity';

export class FinanceSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const txRepo = dataSource.getRepository(Transaction);
    const billRepo = dataSource.getRepository(Bill);

    const existingTx = await txRepo.find();
    if (existingTx.length > 0) {
      console.log(`  - Found ${existingTx.length} existing transactions, skipping seeder`);
      return;
    }

    // ── Transactions ────────────────────────────────────
    const transactions: Array<Partial<Transaction>> = [
      { type: 'income', category: 'Venta Online', amount: 56, date: '2026-02-26', paymentMethod: 'Payphone', status: 'Pagado', description: 'Pago' },
      { type: 'income', category: 'Venta Online', amount: 475, date: '2026-02-22', paymentMethod: 'Transferencia', status: 'Pagado' },
      { type: 'expense', category: 'Marketing', amount: 200, date: '2026-02-21', paymentMethod: 'Transferencia', status: 'Pagado', description: 'Diseño gráfico' },
      { type: 'income', category: 'Venta Online', amount: 310, date: '2026-02-20', paymentMethod: 'Payphone', status: 'Pagado' },
      { type: 'income', category: 'Venta Directa', amount: 200, date: '2026-02-18', paymentMethod: 'Efectivo', status: 'Pagado' },
      { type: 'expense', category: 'Proveedor', amount: 800, date: '2026-02-17', paymentMethod: 'T. Crédito', status: 'Pagado', description: 'Frascos y atomizadores' },
      { type: 'income', category: 'Venta Online', amount: 520, date: '2026-02-15', paymentMethod: 'Transferencia', status: 'Pagado' },
      { type: 'expense', category: 'Envíos', amount: 92, date: '2026-02-14', paymentMethod: 'Efectivo', status: 'Pagado', description: 'Envíos semana 2' },
      { type: 'income', category: 'Venta Online', amount: 380, date: '2026-02-12', paymentMethod: 'Payphone', status: 'Pagado' },
      { type: 'expense', category: 'Otros', amount: 45, date: '2026-02-11', paymentMethod: 'Efectivo', status: 'Pagado', description: 'Material empaque' },
      { type: 'income', category: 'Venta Directa', amount: 95, date: '2026-02-10', paymentMethod: 'Efectivo', status: 'Pagado' },
      { type: 'income', category: 'Venta Online', amount: 630, date: '2026-02-08', paymentMethod: 'Transferencia', status: 'Pagado' },
      { type: 'expense', category: 'Proveedor', amount: 1200, date: '2026-02-06', paymentMethod: 'Transferencia', status: 'Pagado', description: 'Esencias importadas' },
      { type: 'income', category: 'Venta Directa', amount: 150, date: '2026-02-05', paymentMethod: 'Efectivo', status: 'Pagado' },
      { type: 'expense', category: 'Marketing', amount: 135, date: '2026-02-03', paymentMethod: 'T. Crédito', status: 'Pagado', description: 'Ads Instagram' },
      { type: 'income', category: 'Venta Online', amount: 290, date: '2026-02-02', paymentMethod: 'Payphone', status: 'Pagado' },
      { type: 'expense', category: 'Envíos', amount: 68, date: '2026-02-01', paymentMethod: 'Efectivo', status: 'Pagado', description: 'Envíos semana 1' },
      // March transactions
      { type: 'income', category: 'Venta Online', amount: 340, date: '2026-03-01', paymentMethod: 'Transferencia', status: 'Pagado' },
      { type: 'expense', category: 'Proveedor', amount: 450, date: '2026-03-02', paymentMethod: 'Transferencia', status: 'Pagado', description: 'Frascos 10ml' },
      { type: 'income', category: 'Venta Directa', amount: 180, date: '2026-03-04', paymentMethod: 'Efectivo', status: 'Pagado' },
      { type: 'income', category: 'Venta Online', amount: 520, date: '2026-03-06', paymentMethod: 'Payphone', status: 'Pagado' },
      { type: 'expense', category: 'Marketing', amount: 180, date: '2026-03-07', paymentMethod: 'T. Crédito', status: 'Pagado', description: 'Ads Facebook' },
      { type: 'income', category: 'Venta Online', amount: 410, date: '2026-03-10', paymentMethod: 'Transferencia', status: 'Pagado' },
      { type: 'expense', category: 'Envíos', amount: 75, date: '2026-03-11', paymentMethod: 'Efectivo', status: 'Pagado', description: 'Envíos semana 2' },
      { type: 'income', category: 'Venta Directa', amount: 260, date: '2026-03-13', paymentMethod: 'Efectivo', status: 'Pagado' },
    ];

    for (const txData of transactions) {
      const tx = txRepo.create(txData);
      await txRepo.save(tx);
    }

    // ── Bills (Cuentas por Pagar) ───────────────────────
    const bills: Array<Partial<Bill>> = [
      { name: 'Ads Facebook vencido', bank: 'Banco Pichincha', dueDate: '2026-02-15', amount: 180, status: 'overdue' },
      { name: 'TC Mastercard - Envases', bank: 'Banco Guayaquil', dueDate: '2026-02-24', amount: 420, status: 'overdue' },
      { name: 'TC Visa - Fragancias', bank: 'Banco Pichincha', dueDate: '2026-02-28', amount: 650, status: 'pending' },
      { name: 'Pago Servientrega', bank: 'Banco Guayaquil', dueDate: '2026-03-20', amount: 95, status: 'pending' },
      { name: 'Renovación dominio web', bank: 'Banco Pichincha', dueDate: '2026-03-25', amount: 35, status: 'pending' },
    ];

    for (const billData of bills) {
      const bill = billRepo.create(billData);
      await billRepo.save(bill);
    }

    console.log('✓ Finance seeded');
    console.log(`  - Created ${transactions.length} transactions`);
    console.log(`  - Created ${bills.length} bills`);
  }
}
