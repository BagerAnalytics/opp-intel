const http = require('https'); 
http.get('https://adorable-optimism-production-58be.up.railway.app/', (res) => { 
  let data = ''; 
  res.on('data', c => data += c); 
  res.on('end', () => { 
    const matches = [...data.matchAll(/src=.([^">]+\.js)/g)]; 
    matches.forEach(m => { 
      let url = m[1];
      if(url.startsWith('/')) url = 'https://adorable-optimism-production-58be.up.railway.app' + url;
      http.get(url, (r) => { 
        let d = ''; 
        r.on('data', c => d+=c); 
        r.on('end', () => { 
          if(d.includes('Cannot Scan')) console.log('FOUND Cannot Scan IN', url) 
          if(d.includes('max-h-[5000px]')) console.log('FOUND max-h-[5000px] IN', url) 
        }); 
      }) 
    }) 
  }) 
})
