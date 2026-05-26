// Subscription pricing plans in Nigerian Naira (Kobo for Paystack)
export const SUBSCRIPTION_PLANS = {
  one_month: {
    name: 'One Month',
    duration_days: 30,
    price_naira: 5000,
    price_kobo: 500000, 
    plan_type: 'one_month',
    description: 'Access for 1 month',
    features: [
      'Unlimited product uploads',
      'Full dashboard access',
      'Marketplace visibility',
      'Customer management',
      'Order management'
    ]
  },
  three_months: {
    name: 'Three Months',
    duration_days: 90,
    price_naira: 12000,
    price_kobo: 1200000,
    plan_type: 'three_months',
    description: 'Access for 3 months',
    features: [
      'Unlimited product uploads',
      'Full dashboard access',
      'Marketplace visibility',
      'Customer management',
      'Order management',
      'Priority support'
    ]
  },
  one_year: {
    name: 'One Year',
    duration_days: 365,
    price_naira: 40000,
    price_kobo: 4000000,
    plan_type: 'one_year',
    description: 'Access for 12 months',
    features: [
      'Unlimited product uploads',
      'Full dashboard access',
      'Marketplace visibility',
      'Customer management',
      'Order management',
      'Priority support',
      '20% discount on featured promotions'
    ]
  }
};

// Get plan by type
export const getPlanByType = (planType) => {
  return SUBSCRIPTION_PLANS[planType] || null;
};

// Get all plans as array (for pricing page display)
export const getAllPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS);
};

// Get plan in USD equivalent (for display purposes)
export const getPlanInUSD = (planType, exchangeRate = 1550) => {
  const plan = getPlanByType(planType);
  if (!plan) return null;
  return {
    ...plan,
    price_usd: Math.round(plan.price_naira / exchangeRate)
  };
};

// Subscription statuses
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PENDING: 'pending'
};

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  VERIFIED: 'verified'
};