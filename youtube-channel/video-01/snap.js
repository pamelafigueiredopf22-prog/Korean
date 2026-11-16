// Render still frames for checking: node snap.js out_dir t1 t2 ...  (or "scenes" for one mid-frame per line)
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const [out,...ts]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/render.html?headless');await p.evaluate(()=>window.ready);
 let times=ts.map(Number);
 if(ts[0]==='scenes'){const tl=JSON.parse(fs.readFileSync('build/timeline.json'));times=[];tl.scenes.forEach(s=>s.lines.forEach((l,i)=>times.push(+(l.start+(l.end-l.start)*.75).toFixed(2))))}
 for(const t of times){await p.evaluate(t=>render(t),t);await p.locator('canvas').screenshot({path:`${out}/t${String(t.toFixed(2)).padStart(7,'0')}.jpg`,type:'jpeg',quality:70})}
 console.log(times.length,'frames',errs.slice(0,5));await b.close()})();
