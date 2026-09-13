(() => {
  'use strict';
  const pages=JSON.parse(document.getElementById('world-data').textContent);
  const stage=document.getElementById('stage'),gallery=document.getElementById('gallery');
  let frame=null,lastCard=null;
  function home(update=true) {
    if(frame){frame.contentWindow?.postMessage({type:'slow-island-stop'},'*');frame.remove();frame=null;}
    stage.classList.remove('active');document.body.classList.remove('viewing');gallery.removeAttribute('inert');
    document.title='慢慢岛 · 十个可以发呆的小世界';
    if(update)history.pushState(null,'',location.pathname+location.search);
    lastCard?.focus({preventScroll:true});
  }
  function open(id,update=true) {
    if(!Object.hasOwn(pages,id))return;
    home(false);gallery.setAttribute('inert','');stage.classList.add('active');document.body.classList.add('viewing');
    frame=document.createElement('iframe');frame.title=pages[id].name+' · 慢慢岛';
    frame.setAttribute('allow','autoplay');frame.src=pages[id].file;stage.appendChild(frame);
    document.title=pages[id].name+' · 慢慢岛';
    frame.addEventListener('load',()=>frame?.focus());
    if(update)history.pushState(null,'','#'+id);
  }
  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{lastCard=b;open(b.dataset.open);}));
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});
    document.querySelectorAll('.card').forEach(c=>c.hidden=b.dataset.filter!=='0'&&c.dataset.mood!==b.dataset.filter);
  }));
  window.addEventListener('message',e=>{
    if(!frame||e.source!==frame.contentWindow||e.data?.type!=='slow-island-navigate')return;
    if(e.data.id==='home')home();else open(e.data.id);
  });
  document.getElementById('back').addEventListener('click',()=>home());
  window.addEventListener('popstate',()=>{const id=location.hash.slice(1);if(Object.hasOwn(pages,id))open(id,false);else home(false);});
  const id=location.hash.slice(1);if(Object.hasOwn(pages,id))open(id,false);
})();

// Gallery previews share the atlas; reveal complete drawings after decoding.
(() => {const a=new Image();a.onload=()=>document.documentElement.classList.add('art-ready');a.onerror=a.onload;a.src='assets/animal-atlas.png';})();
