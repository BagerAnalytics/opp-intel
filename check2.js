const http = require('https'); 
http.get('https://adorable-optimism-production-58be.up.railway.app/', (res) => { 
  let data = ''; 
  res.on('data', c => data += c); 
  res.on('end', () => { 
    console.log('HTML length:', data.length);
    if (data.includes('Cannot Scan')) console.log('Found Cannot Scan in HTML!');
    const matches = [...data.matchAll(/src=.([^">]+\.js)/g)];
    console.log('JS Chunks in HTML:', matches.map(m=>m[1]));
  }) 
})
