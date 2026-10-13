export function createDOM({width,height,canvas,canvasFactory}){
  const ids=new Map(),docListeners=new Map();let created=0;
  const decode=s=>String(s).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  function matches(el,sel){
    if(sel==='*')return true;
    const attrMatches=[...sel.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)];
    let plain=sel.replace(/\[[^\]]+\]/g,''),tag=plain.match(/^[\w-]+/)?.[0],id=plain.match(/#([\w-]+)/)?.[1],classes=[...plain.matchAll(/\.([\w-]+)/g)].map(m=>m[1]);
    return(!tag||el.tagName===tag.toUpperCase())&&(!id||el.id===id)&&classes.every(c=>el.classList.contains(c))&&attrMatches.every(m=>el.getAttribute(m[1])!==null&&(m[2]===undefined||el.getAttribute(m[1])===m[2]));
  }
  function chainMatches(el,chain,root){
    if(!matches(el,chain.at(-1)))return false;
    let at=el.parentElement;
    for(let i=chain.length-2;i>=0;i--){while(at&&!matches(at,chain[i]))at=at.parentElement;if(!at)return false;at=at.parentElement;}
    return true;
  }
  function element(tag='div'){
    const attrs=new Map(),listeners=new Map(),classes=new Set();let id='',inner='',realCanvas=null;
    const el={tagName:tag.toUpperCase(),name:'created-'+(++created),value:'',_text:'',checked:false,disabled:false,hidden:false,dataset:{},children:[],parentElement:null,parentNode:null,style:{setProperty(k,v){this[k]=v;}},width,height,clientWidth:width,clientHeight:height,
      classList:{add:(...c)=>c.forEach(x=>classes.add(x)),remove:(...c)=>c.forEach(x=>classes.delete(x)),toggle:(c,force)=>{const yes=force??!classes.has(c);yes?classes.add(c):classes.delete(c);return yes;},contains:c=>classes.has(c)},listeners,
      setAttribute(k,v){v=String(v);attrs.set(k,v);if(k==='id')this.id=v;else if(k==='class')this.className=v;else if(k==='value')this.value=decode(v);else if(k==='checked')this.checked=true;else if(k==='disabled')this.disabled=true;else if(k==='hidden')this.hidden=true;else if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=decode(v);else this[k]=v;},getAttribute(k){if(k==='id')return id||null;if(k==='class')return this.className||null;if(k.startsWith('data-'))return this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]??null;return attrs.get(k)??null;},removeAttribute(k){attrs.delete(k);if(k==='hidden')this.hidden=false;},
      addEventListener(n,fn){listeners.set(n,[...(listeners.get(n)||[]),fn]);},removeEventListener(n,fn){listeners.set(n,(listeners.get(n)||[]).filter(f=>f!==fn));},
      dispatchEvent(ev){ev.target??=this;ev.currentTarget=this;for(const fn of listeners.get(ev.type)||[])fn(ev);this['on'+ev.type]?.(ev);return true;},click(){this.dispatchEvent({type:'click',target:this,preventDefault(){},stopPropagation(){}});},
      appendChild(child){if(child.parentElement){child.parentElement.children=child.parentElement.children.filter(c=>c!==child);}this.children.push(child);child.parentElement=child.parentNode=this;return child;},append(...args){for(const child of args)if(typeof child!=='string')this.appendChild(child);},replaceChildren(...args){this.children=[];this.append(...args);},remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);if(id)ids.delete(id);this.parentElement=this.parentNode=null;},
      querySelectorAll(sel){const selectors=sel.split(',').map(s=>s.trim().split(/\s+/)),out=[];function visit(n){for(const c of n.children){if(selectors.some(chain=>chainMatches(c,chain,el)))out.push(c);visit(c);}}visit(this);return out;},querySelector(sel){return this.querySelectorAll(sel)[0]||null;},closest(sel){let at=this;while(at){if(matches(at,sel))return at;at=at.parentElement;}return null;},matches(sel){return matches(this,sel);},contains(other){let at=other;while(at){if(at===this)return true;at=at.parentElement;}return false;},
      getBoundingClientRect:()=>({width,height,x:0,y:0,left:0,top:0,right:width,bottom:height}),getContext(...args){if(!realCanvas&&canvasFactory)realCanvas=canvasFactory(id||this.name,this.width,this.height);return realCanvas?realCanvas.getContext(...args):canvas;},focus(){document.activeElement=this;},setPointerCapture(){},releasePointerCapture(){},hasPointerCapture:()=>true,requestFullscreen:()=>Promise.resolve(),scrollIntoView(){},
    };
    Object.defineProperty(el,'id',{get:()=>id,set:v=>{if(id)ids.delete(id);id=String(v);if(id)ids.set(id,el);}});
    Object.defineProperty(el,'className',{get:()=>[...classes].join(' '),set:v=>{classes.clear();String(v).split(/\s+/).filter(Boolean).forEach(x=>classes.add(x));}});
    Object.defineProperty(el,'innerHTML',{get:()=>inner,set:v=>{inner=String(v);el.children=[];parse(el,inner);}});
    Object.defineProperty(el,'textContent',{get:()=>el._text+el.children.map(c=>c.textContent).join(''),set:v=>{el._text=String(v);el.children=[];}});
    Object.defineProperty(el,'options',{get:()=>el.children});
    Object.defineProperty(el,'realCanvas',{get:()=>realCanvas});
    return el;
  }
  function parse(parent,html){
    const stack=[parent];for(const tok of html.matchAll(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|[^<]+/g)){
      const s=tok[0];if(s.startsWith('<!--'))continue;if(s.startsWith('</')){if(stack.length>1)stack.pop();continue;}
      if(!s.startsWith('<')){const at=stack.at(-1);at._text+=decode(s);if(at.tagName==='TEXTAREA')at.value+=decode(s);continue;}
      const tag=s.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const e=element(tag);
      for(const m of s.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))e.setAttribute(m[1],m[2]??m[3]??m[4]??'');
      stack.at(-1).appendChild(e);if(!/\/$/.test(s.slice(0,-1))&&!/^(input|br|hr|img|meta|link|source|area|base|col|embed|param|track|wbr)$/i.test(tag))stack.push(e);
    }
    for(const e of parent.querySelectorAll('select')){const option=e.children.find(c=>c.getAttribute('selected')!==null)||e.children[0];if(option)e.value=option.value||option.textContent;}
  }
  const html=element('html'),body=element('body');html.appendChild(body);body.id='body';
  const document={getElementById:id=>ids.get(id)||null,querySelector:sel=>html.querySelector(sel),querySelectorAll:sel=>html.querySelectorAll(sel),createElement:tag=>element(tag),documentElement:html,body,activeElement:body,fullscreenElement:null,hidden:false,addEventListener:(n,fn)=>docListeners.set(n,[...(docListeners.get(n)||[]),fn]),removeEventListener(){},exitFullscreen:()=>Promise.resolve()};
  return{document,elements:ids,docListeners,parseHTML:html=>{body.innerHTML=(html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');}};
}
