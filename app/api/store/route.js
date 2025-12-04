import { createClient } from '@libsql/client/web';
import { randomBytes } from 'crypto';

export async function POST(request) {
  const body = await request.json();
  const { to, from, msg, img, password = '5201314' } = body;

  if (!to || !from) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  // 產生雙層 key
  const shareKey = randomBytes(5).toString('hex');  // 10 位短網址
  const gameKey = randomBytes(16).toString('hex');  // 32 位真安全 key

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
    syncSchema: false
  });

  try {
    await client.execute({
      sql: `INSERT OR REPLACE INTO games 
            (id, recipient, sender, msg, img, password, gameKey) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [shareKey, to, from, msg || '', img || '', password, gameKey],
    });

    const host = request.headers.get('host') || 'localhost:3000';
    const shortUrl = `https://${host}/${shareKey}`;  // 客戶看到的短網址

    return Response.json({ success: true, url: shortUrl, gameKey });
  } catch (error) {
    console.error('Store error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
