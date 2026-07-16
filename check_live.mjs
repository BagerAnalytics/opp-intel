// Check the NEXT_PUBLIC_API_URL in the live JS chunks
fetch('https://adorable-optimism-production-58be.up.railway.app/')
  .then(r => r.text())
  .then(html => {
    // Get all JS chunk urls
    const chunks = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map(m => m[1]);
    console.log('JS chunks found:', chunks.length);
    
    // Find the main app chunk (usually the biggest)
    const promises = chunks.slice(0, 5).map(chunk => 
      fetch('https://adorable-optimism-production-58be.up.railway.app' + chunk)
        .then(r => r.text())
        .then(js => {
          if (js.includes('API_URL') || js.includes('railway') || js.includes('trigger-all') || js.includes('Force Sync')) {
            console.log('\n=== FOUND IN CHUNK:', chunk, '===');
            // Find relevant snippets
            const idx = js.indexOf('API_URL');
            if (idx > -1) console.log('API_URL context:', js.slice(Math.max(0, idx-50), idx+100));
            const idx2 = js.indexOf('trigger-all');
            if (idx2 > -1) console.log('trigger-all context:', js.slice(Math.max(0, idx2-50), idx2+100));
          }
        })
    );
    return Promise.all(promises);
  })
  .then(() => console.log('\nDone'))
  .catch(e => console.error(e));
