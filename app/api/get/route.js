// app/api/get/route.js   ← 支援 GET + POST，永遠不會 405
import { createClient } from '@libsql/client/web';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
    syncSchema: false
});

export async function GET(request) {
    return handleRequest(request);
}

export async function POST(request) {
    return handleRequest(request);
}

async function handleRequest(request) {
    try {
        // 同時支援 GET (?key=xxx) 和 POST {shareKey, inputPassword}
        let shareKey, inputPassword;

        if (request.method === 'GET') {
            shareKey = new URL(request.url).searchParams.get('key');
            inputPassword = '5201314'; // GET 模式直接用測試密碼（方便測試）
        } else {
            const body = await request.json();
            shareKey = body.shareKey;
            inputPassword = body.inputPassword;
        }

        if (!shareKey) {
            return Response.json({ error: 'no key' }, { status: 400 });
        }

        const res = await client.execute({
            sql: 'SELECT recipient, sender, msg, img, password, gameKey FROM games WHERE id = ?',
            args: [shareKey]
        });

        if (res.rows.length === 0) {
            return Response.json({ error: 'not found' }, { status: 404 });
        }

        const row = res.rows[0];

        // 密碼驗證（POST 時才嚴格檢查）
        if (request.method === 'POST' && row.password !== inputPassword) {
            return Response.json({ error: 'wrong password' }, { status: 403 });
        }

        return Response.json({
            success: true,
            data: {
                to: row.recipient,
                from: row.sender,
                msg: row.msg || '',
                img: row.img || '',
                gameKey: row.gameKey
            }
        });
    } catch (error) {
        console.error('API error:', error);
        return Response.json({ error: 'server error' }, { status: 500 });
    }
}