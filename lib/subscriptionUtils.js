import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from './subscriptionConfig';

/**
 * Check if a subscription is currently active
 * @param {Object} subscription - Subscription record from DB
 * @returns {Boolean}
 */
export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  
  const now = new Date();
  const endDate = new Date(subscription.end_date);
  
  return subscription.status === SUBSCRIPTION_STATUS.ACTIVE && endDate > now;
};

/**
 * Get days remaining in a subscription
 * @param {Object} subscription - Subscription record from DB
 * @returns {Number} Days remaining, or 0 if expired
 */
export const getSubscriptionDaysRemaining = (subscription) => {
  if (!subscription) return 0;
  
  const now = new Date();
  const endDate = new Date(subscription.end_date);
  
  if (endDate <= now) return 0;
  
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Calculate subscription end date based on plan type
 * @param {String} planType - 'one_month', 'three_months', 'one_year'
 * @param {Date} startDate - Start date (default: now)
 * @returns {Date} End date
 */
export const calcSubscriptionEndDate = (planType, startDate = new Date()) => {
  const plan = SUBSCRIPTION_PLANS[planType];
  
  if (!plan) {
    throw new Error(`Invalid plan type: ${planType}`);
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.duration_days);
  
  return endDate;
};

/**
 * Get subscription status with details
 * @param {Object} subscription - Subscription record from DB
 * @returns {Object} Status details { isActive, daysRemaining, expiresAt, message }
 */
export const getSubscriptionStatus = (subscription) => {
  const isActive = isSubscriptionActive(subscription);
  const daysRemaining = getSubscriptionDaysRemaining(subscription);
  const expiresAt = subscription?.end_date ? new Date(subscription.end_date) : null;
  
  let message = '';
  if (!subscription) {
    message = 'No active subscription';
  } else if (isActive) {
    if (daysRemaining <= 7) {
      message = `Expiring in ${daysRemaining} days`;
    } else {
      message = `Active - ${daysRemaining} days remaining`;
    }
  } else {
    message = 'Subscription expired';
  }
  
  return {
    isActive,
    daysRemaining,
    expiresAt,
    message,
    status: subscription?.status || SUBSCRIPTION_STATUS.EXPIRED
  };
};

/**
 * Check if subscription is expiring soon (within 7 days)
 * @param {Object} subscription - Subscription record from DB
 * @returns {Boolean}
 */
export const isSubscriptionExpiringSoon = (subscription) => {
  if (!subscription) return false;
  
  const daysRemaining = getSubscriptionDaysRemaining(subscription);
  return daysRemaining > 0 && daysRemaining <= 7;
};

/**
 * Format subscription info for display
 * @param {Object} subscription - Subscription record from DB
 * @returns {Object} Formatted info
 */
export const formatSubscriptionInfo = (subscription) => {
  if (!subscription) {
    return {
      plan: null,
      startDate: null,
      endDate: null,
      daysRemaining: 0,
      status: 'inactive',
      displayText: 'No active subscription'
    };
  }
  
  const plan = SUBSCRIPTION_PLANS[subscription.plan_type];
  const daysRemaining = getSubscriptionDaysRemaining(subscription);
  const isActive = isSubscriptionActive(subscription);
  
  return {
    plan: plan?.name || subscription.plan_type,
    startDate: new Date(subscription.start_date),
    endDate: new Date(subscription.end_date),
    daysRemaining,
    status: isActive ? 'active' : 'expired',
    displayText: isActive 
      ? `${plan?.name} - ${daysRemaining} days remaining`
      : `Subscription expired`
  };
};

/**
 * Get price display string
 * @param {String} planType - 'one_month', 'three_months', 'one_year'
 * @param {String} currency - 'NGN' or 'USD'
 * @returns {String} Formatted price
 */
export const getPriceDisplay = (planType, currency = 'NGN') => {
  const plan = SUBSCRIPTION_PLANS[planType];
  
  if (!plan) return '';
  
  if (currency === 'NGN') {
    return `₦${plan.price_naira.toLocaleString()}`;
  } else if (currency === 'USD') {
    const usd = Math.round(plan.price_naira / 1550);
    return `$${usd}`;
  }
  
  return '';
};

/**
 * Calculate cost per day
 * @param {String} planType - 'one_month', 'three_months', 'one_year'
 * @returns {Number} Cost per day in Naira
 */
export const getPricePerDay = (planType) => {
  const plan = SUBSCRIPTION_PLANS[planType];
  
  if (!plan) return 0;
  
  return (plan.price_naira / plan.duration_days).toFixed(2);
};

/**
 * Validate subscription data before creating
 * @param {Object} data - Subscription data
 * @returns {Object} { isValid, errors }
 */
export const validateSubscriptionData = (data) => {
  const errors = [];
  
  if (!data.user_id) errors.push('user_id is required');
  if (!data.store_id) errors.push('store_id is required');
  if (!SUBSCRIPTION_PLANS[data.plan_type]) {
    errors.push(`Invalid plan_type: ${data.plan_type}`);
  }
  if (!data.payment_reference) errors.push('payment_reference is required');
  if (!data.amount_paid || data.amount_paid <= 0) {
    errors.push('amount_paid must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format date for display
 * @param {Date|String} date - Date to format
 * @returns {String} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};