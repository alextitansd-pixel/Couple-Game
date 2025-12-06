import { createClient } from '@libsql/client/web';
import { randomBytes } from 'crypto';

export const POST = async (req) => {
    try {
        const { to, from, msg = '', img = '', password = '5201314' } = await req.json();

        if (!to || !from) {
            return Response.json({ error: 'missing fields' }, { status: 400 });
        }

        const shareKey = randomBytes(5).toString('hex');
        const gameKey = randomBytes(16).toString('hex');

        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
            syncSchema: false
        });

        await client.execute({
            sql: `INSERT OR REPLACE INTO games 
            (id, recipient, sender, msg, img, password, gameKey) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [shareKey, to, from, msg, img, password, gameKey]
        });

        const host = req.headers.get('host') || 'localhost:3000';
        const url = `https://${host}/?share=${shareKey}`;

        return Response.json({ success: true, url });
    } catch (error) {
        console.error('Store error:', error);
        return Response.json({ error: 'server error' }, { status: 500 });
    }
};