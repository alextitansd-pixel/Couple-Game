import { createClient } from '@libsql/client/web';
import { randomBytes } from 'crypto';

export const POST = async (req) => {
  const { to, from, msg = '', img = '', password = '5201314' } = await req.json();
  if (!to || !from) return Response.json({ error: 'missing' }, { status: 400 });

  const shareKey = randomBytes(5).toString('hex');
  const gameKey  = randomBytes(16).toString('hex');

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
    syncSchema: false
  });

  await client.execute({
    sql: `INSERT OR REPLACE INTO games (id, recipient, sender, msg, img, password, gameKey)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [shareKey, to, from, msg, img, password, gameKey]
  });

  const url = `https://${req.headers.get('host')}/unity/?share=${shareKey}`;
  return Response.json({ success: true, url });
};
