const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const DATA_FILE = path.join(__dirname, 'shared-data.json');

// Initialize empty data file
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

const server = http.createServer((req, res) => {
    // CORS - allow any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/data') {
        if (req.method === 'GET') {
            // Return stored data
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        } else if (req.method === 'POST') {
            // Update stored data
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    // Validate JSON
                    JSON.parse(body);
                    fs.writeFileSync(DATA_FILE, body, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
        } else {
            res.writeHead(405);
            res.end();
        }
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log('  燕云摸鱼办 · 数据同步服务');
    console.log('====================================');
    console.log('  本机:   http://localhost:' + PORT);
    console.log('');
    // Get local IP
    const os = require('os');
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log('  局域网: http://' + net.address + ':' + PORT);
            }
        }
    }
    console.log('====================================');
    console.log('  把这个地址填到签到页的配置里就行');
    console.log('====================================');
});
