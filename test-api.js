const https = require('https');

const key = 'sfl.NTcyODMzMjE2Nzk5NjA1Mw.5OsIOZmaXTtIx5eygygj_Idj5boI5x5AndocJh4daQI';
const farmId = Buffer.from('NTcyODMzMjE2Nzk5NjA1Mw==', 'base64').toString();

console.log('Farm ID:', farmId);

function req(path, headers, body, label) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'api.sunflower-land.com',
      path,
      method: body ? 'POST' : 'GET',
      headers
    };
    const r = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`\n=== ${label} ===`);
        console.log('Status:', res.statusCode);
        try {
          const j = JSON.parse(d);
          console.log(JSON.stringify(j, null, 2));
        } catch(e) {
          console.log(d.substring(0, 500));
        }
        resolve();
      });
    });
    r.on('error', e => { console.log('E:', e.message); resolve(); });
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  const h = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Origin': 'https://app.sunflower-land.com',
    'Referer': 'https://app.sunflower-land.com/',
    'X-API-Key': key
  };

  // Get the farm data
  await req(`/community/farms/${farmId}`, h, null, `GET /community/farms/${farmId}`);

  // Also try batch endpoint
  await req('/community/farms?limit=3', h, null, 'GET /community/farms batch');
}

main();
