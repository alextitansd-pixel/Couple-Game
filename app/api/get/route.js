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
        let shareKey, inputPassword;

        if (request.method === 'GET') {
            shareKey = new URL(request.url).searchParams.get('key');
            inputPassword = '5201314';
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