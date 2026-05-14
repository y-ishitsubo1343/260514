const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const port = 3000;

// データベースのセットアップ
const db = new Database('votes.db');

// テーブルの自動作成
db.prepare(`
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    option TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

app.use(express.json());
// index.html を静的ファイルとして配信
app.use(express.static(path.join(__dirname)));

// 投票を受け取るエンドポイント
app.post('/vote', (req, res) => {
    const { option } = req.body;
    
    if (!option) {
        return res.status(400).json({ error: 'Option is required' });
    }

    try {
        const stmt = db.prepare('INSERT INTO votes (option) VALUES (?)');
        stmt.run(option);
        res.json({ success: true, message: 'Vote recorded' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 集計結果を返すエンドポイント
app.get('/votes', (req, res) => {
    try {
        // オプションごとのカウントを集計
        const stmt = db.prepare(`
            SELECT option, COUNT(*) as count 
            FROM votes 
            GROUP BY option
        `);
        const results = stmt.all();
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
