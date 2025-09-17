// pages/api/banks/index.js
export default async function handler(req, res) {
  console.log('pages API /api/banks called', req.method);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    console.error('PAYSTACK_SECRET_KEY not set');
    return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY not set' });
  }

  try {
    const r = await fetch('https://api.paystack.co/bank?currency=NGN', {
      headers: { Authorization: `Bearer ${key}` },
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (!r.ok) {
      console.error('Paystack returned non ok', r.status, data);
      return res.status(r.status).json({ error: 'Paystack error', details: data });
    }

    console.log('Paystack banks fetched, count =', Array.isArray(data.data) ? data.data.length : 'unknown');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Server error fetching banks', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
