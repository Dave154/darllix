export default async function handler(req, res) {

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    console.error('PAYSTACK_SECRET_KEY not set');
    return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not set' });
  }

  const { account_number, bank_code } = req.query;

  if (!account_number || !bank_code) {
    return res.status(400).json({ error: 'Missing account_number or bank_code' });
  }

  try {
    const url = `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`;
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    const text = await r.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    if (!r.ok || !data.status) {
      const statusCode = data.message?.toLowerCase().includes('could not resolve account') ? 400 : r.status;
      console.error('Paystack error:', data.message || 'Unknown error');
      return res.status(statusCode).json({
      error: 'Validation error',
      message: data.message || 'Could not validate account details',
      details: data
      });
    }

    console.log('Paystack account resolved:', data.data?.account_name || 'unknown');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Server error resolving account', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}