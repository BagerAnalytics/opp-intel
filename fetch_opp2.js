const http = require('http'); 
const https = require('https'); 

https.get('https://confident-smile-production.up.railway.app/api/opportunities', (res) => { 
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
     try {
       const opps = JSON.parse(data);
       const stdf = opps.find(o => o.name && o.name.includes('STDF'));
       if (stdf) {
         console.log(JSON.stringify({
           name: stdf.name,
           benefits: stdf.benefits,
           eligibility_criteria: stdf.eligibility_criteria,
           selection_criteria: stdf.selection_criteria,
           application_process: stdf.application_process,
           past_winners: stdf.past_winners,
           link: stdf.link
         }, null, 2));
       } else {
         console.log('Not found');
       }
     } catch(e) {
       console.log('Error parsing JSON');
     }
  });
});
