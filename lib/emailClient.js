// lib/emailClient.js
import emailjs from "emailjs-com";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export async function sendEmail(templateId, variables) {
  try {
    const res = await emailjs.send(
      SERVICE_ID,
      templateId,
      variables,
      PUBLIC_KEY
    );
    return res;
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
}
