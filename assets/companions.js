/* Continuous animal contours and an articulated cartoon petting hand. */
(() => {
'use strict';
const api=window.IslandCompanion,hit=document.querySelector('.companion-hit'),target=document.querySelector('.companion-touch-target'),motion=document.querySelector('.companion-motion'),art=document.getElementById('art')||document.getElementById('sceneSvg'),head=document.querySelector('.companion-head'),portrait=document.querySelector('.companion-art');
if(!api||!hit||!head)return;
const NS='http://www.w3.org/2000/svg',name=api.name,index=+motion.dataset.rig,reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer: fine)');
const face={x:+head.dataset.faceX,y:+head.dataset.faceY},pivot={x:+head.dataset.pivotX,y:+head.dataset.pivotY},expression=portrait.querySelector('.companion-expression'),tail=document.querySelector('.companion-tail');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rig=window.createAnimalRig(portrait);let hand=null,handSide=1;
  const icons = {
    pet: '<path d="M17 41c-7-4-9-13-12-19-2-5 4-8 7-3l4 6V9c0-5 6-5 6 0v12-16c0-5 6-5 6 0v17-14c0-5 6-5 6 0v15-11c0-4 6-4 6 0v18c0 10-6 16-14 16Z" fill="#f5dcc0" stroke="#8e735b" stroke-width="1.8" stroke-linejoin="round"/><path d="M24 30q6-3 10 1" fill="none" stroke="#d4a888" stroke-width="1.6" stroke-linecap="round"/>',
    toy: '<path d="M8 43 27 5" fill="none" stroke="#95765a" stroke-width="3" stroke-linecap="round"/><path d="M27 5q20 1 13 21" fill="none" stroke="#a99c83" stroke-width="1.2"/><path d="M40 23q-17 2-12 16 13 5 16-10Z" fill="#b6c7a2" stroke="#7e9674" stroke-width="1.3"/><path d="m39 26-8 12" stroke="#7e9674" stroke-width="1.2"/><circle cx="40" cy="23" r="3" fill="#dab881"/>',
    treat: '<path d="M9 23C6 13 15 7 24 10 34 5 43 15 38 25c5 12-8 18-17 13C10 42 4 31 9 23Z" fill="#e8c78d" stroke="#a58050" stroke-width="1.7"/><path d="m17 17 2 2m10-2 2 2m-8 9 2 2m-12-2 1 1m16 3 1 1" stroke="#b48954" stroke-width="3" stroke-linecap="round"/>'
  };
  if (/小鱼/.test(api.snack)) icons.treat='<path d="M5 23C12 10 28 11 34 20l10-8v22l-10-7C24 38 11 35 5 23Z" fill="#b2c9c1" stroke="#6d9187" stroke-width="1.8" stroke-linejoin="round"/><circle cx="13" cy="21" r="2" fill="#56776f"/><path d="M26 19v10" stroke="#7fa295" stroke-width="1.5"/>';
  else if (/胡萝卜/.test(api.snack)) icons.treat='<path d="M15 14Q27 11 31 23L12 43Z" fill="#e7ab6a" stroke="#b08048" stroke-width="1.7"/><path d="M20 15 17 4m6 12 9-12m-7 13 13-5" fill="none" stroke="#8eaa71" stroke-width="4" stroke-linecap="round"/><path d="m15 25 6 1m-8 9 5 1" stroke="#c68a4e" stroke-width="2"/>';
  else if (/叶/.test(api.snack)) icons.treat='<path d="M9 39C1 17 20 5 41 8 42 31 30 45 9 39Z" fill="#b8c993" stroke="#7d995f" stroke-width="1.8"/><path d="M8 42 34 15m-15 17-1-12m9 4 8-1" fill="none" stroke="#859e6b" stroke-width="1.6" stroke-linecap="round"/>';
  else if (/苹果/.test(api.snack)) icons.treat='<path d="M24 14C7 4 3 22 11 35q7 10 13 4c9 6 17-7 17-17Q40 7 24 14Z" fill="#db9c89" stroke="#ac7362" stroke-width="1.8"/><path d="M24 15 26 5" stroke="#8a795b" stroke-width="2"/><path d="M26 9Q31 0 39 6q-3 7-13 3" fill="#9eb885"/>';
const toys=[
'<circle cx="24" cy="24" r="15" fill="#e3eeee" fill-opacity=".32" stroke="#90afb1" stroke-width="1.5"/><path d="M14 22q0-9 10-10" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/>',
icons.toy,
'<g class="butterfly-wing"><path d="M24 25C5-5-4 21 19 28 0 28 14 48 24 29Z" fill="#e1b696"/><path d="M24 25C43-5 52 21 29 28 48 28 34 48 24 29Z" fill="#edd5a6"/></g><path d="M24 18v14m0-10-4-8m4 8 4-8" stroke="#8d8b6f" stroke-width="1.5"/>',
'<path d="M24 5C21 13 11 24 12 30a12 12 0 0 0 24 0C37 24 27 13 24 5Z" fill="#b6d3d2" stroke="#85abaa" stroke-width="1.4"/><path d="M18 27q-4 7 4 9" fill="none" stroke="#edf5e9" stroke-width="2"/>',
'<path d="M6 25C-2 7 17 5 24 11 33 1 52 14 41 28L28 40h-9Z" fill="#e6c5ac" stroke="#b79481" stroke-width="1.5"/><path d="M24 37 13 14m11 23L24 12m0 25 12-22M18 40h13" fill="none" stroke="#c39f8b" stroke-width="1.4"/>',
'<path d="M32 22q17-3 10 12-3 4-10 1" fill="none" stroke="#b5967d" stroke-width="3"/><path d="M9 19h25l-2 22q-10 5-22-1Z" fill="#f0dfbd" stroke="#b5967d" stroke-width="1.5"/><ellipse cx="21" cy="19" rx="12" ry="3" fill="#9c7860"/><path class="toy-float" d="M17 12q-5-5 0-10m9 11q5-5 0-10" fill="none" stroke="#c1b9ac" stroke-width="1.5"/>',
'<rect x="5" y="11" width="38" height="28" rx="3" fill="#f4e4c6" stroke="#bca58d" stroke-width="1.4"/><path d="m6 12 18 16 18-16" fill="none" stroke="#bca58d" stroke-width="1.4"/><path d="M24 32c-10-6-5-12 0-7 5-5 10 1 0 7" fill="#ce9483"/>',
'<path d="M9 39C1 17 20 5 41 8 42 31 30 45 9 39Z" fill="#b8c993" stroke="#7d995f" stroke-width="1.5"/><path d="M8 42 34 15m-15 17-1-12m9 4 8-1" fill="none" stroke="#859e6b" stroke-width="1.4"/>',
'<path d="M24 25v19m0-8q-15-15-14-2 5 6 14 5" fill="#9eb18b" stroke="#849a74" stroke-width="1.5"/><g fill="#ebc5b5"><ellipse cx="24" cy="13" rx="7" ry="11"/><ellipse cx="17" cy="21" rx="11" ry="7"/><ellipse cx="31" cy="21" rx="11" ry="7"/><ellipse cx="24" cy="28" rx="7" ry="10"/></g><circle cx="24" cy="21" r="6" fill="#d8b771"/>',
'<circle class="firefly-glow" cx="24" cy="28" r="18" fill="#ecd892" opacity=".25"/><ellipse cx="24" cy="28" rx="5" ry="9" fill="#eed494"/><path d="M22 24C1 7 9 34 22 26m4-2c21-17 13 10 0 2" fill="#c5cfc0" fill-opacity=".65"/><circle cx="24" cy="19" r="3" fill="#8a8f7e"/>'
];
const profiles=[
['吹泡泡','泡泡飘过来，团团歪着头看了看。','bubble','pop'],
['羽毛棒','糯糯盯住羽毛，探过头来碰了一下。','spark','rustle'],
['小蝴蝶','绵绵竖起耳朵，跟着蝴蝶望来望去。','butterfly','rustle'],
['拨拨水','泡泡低下头，看着涟漪一圈圈散开。','ripple','water'],
['小贝壳','小满低头拨了拨贝壳，舍不得放开。','spark','shell'],
['热可可','栗栗凑近杯沿，轻轻吹了吹热气。','steam','pour'],
['小信封','啾啾点点头，把一封信交给了风。','letter','page'],
['竹叶尖','慢慢低头嗅了嗅，又轻轻嚼了两下。','leaf','rustle'],
['闻闻花','米粒探出鼻尖，闻到了淡淡的花香。','butterfly','rustle'],
['萤火虫','橘橘抬起头，追着那一点小小的光。','firefly','chime']
],profile=profiles[index];
icons.toy=toys[index];
const icon=key=>`<svg viewBox="0 0 48 48" aria-hidden="true">${icons[key]}</svg>`;
const descriptions={pet:`轻轻摸摸${name}，它会闭眼靠过来。`,toy:`把${profile[0]}移到${name}身边，点一下陪它玩。`,treat:`把${api.snack||'小零食'}送到${name}嘴边。`};
const shelf=document.createElement('div');shelf.className='companion-shelf';
shelf.innerHTML=`<div class="companion-label"><strong>陪${name}玩一会儿</strong><small>轻轻碰一下，会有回应</small></div><div class="companion-tools" role="group" aria-label="选择陪伴道具"><button class="companion-tool" type="button" data-tool="pet" aria-pressed="true">${window.CartoonHand.markup()}摸摸手</button><button class="companion-tool" type="button" data-tool="toy" aria-pressed="false">${icon('toy')}${profile[0]}</button><button class="companion-tool" type="button" data-tool="treat" aria-pressed="false">${icon('treat')}小零食</button></div><p class="companion-instruction" id="companionInstruction" aria-live="polite"></p>`;
document.querySelector('.scene').after(shelf);const instruction=shelf.querySelector('p');hit.setAttribute('aria-describedby','companionInstruction');
const cursor=document.createElement('div');cursor.className='companion-cursor';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
let mode='pet',pointer=null,contact=null,pose='idle',until=0,start=0,reactAt=-Infinity,clickAt=-Infinity,replyTimer;
let angle=0,dx=0,dy=0,lastFrame=0,clock=0,nextBlink=2.8+index*.37,blinkUntil=0,handling=false,automaticHand=false;
const toLocal=e=>{const p=art.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(portrait.getScreenCTM().inverse());};
const toScreen=p=>{const v=art.createSVGPoint();v.x=p.x;v.y=p.y;return v.matrixTransform(portrait.getScreenCTM());};
function facePoint(offsetY=25){const p=toScreen(rig.point(face.x,face.y+offsetY));return api.point({clientX:p.x,clientY:p.y});}
api.anchor=key=>{
 const mouths=[[302,264],[493,280],[788,295],[1192,300],[1393,278],[177,703],[484,706],[769,733],[1191,787],[1400,738]];
 const points={mouth:mouths[index],mug:[173,777],letter:[482,823],toy:index===1?[607,286]:index===4?[1406,385]:index===7?[770,772]:index===8?[1210,795]:[face.x,face.y+65]};
 const q=points[key]||[face.x,face.y+25],p=toScreen(rig.point(q[0],q[1]));return api.point({clientX:p.x,clientY:p.y});
};
function nearby(p,margin=.18){if(!p)return false;const r=target.getBoundingClientRect();return p.x>r.left-r.width*margin&&p.x<r.right+r.width*margin&&p.y>r.top-r.height*margin&&p.y<r.bottom+r.height*margin;}
function hideCursor(){cursor.classList.remove('is-visible');art.classList.remove('has-companion-cursor');}
function choose(next){mode=next;reactAt=-Infinity;pose='idle';until=0;automaticHand=false;hit.dataset.state='idle';shelf.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===next)));cursor.dataset.mode=mode;cursor.innerHTML=mode==='pet'?window.CartoonHand.markup():icon(mode);hand=mode==='pet'?window.CartoonHand.attach(cursor.querySelector('svg')):null;instruction.textContent=descriptions[mode];hit.setAttribute('aria-label',`${{pet:'摸摸',toy:`用${profile[0]}陪`,treat:'喂一份小零食给'}[mode]}${api.fullName||name}`);hideCursor();}
choose('pet');shelf.addEventListener('click',e=>{const b=e.target.closest('[data-tool]');if(b){clearTimeout(replyTimer);choose(b.dataset.tool);}});
function prop(kind){
 const g=document.createElementNS(NS,'g');g.classList.add('companion-prop');g.innerHTML=icons[kind];art.append(g);
 const duration=kind==='treat'?1400:2200,at=performance.now();
 function draw(now){const t=clamp((now-at)/duration,0,1),still=reduce.matches||api.paused();const p=kind==='treat'?api.anchor('mouth'):api.anchor('toy');let x=p.x,y=p.y,scale=.8,opacity=1;
 if(!still){if(kind==='treat'){const q=clamp(t*2,0,1);x+=45*(1-q);y+=24*(1-q);scale=.85*(1-clamp((t-.45)/.5,0,1)*.88);opacity=1-clamp((t-.86)/.14,0,1);}else{y-=Math.sin(t*Math.PI*3)*5;opacity=Math.min(1,(1-t)*5);}}
 const pm=portrait.getScreenCTM(),am=art.getScreenCTM();scale*=clamp(Math.hypot(pm.a,pm.b)/Math.hypot(am.a,am.b)/.65,.45,1.5);
 g.setAttribute('transform',`translate(${x-24*scale} ${y-24*scale}) scale(${scale})`);g.setAttribute('opacity',opacity);
 if(t<1&&document.contains(g))requestAnimationFrame(draw);else g.remove();
 }requestAnimationFrame(draw);
}
function startPose(kind,e,announce=true,fromEngine=false){
 const now=performance.now();if(!fromEngine&&now-reactAt<420)return;
 const continuing=kind==='pet'&&pose==='pet'&&now<until;reactAt=now;pose=kind;if(!continuing)start=now;until=now+(kind==='pet'?2900:kind==='toy'?2400:1800);hit.dataset.state=kind==='pet'?'nuzzling':kind==='toy'?'playing':'eating';
 automaticHand=!e;if(e)pointer={x:e.clientX,y:e.clientY,type:e.pointerType||'mouse'};
 if(kind==='pet'){
  if(!fromEngine){handling=true;api.pet(facePoint(-30));handling=false;}
  instruction.textContent=index===1?'糯糯闭上眼，把脸颊贴过来，轻轻蹭了蹭你的手。':`${name}闭上眼，轻轻把脑袋靠了过来。`;
 }else if(kind==='toy'){
  instruction.textContent=profile[1];api.sound?.(profile[3]);
  const p=index===3?{x:815,y:580}:index===5?api.anchor('mug'):index===6?api.anchor('letter'):facePoint(-25);api.effect?.(profile[2],p,index===3?2:index===0?3:1);
  if([1,4,7,8].includes(index))prop('toy');
 }else{instruction.textContent=`${name}接住了${api.snack||'小零食'}，慢慢嚼了两下。`;prop('treat');api.sound?.('nibble');}
 if(announce)api.say(instruction.textContent);clearTimeout(replyTimer);replyTimer=setTimeout(()=>instruction.textContent=descriptions[mode],4000);
}
art.addEventListener('pointermove',e=>{
 pointer={x:e.clientX,y:e.clientY,type:e.pointerType};automaticHand=false;
 if(pose==='pet'&&!nearby(pointer,.25)){until=performance.now();automaticHand=false;}
 if(mode==='toy'&&nearby(pointer,0)&&Math.hypot(e.movementX||0,e.movementY||0)>3&&performance.now()-reactAt>2600)startPose('toy',e,false);
},{passive:true});
hit.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();hit.setPointerCapture(e.pointerId);contact={id:e.pointerId,x:e.clientX,y:e.clientY};startPose(mode,e);clickAt=performance.now();});
hit.addEventListener('pointermove',e=>{if(!contact||contact.id!==e.pointerId)return;const distance=Math.hypot(e.clientX-contact.x,e.clientY-contact.y);if(mode!=='treat'&&distance>11&&nearby({x:e.clientX,y:e.clientY},0)&&performance.now()-reactAt>650){contact.x=e.clientX;contact.y=e.clientY;startPose(mode,e,false);}});
function release(){if(contact&&hit.hasPointerCapture(contact.id))hit.releasePointerCapture(contact.id);contact=null;}
hit.addEventListener('pointerup',release);hit.addEventListener('pointercancel',()=>{release();until=0;hideCursor();});hit.addEventListener('lostpointercapture',()=>contact=null);
hit.addEventListener('click',e=>{e.stopPropagation();if(performance.now()-clickAt>500)startPose(mode,e.detail?e:null);});
hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();startPose(mode,null);}});
art.addEventListener('pointerleave',()=>{if(!contact){pointer=null;until=0;automaticHand=false;hideCursor();}});
window.addEventListener('blur',()=>{release();pointer=null;automaticHand=false;until=0;hideCursor();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){release();pointer=null;until=0;hideCursor();}lastFrame=0;});
document.addEventListener('island:pet',()=>{if(!handling){choose('pet');startPose('pet',null,false,true);}});
document.addEventListener('island:feed',()=>{choose('treat');startPose('treat',null,false,true);});
document.addEventListener('island:action',e=>{if(['cocoa','pour','letter','butterflies','water','bamboo','fireflies'].includes(e.detail?.kind)){pose='toy';start=performance.now();until=start+2300;}});
const focus=target.cloneNode(false);focus.removeAttribute('class');focus.classList.add('companion-focus');focus.setAttribute('pointer-events','none');target.after(focus);
document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.classList.add('keyboard-input');},true);
document.addEventListener('pointerdown',()=>document.body.classList.remove('keyboard-input'),true);
let visible=true;new IntersectionObserver(entries=>visible=entries[0].isIntersecting,{rootMargin:'80px'}).observe(art);
function frame(now){
 requestAnimationFrame(frame);if(document.hidden||!visible){lastFrame=0;return;}
 const dt=Math.min(.04,(now-(lastFrame||now))/1000);lastFrame=now;
 if(contact&&mode==='pet'&&nearby(pointer,0))until=Math.max(until,now+700);
 const stopped=reduce.matches||api.paused(),active=now<until;if(!stopped)clock+=dt;
 if(!active&&pose!=='idle'){pose='idle';hit.dataset.state='idle';automaticHand=false;}
 if(clock>nextBlink){blinkUntil=clock+.15;nextBlink=clock+4.2+Math.random()*3.3;}
 let tx=0,ty=0,turn=0,local=!automaticHand&&pointer&&nearby(pointer,.7)?toLocal({clientX:pointer.x,clientY:pointer.y}):null;
 if(!stopped){
  if(local){turn=clamp((local.x-face.x)/36,-3.5,3.5);tx=clamp((local.x-face.x)*.035,-4,4);}else turn=Math.sin(clock*.55+index)*.65;
  if(active){const t=(now-start)/1000,fade=Math.min(1,(until-now)/550),side=local&&local.x<face.x-25?-1:1;
   if(pose==='pet'){const rub=.5-.5*Math.cos(t*4.3);turn=side*(3+rub*6)*fade;tx=side*(5+rub*8)*fade;ty=-(5+rub*5)*fade;}
   else if(pose==='treat'){turn=Math.sin(t*12)*1.8*fade;ty=(3+Math.sin(t*13)*2)*fade;}
   else{const bend=[-2,-3,-5,6,5,7,3,6,-1,-5][index];turn+=Math.sin(t*3)*[3,5,5,1,2,1,3,2,1,4][index]*fade;ty=bend*(.5-.5*Math.cos(t*3))*fade;tx+=index===8?5*Math.sin(t*2)*fade:0;}
  }
 }
 const ease=1-Math.exp(-dt*8);angle+=(turn-angle)*ease;dx+=(tx-dx)*ease;dy+=(ty-dy)*ease;
 head.setAttribute('transform',stopped?'':`translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${angle.toFixed(2)} ${pivot.x} ${pivot.y})`);
 const closed=active&&(pose==='pet'||pose==='treat'||[3,5,7,8].includes(index))||!stopped&&clock<blinkUntil;expression.setAttribute('opacity',closed?'1':'0');rig.render({angle:stopped?0:angle,x:stopped?0:dx,y:stopped?0:dy,happy:closed?1:0,tail:stopped?0:Math.sin(clock*(active?3.5:1.2))*(active?2.5:1)});
 if(tail){const wag=stopped?0:Math.sin(clock*(active?3.5:1.2))*(active?4:1.7);tail.setAttribute('transform',`rotate(${wag.toFixed(2)} ${tail.dataset.pivotX} ${tail.dataset.pivotY})`);}
 const handActive=mode==='pet'&&active&&pose==='pet',show=handActive||pointer&&pointer.type!=='touch'&&fine.matches&&nearby(pointer,.06);
 cursor.classList.toggle('is-visible',!!show);art.classList.toggle('has-companion-cursor',!!show&&!!pointer&&pointer.type!=='touch');cursor.classList.toggle('is-nuzzling',handActive);
 if(show){
  const m=portrait.getScreenCTM(),scale=clamp(Math.hypot(m.a,m.b)*200,76,132)/160,t=(now-start)/1000,stroke=.5-.5*Math.cos(t*4.3);
  let p=pointer?{x:pointer.x,y:pointer.y}:toScreen({x:face.x+80,y:face.y-28}),anchor={x:24,y:24};
  if(mode==='pet'){
   if(local){if(local.x<face.x-45)handSide=-1;else if(local.x>face.x+25)handSide=1;}else if(automaticHand)handSide=1;
   if(handActive&&automaticHand){const zones=[[210,167,18],[565,206,42],[853,224,33],[1180,220,28],[1490,204,35],[267,634,35],[554,660,28],[859,661,34],[1196,704,28],[1488,658,38]],q=zones[index];p=toScreen(rig.point(q[0],q[1]+(stopped?.5:stroke)*q[2]));}
   else if(handActive&&!stopped){p.y+=Math.sin(t*4.3)*4*scale;}
   anchor=hand.pose(stopped?0:handActive?.2+stroke*.72:.04,stopped?0:handActive?-7+stroke*13:-5,handSide);
   anchor.x*=scale;anchor.y*=scale;cursor.style.width=`${160*scale}px`;cursor.style.height=`${116*scale}px`;
  }else{cursor.style.width='48px';cursor.style.height='48px';}
  cursor.style.transform=`translate3d(${(p.x-anchor.x).toFixed(1)}px,${(p.y-anchor.y).toFixed(1)}px,0)`;
 }

}
requestAnimationFrame(frame);
})();
