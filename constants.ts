
import { Employee, ServiceConfig } from './types';

export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: '1', name: '员工 01' },
  { id: '2', name: '员工 02' },
  { id: '3', name: '员工 03' },
  { id: '4', name: '员工 04' },
  { id: '5', name: '员工 05' },
  { id: '6', name: '员工 06' },
];

export const DEFAULT_SERVICES: ServiceConfig[] = [
  { id: 's1', label: '128项目', amount: 128, commissionType: 'percentage', commissionValue: 0.2 },
  { id: 's2', label: '48项目', amount: 48, commissionType: 'fixed', commissionValue: 5 },
  { id: 's3', label: '项目 3', amount: 158, commissionType: 'percentage', commissionValue: 0.2 },
  { id: 's4', label: '项目 4', amount: 198, commissionType: 'percentage', commissionValue: 0.2 },
  { id: 's5', label: '项目 5', amount: 98, commissionType: 'percentage', commissionValue: 0.2 },
];

export const STORAGE_KEY = 'massage_business_data_v2_1';
export const SETTINGS_KEY = 'massage_settings_v2_1';
