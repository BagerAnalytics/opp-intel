const https = require('https');

https.get('https://adorable-optimism-production-58be.up.railway.app/', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const matches = [...data.matchAll(/src=[\"']([^\"']+\.js)/g)];
    matches.forEach(m => {
      const url = m[1].startsWith('/') ? 'https://adorable-optimism-production-58be.up.railway.app' + m[1] : m[1];
      https.get(url, r => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => {
          const apiUrlMatch = d.match(/https:\/\/[^\"]+\.up\.railway\.app/g);
          if (apiUrlMatch && apiUrlMatch.length > 0) {
            apiUrlMatch.forEach(url => {
              if (!url.includes('adorable')) console.log('Found backend URL:', url);
            });
          }
        });
      });
    });
  });
});
