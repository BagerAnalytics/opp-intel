const http = require('https'); 
http.get('https://adorable-optimism-production-58be.up.railway.app/', (res) => { 
  let data = ''; 
  res.on('data', c => data += c); 
  res.on('end', () => { 
    const matches = [...data.matchAll(/href=.([^">]+\.css)/g)];
    console.log('CSS files:', matches.map(m=>m[1]));
    matches.forEach(m => { 
      let url = m[1];
      if(url.startsWith('/')) url = 'https://adorable-optimism-production-58be.up.railway.app' + url;
      http.get(url, (r) => { 
        let d = ''; 
        r.on('data', c => d+=c); 
        r.on('end', () => { 
          if(d.includes('5000px')) console.log('FOUND 5000px in CSS:', url) 
          else console.log('NOT FOUND in', url)
        }); 
      }) 
    }) 
  }) 
})
