/* One continuous textured mesh: there is no cut between head and body. */
(() => {
'use strict';
const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
const pictures=Promise.all([load('assets/animal-atlas.png'),load('assets/contented-faces.webp')]);
const smooth=(a,b,v)=>{const q=Math.max(0,Math.min(1,(v-a)/(b-a)));return q*q*(3-2*q);};
window.createAnimalRig=(portrait)=>{
 const canvas=portrait.querySelector('.animal-canvas'),surface=portrait.querySelector('.rig-surface'),fallback=portrait.querySelector('.rig-fallback');
 const data=JSON.parse(portrait.dataset.mesh),[rx,ry,w,h]=data.region,pad=40,neck=[data.pivot[0]-rx,data.pivot[1]-ry];
 portrait.dataset.renderer='static-fallback';
 let gl,ready=false,draw=null,pose={angle:0,x:0,y:0,happy:0,tail:0};
 pictures.then(()=>{if(!ready)fallback.style.visibility='visible';}).catch(()=>{fallback.style.visibility='visible';});
 const rig={render(p){pose=p;if(ready)draw(p);},point(x,y){
  if(!ready)return {x,y};
  const weight=1-smooth(data.seam-20,data.seam+46,y),a=pose.angle*Math.PI/180,ox=x-data.pivot[0],oy=y-data.pivot[1];
  return {x:x+weight*(Math.cos(a)*ox-Math.sin(a)*oy-ox+pose.x),y:y+weight*(Math.sin(a)*ox+Math.cos(a)*oy-oy+pose.y)};
 }};
 try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});}catch(_){return rig;}
 if(!gl)return rig;
 const vertex=`precision mediump float;attribute vec2 position;uniform vec2 size;uniform vec2 pivot;uniform vec4 pose;uniform float seam;uniform float cat;varying vec2 uv;
 void main(){uv=position/size;float weight=1.0-smoothstep(seam-20.0,seam+46.0,position.y);vec2 o=position-pivot;float c=cos(pose.z),s=sin(pose.z);vec2 p=position+weight*(vec2(c*o.x-s*o.y,s*o.x+c*o.y)-o+pose.xy);
 float t=cat*smoothstep(246.0,283.0,position.x)*(1.0-smoothstep(365.0,387.0,position.y));p.x+=sin(pose.w)*(387.0-position.y)*t;p.y+=sin(pose.w)*.1*(position.x-246.0)*t;
 gl_Position=vec4((p.x+40.0)/(size.x+80.0)*2.0-1.0,1.0-(p.y+40.0)/(size.y+80.0)*2.0,0.0,1.0);}`;
 const fragment=`precision mediump float;uniform sampler2D base;uniform sampler2D contented;uniform vec2 size;uniform vec4 face;uniform float happy;varying vec2 uv;
 void main(){vec4 a=texture2D(base,uv);float m=(1.0-smoothstep(.78,1.0,length((uv*size-face.xy)/face.zw)))*happy;vec3 color=mix(a.rgb,texture2D(contented,uv).rgb,m);gl_FragColor=vec4(color*a.a,a.a);}`;
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 try{
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const vertices=[];for(let y=0;y<24;y++)for(let x=0;x<16;x++){const l=x*w/16,r=(x+1)*w/16,t=y*h/24,b=(y+1)*h/24;vertices.push(l,t,r,t,l,b,r,t,r,b,l,b);}
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  const u=name=>gl.getUniformLocation(program,name);gl.uniform2f(u('size'),w,h);gl.uniform2f(u('pivot'),...neck);gl.uniform1f(u('seam'),data.seam-ry);gl.uniform1f(u('cat'),data.index===1?1:0);gl.uniform4f(u('face'),data.face[0]-rx,data.face[1]-ry,data.face[2],data.face[3]);
  const up=u('pose'),uh=u('happy');gl.uniform1i(u('base'),0);gl.uniform1i(u('contented'),1);
  canvas.width=w+pad*2;canvas.height=h+pad*2;gl.viewport(0,0,canvas.width,canvas.height);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  const crop=(img,alpha)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
   if(alpha&&data.polygon){const pairs=data.polygon.split(' ').map(v=>v.split(',').map(Number));ctx.beginPath();pairs.forEach(([x,y],i)=>i?ctx.lineTo(x-rx,y-ry):ctx.moveTo(x-rx,y-ry));ctx.closePath();ctx.clip();}
   ctx.drawImage(img,rx,ry,w,h,0,0,w,h);
   if(alpha&&data.index===0){ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.ellipse(203-rx,484-ry,42,18,0,0,Math.PI*2);ctx.fill();}
   return c;
  };
  pictures.then(images=>{images.forEach((img,i)=>{gl.activeTexture(gl.TEXTURE0+i);const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,crop(img,i===0));});
   draw=p=>{gl.uniform4f(up,p.x,p.y,p.angle*Math.PI/180,(p.tail||0)*Math.PI/180);gl.uniform1f(uh,p.happy);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,vertices.length/2);};ready=true;draw(pose);surface.style.display='block';fallback.style.visibility='hidden';portrait.dataset.renderer='continuous-mesh';
  }).catch(()=>{portrait.dataset.renderer='static-fallback';});
 }catch(e){portrait.dataset.renderer='static-fallback';console.warn('Animal animation fallback:',e.message);}
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;surface.style.display='none';fallback.style.visibility='visible';portrait.dataset.renderer='static-fallback';});
 return rig;
};
})();
