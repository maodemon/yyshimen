const fs = require('fs');
const path = require('path');
const filepath = path.join(__dirname, 'dashboard.html');
let content = fs.readFileSync(filepath, 'utf8');

// Replace the sync server section with Supabase configuration
// Add Supabase constants and update fetch/save functions

// 1. Remove old sync constants and add Supabase constants
const oldSyncBlock = `// 同步服务器地址（局域网内所有人填同一个IP）
        // 可在浏览器控制台运行: localStorage.setItem('yyshimen_sync_url','http://你的IP:3456/data')
        var SYNC_SERVER = localStorage.getItem('yyshimen_sync_url') || 'http://localhost:3456/data';`;

const newSupabaseBlock = `// Supabase 云数据库配置（免费，7x24小时在线）
        // 创建方法: 打开 supabase.com → 用GitHub登录 → New project → 复制下面的URL和Key
        var SUPABASE_URL = localStorage.getItem('yyshimen_supabase_url') || 'https://你的项目.supabase.co';
        var SUPABASE_KEY = localStorage.getItem('yyshimen_supabase_key') || '你的anon公钥';
        var SUPABASE_TABLE = 'users_data';`;

if (content.includes(oldSyncBlock)) {
    content = content.replace(oldSyncBlock, newSupabaseBlock);
    console.log('✅ Supabase constants added');
} else {
    console.log('❌ old block not found, checking alternatives...');
    // Try to find the SYNC_SERVER line
    if (content.includes('var SYNC_SERVER =')) {
        content = content.replace(/var SYNC_SERVER =.*?;/s, newSupabaseBlock);
        console.log('✅ Replaced via regex');
    }
}

// 2. Update fetch background sync to use Supabase
const oldFetchSync = `            // 后台尝试从同步服务器获取最新数据（多设备共享排行榜）
            try {
                var controller = new AbortController();
                var tid = setTimeout(function(){ controller.abort(); }, 2000);
                var resp = await fetch(SYNC_SERVER, { signal: controller.signal });
                clearTimeout(tid);
                if (resp.ok) {
                    var svUsers = await resp.json();`;

const newFetchSync = `            // 后台从Supabase拉取最新数据（多设备共享排行榜）
            try {
                var controller = new AbortController();
                var tid = setTimeout(function(){ controller.abort(); }, 3000);
                var resp = await fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?select=data', {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
                    signal: controller.signal
                });
                clearTimeout(tid);
                if (resp.ok) {
                    var rows = await resp.json();
                    if (rows && rows.length > 0 && rows[0].data) {
                        var svUsers = rows[0].data;`;

if (content.includes(oldFetchSync)) {
    content = content.replace(oldFetchSync, newFetchSync);
    console.log('✅ fetch sync updated');
} else {
    console.log('❌ fetch sync pattern not found');
}

// 3. Update save function to use Supabase
const oldSaveFunc = `        async function saveUsersToGitHub() {
            try {
                var controller = new AbortController();
                var tid = setTimeout(function(){ controller.abort(); }, 2000);
                var resp = await fetch(SYNC_SERVER, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(g_Users),
                    signal: controller.signal
                });`;

const newSaveFunc = `        async function saveUsersToGitHub() {
            try {
                var controller = new AbortController();
                var tid = setTimeout(function(){ controller.abort(); }, 3000);
                var resp = await fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?id=eq.1', {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ data: g_Users, updated_at: new Date().toISOString() }),
                    signal: controller.signal
                });`;

if (content.includes(oldSaveFunc)) {
    content = content.replace(oldSaveFunc, newSaveFunc);
    console.log('✅ save function updated');
} else {
    console.log('❌ save function pattern not found');
}

fs.writeFileSync(filepath, content, 'utf8');
console.log('✅ 完成');
