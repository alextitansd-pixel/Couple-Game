import { createClient } from '@libsql/client/web';

export const GET = async (req) => {
  const shareKey = new URL(req.url).searchParams.get('key');
  if (!shareKey) return Response.json({ error: 'no key' }, { status: 400 });

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
    syncSchema: false
  });

  const res = await client.execute({
    sql: 'SELECT * FROM games WHERE id = ?',
    args: [shareKey]
  });

  if (res.rows.length === 0) return Response.json({ error: 'not found' }, { status: 404 });

  const d = res.rows[0];
  return Response.json({
    data: {
      to: d.recipient,
      from: d.sender,
      msg: d.msg,
      img: d.img,
      password: d.password,
      gameKey: d.gameKey
    }
  });
};
