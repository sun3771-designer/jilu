
import { ServiceConfig, Employee } from '../types';

/**
 * Calculates commission based on service configuration and potential employee overrides.
 */
export const calculateCommission = (service: ServiceConfig, employee?: Employee): number => {
  // Check if this specific employee has an override for this specific service
  const override = employee?.commissionOverrides?.[service.id];
  
  const type = override ? override.commissionType : service.commissionType;
  const value = override ? override.commissionValue : service.commissionValue;

  if (type === 'percentage') {
    return service.amount * value;
  } else {
    return value;
  }
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
};
