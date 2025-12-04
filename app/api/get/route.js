import { createClient } from '@libsql/client/web';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shareKey = searchParams.get('key');

  if (!shareKey) return Response.json({ error: 'No key' }, { status: 400 });

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
    syncSchema: false
  });

  try {
    const result = await client.execute({
      sql: 'SELECT * FROM games WHERE id = ?',
      args: [shareKey],
    });

    if (result.rows.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const data = result.rows[0];
    return Response.json({
      data: {
        to: data.recipient,
        from: data.sender,
        msg: data.msg,
        img: data.img,
        password: data.password,
        gameKey: data.gameKey,  // 給前端跳轉用
      },
    });
  } catch (error) {
    console.error('Get error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
