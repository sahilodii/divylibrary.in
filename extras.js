// Theme, lazy Razorpay, image skeletons, recently viewed.
(()=>{
const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
// Dark mode
const root=document.documentElement,tbtn=document.getElementById('theme-toggle');
const setTheme=t=>{root.dataset.theme=t;if(tbtn)tbtn.textContent=t==='dark'?'☀':'☾'};
setTheme(store.get('divyThemeV1')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
tbtn?.addEventListener('click',()=>{const t=root.dataset.theme==='dark'?'light':'dark';setTheme(t);store.set('divyThemeV1',t)});
// Load Razorpay only when needed
let rzp;window.loadRazorpay=()=>window.Razorpay?Promise.resolve():(rzp||=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=res;s.onerror=()=>{rzp=null;rej()};document.head.append(s)}));
// Image skeletons
const done=i=>i.classList.add('loaded');
document.addEventListener('load',e=>{if(e.target.tagName==='IMG')done(e.target)},true);
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')done(e.target)},true);
document.querySelectorAll('img').forEach(i=>{if(i.complete)done(i)});
// Recently viewed
const KEY='divyRecentV1',box=document.getElementById('recent'),list=document.getElementById('recent-list');
const read=()=>{try{const v=JSON.parse(store.get(KEY)||'[]');return Array.isArray(v)?v:[]}catch{return[]}};
const render=()=>{const items=read().filter(c=>document.querySelector('.pack[data-cat="'+c+'"]'));box.hidden=!items.length;list.replaceChildren(...items.map(c=>{const b=document.createElement('button');b.type='button';b.textContent=document.querySelector('.pack[data-cat="'+c+'"] h3').textContent;b.onclick=()=>document.querySelector('[data-view-pack="'+c+'"]').click();return b}))};
document.addEventListener('click',e=>{const b=e.target.closest('[data-view-pack]');if(!b)return;window.loadRazorpay().catch(()=>{});store.set(KEY,JSON.stringify([b.dataset.viewPack,...read().filter(c=>c!==b.dataset.viewPack)].slice(0,5)));render()},true);
render();
})();

// --- smoothness pass ---
(()=>{
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
// Sticky header shadow + back-to-top
const header=document.querySelector('.header');
const onScroll=()=>{const y=scrollY;header?.classList.toggle('scrolled',y>8)};
let r1=0;addEventListener('scroll',()=>{r1||(r1=requestAnimationFrame(()=>{r1=0;onScroll()}))},{passive:true});onScroll();
// Hero: autoplay, pause on hover/focus/hidden tab, swipe
const stage=document.querySelector('.stage');let paused=false,timer;
const play=()=>{clearInterval(timer);if(!reduce)timer=setInterval(()=>{if(!paused&&!document.hidden)window.DIVY_NEXT?.()},6000)};
stage?.addEventListener('pointerenter',()=>paused=true);stage?.addEventListener('pointerleave',()=>paused=false);
stage?.addEventListener('focusin',()=>paused=true);stage?.addEventListener('focusout',()=>paused=false);
let x0=null;stage?.addEventListener('pointerdown',e=>{x0=e.clientX});
stage?.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>45){dx<0?window.DIVY_NEXT?.():window.DIVY_PREV?.();play()}});
document.querySelectorAll('#prev,#forward,#next,.pick').forEach(b=>b.addEventListener('click',play));play();
// Scroll reveal
if(!reduce&&'IntersectionObserver' in window){
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target);setTimeout(()=>e.target.classList.remove('reveal','in'),900)}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
 document.querySelectorAll('.section .head,.collection,.benefit,.faq details,.pricing>*,.footer section').forEach((el,k)=>{el.classList.add('reveal');el.style.transitionDelay=(k%4)*70+'ms';io.observe(el)});
}
// Active nav link
const links=[...document.querySelectorAll('.navlinks a')];
if('IntersectionObserver' in window){const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-45% 0px -50% 0px'});
 links.forEach(a=>{const s=document.querySelector(a.getAttribute('href'));if(s)so.observe(s)})}
// Toast on save / unsave
const toast=document.createElement('div');toast.className='toast';toast.setAttribute('role','status');document.body.append(toast);let tt;
document.addEventListener('click',e=>{const b=e.target.closest('[data-favorite-pack]');if(!b)return;setTimeout(()=>{toast.textContent=b.getAttribute('aria-pressed')==='true'?'♥ Saved to your shelf':'Removed from saved';toast.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('show'),1800)},0)});
})();

// --- features pass 3 ---
(()=>{
const $=s=>document.querySelector(s),grid=$('#packs'),cards=[...grid.children];
// Sort
const price=c=>{const m=[...c.querySelector('.price').textContent.matchAll(/₹(\d+)/g)].pop();return m?+m[1]:0};
$('#sort')?.addEventListener('change',e=>{const v=e.target.value,list=[...cards];
 if(v==='p-asc')list.sort((a,b)=>price(a)-price(b));if(v==='p-desc')list.sort((a,b)=>price(b)-price(a));
 if(v==='az')list.sort((a,b)=>a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));
 list.forEach(c=>grid.append(c))});
// Keyboard: "/" focuses search, Esc closes dialogs
addEventListener('keydown',e=>{const t=e.target,typing=/INPUT|TEXTAREA|SELECT/.test(t.tagName);
 if(e.key==='/'&&!typing){e.preventDefault();$('#library').scrollIntoView({behavior:'smooth'});$('#search').focus()}
 if(e.key==='Escape')document.querySelector('.pack-payment-overlay:not([hidden]) .pack-payment-close, .auth-overlay:not([hidden]) [class*=close]')?.click()});
// Scroll progress bar
const bar=document.createElement('div');bar.id='progress';document.body.append(bar);
const prog=()=>{const d=document.documentElement;bar.style.transform='scaleX('+(scrollY/Math.max(1,d.scrollHeight-innerHeight))+')'};
let r2=0;addEventListener('scroll',()=>{r2||(r2=requestAnimationFrame(()=>{r2=0;prog()}))},{passive:true});prog();
// Deep links: #pack-history opens that pack; share button copies the link
let current='';
document.addEventListener('click',e=>{const b=e.target.closest('[data-view-pack]');if(b){current=b.dataset.viewPack;history.replaceState(null,'','#pack-'+current)}},true);
$('#pack-share')?.addEventListener('click',async()=>{const url=location.origin+location.pathname+'#pack-'+current,btn=$('#pack-share');
 try{if(navigator.share){await navigator.share({title:'Divy Library',url})}else{await navigator.clipboard.writeText(url);btn.textContent='✓ Link copied'}}catch{btn.textContent='Copy failed'}
 setTimeout(()=>btn.textContent='🔗 Copy link to this pack',1800)});
const m=location.hash.match(/^#pack-([a-z]+)$/);
if(m)addEventListener('load',()=>setTimeout(()=>document.querySelector('[data-view-pack="'+m[1]+'"]')?.click(),400));
})();

// --- mobile menu ---
(()=>{const hd=document.querySelector('.header'),bt=document.getElementById('menu-toggle');if(!hd||!bt)return;
const set=o=>{hd.classList.toggle('open',o);bt.setAttribute('aria-expanded',o);bt.setAttribute('aria-label',o?'Close menu':'Open menu');bt.textContent=o?'✕':'☰'};
bt.addEventListener('click',()=>set(!hd.classList.contains('open')));
document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>set(false)));
addEventListener('keydown',e=>{if(e.key==='Escape'&&hd.classList.contains('open')){set(false);bt.focus()}});
document.addEventListener('click',e=>{if(hd.classList.contains('open')&&!hd.contains(e.target))set(false)});
matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches)set(false)})})();
