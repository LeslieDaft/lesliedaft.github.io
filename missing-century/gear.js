(() => {
  const slots = {
    weapon: 'Weapon', head: 'Helmet', chest: 'Chest armor', hands: 'Gloves',
    legs: 'Leg armor', feet: 'Boots', charm: 'Charm'
  };
  const labels = {attack:'Attack', defense:'Guard', magic:'Magic', hp:'HP', focus:'Starting Focus', critical:'Critical chance'};
  const catalog = {};
  const add = (id, name, slot, chapter, price, stats) => {
    catalog[id] = {id, name, slot, chapter, price, stats};
  };
  add('training-blade','Training Blade','weapon',1,0,{});
  add('linen-tunic','Linen Tunic','chest',1,0,{});
  add('trail-shoes','Trail Shoes','feet',1,0,{});

  add('shortsword','Iron Shortsword','weapon',1,19,{attack:5});
  add('ash-staff','Ashwood Staff','weapon',1,22,{magic:5});
  add('tin-buckler','Tin Buckler Charm','charm',1,14,{defense:2,hp:5});
  add('glass-pendant','Sea Glass Pendant','charm',2,26,{magic:2,focus:1});
  add('cutlass','Tideglass Cutlass','weapon',2,41,{attack:7,critical:9});
  add('reef-wand','Reef Wand','weapon',2,39,{magic:8,attack:1});
  add('beetle-ring','Amber Beetle Ring','charm',3,34,{attack:2,critical:10});
  add('yewbow','Glasswood Bow','weapon',3,56,{attack:10,critical:12});
  add('prism-rod','Prism Rod','weapon',3,58,{magic:11,focus:1});
  add('greatsword','Switchyard Greatsword','weapon',4,73,{attack:15,hp:3});
  add('hammer','Copper Maul','weapon',4,76,{attack:13,defense:3});
  add('whistle','Rail Diver’s Whistle','charm',4,47,{focus:1,attack:3});
  add('gale-spear','Stormglass Spear','weapon',5,105,{attack:16,magic:4,critical:9});
  add('storm-rod','Thunder Rod','weapon',5,108,{magic:17,focus:1});
  add('wind-knot','Wind Knot','charm',5,63,{critical:12,defense:2});
  add('rime-axe','Rimeforged Axe','weapon',6,124,{attack:20,critical:11});
  add('aurora-staff','Aurora Staff','weapon',6,127,{magic:21,hp:9});
  add('totem','Snow Hare Totem','charm',6,71,{hp:21,magic:2});
  add('rapier','Capital Rapier','weapon',7,149,{attack:20,critical:21,focus:1});
  add('sun-censer','Sun Censer','weapon',7,155,{magic:24,defense:4});
  add('gilt-watch','Gilt Pocket Watch','charm',7,83,{focus:2,hp:9});
  add('bogblade','Archive Blade','weapon',8,177,{attack:26,magic:8});
  add('reed-scepter','Reed Scepter','weapon',8,179,{magic:28,focus:2});
  add('drowned-pearl','Drowned Pearl','charm',8,98,{magic:6,defense:4});
  add('meridian-sabre','Meridian Sabre','weapon',9,207,{attack:30,critical:19});
  add('clockwork-rod','Clockwork Rod','weapon',9,212,{attack:11,magic:31,focus:1});
  add('broken-minute','Broken Minute','charm',9,112,{attack:7,critical:14});
  add('dawn-edge','Daybreak Edge','weapon',10,249,{attack:36,critical:22});
  add('firstlight-staff','Firstlight Staff','weapon',10,249,{magic:37,focus:2,hp:12});
  add('last-star','Last Star Pendant','charm',10,131,{magic:7,attack:5,defense:5});

  const sets = [
    ['Leather',1,14,{defense:1,hp:2}],
    ['Padded',1,11,{hp:4,magic:1}],
    ['Bronze',2,27,{defense:2,attack:1}],
    ['Sailcloth',2,25,{magic:2,hp:4}],
    ['Chainmail',3,39,{defense:3,hp:4}],
    ['Greenweave',3,37,{magic:3,critical:3,hp:4}],
    ['Steel',4,54,{defense:4,hp:6,attack:1}],
    ['Stormwoven',5,67,{magic:4,critical:4,hp:7}],
    ['Rimeplate',6,81,{defense:5,hp:8,magic:1}],
    ['Sunsteel',7,95,{defense:5,attack:3,critical:3,hp:8}],
    ['Moonweave',8,107,{magic:5,defense:3,critical:5,hp:10}],
    ['Meridian',9,124,{defense:7,attack:3,hp:10}],
    ['Firstlight',10,145,{defense:8,magic:5,attack:4,hp:12}]
  ];
  const pieces = [
    ['head','Helm',.9,0,{magic:1}],
    ['chest','Chestplate',1.42,4,{defense:2,hp:4}],
    ['hands','Gauntlets',.84,1,{attack:1}],
    ['legs','Legguards',1.1,2,{defense:1,hp:2}],
    ['feet','Boots',.78,0,{critical:2}]
  ];
  for (const [set,chapter,price,stats] of sets) {
    for (const [slot,name,multiplier,extra,adjust] of pieces) {
      const bonuses = {...stats};
      for (const [stat,value] of Object.entries(adjust)) bonuses[stat] = (bonuses[stat] || 0) + value;
      if ((set === 'Stormwoven' || set === 'Moonweave') && slot === 'head') bonuses.focus = 1;
      add(set.toLowerCase()+'-'+slot, set+' '+name, slot, chapter, Math.round(price*multiplier)+extra, bonuses);
    }
  }

  const starting = {weapon:'training-blade', chest:'linen-tunic', feet:'trail-shoes'};
  function create(existing, clearedCount = 0) {
    if (!existing) return {gold:18+Math.min(160,clearedCount*17),owned:Object.values(starting),loadout:{...starting}};
    const owned = [...new Set([...Object.values(starting), ...(Array.isArray(existing.owned) ? existing.owned.filter(id => Object.hasOwn(catalog,id)) : [])])];
    const loadout = {};
    for (const slot of Object.keys(slots)) {
      const id = existing.loadout?.[slot];
      if (owned.includes(id) && catalog[id].slot === slot) loadout[slot] = id;
    }
    return {gold:Number.isSafeInteger(existing.gold) && existing.gold >= 0 ? existing.gold : 18, owned, loadout};
  }

  function total(loadout) {
    const stats = {attack:0,defense:0,magic:0,hp:0,focus:0,critical:0};
    for (const [slot,id] of Object.entries(loadout)) {
      const item = catalog[id];
      if (!item || item.slot !== slot) continue;
      for (const [stat,value] of Object.entries(item.stats)) stats[stat] += value;
    }
    return stats;
  }

  function prices(chapter) {
    return Object.values(catalog).filter(item => item.price && item.chapter <= chapter)
      .sort((a,b) => b.chapter-a.chapter || a.price-b.price || a.name.localeCompare(b.name));
  }

  function victoryGold(chapter, boss) {
    return boss ? 26 + chapter * 7 : 7 + chapter * 3;
  }

  const api = {slots,labels,catalog,create,total,prices,victoryGold};
  if (typeof window !== 'undefined') window.MissingCenturyGear = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
