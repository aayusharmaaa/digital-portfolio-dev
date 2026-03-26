import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFallbackContext, embedText } from '@/lib/rag';

// This route seeds your Supabase vector store with your portfolio data.
// Hit POST /api/embed once after setting up Supabase to populate the DB.

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // Protect with secret
  const { secret } = await req.json();
  if (secret !== process.env.EMBED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(url, key);
  const content = getFallbackContext();
  
  // Chunk the content into sections
  const chunks = content
    .split('\n## ')
    .filter(Boolean)
    .map(c => c.trim());

  const results = [];
  for (const chunk of chunks) {
    const embedding = await embedText(chunk);
    const { error } = await supabase.from('documents').insert({
      content: chunk,
      embedding,
    });
    results.push({ chunk: chunk.slice(0, 50), error: error?.message });
  }

  return NextResponse.json({ seeded: results.length, results });
}
