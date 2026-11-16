// Render the thumbnail (1280x720 PNG) from render.html's thumb()
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto('http://localhost:8765/render.html?headless');await p.evaluate(()=>window.ready);await p.evaluate(()=>thumb());
 const u=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=1280;c.height=720;const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(document.getElementById('c'),0,0,1280,720);return c.toDataURL('image/png')});
 require('fs').writeFileSync('build/thumbnail.png',Buffer.from(u.split(',')[1],'base64'));await b.close();console.log('ok')})();
