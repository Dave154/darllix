export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { buyerEmail, sellerEmail, orderDetails } = req.body;

  try {
    // Replace with your real email sending logic
    console.log("📩 Sending email to:", buyerEmail, sellerEmail);
    console.log("🛒 Order Details:", orderDetails);

    // Example: You could use nodemailer here
    // await transporter.sendMail(...)

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to send emails" });
  }
}
