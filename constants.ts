import { Employee, ServiceConfig } from './types';

export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: '1', name: '员工 01' }, { id: '2', name: '员工 02' },
  { id: '3', name: '员工 03' }, { id: '4', name: '员工 04' },
  { id: '5', name: '员工 05' }, { id: '6', name: '员工 06' },
];

export const DEFAULT_SERVICES: ServiceConfig[] = [
  { id: 's1', label: '128项目', amount: 128, commissionType: 'percentage', commissionValue: 0.2 },
  { id: 's2', label: '48项目', amount: 48, commissionType: 'fixed', commissionValue: 5 },
];

export const STORAGE_KEY = 'jilu_data_v1';
export const SETTINGS_KEY = 'jilu_settings_v1';