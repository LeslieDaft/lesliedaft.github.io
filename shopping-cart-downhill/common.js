'use strict';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),keys={};let state='menu',last=0,clock=0,muted=false,audio;
function tone(f=220,d=.08,type='square'){if(muted)return;try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*.5,audio.currentTime+d);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function text(s,x,y,size=20,c='#fff',align='left'){ctx.fillStyle=c;ctx.font=`bold ${size}px system-ui`;ctx.textAlign=align;ctx.fillText(s,x,y)}
function line(x,y,a,b,c,w=3){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke()}
function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function rand(a,b){return a+Math.random()*(b-a)}
function down(k){return !!keys[k]}
function press(k){if(k==='p'){if(state==='play')state='paused';else if(state==='paused')state='play'}if(k==='r')start();if(k==='m')muted=!muted;action(k)}
window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(!keys[k])press(k);keys[k]=true});window.addEventListener('keyup',e=>{let k=e.key.toLowerCase();keys[k]=false;release(k)});window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);if(state==='play')state='paused'});
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(!keys[k])press(k);keys[k]=true};b.onpointerup=b.onpointercancel=()=>{keys[k]=false;release(k)}});
document.querySelector('#start').onclick=()=>start();document.querySelector('#pause').onclick=()=>press('p');document.querySelector('#sound').onclick=e=>{muted=!muted;e.target.textContent=muted?'Sound off':'Sound on'};
function best(key,v){let b=0;try{b=Number(localStorage.getItem(key))||0;if(v>b)localStorage.setItem(key,Math.floor(v))}catch{}return Math.max(b,Math.floor(v||0))}
function overlay(title,sub){rect(0,0,960,600,'#07111dd9');text(title,480,250,46,'#fff','center');text(sub,480,300,18,'#bfccd3','center');text('Press R or use Start / Restart',480,345,18,'#c9fb76','center')}
function frame(t){const dt=Math.min((t-last)/1000||0,.033);last=t;clock+=dt;if(state==='play')update(dt);draw();if(state==='menu')overlay(gameTitle,tagline);if(state==='paused')overlay('PAUSED','P to resume');requestAnimationFrame(frame)}
