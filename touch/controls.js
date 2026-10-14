/* Daft Arcade: shared multi-touch input. Game simulation stays in each game. */
(() => {
  'use strict';
  if (window.DaftTouch) return;
  const available = navigator.maxTouchPoints > 0 || matchMedia('(any-pointer: coarse)').matches || new URLSearchParams(location.search).get('touch') === '1';
  const instances = new Set(), keyOwners = new Map();
  const keyNames = {Space:' ',ShiftLeft:'Shift',ShiftRight:'Shift',ControlLeft:'Control',ControlRight:'Control',AltLeft:'Alt',Escape:'Escape',Enter:'Enter',Tab:'Tab',Backspace:'Backspace',Delete:'Delete',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'};
  const legacy = {Space:32,ShiftLeft:16,ShiftRight:16,ControlLeft:17,ControlRight:17,AltLeft:18,Escape:27,Enter:13,Tab:9,Backspace:8,Delete:46,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40};
  function sendKey(type, code) {
    const key = keyNames[code] || (code.startsWith('Key') ? code.slice(3).toLowerCase() : code.startsWith('Digit') ? code.slice(5) : code);
    const n = legacy[code] || (code.startsWith('Key') ? code.charCodeAt(3) : code.startsWith('Digit') ? code.charCodeAt(5) : 0);
    const event = new KeyboardEvent(type, {key,code,bubbles:true,cancelable:true,repeat:false,shiftKey:keyOwners.has('ShiftLeft') || keyOwners.has('ShiftRight'),ctrlKey:keyOwners.has('ControlLeft') || keyOwners.has('ControlRight'),altKey:keyOwners.has('AltLeft') || keyOwners.has('AltRight')});
    for (const prop of ['keyCode','which']) { try { Object.defineProperty(event,prop,{value:n}); } catch {} }
    (document.body || document).dispatchEvent(event);
  }
  function hold(owner, code, down) {
    if (!code) return;
    let owners = keyOwners.get(code);
    if (down) {
      if (!owners) { owners=new Set();keyOwners.set(code,owners); }
      if (owners.has(owner)) return;
      const first=owners.size===0; owners.add(owner); if(first) sendKey('keydown',code);
    } else if (owners && owners.delete(owner) && owners.size===0) { keyOwners.delete(code);sendKey('keyup',code); }
  }
  function styles() {
    if(document.getElementById('daft-touch-style'))return;
    const style=document.createElement('style');style.id='daft-touch-style';style.textContent=`
      .dt-root{position:fixed;inset:0;z-index:10000;pointer-events:none;font-family:Arial,sans-serif;color:white;--dt-pad:118px;--dt-button:56px}
      .dt-root *{box-sizing:border-box}.dt-toolbar{position:absolute;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);display:flex;gap:5px;pointer-events:auto}
      .dt-toolbar button{min-height:36px;padding:7px 10px;border:1px solid #ffffff60;border-radius:9px;background:#152536d9;color:#fff;font:700 11px Arial,sans-serif;touch-action:manipulation;white-space:nowrap}
      .dt-panel{position:absolute;bottom:max(14px,env(safe-area-inset-bottom));display:flex;align-items:flex-end;gap:12px;pointer-events:none}.dt-left{left:max(14px,env(safe-area-inset-left));max-width:46vw}.dt-right{right:max(14px,env(safe-area-inset-right));max-width:min(49vw,420px);justify-content:flex-end;flex-wrap:wrap;gap:7px}
      .dt-joystick{width:var(--dt-pad);height:var(--dt-pad);flex-shrink:0;position:relative;border:2px solid #ffffff70;border-radius:50%;background:#15253675;touch-action:none;user-select:none;-webkit-user-select:none;pointer-events:auto;box-shadow:0 2px 12px #0004}
      .dt-joystick-label{position:absolute;top:-20px;width:100%;text-align:center;font-size:10px;font-weight:bold;text-shadow:0 1px 4px #000;pointer-events:none}.dt-thumb{position:absolute;left:50%;top:50%;width:43px;height:43px;margin:-21.5px;background:#d5fa74bb;border:2px solid #f6ffde;border-radius:50%;pointer-events:none}
      .dt-action{pointer-events:auto;min-width:var(--dt-button);min-height:var(--dt-button);max-width:100px;padding:9px 10px;border:1px solid #ffffff85;border-radius:16px;background:#152536a8;color:#fff;font:700 11px Arial,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 2px 10px #0004;line-height:1.15}
      .dt-action.dt-held{background:#d5fa74d9;color:#13211b;transform:scale(.96)}.dt-action:focus-visible,.dt-toolbar button:focus-visible,.dt-joystick:focus-visible{outline:3px solid #8ce8ff;outline-offset:3px}
      .dt-root.dt-hidden .dt-panel,.dt-root.dt-inactive .dt-panel{display:none}.dt-root [hidden]{display:none!important}
      @media(max-height:480px){.dt-root{--dt-pad:94px;--dt-button:46px}.dt-panel{bottom:max(9px,env(safe-area-inset-bottom))}.dt-right{gap:5px}.dt-action{padding:6px 8px;font-size:10px;border-radius:12px}.dt-joystick-label{top:-16px}}
      @media(max-width:480px){.dt-root{--dt-pad:100px;--dt-button:49px}.dt-left{left:9px;gap:6px}.dt-right{right:9px;gap:5px}.dt-action{padding:7px;font-size:10px}.dt-toolbar button{min-height:34px;padding:6px 8px}}
    `;document.head.append(style);
  }
  function create(config={}) {
    if(!available)return {element:null,setVisible(){},destroy(){}};
    styles();document.body.classList.add('daft-touch-enabled');
    const root=document.createElement('div');root.className='dt-root';root.dataset.dtGame=config.id||'game';root.setAttribute('aria-label',(config.title||'Game')+' touch controls');
    const toolbar=document.createElement('div');toolbar.className='dt-toolbar';
    const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Hide controls';toggle.setAttribute('aria-pressed','true');
    const full=document.createElement('button');full.type='button';full.textContent='Full screen';
    toolbar.append(toggle,full);root.append(toolbar);
    const left=document.createElement('div');left.className='dt-panel dt-left';const right=document.createElement('div');right.className='dt-panel dt-right';root.append(left,right);document.body.append(root);
    let visible=true,active=true,destroyed=false;const releases=new Set(),cleanup=[];
    const allowed=()=>visible && (!config.isActive || config.isActive());
    function releaseAll(){for(const release of releases)release();}
    function refresh(){const next=!config.isActive||!!config.isActive();if(active!==next){active=next;if(!active)releaseAll();root.classList.toggle('dt-inactive',!active);}}
    function setVisible(value){visible=!!value;root.classList.toggle('dt-hidden',!visible);toggle.textContent=visible?'Hide controls':'Show controls';toggle.setAttribute('aria-pressed',String(visible));if(!visible)releaseAll();config.onVisibilityChange?.(visible);}
    toggle.onclick=()=>setVisible(!visible);
    full.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen?.();else await (config.fullscreenElement||document.documentElement).requestFullscreen?.();}catch{} };
    const listen=(node,name,fn,opts)=>{node.addEventListener(name,fn,opts);cleanup.push(()=>node.removeEventListener(name,fn,opts));};
    for(const spec of config.joysticks||[]) {
      const pad=document.createElement('div');pad.className='dt-joystick';pad.dataset.dtJoystick=spec.id||'move';pad.setAttribute('role','group');pad.setAttribute('aria-label',spec.label||'Move');
      const label=document.createElement('span');label.className='dt-joystick-label';label.textContent=spec.label||'MOVE';const thumb=document.createElement('span');thumb.className='dt-thumb';pad.append(label,thumb);(spec.side==='right'?right:left).append(pad);
      const owner={},keys=spec.keys||{};let pointer=null,x=0,y=0;
      function move(nx,ny){x=nx;y=ny;thumb.style.transform='translate('+x*30+'px,'+y*30+'px)';hold(owner,keys.left,x<-.28);hold(owner,keys.right,x>.28);hold(owner,keys.up,y<-.28);hold(owner,keys.down,y>.28);spec.onMove?.(x,y);}
      function sample(e){const r=pad.getBoundingClientRect(),radius=Math.max(1,r.width*.36);let nx=(e.clientX-r.left-r.width/2)/radius,ny=(e.clientY-r.top-r.height/2)/radius;const length=Math.hypot(nx,ny);if(length>1){nx/=length;ny/=length;}if(length<.12)nx=ny=0;move(nx,ny);}
      function release(){if(pointer===null&&!x&&!y)return;pointer=null;move(0,0);}
      releases.add(release);
      listen(pad,'pointerdown',e=>{if(!allowed()||pointer!==null||e.button>0)return;e.preventDefault();pointer=e.pointerId;pad.setPointerCapture?.(pointer);sample(e);});
      listen(pad,'pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();if(allowed())sample(e);else release();});
      for(const name of ['pointerup','pointercancel','lostpointercapture'])listen(pad,name,e=>{if(e.pointerId===pointer){e.preventDefault();release();}});
    }
    let more=null,expanded=false;
    if((config.buttons||[]).some(spec=>spec.secondary)){
      more=document.createElement('button');more.type='button';more.className='dt-action';more.textContent='MORE';more.setAttribute('aria-expanded','false');right.append(more);
      more.onclick=()=>{releaseAll();expanded=!expanded;more.textContent=expanded?'LESS':'MORE';more.setAttribute('aria-expanded',String(expanded));for(const node of right.querySelectorAll('[data-dt-secondary]'))node.hidden=!expanded;};
    }
    for(const spec of config.buttons||[]) {
      const button=document.createElement('button');button.type='button';button.className='dt-action';button.dataset.dtButton=spec.id||spec.label;button.textContent=spec.label||spec.id;button.setAttribute('aria-label',spec.ariaLabel||spec.label||spec.id);right.append(button);
      if(spec.secondary){button.dataset.dtSecondary='true';button.hidden=!expanded;}
      const owner={},pointers=new Set(),codes=spec.keys||[];let down=false;
      function press(e){if(down)return;down=true;button.classList.add('dt-held');for(const code of codes)hold(owner,code,true);spec.onPress?.(e);}
      function release(e){pointers.clear();if(!down)return;down=false;button.classList.remove('dt-held');for(const code of codes)hold(owner,code,false);spec.onRelease?.(e);}
      releases.add(release);
      listen(button,'pointerdown',e=>{if(!allowed()||e.button>0)return;e.preventDefault();pointers.add(e.pointerId);button.setPointerCapture?.(e.pointerId);press(e);});
      for(const name of ['pointerup','pointercancel','lostpointercapture'])listen(button,name,e=>{if(!pointers.delete(e.pointerId))return;e.preventDefault();if(!pointers.size)release(e);});
      // Keyboard and assistive technology can activate the visible controls too.
      listen(button,'click',e=>{if(e.detail===0&&allowed()){press(e);release(e);}});
    }
    if(config.onLook&&config.lookElement) {
      const surface=config.lookElement;let pointer=null,lx=0,ly=0;surface.style.touchAction='none';
      const release=()=>{pointer=null;};releases.add(release);
      listen(surface,'pointerdown',e=>{if(!allowed()||e.pointerType!=='touch'||pointer!==null||e.target.closest?.('button,a,input,select,textarea,.dt-root'))return;e.preventDefault();pointer=e.pointerId;lx=e.clientX;ly=e.clientY;surface.setPointerCapture?.(pointer);});
      listen(surface,'pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;if(allowed())config.onLook(dx,dy,e);else release();});
      for(const name of ['pointerup','pointercancel','lostpointercapture'])listen(surface,name,e=>{if(e.pointerId===pointer)release();});
    }
    listen(window,'blur',releaseAll);listen(document,'visibilitychange',()=>{if(document.hidden)releaseAll();});listen(window,'orientationchange',releaseAll);
    const timer=config.isActive?setInterval(refresh,150):null;refresh();
    const instance={element:root,setVisible,destroy(){if(destroyed)return;destroyed=true;releaseAll();clearInterval(timer);for(const fn of cleanup)fn();root.remove();instances.delete(instance);if(!instances.size)document.body.classList.remove('daft-touch-enabled');}};instances.add(instance);return instance;
  }
  window.DaftTouch={available,create};
})();
