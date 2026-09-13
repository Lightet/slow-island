/* Articulated pointer, in the same warm cartoon palette as the scene controls. */
(() => {
'use strict';
const fingers=[
 {x:91,y:35,l1:20,l2:15,a:198,b:138,width:8.5,color:'#e4bb98'},
 {x:87,y:40,l1:26,l2:20,a:194,b:135,width:10,color:'#edc7a4'},
 {x:85,y:47,l1:33,l2:22,a:186,b:135,width:11.5,color:'#f1cfad'},
 {x:86,y:55,l1:37,l2:23,a:182,b:138,width:12,color:'#f5d8b9'}
];
const rad=a=>a*Math.PI/180,f=n=>n.toFixed(2);
function curve(p,curl){const a=rad(p.a-curl*5),b=rad(p.b-curl*25),j={x:p.x+Math.cos(a)*p.l1,y:p.y+Math.sin(a)*p.l1},tip={x:j.x+Math.cos(b)*p.l2,y:j.y+Math.sin(b)*p.l2};
 return {tip,j,d:`M${p.x} ${p.y} Q${f((p.x+j.x)/2)} ${f(j.y-3)} ${f(j.x)} ${f(j.y)} Q${f(j.x-8)} ${f(j.y+3)} ${f(tip.x)} ${f(tip.y)}`};
}
function markup(){return `<svg class="petting-hand" viewBox="0 0 160 116" aria-hidden="true"><g class="hand-side"><path d="M121 42Q142 45 155 54L158 81Q139 82 121 70Z" fill="#bcc9b0" stroke="#859778" stroke-width="1.7" stroke-linejoin="round"/><g class="hand-wrist">${fingers.map((p,i)=>{const q=curve(p,.08);return `<g class="hand-finger" data-finger="${i}"><path class="finger-outline" d="${q.d}" fill="none" stroke="#a8876b" stroke-width="${p.width+2.8}" stroke-linecap="round"/><path class="finger-fill" d="${q.d}" fill="none" stroke="${p.color}" stroke-width="${p.width}" stroke-linecap="round"/><path class="finger-crease" d="M${q.j.x-1} ${q.j.y-2}l3 2" fill="none" stroke="#c39a79" stroke-width="1.1" stroke-linecap="round"/></g>`;}).join('')}<path d="M80 32C93 25 108 28 119 37L130 46 129 65Q116 81 91 71Q78 66 77 53L80 32Z" fill="#f2cfad" stroke="#a8876b" stroke-width="1.5" stroke-linejoin="round"/><path d="M89 34Q104 32 115 42" fill="none" stroke="#f9e3cb" stroke-width="3" stroke-linecap="round"/><g class="hand-thumb"><path d="M112 57Q104 51 98 56L84 69Q79 75 83 79 88 84 94 77L108 68" fill="#f6d9ba" stroke="#a8876b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M86 73q3-4 6-4" fill="none" stroke="#d2ac8a" stroke-width="1.1" stroke-linecap="round"/></g></g><path d="M127 44Q121 57 125 71" fill="none" stroke="#8d9f7f" stroke-width="4" stroke-linecap="round"/></g></svg>`;}
function attach(svg){const paths=[...svg.querySelectorAll('.hand-finger')].map(g=>({outline:g.querySelector('.finger-outline'),fill:g.querySelector('.finger-fill'),crease:g.querySelector('.finger-crease')})),wrist=svg.querySelector('.hand-wrist'),thumb=svg.querySelector('.hand-thumb'),side=svg.querySelector('.hand-side');
 return {pose(pressure,angle,sign=1){let tip;fingers.forEach((p,i)=>{const q=curve(p,pressure*(.65+i*.1));paths[i].outline.setAttribute('d',q.d);paths[i].fill.setAttribute('d',q.d);paths[i].crease.setAttribute('d',`M${f(q.j.x-1)} ${f(q.j.y-2)}l3 2`);if(i===3)tip=q.tip;});
  wrist.setAttribute('transform',`rotate(${f(angle)} 125 57)`);thumb.setAttribute('transform',`rotate(${f(-pressure*10)} 109 60)`);side.setAttribute('transform',sign<0?'translate(160 0) scale(-1 1)':'');svg.dataset.pressure=f(pressure);
  const a=rad(angle),x=125+(tip.x-125)*Math.cos(a)-(tip.y-57)*Math.sin(a),y=57+(tip.x-125)*Math.sin(a)+(tip.y-57)*Math.cos(a);
  return {x:sign<0?160-x:x,y};
 }};
}
window.CartoonHand={markup,attach};
})();
