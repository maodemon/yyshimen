// Vercel Serverless Function - 燕云摸鱼办数据同步API
// 部署到 Vercel 后自动生成 URL，7x24小时在线

import fs from 'fs';
import path from 'path';

// 数据文件路径（Vercel 环境下 /tmp 可写）
const DATA_DIR = '/tmp';
const DATA_FILE = path.join(DATA_DIR, 'yyshimen_data.json');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // 读取数据
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.status(200).json(JSON.parse(data));
      } else {
        // 初始化数据
        const initData = [{"id":"admin_init","username":"admin","password":"123456","nickname":"管理员","avatar":"🔑","role":"admin","createdAt":"2026/5/18","xpData":{"xp":0,"checkinDates":[],"consecutiveDays":0,"lastDate":"","weekCheckins":[],"weekId":"","weeklyBonusWeek":""}}];
        fs.writeFileSync(DATA_FILE, JSON.stringify(initData), 'utf8');
        res.status(200).json(initData);
      }
    } else if (req.method === 'POST') {
      // 保存数据
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const parsed = JSON.parse(body); // validate JSON
      fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf8');
      res.status(200).json({ ok: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e) {
    console.error('Sync API error:', e);
    res.status(500).json({ error: e.message });
  }
}
