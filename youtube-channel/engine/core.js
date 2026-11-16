// ============================================================ basics
const C = document.getElementById('c'), g = C.getContext('2d');
// Shared animation engine: drawing helpers, the pill characters, props, and the render loop.
// Each video supplies scenes.js (adds S.<type> functions, optional NODIP_IN/OUT and window.thumb).
const W = 1920, H = 1080;
const COL = { paper:'#F4EDE1', paper2:'#E9DECB', ink:'#2B2D42', ink2:'#5C6178', ivy:'#2A9D8F', sam:'#F2B84B', alex:'#E76F51',
  max:'#7B6CF6', red:'#D1495B', green:'#4FAE62', white:'#FFFDF8', night:'#1E2340', gray:'#A3A8B5', sky:'#8EC5E8' };
const EX = ['#9DB4C0','#C9A9A6','#B5C99A','#D4B483','#A7A3C9','#E0A487','#93B7A8'];
const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp = (a,b,t)=>a+(b-a)*t;
const eio = t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const back = t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
const P = (t,a,d=.5)=>clamp((t-a)/d);
const E = (t,a,d=.5)=>eio(P(t,a,d));
const B = (t,a,d=.45)=>{const p=P(t,a,d);return p<=0?0:p>=1?1:back(p)};
let seed = 7; const rnd = ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
function h2r(h){h=h.replace('#','');return[0,2,4].map(i=>parseInt(h.substr(i,2),16))}
function mix(a,b,t){const x=h2r(a),y=h2r(b);return '#'+x.map((v,i)=>Math.round(lerp(v,y[i],clamp(t))).toString(16).padStart(2,'0')).join('')}
const dark=(c,a)=>mix(c,'#1b1c2a',a), light=(c,a)=>mix(c,'#ffffff',a);
let TT = 0; // absolute time (idle motion)

function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function ell(x,y,rx,ry,rot=0){g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,Math.PI*2)}
function line(x1,y1,x2,y2,w,c){g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.lineWidth=w;g.strokeStyle=c;g.lineCap='round';g.stroke()}
function txt(s,x,y,o={}){const{size=60,color=COL.ink,font='Fredoka',weight=600,align='center',base='middle',alpha=1,maxW,ls=0}=o;
  if(alpha<=0)return;g.save();g.globalAlpha*=alpha;g.font=`${weight} ${size}px ${font}`;g.fillStyle=color;g.textAlign=align;g.textBaseline=base;
  if(ls)g.letterSpacing=ls+'px';g.fillText(s,x,y,maxW);g.restore()}
function wrap(s,x,y,w,lh,o={}){g.save();g.font=`${o.weight||600} ${o.size||60}px ${o.font||'Fredoka'}`;const words=s.split(' ');const out=[];let cur='';
  for(const wd of words){const tr=cur?cur+' '+wd:wd;if(g.measureText(tr).width>w&&cur){out.push(cur);cur=wd}else cur=tr}out.push(cur);g.restore();
  const y0=o.base==='top'?y:y-(out.length-1)*lh/2;out.forEach((l,i)=>txt(l,x,y0+i*lh,o));return out.length}
function scaleAt(x,y,s){g.translate(x,y);g.scale(s,s);g.translate(-x,-y)}
function withA(a,f){if(a<=0.001)return;g.save();g.globalAlpha*=a;f();g.restore()}

// ============================================================ grain + vignette
const grain=document.createElement('canvas');grain.width=480;grain.height=270;{const q=grain.getContext('2d'),id=q.createImageData(480,270);
  for(let i=0;i<id.data.length;i+=4){const v=rnd()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255}q.putImageData(id,0,0)}
function finish(){g.save();g.globalAlpha=.045;g.globalCompositeOperation='overlay';g.imageSmoothingEnabled=false;g.drawImage(grain,0,0,W,H);g.restore();
  const v=g.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*1.05);v.addColorStop(0,'rgba(20,20,40,0)');v.addColorStop(1,'rgba(20,20,40,.28)');g.fillStyle=v;g.fillRect(0,0,W,H)}

// ============================================================ characters
// pill-shaped people. o.y = ground line. Heights ~240px at s=1
function ch(o){
  const{x,y,c=COL.ivy,s=1,expr='smile',look=0,lookY=0,arms='down',alpha=1,flip=false,sweat=false,shake=0,sd=0,top=null,hop=0,gray=0,glow=0}=o;
  if(alpha<=0.001)return;
  const col=gray?mix(c,'#9AA0AE',gray):c;
  g.save();g.globalAlpha*=alpha;
  const bob=Math.sin(TT*2.3+sd)*3, jit=shake?Math.sin(TT*55+sd)*shake*4:0;
  g.translate(x+jit,y-hop*s);g.scale(flip?-s:s,s);
  if(glow){const gr=g.createRadialGradient(0,-120,20,0,-120,260);gr.addColorStop(0,`rgba(255,240,200,${.55*glow})`);gr.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=gr;g.fillRect(-300,-420,600,500)}
  g.fillStyle='rgba(43,45,66,.16)';ell(0,2+hop*.6,82*(1-hop/400),13);g.fill();
  g.fillStyle=dark(col,.55);ell(-30,-10,28,13);g.fill();ell(30,-10,28,13);g.fill();
  const by=-240+bob;
  // arms (behind for 'down')
  const armC=dark(col,.12);
  const arm=(sx,ex,ey)=>line(sx,by+132,ex,ey,20,armC);
  const sw=Math.sin(TT*7+sd), shk=shake?Math.sin(TT*48+sd)*5:0;
  if(arms==='down'){arm(-58,-80,by+205+shk);arm(58,80,by+205-shk)}
  // body
  g.save();rr(-64,by,128,232,64);g.fillStyle=col;g.fill();g.clip();
  g.fillStyle=dark(col,.16);g.fillRect(-70,by+150,140,100);
  g.fillStyle=light(col,.22);g.globalAlpha*=.6;ell(-34,by+60,14,40,.3);g.fill();g.restore();
  // top accessory
  g.fillStyle=dark(col,.35);
  if(top==='bun'){ell(0,by-8,24,22);g.fill()}
  if(top==='tuft'){g.strokeStyle=dark(col,.35);g.lineWidth=8;g.lineCap='round';[-14,0,14].forEach((d,i)=>{g.beginPath();g.moveTo(d,by+6);g.quadraticCurveTo(d+6,by-18,d+16-i*6,by-26);g.stroke()})}
  if(top==='hood'){g.save();g.strokeStyle=dark(col,.28);g.lineWidth=10;g.beginPath();g.arc(0,by+92,62,Math.PI*1.06,Math.PI*1.94);g.stroke();g.restore()}
  if(top==='spike'){g.beginPath();g.moveTo(-30,by+12);g.lineTo(-18,by-22);g.lineTo(-4,by+4);g.lineTo(10,by-28);g.lineTo(22,by+4);g.lineTo(34,by-14);g.lineTo(36,by+16);g.closePath();g.fill()}
  if(top==='crown'){g.fillStyle='#F2C230';g.beginPath();g.moveTo(-40,by+14);g.lineTo(-44,by-34);g.lineTo(-20,by-10);g.lineTo(0,by-44);g.lineTo(20,by-10);g.lineTo(44,by-34);g.lineTo(40,by+14);g.closePath();g.fill();g.fillStyle=COL.red;g.beginPath();g.arc(0,by-6,6,0,7);g.fill()}
  if(top==='slick'){g.fillStyle=dark(col,.45);g.beginPath();g.moveTo(-58,by+40);g.quadraticCurveTo(-60,by-16,10,by-14);g.quadraticCurveTo(64,by-10,62,by+30);g.quadraticCurveTo(20,by+4,-58,by+40);g.fill()}
  if(top==='part'){g.fillStyle=dark(col,.4);g.beginPath();g.moveTo(-60,by+50);g.quadraticCurveTo(-56,by-12,-14,by-8);g.lineTo(-20,by+26);g.closePath();g.fill();g.beginPath();g.moveTo(-6,by-8);g.quadraticCurveTo(58,by-10,60,by+46);g.quadraticCurveTo(30,by+14,-4,by+20);g.closePath();g.fill()}
  if(top==='baby'){g.strokeStyle=dark(col,.35);g.lineWidth=7;g.beginPath();g.arc(6,by-4,12,Math.PI*.9,Math.PI*2.2);g.stroke()}
  // arms in front
  if(arms==='wave'){arm(-58,-80,by+205);const a=-1.25+sw*.35;line(58,by+130,58+Math.cos(a)*95,by+130+Math.sin(a)*95,20,armC)}
  if(arms==='up'){const k=Math.sin(TT*9+sd)*6;line(-58,by+130,-110,by+40+k,20,armC);line(58,by+130,110,by+40-k,20,armC)}
  if(arms==='shake'){line(-58,by+132,-40+shk,by+200,20,armC);line(58,by+132,40-shk,by+200,20,armC);
    if(shake>.5){[-1,1].forEach(k=>{line(k*78,by+188,k*92,by+182,4,COL.ink2);line(k*80,by+204,k*96,by+204,4,COL.ink2)})}}
  if(arms==='cup'){arm(58,80,by+205);line(-58,by+132,-92,by+175,20,armC);line(-92,by+175,-60,by+150,20,armC);
    g.fillStyle=COL.white;rr(-86,by+118,30,34,6);g.fill();g.strokeStyle=COL.ink;g.lineWidth=3;g.stroke()}
  if(arms==='book'){line(-58,by+132,-30,by+175,20,armC);line(58,by+132,30,by+175,20,armC);
    g.save();g.translate(0,by+168);g.fillStyle='#C8553D';rr(-60,-36,58,64,6);g.fill();rr(2,-36,58,64,6);g.fill();g.fillStyle=COL.white;rr(-54,-30,50,54,4);g.fill();rr(4,-30,50,54,4);g.fill();g.restore()}
  if(arms==='hug'){line(-58,by+132,-20,by+178,20,armC);line(58,by+132,20,by+178,20,armC)}
  // face
  const ey=by+62+lookY*4, lx=look*7;
  const ph=(TT*1+sd*1.7)%4.3, blink=ph<.13?.12:1;
  g.fillStyle='rgba(240,120,120,.35)';ell(-38,ey+30,13,8);g.fill();ell(38,ey+30,13,8);g.fill();
  const closed=expr==='joy'||expr==='calm';
  if(closed){g.strokeStyle=COL.ink;g.lineWidth=6;g.lineCap='round';[-24,24].forEach(dx=>{g.beginPath();g.arc(dx,ey+6,11,Math.PI*1.15,Math.PI*1.85);g.stroke()})}
  else{const big=expr==='o'||expr==='scared'?1.25:1;
    [-24,24].forEach(dx=>{g.fillStyle=COL.white;ell(dx,ey,15*big,18*big*blink);g.fill();
      if(blink>.5){g.fillStyle=COL.ink;ell(dx+lx,ey+3+lookY*3,(expr==='scared'?5:8),(expr==='scared'?5:8));g.fill();g.fillStyle='#fff';ell(dx+lx+3,ey-1,2.5,2.5);g.fill()}
      if(expr==='tired'||expr==='smug'||expr==='flat'){g.fillStyle=col;g.fillRect(dx-17,ey-20,34,expr==='flat'?14:19)}});}
  g.strokeStyle=COL.ink;g.lineWidth=6;g.lineCap='round';
  if(['worried','nervous','sad','scared'].includes(expr)){[-1,1].forEach(sg=>{g.beginPath();g.moveTo(sg*12,ey-26);g.lineTo(sg*34,ey-32+(expr==='sad'?0:4));g.stroke()})}
  if(expr==='determined'){[-1,1].forEach(sg=>{g.beginPath();g.moveTo(sg*12,ey-24);g.lineTo(sg*34,ey-32);g.stroke()})}
  const my=ey+40;g.beginPath();
  if(expr==='smile'||expr==='calm'||expr==='determined'){g.arc(0,my-10,16,.2*Math.PI,.8*Math.PI);g.stroke()}
  else if(expr==='joy'){g.moveTo(-20,my-6);g.quadraticCurveTo(0,my+26,20,my-6);g.closePath();g.fillStyle=COL.ink;g.fill();g.fillStyle='#E07A7A';ell(0,my+8,8,5);g.fill()}
  else if(expr==='smug'){g.moveTo(-18,my-2);g.quadraticCurveTo(4,my+12,22,my-10);g.stroke()}
  else if(expr==='neutral'||expr==='tired'||expr==='flat'){g.moveTo(-12,my);g.lineTo(12,my);g.stroke()}
  else if(expr==='o'||expr==='scared'){ell(0,my+2,8,10);g.fillStyle=COL.ink;g.fill()}
  else if(expr==='nervous'||expr==='worried'){g.moveTo(-18,my+2);for(let i=1;i<=4;i++)g.lineTo(-18+i*9,my+2+(i%2?-5:5));g.stroke()}
  else if(expr==='sad'){g.arc(0,my+14,14,1.2*Math.PI,1.8*Math.PI);g.stroke()}
  if(sweat){const d=(TT*1.2+sd)%1.6;g.save();g.globalAlpha*=clamp(1.4-d);g.fillStyle=COL.sky;g.beginPath();const sx=60,sy=by+38+d*30;g.moveTo(sx,sy-16);g.quadraticCurveTo(sx+12,sy,sx,sy+6);g.quadraticCurveTo(sx-12,sy,sx,sy-16);g.fill();g.restore()}
  g.restore();
}
const IVY={c:COL.ivy,top:'bun',sd:1}, SAM={c:COL.sam,top:'tuft',sd:2.3}, ALEX={c:COL.alex,top:'hood',sd:3.7}, MAX={c:COL.max,top:'spike',sd:5.1};
const P_=(base,o)=>Object.assign({},base,o);

// ============================================================ props & icons
function heart(x,y,s,c=COL.red,a=1){withA(a,()=>{g.save();g.translate(x,y);g.scale(s,s);g.beginPath();g.moveTo(0,12);g.bezierCurveTo(-26,-6,-14,-28,0,-14);g.bezierCurveTo(14,-28,26,-6,0,12);g.fillStyle=c;g.fill();g.restore()})}
function battery(x,y,s,level,a=1){withA(a,()=>{g.save();g.translate(x,y);g.scale(s,s);
  const c=level<.3?COL.red:level<.6?COL.sam:COL.green;g.fillStyle=COL.white;rr(-70,-130,140,260,24);g.fill();g.lineWidth=12;g.strokeStyle=COL.ink;g.stroke();
  g.fillStyle=COL.ink;rr(-28,-152,56,24,8);g.fill();const hh=232*clamp(level);g.fillStyle=c;rr(-56,116-hh,112,hh,12);g.fill();
  txt(Math.round(level*100)+'%',0,186,{size:46,weight:700});g.restore()})}
function bolt(x,y,s,a=1){withA(a,()=>{g.save();g.translate(x,y);g.scale(s,s);g.beginPath();g.moveTo(8,-40);g.lineTo(-22,6);g.lineTo(-2,6);g.lineTo(-10,40);g.lineTo(22,-8);g.lineTo(2,-8);g.closePath();g.fillStyle='#FFD447';g.fill();g.lineWidth=5;g.strokeStyle=COL.ink;g.stroke();g.restore()})}
function cloud(x,y,s,storm=false,a=1){withA(a,()=>{g.save();g.translate(x,y);g.scale(s,s);g.fillStyle=storm?'#5D6378':'#fff';
  [[-50,10,42],[0,-10,56],[52,8,44],[0,24,46]].forEach(([cx,cy,r])=>{g.beginPath();g.arc(cx,cy,r,0,7);g.fill()});
  if(storm){const f=(TT*1.3)%2.2<.12;g.fillStyle=f?'#FFE066':'#FFD447';g.beginPath();g.moveTo(6,50);g.lineTo(-14,92);g.lineTo(2,92);g.lineTo(-8,128);g.lineTo(22,82);g.lineTo(6,82);g.lineTo(16,50);g.fill();
    g.strokeStyle=COL.sky;g.lineWidth=5;g.lineCap='round';for(let i=0;i<5;i++){const yy=((TT*180+i*37)%80);g.globalAlpha=.8;g.beginPath();g.moveTo(-60+i*28,60+yy);g.lineTo(-66+i*28,76+yy);g.stroke()}}
  g.restore()})}
function eyes(x,y,s,tx,ty,a=1,sd=0){withA(a,()=>{const ph=(TT+sd)%3.7,bl=ph<.12?.1:1;[-1,1].forEach(k=>{g.fillStyle='#FFFDF8';ell(x+k*22*s,y,14*s,10*s*bl);g.fill();
  if(bl>.5){const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy)||1;g.fillStyle=COL.ink;ell(x+k*22*s+dx/d*5*s,y+dy/d*3*s,6*s,6*s);g.fill()}})})}
function bubble(x,y,w,h,tail='bl',a=1,fill=COL.white){withA(a,()=>{g.save();g.fillStyle=fill;g.strokeStyle=COL.ink;g.lineWidth=5;rr(x-w/2,y-h/2,w,h,Math.min(40,h/2));g.fill();g.stroke();
  const tx=tail==='bl'?x-w/4:tail==='br'?x+w/4:x;g.beginPath();g.moveTo(tx-16,y+h/2-3);g.lineTo(tx+(tail==='br'?20:-20),y+h/2+34);g.lineTo(tx+16,y+h/2-3);g.fill();
  g.beginPath();g.moveTo(tx-16,y+h/2);g.lineTo(tx+(tail==='br'?20:-20),y+h/2+34);g.lineTo(tx+16,y+h/2);g.stroke();g.restore()})}
function thought(x,y,w,h,a=1){withA(a,()=>{g.fillStyle=COL.white;g.strokeStyle=COL.ink;g.lineWidth=5;rr(x-w/2,y-h/2,w,h,h/2);g.fill();g.stroke();
  [[x-w/3,y+h/2+28,16],[x-w/3-34,y+h/2+66,10]].forEach(([cx,cy,r])=>{g.beginPath();g.arc(cx,cy,r,0,7);g.fill();g.stroke()})})}
function card(x,y,w,h,a=1,fill=COL.white,stroke=COL.ink){withA(a,()=>{g.fillStyle='rgba(43,45,66,.15)';rr(x-w/2+10,y-h/2+14,w,h,28);g.fill();g.fillStyle=fill;rr(x-w/2,y-h/2,w,h,28);g.fill();g.lineWidth=6;g.strokeStyle=stroke;g.stroke()})}
function pill(s,x,y,o={}){const{bg=COL.ink,color=COL.white,size=40,p=1,padX=28,h=size*1.6}=o;if(p<=0)return;g.save();g.font=`600 ${size}px Fredoka`;const w=g.measureText(s).width+padX*2;
  g.translate(x,y);g.scale(p,p);g.fillStyle=bg;rr(-w/2,-h/2,w,h,h/2);g.fill();g.restore();g.save();g.translate(x,y);g.scale(p,p);txt(s,0,2,{size,color});g.restore()}
function strike(x,y,w,p,c=COL.red){if(p<=0)return;line(x-w/2,y+6,x-w/2+w*p,y-6,12,c)}
function cross(x,y,r,p,c=COL.red){if(p<=0)return;const a=clamp(p*2),b=clamp(p*2-1);line(x-r,y-r,x-r+2*r*a,y-r+2*r*a,16,c);if(b>0)line(x+r,y-r,x+r-2*r*b,y-r+2*r*b,16,c)}
function check(x,y,s,p,c=COL.green){if(p<=0)return;g.save();g.translate(x,y);g.scale(s,s);g.beginPath();g.moveTo(-20,0);const a=clamp(p*2),b=clamp(p*2-1);g.lineTo(-20+14*a,14*a);if(b>0)g.lineTo(-6+32*b,14-38*b);g.lineWidth=10;g.strokeStyle=c;g.lineCap='round';g.lineJoin='round';g.stroke();g.restore()}
function stamp(s,x,y,p,c=COL.red,rot=-.18,size=96){if(p<=0)return;const k=p<1?lerp(2.2,1,eio(p)):1;g.save();g.translate(x,y);g.rotate(rot);g.scale(k,k);g.globalAlpha*=clamp(p*1.5);
  g.font=`700 ${size}px Fredoka`;const w=g.measureText(s).width+60;g.lineWidth=10;g.strokeStyle=c;rr(-w/2,-size*.7,w,size*1.4,22);g.stroke();txt(s,0,4,{size,color:c,weight:700});g.restore()}
function clock(x,y,r,hours,a=1){withA(a,()=>{g.fillStyle=COL.white;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.lineWidth=r*.1;g.strokeStyle=COL.ink;g.stroke();
  for(let i=0;i<12;i++){const an=i/12*Math.PI*2;line(x+Math.sin(an)*r*.78,y-Math.cos(an)*r*.78,x+Math.sin(an)*r*.86,y-Math.cos(an)*r*.86,r*.05,COL.ink)}
  const ha=hours/12*Math.PI*2,ma=(hours%1)*Math.PI*2;line(x,y,x+Math.sin(ha)*r*.48,y-Math.cos(ha)*r*.48,r*.1,COL.ink);line(x,y,x+Math.sin(ma)*r*.72,y-Math.cos(ma)*r*.72,r*.06,COL.red);
  g.fillStyle=COL.ink;g.beginPath();g.arc(x,y,r*.08,0,7);g.fill()})}
function note(x,y,s,a){withA(a,()=>{g.save();g.translate(x,y);g.scale(s,s);g.fillStyle=COL.ink;ell(0,0,12,9,-.4);g.fill();line(10,-4,10,-46,5,COL.ink);line(10,-46,26,-36,5,COL.ink);g.restore()})}
function chapter(n,label,lt){const p=E(lt,.15,.6);if(p<=0)return;g.save();g.translate(lerp(-420,0,p),0);g.fillStyle=COL.ink;rr(40,40,110+label.length*25,76,38);g.fill();
  g.fillStyle=COL.sam;g.beginPath();g.arc(78,78,26,0,7);g.fill();txt(String(n),78,80,{size:34,weight:700,color:COL.ink});txt(label,118,80,{size:36,color:COL.white,align:'left'});g.restore()}
function source(s,a=1){txt(s,W-50,H-44,{size:24,font:'Nunito',weight:700,color:COL.ink2,align:'right',alpha:a*.85})}
function paperBg(tint=COL.paper){g.fillStyle=tint;g.fillRect(0,0,W,H);g.save();g.globalAlpha=.07;g.fillStyle=COL.ink;for(let y=60;y<H;y+=60)for(let x=(y/60%2)*30+30;x<W;x+=60){g.beginPath();g.arc(x,y,2.4,0,7);g.fill()}g.restore()}

// ============================================================ the party room
function room(o={}){const{door=0,night=false}=o;
  const wall=g.createLinearGradient(0,0,0,860);wall.addColorStop(0,'#5E4B5F');wall.addColorStop(1,'#7A5F6A');g.fillStyle=wall;g.fillRect(0,0,W,860);
  // window
  g.fillStyle='#2B2F57';rr(110,150,330,380,10);g.fill();g.fillStyle='#F6E7B8';g.beginPath();g.arc(360,230,30,0,7);g.fill();
  g.fillStyle='#3B4170';[[130,420,60,110],[200,380,50,150],[260,440,70,90],[340,400,60,130]].forEach(b=>g.fillRect(...b));
  g.fillStyle='#F2D27A';for(let i=0;i<22;i++){const bx=140+((i*53)%270),byy=400+((i*37)%110);g.fillRect(bx,byy,6,8)}
  g.lineWidth=14;g.strokeStyle='#3A2C3B';rr(110,150,330,380,10);g.stroke();line(275,150,275,530,10,'#3A2C3B');
  // art
  [[620,170,200,150,'#E76F51','circle'],[880,140,160,200,'#2A9D8F','tri'],[1110,180,240,140,'#F2B84B','wave']].forEach(([x,y,w,h,c,k])=>{g.fillStyle='#3A2C3B';g.fillRect(x-10,y-10,w+20,h+20);g.fillStyle='#EFE3CF';g.fillRect(x,y,w,h);g.fillStyle=c;
    if(k==='circle'){g.beginPath();g.arc(x+w/2,y+h/2,48,0,7);g.fill()}if(k==='tri'){g.beginPath();g.moveTo(x+30,y+h-30);g.lineTo(x+w/2,y+40);g.lineTo(x+w-30,y+h-30);g.fill()}
    if(k==='wave'){g.lineWidth=16;g.strokeStyle=c;g.beginPath();for(let i=0;i<=8;i++)g.lineTo(x+20+i*25,y+h/2+Math.sin(i)*24);g.stroke()}});
  // string lights
  g.strokeStyle='#2A2030';g.lineWidth=3;g.beginPath();g.moveTo(0,70);for(let x=0;x<=W;x+=20)g.lineTo(x,70+Math.sin(x/W*Math.PI*3)*26+26);g.stroke();
  for(let i=0;i<26;i++){const x=i*76+20,y=96+Math.sin(x/W*Math.PI*3)*26+10,c=['#FFD166','#EF476F','#06D6A0','#8EC5E8'][i%4],tw=.6+.4*Math.sin(TT*3+i);
    const gl=g.createRadialGradient(x,y,2,x,y,30);gl.addColorStop(0,c);gl.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=.55*tw;g.fillStyle=gl;g.fillRect(x-30,y-30,60,60);g.globalAlpha=1;g.fillStyle=c;ell(x,y,8,11);g.fill()}
  // door
  const dx=1600,dy=380,dw=200,dh=480;g.fillStyle='#16182E';g.fillRect(dx,dy,dw,dh);
  g.fillStyle='rgba(142,197,232,.25)';for(let i=0;i<10;i++){g.fillRect(dx+((i*47)%dw),dy+((i*71)%300),3,3)}
  o.inDoor&&o.inDoor();
  const ow=dw*(1-door*.82);g.fillStyle='#8C5A3C';g.fillRect(dx,dy,ow,dh);g.fillStyle='#7A4C31';if(ow>40){g.fillRect(dx+ow*.14,dy+40,ow*.72,170);g.fillRect(dx+ow*.14,dy+250,ow*.72,190)}
  g.fillStyle='#F2D27A';if(door<.5){g.beginPath();g.arc(dx+ow-28,dy+260,10,0,7);g.fill()}
  g.lineWidth=14;g.strokeStyle='#3A2C3B';g.strokeRect(dx-7,dy-7,dw+14,dh+14);
  // lamp + plant
  line(1480,860,1480,560,8,'#2A2030');g.fillStyle='#F6D58E';g.beginPath();g.moveTo(1430,560);g.lineTo(1530,560);g.lineTo(1505,490);g.lineTo(1455,490);g.closePath();g.fill();
  const lg=g.createRadialGradient(1480,560,10,1480,620,300);lg.addColorStop(0,'rgba(255,220,150,.35)');lg.addColorStop(1,'rgba(255,220,150,0)');g.fillStyle=lg;g.fillRect(1180,400,600,500);
  g.fillStyle='#B5653D';rr(470,770,90,90,10);g.fill();g.fillStyle='#4E8A5B';[[-30,-60,-.5],[0,-80,0],[30,-60,.5],[-15,-40,-.9],[18,-40,.9]].forEach(([a,b,r])=>{ell(515+a,770+b,22,56,r);g.fill()});
  // floor
  const fl=g.createLinearGradient(0,860,0,H);fl.addColorStop(0,'#3E2E36');fl.addColorStop(1,'#2C2027');g.fillStyle=fl;g.fillRect(0,860,W,H-860);
  g.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<6;i++)g.fillRect(0,880+i*36,W,3);g.fillStyle='#2A2030';g.fillRect(0,850,W,16);
  const rug=g.createRadialGradient(960,940,40,960,940,620);rug.addColorStop(0,'rgba(231,111,81,.35)');rug.addColorStop(1,'rgba(231,111,81,0)');g.fillStyle=rug;ell(960,950,620,90);g.fill();
}
const CROWD=[[690,0,'joy','up'],[830,3,'smile','down'],[1140,1,'joy','cup'],[1275,5,'smile','down'],[1410,2,'o','down']];
function crowd(o={}){const{alpha=1,except=-1,y=880,dx=0,expr}=o;CROWD.forEach(([x,ci,e,a],i)=>{if(i!==except)ch({x:x+dx,y,c:EX[ci],s:.92,expr:expr||e,arms:a,sd:i*1.3,look:x>980?-1:1,alpha})})}
function camera(keys,lt){ // keys: [time,cx,cy,zoom]
  let k=keys[0];let cx=k[1],cy=k[2],z=k[3];
  for(let i=1;i<keys.length;i++){const p=E(lt,keys[i-1][0],Math.max(.01,keys[i][0]-keys[i-1][0]));if(lt>=keys[i-1][0]){cx=lerp(keys[i-1][1],keys[i][1],p);cy=lerp(keys[i-1][2],keys[i][2],p);z=lerp(keys[i-1][3],keys[i][3],p)}}
  cx=clamp(cx,W/(2*z),W-W/(2*z));cy=clamp(cy,H/(2*z),H-H/(2*z));g.translate(W/2,H/2);g.scale(z,z);g.translate(-cx,-cy)}

// ============================================================ shared scene helpers
// crossfade between panels; starts = line index where each panel begins
function panels(lt, L, starts, fns) {
  starts.forEach((li, k) => {
    const a0 = k === 0 ? 1 : E(lt, L[li] - .15, .4), a1 = k < starts.length - 1 ? E(lt, L[starts[k + 1]] - .15, .4) : 0;
    const a = a0 * (1 - a1); if (a > .001) withA(a, fns[k]);
  });
}
function lying(o) { g.save(); g.translate(o.x, o.y); g.rotate(-Math.PI / 2); ch(Object.assign({}, o, { x: 0, y: 0 })); g.restore(); }
function memCard(x, y, w, h, text, o = {}) { const { hl = 0, rot = 0, a = 1, size = 44, fill = COL.white, sub } = o; withA(a, () => { g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(43,45,66,.18)'; rr(-w / 2 + 8, -h / 2 + 10, w, h, 18); g.fill(); g.fillStyle = fill; rr(-w / 2, -h / 2, w, h, 18); g.fill(); g.lineWidth = 5; g.strokeStyle = COL.ink; g.stroke();
  if (hl > 0) { g.fillStyle = 'rgba(255,224,70,.85)'; g.font = `700 ${size}px Fredoka`; const tw = g.measureText(text).width + 30; rr(-tw / 2, -size * .55 + (sub ? -14 : 0), tw * clamp(hl), size * 1.1, 10); g.fill(); }
  txt(text, 0, 3 + (sub ? -14 : 0), { size, weight: 700 }); if (sub) txt(sub, 0, 40, { size: 26, font: 'Nunito', weight: 700, color: COL.ink2 }); g.restore() }) }
function brainChar(x, y, s, o = {}) { const { expr = 'smile', amyg = 0, hippo = 0, a = 1 } = o; withA(a, () => { g.save(); g.translate(x, y); g.scale(s, s);
  const c = '#F4A7B9'; g.fillStyle = 'rgba(43,45,66,.15)'; ell(0, 170, 170, 22); g.fill();
  g.fillStyle = c; [[-110, -10, 90], [-40, -70, 100], [60, -70, 100], [120, 0, 90], [60, 60, 95], [-50, 60, 95], [0, 0, 110]].forEach(([cx, cy, r]) => { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); });
  g.strokeStyle = dark(c, .2); g.lineWidth = 8; g.lineCap = 'round'; line(0, -150, 0, 140, 8, dark(c, .2));
  [[-150, -40, -70, -20], [-130, 50, -60, 30], [60, -40, 150, -20], [70, 40, 160, 60], [-90, -110, -40, -80], [40, -120, 90, -100]].forEach(([a1, b1, a2, b2]) => { g.beginPath(); g.moveTo(a1, b1); g.quadraticCurveTo((a1 + a2) / 2, b1 - 30, a2, b2); g.stroke(); });
  if (hippo > 0) { g.strokeStyle = `rgba(42,157,143,${hippo})`; g.lineWidth = 16; g.beginPath(); g.arc(30, 60, 50, Math.PI * .1, Math.PI * .9); g.stroke(); }
  if (amyg > 0) { const pu = 1 + .15 * Math.sin(TT * 8); const gl = g.createRadialGradient(-30, 70, 4, -30, 70, 70 * pu); gl.addColorStop(0, `rgba(255,120,60,${amyg})`); gl.addColorStop(1, 'rgba(255,120,60,0)'); g.fillStyle = gl; g.beginPath(); g.arc(-30, 70, 70 * pu, 0, 7); g.fill();
    g.fillStyle = `rgba(231,90,50,${amyg})`; ell(-30, 70, 20, 14, .4); g.fill(); }
  // face
  g.fillStyle = COL.white; ell(-40, -20, 18, 22); g.fill(); ell(40, -20, 18, 22); g.fill(); g.fillStyle = COL.ink; ell(-36, -16, 9, 9); g.fill(); ell(44, -16, 9, 9); g.fill();
  g.strokeStyle = COL.ink; g.lineWidth = 7; g.beginPath(); if (expr === 'smirk') { g.moveTo(-26, 30); g.quadraticCurveTo(10, 50, 34, 22); } else g.arc(0, 20, 22, .2 * Math.PI, .8 * Math.PI); g.stroke();
  if (expr === 'smirk') { line(-60, -56, -22, -46, 7, COL.ink); line(60, -56, 22, -46, 7, COL.ink); }
  g.restore() }) }
function label(s, x, y, tx, ty, p, c = COL.ink) { if (p <= 0) return; withA(p, () => { g.setLineDash([10, 8]); line(x, y, lerp(x, tx, p), lerp(y, ty, p), 4, c); g.setLineDash([]); pill(s, x, y, { p: B(p, 0, 1), bg: c, size: 36 }); }) }
function bar(x, base, w, h, c, p) { const hh = h * p; g.fillStyle = c; rr(x - w / 2, base - hh, w, hh, 14); g.fill(); }
function confetti(lt, t0) { for (let i = 0; i < 70; i++) { const a = lt - t0 - (i % 7) * .03; if (a < 0) continue; const x = (i * 263) % W, y = -40 + a * (260 + (i % 5) * 60) + Math.sin(a * 3 + i) * 20;
  g.save(); g.translate(x, y); g.rotate(a * 4 + i); g.fillStyle = [COL.ivy, COL.sam, COL.alex, COL.max, COL.red][i % 5]; g.fillRect(-9, -5, 18, 10); g.restore(); } }
function arrowLine(x1, y1, x2, y2, p, c = COL.ink, w = 8) { if (p <= 0) return; const x = lerp(x1, x2, p), y = lerp(y1, y2, p); line(x1, y1, x, y, w, c); const an = Math.atan2(y2 - y1, x2 - x1);
  g.fillStyle = c; g.beginPath(); g.moveTo(x + Math.cos(an) * 18, y + Math.sin(an) * 18); g.lineTo(x + Math.cos(an + 2.4) * 22, y + Math.sin(an + 2.4) * 22); g.lineTo(x + Math.cos(an - 2.4) * 22, y + Math.sin(an - 2.4) * 22); g.fill(); }
const S = {};
// ============================================================ render
let NODIP_IN = new Set(), NODIP_OUT = new Set();
function render(t){
  const TL=window.TIMELINE;
  TT=t;seed=99;
  let sc=TL.scenes.find(s=>t>=s.start&&t<s.end)||TL.scenes[TL.scenes.length-1];
  const lt=t-sc.start, D=sc.end-sc.start, L=sc.lines.map(l=>l.start-sc.start), Le=sc.lines.map(l=>l.end-sc.start);
  const at=(i,f)=>L[i]+(Le[i]-L[i])*f;
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.clearRect(0,0,W,H);
  try{S[sc.type](lt,L,Le,D,at)}catch(e){g.setTransform(1,0,0,1,0,0);g.fillStyle='red';g.font='40px sans-serif';g.fillText(sc.type+': '+e.message,40,60);console.error(e)}
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;
  let dip=0;if(!NODIP_IN.has(sc.id))dip=Math.max(dip,1-P(lt,0,.3));if(!NODIP_OUT.has(sc.id))dip=Math.max(dip,P(lt,D-.25,.25));
  if(dip>0){g.fillStyle=`rgba(244,237,225,${dip})`;g.fillRect(0,0,W,H)}
  finish();
}
window.render=render;
window.ready=document.fonts.load('600 40px Fredoka').then(()=>Promise.all(['500','700'].map(w=>document.fonts.load(w+' 40px Fredoka')).concat(['400','700','800'].map(w=>document.fonts.load(w+' 40px Nunito')))));

