// Preserve all game-control nodes and handlers while folding their chrome away.
(() => {
 const dock=document.querySelector('.controlDock');
 const menus=[];
 function wrap(node,title,id){
  const menu=document.createElement('details');menu.className='compactMenu';menu.id=id;
  const summary=document.createElement('summary');summary.textContent=title;
  const content=document.createElement('div');content.className='dropdownContent';
  node.before(menu);menu.append(summary,content);content.append(node);menus.push(menu);
  menu.addEventListener('toggle',()=>{if(menu.open&&menu.id!=='meterDropdown')for(const other of menus)if(other!==menu)other.open=false});
  return menu;
 }
 wrap(dock.querySelector('.playCalls'),'Play','playDropdown');
 wrap(dock.querySelector('.settings'),'Receivers','receiverDropdown');
 const camera=document.getElementById('camera'),cameraBox=document.createElement('div');
 dock.append(cameraBox);cameraBox.append(camera);wrap(cameraBox,'Camera','cameraDropdown');
 wrap(dock.querySelector('.panel'),'Controls','controlsDropdown');
 wrap(dock.querySelector('.charge'),'Meter','meterDropdown');
 const stats=document.getElementById('stats');dock.append(stats);wrap(stats,'Info','infoDropdown');
 const hud=document.getElementById('gameHud'),score=hud.querySelector('.scoreRow');
 const gameMenu=document.createElement('details');gameMenu.className='compactMenu gameMenu';gameMenu.id='gameDropdown';
 const summary=document.createElement('summary');summary.append(score);
 const panel=document.createElement('div');panel.className='dropdownContent';
 while(hud.firstChild)panel.append(hud.firstChild);hud.append(gameMenu);gameMenu.append(summary,panel);menus.push(gameMenu);
 const badge=document.getElementById('onlineBadge'),room=document.createElement('details');room.className='compactMenu roomMenu';
 const roomSummary=document.createElement('summary');roomSummary.textContent='Online';
 const roomPanel=document.createElement('div');roomPanel.className='dropdownContent';
 while(badge.firstChild)roomPanel.append(badge.firstChild);badge.append(room);room.append(roomSummary,roomPanel);menus.push(room);
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.compactMenu'))for(const menu of menus)menu.open=false;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const menu of menus)menu.open=false;});
 // Selecting a play/camera returns the field to its clear, collapsed view.
 document.getElementById('playDropdown').addEventListener('click',e=>{if(e.target.closest('button'))document.getElementById('playDropdown').open=false;});
 document.getElementById('receiverDropdown').addEventListener('click',e=>{if(e.target.closest('button'))document.getElementById('receiverDropdown').open=false;});
 document.getElementById('cameraDropdown').addEventListener('change',()=>document.getElementById('cameraDropdown').open=false);
})();
