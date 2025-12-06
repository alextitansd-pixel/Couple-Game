// app/api/get/route.js
import { createClient } from '@libsql/client/web';

export async function POST(req) {
    const { shareKey, inputPassword } = await req.json();

    if (!shareKey || !inputPassword)
        return Response.json({ error: "missing" }, { status: 400 });

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const res = await client.execute({
        sql: "SELECT recipient, sender, msg, img, password, gameKey FROM games WHERE id = ?",
        args: [shareKey]
    });

    if (res.rows.length === 0)
        return Response.json({ error: "not found" }, { status: 404 });

    const row = res.rows[0];
    // 關鍵：只在後端比對密碼，絕不回傳！
    if (row.password !== inputPassword)
        return Response.json({ error: "wrong password" }, { status: 403 });

    // 正確才回傳純資料（沒有 password）
    return Response.json({
        success: true,
        data: {
            to: row.recipient,
            from: row.sender,
            msg: row.msg || "",
            img: row.img || "",
            gameKey: row.gameKey
        }
    });
}