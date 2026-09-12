(() => {
'use strict';
const C = window.WORLD, NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id), svg=$('art');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const S={t:0,ui:0,last:0,run:!reduced.matches,reduced:reduced.matches,speed:C.default,sound:false,volume:.24,happy:0,actionAt:-100,action:'',breathing:false,breathAt:0,quiet:false,deadline:0,angle:.055,omega:0,boatX:0,boatY:0,lift:0,liftTarget:0,balloonX:0,flame:0,drag:null,draw:null,pointer:{x:800,y:400},levels:{},lastPet:-10};
C.mix.forEach(([k,_,v])=>S.levels[k]=v/100);
try{const p=JSON.parse(localStorage.getItem('slow-island-'+C.id)||'null');if(p){S.speed=clamp(+p.speed||C.default,.25,1.4);S.volume=clamp(Number.isFinite(p.volume)?p.volume:.24,0,.8);for(const k in S.levels)if(Number.isFinite(p.levels?.[k]))S.levels[k]=clamp(p.levels[k],0,1);}}catch(_){}
let saveTimer=0,toastTimer=0,sleepTimer=0,holdTimer=0,holdStarted=0;
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem('slow-island-'+C.id,JSON.stringify({speed:S.speed,volume:S.volume,levels:S.levels}));}catch(_){}},250);}
function say(text,ms=3500){$('toast').textContent=text;$('toast').classList.add('visible');$('live').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),ms);}
function fillRange(el){el.style.setProperty('--fill',(100*(Number(el.value)-Number(el.min))/(Number(el.max)-Number(el.min)))+'%');}
function node(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs||{}))n.setAttribute(k,String(v));if(parent)parent.appendChild(n);return n;}
function pos(e){const m=svg.getScreenCTM();if(!m)return{x:0,y:0};const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;try{return p.matrixTransform(m.inverse());}catch(_){return{x:0,y:0};}}
function transform(n,s){if(n)n.setAttribute('transform',s);}
const f=v=>Number(v).toFixed(2);
function fit(){svg.setAttribute('viewBox',innerWidth<=760&&!S.quiet?'410 -200 800 900':'0 0 1200 700');svg.setAttribute('preserveAspectRatio','xMidYMid meet');}
fit();window.addEventListener('resize',fit,{passive:true});

/* Local sound synthesis: no external files, streams, tracking or automatic sound.
   The four channel gains, master gain and sleep envelope remain independent. */
class SoundGarden{
 constructor(){this.ctx=null;this.channels={};this.enabled=false;this.nextBird=0;this.nextFire=0;this.sleepEnd=0;this.suspendTimer=0;}
 async init(){
  if(this.ctx)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('浏览器不支持 Web Audio');
  this.ctx=new AC();const a=this.ctx;
  this.master=a.createGain();this.master.gain.value=0;
  this.sleep=a.createGain();this.sleep.gain.value=1;
  this.limiter=a.createDynamicsCompressor();this.limiter.threshold.value=-17;this.limiter.knee.value=16;this.limiter.ratio.value=3;this.limiter.attack.value=.015;this.limiter.release.value=.22;
  this.master.connect(this.sleep);this.sleep.connect(this.limiter);this.limiter.connect(a.destination);
  this.fx=a.createGain();this.fx.gain.value=.38;this.fx.connect(this.master);
  const n=a.sampleRate*9;this.buffers={};
  for(const type of ['white','pink','brown']){
   const buffer=a.createBuffer(2,n,a.sampleRate),data=buffer.getChannelData(0);let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,brown=0;
   for(let i=0;i<n;i++){const w=Math.random()*2-1;if(type==='white')data[i]=w;else if(type==='brown'){brown=(brown+.018*w)/1.018;data[i]=brown*4.4;}else{b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;data[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.105;b6=w*.115926;}}
   // A short wrap blend prevents an abrupt loop boundary without long silent gaps.
   const blend=Math.floor(a.sampleRate*.08);for(let i=0;i<blend;i++){const q=i/blend;data[n-blend+i]=data[n-blend+i]*(1-q)+data[i]*q;}
   const right=buffer.getChannelData(1);for(let i=0;i<n;i++)right[i]=data[(i+Math.floor(n*.371))%n];
   this.buffers[type]=buffer;
  }
  const specs={ocean:['pink',720,.20,.11],wind:['pink',420,.24,.055],rain:['white',2100,.43,.055],brown:['brown',300,.4,.17],forest:['pink',1250,.30,.064],water:['pink',1100,.48,.083],fire:['brown',930,.5,.13],birds:['pink',1700,.4,.009],night:['pink',1000,.35,.032]};
  for(const [key]of C.mix){const[type,hz,q,vol]=specs[key];const source=a.createBufferSource();source.buffer=this.buffers[type];source.loop=true;const filter=a.createBiquadFilter();filter.type=key==='brown'?'lowpass':'bandpass';filter.frequency.value=hz;filter.Q.value=q;const high=a.createBiquadFilter();high.type='highpass';high.frequency.value=key==='brown'?35:70;const texture=a.createGain();texture.gain.value=vol;const gain=a.createGain();gain.gain.value=S.levels[key];source.connect(filter);filter.connect(high);high.connect(texture);texture.connect(gain);gain.connect(this.master);source.start(0,rnd(0,8));
   const lfo=a.createOscillator();lfo.type='sine';lfo.frequency.value=key==='ocean'?.085:key==='water'?.16:.048;const depth=a.createGain();depth.gain.value=vol*(key==='ocean'?.43:.13);lfo.connect(depth);depth.connect(texture.gain);lfo.start();this.channels[key]={gain,filter};
  }
  this.setSleep(S.deadline);
 }
 async toggle(){
  try{await this.init();clearTimeout(this.suspendTimer);if(!S.sound){await this.ctx.resume();if(this.ctx.state!=='running')throw Error('声音尚未启动');S.sound=true;this.enabled=true;this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setTargetAtTime(S.volume,this.ctx.currentTime,.7);this.nextBird=this.ctx.currentTime+5;this.nextFire=this.ctx.currentTime+4;}else this.mute();audioUI();}
  catch(e){S.sound=false;this.enabled=false;audioUI();say('声音暂时没有打开，画面和互动仍然可以使用。');}
 }
 mute(){S.sound=false;this.enabled=false;if(this.ctx){const now=this.ctx.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(0,now,.2);clearTimeout(this.suspendTimer);this.suspendTimer=setTimeout(()=>{if(!this.enabled)this.ctx.suspend().catch(()=>{});},1500);}audioUI();}
 volume(v){if(this.ctx&&this.enabled)this.master.gain.setTargetAtTime(v,this.ctx.currentTime,.15);}
 level(k,v){this.channels[k]?.gain.gain.setTargetAtTime(v,this.ctx.currentTime,.4);}
 setSleep(deadline){if(!this.ctx)return;const a=this.ctx,now=a.currentTime;this.sleep.gain.cancelScheduledValues(now);this.sleep.gain.setValueAtTime(1,now);if(deadline){const left=Math.max(0,(deadline-Date.now())/1000),fade=Math.min(30,left);this.sleep.gain.setValueAtTime(1,now+left-fade);this.sleep.gain.linearRampToValueAtTime(0,now+left);}this.sleepEnd=deadline;}
 tone(freq=440,duration=.6,volume=.075,delay=0,end=null){if(!this.ctx||!this.enabled||this.ctx.state!=='running')return;const a=this.ctx,at=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(freq,at);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(30,end),at+duration*.8);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+.045);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(this.fx);o.start(at);o.stop(at+duration+.06);o.onended=()=>{o.disconnect();g.disconnect();};}
 noise(duration=.4,volume=.05,hz=1100,q=.5,delay=0,pan=0,flutter=0){
  if(!this.ctx||!this.enabled||this.ctx.state!=='running')return;
  const a=this.ctx,at=a.currentTime+delay,source=a.createBufferSource(),filter=a.createBiquadFilter(),gain=a.createGain(),texture=a.createGain(),stereo=a.createStereoPanner();
  source.buffer=this.buffers.pink;filter.type='bandpass';filter.frequency.value=hz;filter.Q.value=q;stereo.pan.value=pan;
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+Math.min(.09,duration*.18));gain.gain.setTargetAtTime(volume*.4,at+duration*.25,duration*.17);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  source.connect(filter);filter.connect(texture);texture.connect(gain);gain.connect(stereo);stereo.connect(this.fx);
  let lfo,depth;if(flutter){lfo=a.createOscillator();depth=a.createGain();lfo.frequency.value=flutter;texture.gain.value=.72;depth.gain.value=.28;lfo.connect(depth);depth.connect(texture.gain);lfo.start(at);lfo.stop(at+duration);}
  source.start(at,rnd(0,7));source.stop(at+duration+.025);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();texture.disconnect();stereo.disconnect();lfo?.disconnect();depth?.disconnect();};
 }
 chime(base=680){const detune=rnd(.985,1.015);[[1,2.5,.075,0],[2.03,1.55,.019,.008],[2.71,1.15,.009,.015],[4.11,.7,.003,.01]].forEach(([ratio,d,v,t])=>this.tone(base*ratio*detune,d,v,t));this.noise(.07,.009,2600,1);}
 sfx(type){
  if(!this.ctx||!this.enabled)return;
  const now=this.ctx.currentTime;
  if(type==='pet'){if(now<(this.petAfter||0))return;this.petAfter=now+.8;
   if(C.index===1){this.noise(1.65,.14,155,.65,0,.08,25);this.noise(1.25,.025,760,.45,.09,-.12,24);}
   else this.noise(.9,.055,C.index===3?360:650,.5,0,.08,8);
  }else if(type==='bell'||type==='chime')this.chime(type==='bell'?840:610);
  else if(type==='pop')this.tone(rnd(800,1100),.085,.045,0,190);
  else if(['water','ripple','pour','paddle','citrus'].includes(type)){
   this.noise(type==='pour'?.85:.48,.065,1450,.6,0,-.12);
   for(let i=0;i<4;i++){const f=rnd(1050,1850);this.tone(f,.065,.018,i*.09+.12,f*1.6);}
  }else if(type==='shell'){this.tone(1140,.21,.025);this.tone(1725,.13,.012,.16);this.noise(.07,.015,1700,1.2);}
  else if(type==='nibble'){this.noise(.12,.055,1300,.8);this.noise(.14,.045,1000,.6,.24);}
  else if(['page','letter'].includes(type)){this.noise(.36,.09,1700,.6,0,-.25);this.noise(.21,.045,670,.6,.16,.2);}
  else if(['leaves','bamboo','rustle'].includes(type)){this.noise(.55,.06,2200,.45);this.noise(.4,.03,930,.6,.12,.22);}
  else if(['shoot','lantern','fireflies'].includes(type))this.chime(520);
  else if(['tea','cocoa','steam'].includes(type))this.noise(.65,.055,950,.55);
  else if(type==='fire'){this.noise(.08,.085,1500,.5);this.noise(.16,.035,700,.6,.19);}
  else this.noise(.3,.045,830,.6);
 }
 rustle(duration=.3,volume=.018){this.noise(duration,volume*2.3,1600,.55,0,rnd(-.35,.35));}

 tick(){if(!this.ctx||!this.enabled)return;const now=this.ctx.currentTime;if(now>this.nextBird){this.nextBird=now+rnd(11,21);if(S.levels.birds>.01){this.tone(1350,.3,S.levels.birds*.05,0,1750);this.tone(1680,.32,S.levels.birds*.035,.28,1280);}}if(now>this.nextFire){this.nextFire=now+rnd(2,6);if(S.levels.fire>.01)this.rustle(.15,S.levels.fire*.028);}}
 close(){clearTimeout(this.suspendTimer);if(this.ctx){this.enabled=false;this.ctx.close().catch(()=>{});this.ctx=null;}}
}
const sound=new SoundGarden();
function audioUI(){document.body.classList.toggle('sound-on',S.sound);$('soundIcon').setAttribute('href',S.sound?'#i-sound':'#i-mute');$('soundLabel').textContent=S.sound?'声音已打开':'打开声音';$('soundBtn').setAttribute('aria-pressed',String(S.sound));$('soundStatus').textContent=S.sound?'环境声陪伴中':'声音轻轻关着';}
$('soundBtn').addEventListener('click',()=>sound.toggle());$('master').value=Math.round(S.volume*100);$('master').addEventListener('input',e=>{S.volume=+e.target.value/100;sound.volume(S.volume);fillRange(e.target);save();});
C.mix.forEach(([key])=>{const el=$('mix-'+key);el.value=Math.round(S.levels[key]*100);$('val-'+key).textContent=el.value+'%';el.addEventListener('input',()=>{S.levels[key]=+el.value/100;$('val-'+key).textContent=el.value+'%';fillRange(el);sound.level(key,S.levels[key]);save();});});

/* Lightweight, bounded SVG particles; never a scoreboard or a demand for attention. */
const particles=[],drawings=[],flowerNodes=[];
const fx=$('effects'),bubbles=$('bubbleLayer');
const P={pet:C.pet||[820,370]};
function dropOld(){while(particles.length>130){particles.shift().el.remove();}}
function particle(kind,x,y,opts={}){
 let el,life=opts.life||rnd(2.5,4),s=opts.scale||1,vx=opts.vx??rnd(-18,18),vy=opts.vy??-rnd(14,35),color=opts.color||'#fff2cb';
 if(kind==='heart')el=node('path',{d:'M0 4C-24-9-9-24 0-13 9-24 24-9 0 4Z',fill:opts.color||'#e1b09f'},fx);
 else if(kind==='leaf')el=node('path',{d:'M-12 4Q-12-16 13-10 14 10-12 4Z',fill:opts.color||['#b8c399','#c9c398','#a7b795'][Math.floor(rnd(0,3))]},fx);
 else if(kind==='ripple'){el=node('ellipse',{cx:0,cy:0,rx:10,ry:3,fill:'none',stroke:C.night?'#e9dab5':'#fff9e1','stroke-width':1.8},fx);life=2.5;vx=vy=0;}
 else if(kind==='bubble'){el=node('g',{'class':'fx-bubble',role:'button',tabindex:'0','aria-label':'戳破小泡泡'},bubbles);const r=opts.r||rnd(13,26);node('circle',{r,fill:'#fffdf1','fill-opacity':.13,stroke:C.night?'#dad7e9':'#fafcf0','stroke-width':1.7},el);node('path',{d:`M${-r*.6} ${-r*.2}q0 ${-r*.42} ${r*.45} ${-r*.46}`,fill:'none',stroke:'#fff9e9','stroke-width':2,'stroke-linecap':'round'},el);life=rnd(9,14);vy=-rnd(22,44);el.addEventListener('pointerdown',e=>e.stopPropagation());const pop=e=>{e.stopPropagation();const p=particles.find(p=>p.el===el);if(p){p.life=0;burst(p.x,p.y,4,'spark');sound.sfx('pop');}};el.addEventListener('click',pop);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pop(e);}});}
 else if(kind==='steam'){el=node('path',{d:'M0 0q-15-17 0-33t-2-27',fill:'none',stroke:'#fff9e9','stroke-width':opts.width||7,'stroke-linecap':'round',opacity:.5},fx);life=3.5;vx=rnd(-3,3);vy=-14;}
 else if(kind==='orange'){el=node('g',{},fx);node('circle',{r:15,fill:'#e7bb65',stroke:'#bba367','stroke-width':1.5},el);node('path',{d:'M0-15q-3-12 5-15m-1 3q16-10 18-1-8 6-18 1',fill:'#aabb84',stroke:'#91a66f','stroke-width':1.5},el);life=11;vx=rnd(-9,9);vy=opts.drop?65:0;}
 else if(kind==='lantern'){el=node('g',{},fx);node('ellipse',{cy:21,rx:22,ry:5,fill:'#f4d5a0',opacity:.2},el);node('rect',{x:-15,y:-17,width:30,height:33,rx:4,fill:'#ecd1a1',stroke:'#c7ac87','stroke-width':1.5},el);node('path',{d:'M-17-17h34M-17 16h34M-8-17v33M8-17v33',fill:'none',stroke:'#bea382','stroke-width':1.3},el);node('ellipse',{cy:0,rx:5,ry:9,fill:'#fff3be'},el);life=18;vx=rnd(-22,-9);vy=-rnd(2,4);}
 else if(kind==='letter'){el=node('g',{},fx);node('rect',{x:-21,y:-14,width:42,height:28,rx:4,fill:'#fff1d4',stroke:'#bdaa92','stroke-width':1.5},el);node('path',{d:'M-20-12L0 2 20-12',fill:'none',stroke:'#b9a88f','stroke-width':1.4},el);node('circle',{cy:3,r:3,fill:'#d7aa9b'},el);life=7;vx=-40;vy=-37;}
 else if(kind==='butterfly'){el=node('g',{},fx);for(const sign of [-1,1])node('path',{d:`M0 0Q${sign*27}-27 ${sign*24}-2Q${sign*25}17 0 4Z`,fill:opts.color||'#e7c29d','fill-opacity':.9,stroke:'#c4b39a','stroke-width':1},el);node('path',{d:'M0-5V9',stroke:'#9e9b80','stroke-width':2,'stroke-linecap':'round'},el);life=12;vx=rnd(-25,25);vy=-rnd(5,16);}
 else if(kind==='shoot'){el=node('g',{},fx);node('path',{d:'M0 0L-100-46',stroke:'#f3dfb9','stroke-width':2.2,'stroke-linecap':'round',opacity:.6},el);node('circle',{r:3,fill:'#fff1cb'},el);life=1.5;vx=215;vy=100;}
 else if(kind==='snow'){el=node('circle',{r:rnd(2,4),fill:'#fffdf1',opacity:.8},fx);life=5;vx=rnd(-10,10);vy=rnd(18,32);}
 else if(kind==='drop'){el=node('path',{d:'M0-9q-8 13 0 12 8 1 0-12Z',fill:'#bccfbc'},fx);life=1.4;vx=rnd(-20,20);vy=rnd(60,100);}
 else if(kind==='fish'){el=node('g',{},fx);node('path',{d:'M-20 0q16-22 35-5l13-8v25L15 5q-19 17-35-5Z',fill:'#b6c6ba',stroke:'#899d8b','stroke-width':1.5},el);node('circle',{cx:-9,cy:-3,r:2,fill:'#718573'},el);life=1.5;vx=vy=0;}
 else{el=node('path',{d:'M0-8L2-2 8 0 2 2 0 8-2 2-8 0-2-2Z',fill:color},fx);if(kind==='firefly'){life=11;vx=rnd(-10,10);vy=rnd(-12,4);}}
 el.setAttribute('transform',`translate(${x} ${y}) scale(${s})`);
 particles.push({el,kind,x,y,startX:x,startY:y,life,total:life,age:0,vx,vy,scale:s,phase:rnd(0,6.28),drop:opts.drop});dropOld();return el;
}
function burst(x,y,n=5,kind='heart'){if(S.reduced)n=Math.min(n,3);for(let i=0;i<n;i++)particle(kind,x+rnd(-30,30),y+rnd(-13,12),{scale:rnd(.35,.68)});}
function bubbleBatch(n=5){const amount=S.reduced?2:n;for(let i=0;i<amount;i++)particle('bubble',rnd(600,1030),rnd(460,620));}
function makeRipples(x,y){particle('ripple',x,y);setTimeout(()=>{if(document.contains(svg))particle('ripple',x,y);},370);}
function updateParticles(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;p.life-=dt;if(p.life<=0){p.el.remove();particles.splice(i,1);continue;}const ratio=p.age/p.total,travel=S.reduced?.12:1;p.x+=p.vx*dt*travel;p.y+=p.vy*dt*travel;let size=p.scale,angle=0,opacity=Math.min(1,p.life/.8);
 if(p.kind==='ripple'){p.el.setAttribute('rx',f(10+p.age*33));p.el.setAttribute('ry',f(3+p.age*8));opacity=(1-ratio)*.72;}
 else if(p.kind==='heart')angle=Math.sin(p.age*2+p.phase)*10;
 else if(p.kind==='leaf'){p.x+=Math.sin(p.age*2+p.phase)*18*dt*travel;p.y+=36*dt*travel;angle=p.phase*45+Math.sin(p.age*2)*35;}
 else if(p.kind==='butterfly'){p.x+=Math.cos(p.age*2+p.phase)*24*dt*travel;p.y+=Math.sin(p.age*2)*14*dt*travel;const flap=S.reduced?1:.58+.35*Math.cos(p.age*13);p.el.setAttribute('transform',`translate(${f(p.x)} ${f(p.y)}) scale(${f(size*flap)} ${f(size)})`);p.el.setAttribute('opacity',f(opacity));continue;}
 else if(p.kind==='bubble')p.x+=Math.sin(p.age+p.phase)*12*dt*travel;
 else if(p.kind==='steam'){size*=1+ratio*.6;opacity=.5*(1-ratio);}
 else if(p.kind==='orange'){if(p.drop&&p.y>553){p.y=553;p.vy=0;p.drop=false;makeRipples(p.x,562);}p.y+=Math.sin(p.age*2+p.phase)*2*dt;angle=Math.sin(p.age+p.phase)*8;}
 else if(p.kind==='lantern'){size*=1-ratio*.42;p.y+=Math.sin(p.age)*2*dt;angle=Math.sin(p.age)*2;}
 else if(p.kind==='letter')angle=Math.sin(p.age*2)*12;
 else if(p.kind==='fish'){const q=Math.min(1,p.age/.95),ease=q*q*(3-2*q);p.x=p.startX+(907-p.startX)*ease;p.y=p.startY+(220-p.startY)*ease-Math.sin(q*Math.PI)*70;opacity=q<.9?1:Math.max(0,(1-q)*10);}
 else if(p.kind==='firefly'){p.x+=Math.sin(p.age+p.phase)*16*dt;opacity*=.45+.45*Math.sin(p.age*2+p.phase);}
 p.el.setAttribute('transform',`translate(${f(p.x)} ${f(p.y)}) rotate(${f(angle)}) scale(${f(size)})`);p.el.setAttribute('opacity',f(opacity));}}
function growFlower(x,y){while(flowerNodes.length>=20)flowerNodes.shift().remove();const g=node('g',{transform:`translate(${x} ${y})`},$('gardenFlowers')||fx),stem=node('path',{d:'M0 0Q-6 25 0 43',fill:'none',stroke:'#8b9c76','stroke-width':2.5},g);node('path',{d:'M0 26q-20-14-20-2 7 10 20 7m0-12q17-12 18-2-5 10-18 7',fill:'#a8b58c'},g);const bloom=node('g',{},g),col=['#edc2b2','#e9d6a0','#d9b3b4','#f4e4b5'][Math.floor(rnd(0,4))];for(let i=0;i<5;i++)node('ellipse',{cy:-9,rx:6,ry:10,fill:col,transform:`rotate(${i*72})`},bloom);node('circle',{r:5.5,fill:'#d7b771'},bloom);flowerNodes.push(g);if(!S.reduced)g.animate([{transform:`translate(${x}px,${y+30}px) scale(.15)`,opacity:0},{transform:`translate(${x}px,${y}px) scale(1)`,opacity:1}],{duration:1400,easing:'cubic-bezier(.2,.65,.3,1)'});}

const lines={
 pet:['嗯，好舒服呀。','不用着急，我陪着你。','今天也辛苦啦。','可以再摸一下吗？'],feed:['谢谢你的小鱼，开心又多了一点。'],bubbles:['泡泡不用追，轻轻戳一下就好。'],bell:['叮——慢慢来就好。'],page:['这一页写着：你不必时时刻刻都很厉害。','这一页写着：今天就到这里，也很好。','这一页写着：慢一点，也能看到好风景。','这一页写着：先把自己照顾好。'],tea:['茶还是热的，先歇一歇。'],draw:['在窗上画点什么吧，它们会慢慢消散。'],swing:['风过来了，轻轻荡一下。'],leaves:['让树叶替你赶一会儿路。'],butterflies:['一只小蝴蝶，路过你的下午。'],citrus:['一颗小柚子，把今天泡得软软的。'],steam:['热气轻轻升起来了。'],ripple:['这一圈涟漪，慢慢就平静了。'],paddle:['只划一下，也已经很好。'],lantern:['愿今天的你，被温柔接住。','把一句没说完的话，交给这盏灯。'],shoot:['不必许愿，看看星星也很好。'],fire:['添一根木柴，暖一小会儿。'],cocoa:['小心烫，慢慢喝。'],snow:['雪落得很慢，今晚也是。'],letter:['寄给你：你已经做得够好了。','寄给明天：请对我温柔一点。','寄给今天：谢谢你坚持到这里。'],lift:['再往上，烦恼就小一点。'],cloud:['这一朵云，暂时借给你。'],pour:['水刚好温，下午也刚刚好。'],chime:['把心事放下，听这一声就好。'],bamboo:['沙沙——竹叶替你回答了。'],water:['慢慢长大，就很好。'],plant:['又种下一个小小的盼头。'],toast:['棉花糖变暖了，别急着咬第一口。'],fireflies:['小小的亮光，也能把夜晚照亮。']};
function act(kind,p=null,announce=true){
 S.action=kind;S.actionAt=S.ui;document.dispatchEvent(new CustomEvent('island:action',{detail:{kind}}));const box=document.querySelector('.companion-touch-target')?.getBoundingClientRect();const xy=p||(box?pos({clientX:box.left+box.width*.5,clientY:box.top+box.height*.35}):{x:P.pet[0],y:P.pet[1]});sound.sfx(kind);
 if(kind==='pet'){document.dispatchEvent(new Event('island:pet'));S.happy=S.ui+3.2;burst(xy.x,xy.y-32,4);}
 else if(kind==='feed'){S.happy=S.ui+4;document.dispatchEvent(new Event('island:feed'));}
 else if(kind==='bubbles')bubbleBatch(6);
 else if(kind==='bell'||kind==='chime'){burst(kind==='bell'?937:981,kind==='bell'?319:165,5,'spark');}
 else if(kind==='page'){const book=$('book');if(book&&!S.reduced)book.animate([{opacity:.55},{opacity:1}],{duration:700});burst(822,510,3,'spark');}
 else if(['tea','cocoa','steam','pour'].includes(kind)){const [x,y]=kind==='tea'?[1055,505]:kind==='cocoa'?[758,436]:kind==='pour'?[827,510]:[805,451];for(let i=0;i<4;i++)particle('steam',x+rnd(-25,25),y+rnd(-10,10));if(kind==='pour')for(let i=0;i<6;i++)particle('drop',867+rnd(-8,8),517+rnd(-9,9),{scale:.45});}
 else if(kind==='draw'){$('drawAction')?.classList.toggle('active');}
 else if(kind==='swing'){S.omega=clamp(S.omega+.28,-.65,.65);}
 else if(kind==='leaves'||kind==='bamboo'){for(let i=0;i<13;i++)particle('leaf',rnd(615,1100),rnd(170,355),{life:rnd(4,7),scale:rnd(.5,.85)});}
 else if(kind==='butterflies'){for(let i=0;i<4;i++)particle('butterfly',rnd(575,1040),rnd(435,590),{scale:rnd(.38,.65)});}
 else if(kind==='citrus')particle('orange',p?.x||rnd(664,985),p?.y||435,{drop:true});
 else if(kind==='ripple')makeRipples(p?.x||rnd(665,1000),p?.y||(C.index===3?569:C.index===4?602:491));
 else if(kind==='paddle'){S.boatX=clamp(S.boatX-20,-90,90);makeRipples(985+S.boatX,606+S.boatY);}
 else if(kind==='lantern')particle('lantern',rnd(675,1040),rnd(599,655));
 else if(kind==='shoot')particle('shoot',rnd(582,787),rnd(80,175));
 else if(kind==='fire'){S.flame=1;for(let i=0;i<7;i++)particle('spark',C.index===5?1039:946,C.index===5?479:579,{scale:.3,life:2});}
 else if(kind==='snow'){for(let i=0;i<20;i++)particle('snow',rnd(1084,1144),rnd(554,583));}
 else if(kind==='letter')particle('letter',835,501,{scale:1.1});
 else if(kind==='lift'){S.liftTarget=clamp(S.liftTarget-32,-48,26);if(S.liftTarget<=-48)S.liftTarget=15;}
 else if(kind==='cloud'){for(let i=0;i<9;i++)particle('bubble',rnd(480,1080),rnd(300,570),{r:rnd(14,28)});}
 else if(kind==='water'){for(let i=0;i<20;i++)particle('drop',rnd(1056,1116),rnd(549,579),{scale:rnd(.4,.7)});document.querySelectorAll('.garden-flower').forEach(el=>{if(!S.reduced)el.animate([{opacity:.6},{opacity:1}],{duration:1100});});}
 else if(kind==='plant')growFlower(clamp(p?.x||rnd(475,1150),455,1145),clamp(p?.y||rnd(590,642),565,650));
 else if(kind==='toast'){S.happy=S.ui+3;burst(937,542,4,'spark');}
 else if(kind==='fireflies'){for(let i=0;i<14;i++)particle('firefly',rnd(475,1140),rnd(349,625),{scale:rnd(.25,.5)});}
 if(announce&&lines[kind]){const a=lines[kind];say(a[Math.floor(Math.random()*a.length)]);}
}
document.querySelectorAll('button[data-act]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.act==='bubbles'&&performance.now()-holdStarted>500&&holdStarted>0){holdStarted=0;return;}act(button.dataset.act);}));
const bubbleButton=document.querySelector('button[data-act="bubbles"]');
function stopHold(){clearTimeout(holdTimer);clearInterval(holdTimer);holdTimer=0;}
if(bubbleButton){bubbleButton.addEventListener('pointerdown',()=>{holdStarted=performance.now();stopHold();holdTimer=setTimeout(()=>{bubbleBatch(3);holdTimer=setInterval(()=>bubbleBatch(2),480);},420);});['pointerup','pointercancel','pointerleave'].forEach(k=>bubbleButton.addEventListener(k,stopHold));}

/* Pointer gestures preserve the character's rig instead of translating body parts. */
const clouds=[...svg.querySelectorAll('.cloud')].map((el,i)=>({el,x:+el.dataset.x,y:+el.dataset.y,s:+el.dataset.scale,ox:0,oy:0,i}));
const offsets=new Map();
let suppressClick=false;
svg.addEventListener('pointerdown',e=>{
 if(e.button&&e.button!==0)return;const p=pos(e);S.pointer=p;
 if(e.target.closest('.companion-hit'))return;
 const dr=e.target.closest('[data-drag]');
 if(dr){e.preventDefault();const kind=dr.dataset.drag;S.drag={el:dr,kind,start:p,last:p,moved:false,pointer:e.pointerId,at:performance.now(),cloud:clouds.find(c=>c.el===dr),angle:S.angle,originX:S.boatX,originY:S.boatY,startLift:S.liftTarget,startBX:S.balloonX,clickAct:e.target.closest('[data-act]')?.dataset.act};try{svg.setPointerCapture(e.pointerId);}catch(_){}return;}
 if(e.target.closest('[data-draw]')){e.preventDefault();const el=node('path',{d:`M${f(p.x)} ${f(p.y)}`,fill:'none',stroke:'#fff8e8','stroke-width':4.5,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.7},$('drawing'));S.draw={el,path:`M${f(p.x)} ${f(p.y)}`,pointer:e.pointerId,count:0};drawings.push({el,at:S.ui});while(drawings.length>35)drawings.shift().el.remove();try{svg.setPointerCapture(e.pointerId);}catch(_){}return;}
 if(e.target.closest('[data-act="pet"]')){S.petting=true;S.lastPet=S.ui;act('pet',p,false);}
});
svg.addEventListener('pointermove',e=>{
 const p=pos(e);S.pointer=p;
 if(S.draw&&S.draw.pointer===e.pointerId){e.preventDefault();if(S.draw.count++%2===0){S.draw.path+=`L${f(clamp(p.x,556,1074))} ${f(clamp(p.y,75,476))}`;S.draw.el.setAttribute('d',S.draw.path);}return;}
 const d=S.drag;if(d&&d.pointer===e.pointerId){e.preventDefault();const dx=p.x-d.start.x,dy=p.y-d.start.y;d.moved=d.moved||Math.hypot(dx,dy)>6;
 if(d.kind==='cloud'){d.cloud.ox=clamp(dx,-320,320);d.cloud.oy=clamp(dy,-160,200);}
 else if(d.kind==='swing'){const angle=clamp(Math.atan2(p.x-827,Math.max(140,p.y-148)),-.3,.3),now=performance.now();S.omega=clamp((angle-S.angle)/Math.max(.016,(now-d.at)/1000),-.8,.8);S.angle=angle;d.at=now;}
 else if(d.kind==='boat'){S.boatX=clamp(d.originX+dx,-220,160);S.boatY=clamp(d.originY+dy,-25,40);}
 else if(d.kind==='balloon'){S.liftTarget=clamp(d.startLift+dy,-50,45);S.balloonX=clamp(d.startBX+dx,-120,145);}
 else{const x=clamp(+d.el.dataset.x+dx,520,1150),y=clamp(+d.el.dataset.y+dy,315,650);transform(d.el,`translate(${f(x)} ${f(y)})`);offsets.set(d.el,{x,y});}d.last=p;return;}
 if(S.petting&&S.ui-S.lastPet>.35){S.lastPet=S.ui;S.happy=S.ui+2;particle('heart',p.x,p.y-20,{scale:.4});}
},{passive:false});
function endPointer(e){
 if(S.draw&&(!e||e.pointerId===S.draw.pointer)){S.draw=null;suppressClick=true;setTimeout(()=>suppressClick=false,60);}
 const d=S.drag;if(d&&(!e||e.pointerId===d.pointer)){if(d.moved){suppressClick=true;setTimeout(()=>suppressClick=false,90);if(d.kind==='citrus'){const p=d.last;if(p.x>560&&p.x<1070&&p.y>464)act('citrus',{x:p.x,y:Math.min(p.y,548)});offsets.delete(d.el);transform(d.el,`translate(${d.el.dataset.x} ${d.el.dataset.y})`);}else if(d.kind==='boat'){makeRipples(842+S.boatX,584+S.boatY);}else if(d.kind==='lamp'){burst(d.last.x,d.last.y-18,4,'spark');}}
 if(d.kind==='cloud'&&d.moved)say('这朵云，慢慢放下就好。');S.drag=null;}
 S.petting=false;try{if(e&&svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);}catch(_){}
}
svg.addEventListener('pointerup',endPointer);svg.addEventListener('pointercancel',endPointer);svg.addEventListener('lostpointercapture',()=>{S.petting=false;});
svg.addEventListener('click',e=>{if(suppressClick||e.target.closest('.companion-hit'))return;const el=e.target.closest('[data-act]');if(el){if(el.dataset.act==='pet'&&S.ui-S.lastPet<.1){say(lines.pet[Math.floor(rnd(0,lines.pet.length))]);return;}act(el.dataset.act,pos(e));}else if(e.target.closest('[data-drag="swing"]'))act('swing');else if(e.target.closest('[data-drag="balloon"]'))act('lift');});
svg.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' '||e.target.closest('.companion-hit'))return;const el=e.target.closest('[data-act],[data-drag]');if(!el)return;e.preventDefault();const kind=el.dataset.act||({swing:'swing',boat:'paddle',balloon:'lift',citrus:'citrus',cloud:'cloud',lamp:'fireflies'})[el.dataset.drag];if(kind)act(kind);});

/* An independent visual clock keeps pausing the illustration separate from audio. */
const eyes=[...svg.querySelectorAll('.eyes')],happyEyes=[...svg.querySelectorAll('.happy-eyes')];
const actor=$('actor'),actorBase=actor?.dataset.base?.split(' ').map(Number);
const wheels=[...svg.querySelectorAll('.spin')],flames=[...svg.querySelectorAll('.flame')];
function drawScene(dt){
 const t=S.t,age=S.ui-S.actionAt,happy=S.ui<S.happy,blink=!S.reduced&&(t%6.6)>6.4;
 eyes.forEach(e=>{e.setAttribute('opacity',happy||blink?'0':'1');const gx=S.reduced?0:clamp((S.pointer.x-810)/260,-1.3,1.3);transform(e,`translate(${f(gx)} 0)`);});happyEyes.forEach(e=>e.setAttribute('opacity',happy||blink?'1':'0'));
 if(actorBase){const y=0;transform(actor,`translate(${actorBase[0]} ${f(actorBase[1]+y)})`);}
 clouds.forEach(c=>{if(S.drag?.cloud!==c){c.ox*=Math.exp(-dt*.19);c.oy*=Math.exp(-dt*.19);}const drift=S.reduced?0:Math.sin(t*.032+c.i)*26;transform(c.el,`translate(${f(c.x+drift+c.ox)} ${f(c.y+c.oy)}) scale(${c.s})`);});
 if(C.index===0){
  const phase=t*2.2,bob=S.reduced?0:Math.sin(phase*2)*1.1;
  wheels.forEach(w=>transform(w,`rotate(${f(phase*100%360)})`));
  transform($('crank'),`translate(16 79) rotate(${f(phase*180/Math.PI)})`);
  for(const [side,offset,hx] of [['Far',Math.PI,-82],['Near',0,-68]]){
   const a=phase+offset,px=16+Math.cos(a)*23,py=79+Math.sin(a)*23,hy=-88+bob;
   const ax=px,ay=py-5,dx=ax-hx,dy=ay-hy,d=Math.hypot(dx,dy),upper=111,lower=108;
   const along=(upper*upper-lower*lower+d*d)/(2*d),across=Math.sqrt(Math.max(0,upper*upper-along*along));
   const kx=hx+along*dx/d+across*dy/d,ky=hy+along*dy/d-across*dx/d;
   $('rideLeg'+side).setAttribute('d',`M${hx} ${f(hy)}L${f(kx)} ${f(ky)} ${f(ax)} ${f(ay)}`);
   $('rideFoot'+side).setAttribute('d',`M${f(px-6)} ${f(py-4)}q8-3 22 3h-22Z`);
  }
  transform(actor,`translate(0 ${f(bob)})`);
 }
 if(C.index===2){if(S.drag?.kind!=='swing'){if(!S.reduced&&S.run){S.omega+=(-1.3*S.angle-.27*S.omega)*dt;S.angle=clamp(S.angle+S.omega*dt,-.34,.34);}if(S.reduced)S.angle*=Math.exp(-dt*4);}transform($('swingRig'),`translate(827 148) rotate(${f(S.angle*180/Math.PI)})`);}
 if(C.index===4){if(S.run&&!S.reduced&&S.drag?.kind!=='boat'){S.boatX*=Math.exp(-dt*.16);S.boatY*=Math.exp(-dt*.3);}const wave=S.reduced?0:Math.sin(t*.8)*3;transform($('boatRig'),`translate(${f(826+S.boatX)} ${f(495+S.boatY+wave)}) rotate(${f(S.reduced?0:Math.sin(t*.7)*1.2)})`);const stroke=S.action==='paddle'&&age<2?Math.sin(age*Math.PI)*12:0;transform($('paddle'),`translate(105 -20) rotate(${f(stroke)})`);}
 if(C.index===6){if(S.run&&!S.reduced)S.lift+=(S.liftTarget-S.lift)*(1-Math.exp(-dt*3));if(S.drag?.kind!=='balloon')S.balloonX*=Math.exp(-dt*.12);transform($('balloonRig'),`translate(${f(837+S.balloonX)} ${f(445+S.lift+(S.reduced?0:Math.sin(t*.7)*4))}) rotate(${f(S.reduced?0:Math.sin(t*.38)*1.2)} 0 -140)`);}
 if(C.index===7){const theta=S.action==='chime'&&age<5?Math.sin(age*7)*10*Math.exp(-age*.55):S.reduced?0:Math.sin(t)*1.3;transform($('windChime'),`translate(981 105) rotate(${f(theta)})`);transform($('teapot'),`translate(931 531) rotate(${f(S.action==='pour'&&age<2.3?-Math.sin(age/2.3*Math.PI)*23:0)})`);}
 if(C.index===8)transform($('wateringCan'),`translate(1010 580) rotate(${f(S.action==='water'&&age<2.4?Math.sin(age/2.4*Math.PI)*20:0)})`);
 if(C.index===9){const warm=S.action==='toast'&&age<9;const marsh=$('marshmallow');if(marsh)marsh.setAttribute('fill',warm&&age>1.3?'#dfbc93':'#f5e5c7');transform($('toastStick'),`rotate(${f(S.action==='toast'&&age<3?Math.sin(age/3*Math.PI)*7:0)} 846 560)`);}
 const snow=$('snowGlobe');if(snow)transform(snow,`translate(1113 601) rotate(${f(S.action==='snow'&&age<2&&!S.reduced?Math.sin(age*12)*7*(1-age/2):0)})`);
 const weather=$('weatherLines');if(weather)transform(weather,`translate(${C.index===1?-((t*4)%9):0} ${f(S.reduced?0:Math.sin(t*.6)*7)})`);
 S.flame*=Math.exp(-dt*.3);flames.forEach(el=>el.style.opacity=f(.88+S.flame*.12));
 for(const[el,o]of offsets){if(S.drag?.el===el)continue;const x=+el.dataset.x,y=+el.dataset.y;o.x+=(x-o.x)*(1-Math.exp(-dt*2.4));o.y+=(y-o.y)*(1-Math.exp(-dt*2.4));transform(el,`translate(${f(o.x)} ${f(o.y)}) rotate(${f((o.x-x)*.1)})`);if(Math.hypot(o.x-x,o.y-y)<.15)offsets.delete(el);}
 for(let i=drawings.length-1;i>=0;i--){const d=drawings[i],a=S.ui-d.at;if(a>18){d.el.remove();drawings.splice(i,1);}else d.el.setAttribute('opacity',f(.66*(1-Math.max(0,a-5)/13)));}
 if(S.breathing){const p=(S.ui-S.breathAt)%10,inhale=p<4,e=inhale?.5-.5*Math.cos(p/4*Math.PI):.5+.5*Math.cos((p-4)/6*Math.PI);$('breathCore').style.transform=`scale(${S.reduced?1:.72+e*.78})`;$('breathText').textContent=inhale?'轻轻吸气':'慢慢呼气';}
}
function playbackUI(){document.body.classList.toggle('paused',!S.run);$('playIcon').setAttribute('href',S.run?'#i-pause':'#i-play');$('playBtn').setAttribute('aria-label',S.run?'暂停画面，保留声音':'继续播放画面');$('playBtn').setAttribute('aria-pressed',String(!S.run));}
function pause(){S.run=!S.run;playbackUI();say(S.run?'继续慢慢来。':'画面停一会儿，声音可以继续陪你。');}
$('playBtn').addEventListener('click',pause);$('pace').value=S.speed;$('paceValue').textContent=S.speed.toFixed(2)+'×';$('pace').addEventListener('input',e=>{S.speed=+e.target.value;$('paceValue').textContent=S.speed.toFixed(2)+'×';fillRange(e.target);save();});
$('breathBtn').addEventListener('click',()=>{S.breathing=!S.breathing;S.breathAt=S.ui;document.body.classList.toggle('breathing',S.breathing);$('breathBtn').setAttribute('aria-pressed',String(S.breathing));if(S.breathing)say('跟着舒服的节奏就好，不需要勉强自己。');});
function quiet(value){S.quiet=value;document.body.classList.toggle('immersive',value);fit();(value?$('exitQuiet'):$('quietBtn')).focus({preventScroll:true});}
$('quietBtn').addEventListener('click',()=>quiet(true));$('exitQuiet').addEventListener('click',()=>quiet(false));
function finishRest(){clearTimeout(sleepTimer);S.deadline=0;S.run=false;sound.mute();playbackUI();$('timer').value='0';$('timerNote').textContent='这一小段安静，先陪你到这里。';say('休息时间到了。我们一起停一会儿。');}
$('timer').addEventListener('change',()=>{const m=+$('timer').value;clearTimeout(sleepTimer);S.deadline=m?Date.now()+m*60000:0;sound.setSleep(S.deadline);if(m){sleepTimer=setTimeout(finishRest,m*60000);say(`${m} 分钟后，声音会在最后半分钟慢慢淡出。`);}else $('timerNote').textContent='暂停画面，也可以只听声音。';});
setInterval(()=>{sound.tick();if(S.deadline){const sec=Math.ceil((S.deadline-Date.now())/1000);if(sec<=0)finishRest();else $('timerNote').textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')} 后慢慢收声${sec<=30?' · 正在淡出':''}`;}},1000);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.quiet){e.preventDefault();quiet(false);return;}if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,button,a,[role="button"],textarea,[contenteditable]'))return;if(e.code==='Space'){e.preventDefault();pause();}else if(e.code==='KeyM')sound.toggle();else if(e.code==='KeyP')act('pet');});
document.querySelectorAll('[data-nav]').forEach(a=>a.addEventListener('click',e=>{if(window.parent!==window){e.preventDefault();sound.close();window.parent.postMessage({type:'slow-island-navigate',id:a.dataset.nav},'*');}}));
window.addEventListener('message',e=>{if(e.source===window.parent&&e.data?.type==='slow-island-stop')sound.close();});
window.addEventListener('pagehide',()=>{stopHold();sound.close();});
window.addEventListener('blur',()=>{stopHold();endPointer();});
document.addEventListener('visibilitychange',()=>{S.last=0;if(document.hidden){stopHold();endPointer();}else if(S.deadline&&Date.now()>S.deadline)finishRest();});
reduced.addEventListener?.('change',e=>{S.reduced=e.matches;if(e.matches){S.run=false;playbackUI();}});
function frame(now){requestAnimationFrame(frame);if(document.hidden)return;if(!S.last){S.last=now;return;}if(now-S.last<1000/30)return;const dt=Math.min((now-S.last)/1000,.075);S.last=now;S.ui+=dt;if(S.run&&!S.reduced)S.t+=dt*S.speed;drawScene(dt);updateParticles(dt);}
window.IslandCompanion={name:C.nickname,fullName:C.animal,snack:C.snack,point:pos,pet:p=>act('pet',p,false),say,paused:()=>!S.run,sound:type=>sound.sfx(type),effect:(kind,p,n=1)=>{for(let i=0;i<Math.min(n,4);i++)particle(kind,p.x+rnd(-12,12),p.y+rnd(-5,5),{scale:kind==='ripple'?1:.55,life:kind==='bubble'?7:3.5});}};
document.querySelectorAll('input[type=range]').forEach(fillRange);audioUI();playbackUI();drawScene(0);requestAnimationFrame(frame);
})();
