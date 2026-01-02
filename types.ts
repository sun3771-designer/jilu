export enum PaymentMethod { ONLINE = 'ONLINE', CASH = 'CASH' }
export interface Employee { id: string; name: string; }
export interface ServiceConfig { 
  id: string; 
  label: string; 
  amount: number; 
  commissionType: 'percentage' | 'fixed'; 
  commissionValue: number; 
}
export interface Transaction {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  commission: number;
  paymentMethod: PaymentMethod;
  serviceLabel: string;
}
export interface MonthlySummary {
  employeeId: string;
  employeeName: string;
  totalOnline: number;
  totalCash: number;
  totalAmount: number;
  totalCommission: number;
}