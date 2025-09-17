// lib/emailTemplates.js
export const EMAIL_TEMPLATES = {
  signup: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_SIGNUP,
  login: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_LOGIN,
  orderBuyer: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ORDER_BUYER,
  orderSeller: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ORDER_SELLER,
  withdrawal: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_WITHDRAWAL,
  capitalRequest: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_CAPITAL,
};
