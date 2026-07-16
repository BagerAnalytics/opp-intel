const https = require('https');

https.get('https://opp-intel-production.up.railway.app/api/opportunities', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const opps = JSON.parse(data);
    console.log(`Deleting ${opps.length} opps...`);
    
    let deletedCount = 0;
    
    if (opps.length === 0) {
      console.log('No opps to delete. Running scrapers...');
      runScrapers();
      return;
    }

    opps.forEach(o => {
      const req = https.request(`https://opp-intel-production.up.railway.app/api/opportunities/${o.id}`, { method: 'DELETE' }, (delRes) => {
        deletedCount++;
        if (deletedCount === opps.length) {
          console.log('All mock data deleted! Running scrapers...');
          runScrapers();
        }
      });
      req.end();
    });
  });
});

function runScrapers() {
  const req = https.request('https://opp-intel-production.up.railway.app/api/scrapers/run', { method: 'POST' }, (res) => {
    console.log('Scrapers triggered! Status:', res.statusCode);
  });
  req.end();
}
