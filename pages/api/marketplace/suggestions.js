import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { query } = req.query;

  if (!query) return res.status(200).json({ suggestions: [] });

  try {
    const cleanQuery = query.replace('@', '').trim();

    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, owner_id, name, subdomain')
      .ilike('subdomain', `${cleanQuery}%`) // Match the subdomain
      .limit(5);

    if (error) throw error;

    const suggestions = stores.map(store => ({
      id: store.owner_id,
      full_name: store.name,
      slug: store.subdomain 
    }));

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}