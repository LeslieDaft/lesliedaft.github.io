(() => {
  'use strict';
  const size = 24;
  const themes = {
    meadow: { sky: '#576982', haze: '#e5a087', far: '#526b70', middle: '#386760', near: '#2d544b', floor: '#527451', patch: '#63845a', dark: '#293d36', shade: '#335142', light: '#78995c', path: '#af8e5e', pathDark: '#786d4e', water: '#375f6b', ripple: '#739797', stone: '#6c7d75', bloom: '#f2a579', bright: '#f2d696' },
    water: { sky: '#223f58', haze: '#7da9a1', far: '#3d6078', middle: '#325b6d', near: '#204957', floor: '#476965', patch: '#527b75', dark: '#263c46', shade: '#34545a', light: '#64a097', path: '#8b9a86', pathDark: '#577371', water: '#254b66', ripple: '#5cb6b8', stone: '#677c87', bloom: '#cf9aa8', bright: '#aaf1d4' },
    coast: { sky: '#497c95', haze: '#e8ac86', far: '#4e8892', middle: '#417379', near: '#3a615f', floor: '#aa9c70', patch: '#bfad79', dark: '#465655', shade: '#52776a', light: '#7d9b75', path: '#d0ac78', pathDark: '#937c5b', water: '#36748a', ripple: '#91bdaf', stone: '#998f76', bloom: '#ea9377', bright: '#f9d698' },
    glass: { sky: '#534668', haze: '#d3a9c3', far: '#756981', middle: '#546c7d', near: '#3d5667', floor: '#4f6874', patch: '#5c7382', dark: '#323b58', shade: '#466174', light: '#8abdc4', path: '#a49ea5', pathDark: '#6f7481', water: '#3d5683', ripple: '#9ab2da', stone: '#827c9b', bloom: '#f7accf', bright: '#daf6e3' },
    ember: { sky: '#5b4658', haze: '#e68e64', far: '#7a4650', middle: '#5e423d', near: '#493a3a', floor: '#74514b', patch: '#825a4d', dark: '#372d38', shade: '#523d3b', light: '#93664c', path: '#ad794e', pathDark: '#765844', water: '#9e4a40', ripple: '#f28a54', stone: '#9c7761', bloom: '#eeb36e', bright: '#fee9aa' },
    sky: { sky: '#465880', haze: '#e9b9b2', far: '#827fa0', middle: '#687996', near: '#4a6482', floor: '#6d8190', patch: '#80949d', dark: '#38465e', shade: '#54667a', light: '#9eb5b4', path: '#c8b7a6', pathDark: '#818493', water: '#516a9d', ripple: '#aebce7', stone: '#928ca6', bloom: '#f6c7b4', bright: '#f7e5b5' },
    frost: { sky: '#465679', haze: '#9cabc4', far: '#727f9d', middle: '#586e87', near: '#435c78', floor: '#7899a8', patch: '#92b3bd', dark: '#354364', shade: '#466b83', light: '#96bfca', path: '#b4baca', pathDark: '#778798', water: '#406188', ripple: '#8bb9d3', stone: '#8e9eaf', bloom: '#d9c3e9', bright: '#edfae0' },
    dusk: { sky: '#504367', haze: '#c28387', far: '#6a5876', middle: '#564e66', near: '#424855', floor: '#5c5e5d', patch: '#716a65', dark: '#323646', shade: '#4b4b50', light: '#92877e', path: '#9e8771', pathDark: '#6a625a', water: '#3c465e', ripple: '#817b93', stone: '#847783', bloom: '#dfae9f', bright: '#f4d7ac' },
    marsh: { sky: '#3b4f58', haze: '#8fa68b', far: '#52636c', middle: '#455a59', near: '#344d43', floor: '#4d6546', patch: '#61764b', dark: '#293b37', shade: '#344f45', light: '#819458', path: '#a09062', pathDark: '#62644b', water: '#354f4e', ripple: '#729385', stone: '#707f72', bloom: '#c2b875', bright: '#e7d99a' },
    void: { sky: '#1c1b35', haze: '#85506a', far: '#503c56', middle: '#3c304b', near: '#28233d', floor: '#484056', patch: '#50475e', dark: '#282033', shade: '#382e47', light: '#80647d', path: '#8f7186', pathDark: '#594a64', water: '#312443', ripple: '#915e8e', stone: '#74637b', bloom: '#ea8e88', bright: '#ffc694' }
  };
  const aliases = { forest: 'meadow', village: 'meadow', ruins: 'dusk', underground: 'water', cavern: 'water', desert: 'ember', ocean: 'coast', glacier: 'frost', citadel: 'dusk', finale: 'void' };
  const themeFor = (theme) => themes[theme] || themes[aliases[theme]] || themes.meadow;
  const rand = (x, y, seed = 0) => {
    let n = Math.imul(x + 7919, 1597334677) ^ Math.imul(y + 73, 3812015801) ^ Math.imul(seed + 13, 2793719);
    n = Math.imul(n ^ n >>> 16, 0x7feb352d);
    n = Math.imul(n ^ n >>> 15, 0x846ca68b);
    return ((n ^ n >>> 16) >>> 0) / 4294967296;
  };
  function rect(ctx, color, x, y, width, height) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }
  function polygon(ctx, color, points) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [i, [x, y]] of points.entries()) {
      if (i === 0) ctx.moveTo(Math.round(x), Math.round(y));
      else ctx.lineTo(Math.round(x), Math.round(y));
    }
    ctx.closePath();
    ctx.fill();
  }
  function pixelCircle(ctx, color, x, y, r) {
    for (let row = -r; row <= r; row++) {
      const half = Math.floor(Math.sqrt(r * r - row * row));
      rect(ctx, color, x - half, y + row, half * 2 + 1, 1);
    }
  }
  function grass(ctx, p, x, y) {
    rect(ctx, p.shade, x, y + 3, 6, 2);
    rect(ctx, p.light, x + 1, y + 1, 1, 3);
    rect(ctx, p.light, x + 3, y, 1, 4);
    rect(ctx, p.patch, x + 5, y + 2, 1, 2);
  }
  function tree(ctx, p, x, y, variant = 0) {
    rect(ctx, '#14232b73', x + 1, y + 22, 22, 5);
    rect(ctx, p.dark, x + 10, y + 14, 6, 12);
    rect(ctx, p.pathDark, x + 11, y + 18, 2, 7);
    const branches = [
      [[11, -4], [15, -4], [15, 0], [20, 0], [20, 5], [24, 5], [24, 17], [21, 17], [21, 21], [5, 21], [5, 19], [1, 19], [1, 9], [4, 9], [4, 4], [8, 4], [8, 0], [11, 0]],
      [[11, -5], [14, -5], [14, 0], [17, 0], [17, 5], [20, 5], [20, 10], [23, 10], [23, 15], [20, 15], [20, 20], [3, 20], [3, 16], [0, 16], [0, 11], [4, 11], [4, 7], [7, 7], [7, 2], [11, 2]]
    ][variant];
    polygon(ctx, p.dark, branches.map(([a,b]) => [x + a, y + b]));
    polygon(ctx, p.shade, branches.map(([a,b]) => [x + a * .86 + 1, y + b * .87]));
    polygon(ctx, p.floor, [[x+11,y-1],[x+15,y-1],[x+15,y+3],[x+19,y+3],[x+19,y+7],[x+15,y+7],[x+15,y+10],[x+11,y+10],[x+11,y+12],[x+6,y+12],[x+6,y+7],[x+9,y+7],[x+9,y+3],[x+11,y+3]]);
    rect(ctx, p.light, x + 10, y + 4, 3, 2);
    rect(ctx, p.patch, x + 7, y + 10, 4, 2);
    rect(ctx, p.floor, x + 15, y + 13, 5, 2);
  }
  function stone(ctx, p, x, y, t, yOffset = 0) {
    y += yOffset;
    rect(ctx, '#17202770', x + 1, y + 17, 23, 7);
    polygon(ctx, p.dark, [[x+1,y+9],[x+6,y+4],[x+19,y+4],[x+24,y+9],[x+24,y+20],[x+19,y+23],[x+4,y+23],[x+1,y+19]]);
    polygon(ctx, p.stone, [[x+2,y+9],[x+7,y+5],[x+18,y+5],[x+22,y+9],[x+19,y+15],[x+5,y+15]]);
    rect(ctx, p.light, x + 7, y + 7, 7, 1);
    rect(ctx, p.shade, x + 4, y + 15, 17, 4);
    rect(ctx, p.floor, x + 14, y + 17, 7, 1);
    if (t > .65) rect(ctx, p.patch, x + 3, y + 12, 5, 2);
  }
  function crystal(ctx, p, x, y, n) {
    rect(ctx, '#17202780', x + 1, y + 20, 23, 5);
    polygon(ctx, p.dark, [[x+3,y+20],[x+2,y+11],[x+7,y+9],[x+9,y+11],[x+11,y+1],[x+15,y-3],[x+20,y+1],[x+22,y+10],[x+24,y+17],[x+20,y+24],[x+9,y+24]]);
    polygon(ctx, p.light, [[x+9,y+18],[x+14,y],[x+17,y-1],[x+21,y+4],[x+19,y+19],[x+15,y+22]]);
    polygon(ctx, p.stone, [[x+3,y+13],[x+6,y+10],[x+10,y+12],[x+13,y+22],[x+8,y+22]]);
    polygon(ctx, p.shade, [[x+15,y+21],[x+17,y+8],[x+21,y+4],[x+19,y+19]]);
    if (n > .4) rect(ctx, p.bright, x + 15, y + 2, 1, 6);
  }
  function wall(ctx, p, x, y, n) {
    rect(ctx, p.dark, x, y, size, size);
    rect(ctx, p.shade, x + 1, y + 1, size - 2, 15);
    rect(ctx, p.stone, x + 1, y + 2, size - 2, 4);
    rect(ctx, p.light, x + 1, y + 1, size - 2, 1);
    rect(ctx, p.floor, x + 1, y + 8, size - 2, 5);
    rect(ctx, p.dark, x + 8, y + 7, 1, 9);
    rect(ctx, p.dark, x + 16, y + 2, 1, 5);
    if (n > .65) rect(ctx, p.patch, x + 1, y + 11, 5, 1);
  }
  const isVillage = p => p === themes.meadow || p === themes.coast || p === themes.marsh;
  function house(ctx, p, x, y, width, depth, accent, seed) {
    const roof = p === themes.coast ? '#4f7989' : accent ? '#a8785c' : '#965d54';
    const roofLight = p === themes.coast ? '#79a7ae' : accent ? '#c69c6d' : '#bf8062';
    const wall = p === themes.marsh ? '#a79567' : '#ba9c74';
    const wallShade = p === themes.marsh ? '#6e6551' : '#847452';
    const left = x + 3;
    const right = x + width - 3;
    const top = y + 5;
    const center = (left + right) / 2;
    const wallTop = top + depth * .41;
    const sill = y + depth - 3;
    rect(ctx, '#14232b73', left - 1, sill - 3, width + 2, 5);
    rect(ctx, p.dark, left + 1, wallTop, right - left - 1, sill - wallTop + 1);
    rect(ctx, wall, left + 3, wallTop, right - left - 5, sill - wallTop - 1);
    rect(ctx, wallShade, left + 3, sill - 4, right - left - 5, 4);
    rect(ctx, wallShade, left + 4, wallTop + 3, right - left - 8, 1);
    polygon(ctx, p.dark, [[left-2,wallTop],[left+8,top],[right-9,top],[right+1,wallTop],[right+1,wallTop+3],[left-2,wallTop+3]]);
    polygon(ctx, roof, [[left,wallTop],[left+9,top+1],[right-10,top+1],[right-1,wallTop]]);
    rect(ctx, roofLight, left + 10, top + 1, right - left - 20, 1);
    for (let d = 5; top + d < wallTop; d += 4) {
      const inset = Math.round(9 * (wallTop - top - d) / (wallTop-top));
      rect(ctx, roofLight, left + inset + 2, top + d, right - left - inset * 2 - 4, 1);
    }
    if (right - left > 34) {
      rect(ctx, p.dark, right - 13, top - 6, 7, 10);
      rect(ctx, wallShade, right - 12, top - 5, 5, 9);
      rect(ctx, wall, right - 13, top - 7, 7, 2);
    }
    const doorW = Math.max(5, Math.min(9, Math.floor(width/5)));
    const doorH = Math.max(4, Math.min(13, Math.floor(depth/4)));
    rect(ctx, p.dark, center - doorW/2, sill - doorH, doorW, doorH);
    rect(ctx, wallShade, center - doorW/2 + 1, sill - doorH + 1, doorW - 2, doorH - 1);
    if (doorH > 6) rect(ctx, p.bright, center + 1, sill - 5, 1, 1);
    if (depth > 29) {
      for (let n = left + 11; n < right - 10; n += 13) {
        if (Math.abs(n - center) < 11) continue;
        rect(ctx, p.dark, n - 3, sill - 17, 7, 8);
        rect(ctx, n % 3 === 1 ? p.ripple : p.bright, n - 2, sill - 16, 5, 6);
        rect(ctx, wallShade, n, sill - 16, 1, 6);
        rect(ctx, wallShade, n - 2, sill - 13, 5, 1);
      }
      if (width > 48 && seed > .3) {
        rect(ctx, wallShade, left + 4, wallTop + 5, 3, sill - wallTop - 8);
        rect(ctx, wallShade, right - 7, wallTop + 5, 3, sill - wallTop - 8);
      }
    }
  }
  function villageRoofs(ctx, p, grid, cameraX, cameraY, width, height) {
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      const before = grid[y - 1];
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== '+' || row[x - 1] === '+' || before?.[x] === '+') continue;
        let run = 1;
        let depth = 1;
        while (row[x + run] === '+') run++;
        while (grid[y + depth]?.slice(x,x + run) === '+'.repeat(run)) depth++;
        const px = x * size - cameraX;
        const py = y * size - cameraY;
        if (px > width || px + run * size < 0 || py > height || py + depth * size < 0) continue;
        const houses = run >= 6 ? 2 : 1;
        for (let i = 0; i < houses; i++) {
          const piece = Math.floor(run * size / houses);
          house(ctx, p, px + i * piece, py, piece, depth * size, (i + x + y) % 2 === 0, rand(x,y));
        }
      }
    }
  }
  function structure(ctx, p, x, y, t) {
    wall(ctx, p, x, y, t);
    rect(ctx, p.dark, x + 7, y + 5, 10, 18);
    rect(ctx, p.stone, x + 5, y + 6, 2, 15);
    rect(ctx, p.stone, x + 17, y + 6, 2, 15);
    rect(ctx, p.bright, x + 11, y + 5, 2, 5);
  }
  function terrain(ctx, tile, p, x, y, mapX, mapY, time) {
    const n = rand(mapX, mapY, 34);
    rect(ctx, p.floor, x, y, size, size);
    if (n < .45) {
      rect(ctx, p.patch, x + 9, y + 3, 10, 3);
      rect(ctx, p.patch, x + 14, y + 6, 7, 2);
      rect(ctx, p.shade, x + 3, y + 15, 5, 1);
    } else if (n > .55) {
      rect(ctx, p.patch, x + 2, y + 9, 6, 2);
      rect(ctx, p.patch, x + 12, y + 17, 9, 3);
      rect(ctx, p.shade, x + 10, y + 21, 3, 1);
    }
    if (tile === ':' || tile === '=') {
      rect(ctx, p.path, x, y, size, size);
      if (tile === '=') {
        for (let line = 0; line < size; line += 6) {
          rect(ctx, p.pathDark, x, y + line, size, 1);
          rect(ctx, p.bright, x + 2, y + line + 1, 3, 1);
          rect(ctx, p.pathDark, x + 19, y + line + 3, 2, 2);
        }
      } else {
        rect(ctx, p.pathDark, x + 3, y + (n > .5 ? 7 : 15), 6, 1);
        if (n > .25) rect(ctx, p.bright, x + 16, y + 4, 2, 1);
      }
    }
    if (tile === '~') {
      rect(ctx, p.water, x, y, size, size);
      const slide = Math.floor(time / .37 + n * 8) % 6;
      rect(ctx, p.shade, x + 2 + slide, y + 12, 12, 1);
      rect(ctx, p.ripple, x + 4 + slide, y + 5, 6, 1);
      if (n > .4) rect(ctx, p.ripple, x + 14 - slide, y + 18, 6, 1);
    }
    if (tile === ',' || tile === '*' || n > .76 && (tile === '.' || tile === '@')) {
      grass(ctx, p, x + 5, y + 12);
      if (n > .24) grass(ctx, p, x + 15, y + 6);
      if (tile === '*') {
        rect(ctx, p.bloom, x + 6, y + 9, 3, 3);
        rect(ctx, p.bright, x + 7, y + 10, 1, 1);
        rect(ctx, p.bloom, x + 17, y + 5, 2, 2);
      }
    }
    if (tile === '^') stone(ctx, p, x, y, n);
    if (tile === '+' && !isVillage(p)) structure(ctx, p, x, y, n);
  }
  function barrier(ctx, p, x, y, n) {
    if (p === themes.glass || p === themes.frost) crystal(ctx, p, x, y, n);
    else if (p === themes.water || p === themes.ember || p === themes.dusk || p === themes.void || p === themes.sky) wall(ctx, p, x, y, n);
    else tree(ctx, p, x, y, n > .5 ? 1 : 0);
  }
  const people = {
    Ari: ['#c96f52', '#f6c287', '#684238'],
    Mira: ['#519d94', '#f1bca0', '#5f394f'],
    Bram: ['#b5976b', '#b37e5c', '#2b3442']
  };
  const characterColors = [
    ['#7379ab', '#ecc192', '#594053'], ['#758c55', '#d69d72', '#593f35'],
    ['#b88756', '#f0c586', '#52473e'], ['#7b618f', '#b98065', '#342d39'],
    ['#628894', '#f2c2a1', '#725245']
  ];
  function person(ctx, x, y, color, facing = 'down', frame = 0) {
    const [coat, skin, hair] = color;
    rect(ctx, '#121e276f', x + 5, y + 18, 14, 4);
    rect(ctx, '#232b35', x + 7, y + 11, 11, 9);
    rect(ctx, '#232b35', x + 6, y + 12, 13, 5);
    rect(ctx, coat, x + 8, y + 11, 9, 6);
    rect(ctx, '#f2cd88', x + 8, y + 16, 9, 1);
    rect(ctx, '#293040', x + 8, y + 18 + frame, 3, 3);
    rect(ctx, '#293040', x + 14, y + 19 - frame, 3, 3);
    rect(ctx, hair, x + 7, y + 1, 11, 11);
    rect(ctx, hair, x + 8, y, 9, 12);
    rect(ctx, skin, x + 8, y + 6, 9, 6);
    if (facing === 'up') {
      rect(ctx, hair, x + 8, y + 5, 9, 6);
    } else {
      rect(ctx, '#2c2b38', x + (facing === 'left' ? 8 : 10), y + 7, 1, 2);
      if (facing !== 'left') rect(ctx, '#2c2b38', x + (facing === 'right' ? 16 : 14), y + 7, 1, 2);
      rect(ctx, '#a76059', x + 12, y + 10, 2, 1);
    }
    rect(ctx, coat, x + 8, y + 2, 5, 1);
    rect(ctx, skin, x + 6, y + 13, 2, 3);
    rect(ctx, skin, x + 17, y + 13, 2, 3);
  }
  function monster(ctx, p, x, y, foe, large, pulse) {
    const form = foe && foe.form;
    rect(ctx, '#151d2a91', x + 2, y + 18, 20, 5);
    const edge = '#222431';
    const high = large ? '#d7936a' : '#bc9a78';
    const mid = large ? '#a95a61' : '#776482';
    if (form === 'moth' || form === 'bird' || form === 'wisp') {
      const rise = pulse ? 3 : 0;
      polygon(ctx, edge, [[x+1,y+6+rise],[x+7,y+5],[x+12,y+10],[x+17,y+5],[x+23,y+6+rise],[x+20,y+15],[x+14,y+15],[x+12,y+21],[x+10,y+15],[x+4,y+15]]);
      polygon(ctx, mid, [[x+3,y+7+rise],[x+7,y+7],[x+12,y+12],[x+17,y+7],[x+21,y+7+rise],[x+18,y+13],[x+14,y+13],[x+12,y+17],[x+10,y+13],[x+6,y+13]]);
      rect(ctx, high, x + 11, y + 10, 2, 4);
    } else if (form === 'knight' || form === 'golem' || form === 'root') {
      rect(ctx, edge, x + 5, y + 4, 14, 15);
      rect(ctx, edge, x + 4, y + 8, 16, 7);
      rect(ctx, mid, x + 7, y + 4, 10, 13);
      rect(ctx, p.stone, x + 7, y + 12, 10, 2);
      rect(ctx, p.bright, x + 9, y + 8, 6, 1);
      rect(ctx, edge, x + 5, y + 17, 5, 4);
      rect(ctx, edge, x + 14, y + 17, 5, 4);
    } else {
      polygon(ctx, edge, [[x+2,y+12],[x+5,y+8],[x+7,y+7],[x+8,y+5],[x+17,y+5],[x+17,y+7],[x+20,y+9],[x+22,y+13],[x+20,y+18],[x+3,y+18]]);
      polygon(ctx, mid, [[x+4,y+13],[x+9,y+7],[x+16,y+7],[x+20,y+13],[x+18,y+16],[x+6,y+16]]);
      rect(ctx, high, x + 8, y + 8, 7, 1);
      rect(ctx, p.bright, x + 8, y + 13, 2, 2);
      rect(ctx, p.bright, x + 15, y + 13, 2, 2);
      if (form === 'crab' || form === 'beetle') {
        rect(ctx, edge, x + 2, y + 17, 5, 3);
        rect(ctx, edge, x + 18, y + 17, 4, 3);
      }
    }
  }
  function sparkle(ctx, color, x, y) {
    rect(ctx, color, x + 2, y, 1, 5);
    rect(ctx, color, x, y + 2, 5, 1);
  }
  function actorSprite(ctx, actor, p, x, y, time) {
    const phase = Math.floor(time * 3 + actor.x + actor.y) % 2;
    const selected = actor.selected || actor.nearby;
    if (selected) rect(ctx, p.bright, x + 4, y + 22, 16, 1);
    if (actor.kind === 'npc') {
      const identity = Object.keys(people).find(name => actor.name.startsWith(name));
      const color = people[identity] || characterColors[Math.floor(rand(actor.x, actor.y) * characterColors.length)];
      person(ctx, x, y + 1, color, 'down');
    } else if (actor.kind === 'enemy' || actor.kind === 'boss') {
      monster(ctx, p, x, y - phase, actor.foe, actor.kind === 'boss', phase);
      if (actor.kind === 'boss') {
        rect(ctx, '#3a2939', x + 10, y - 2, 5, 5);
        rect(ctx, '#f2ba83', x + 12, y - 1, 1, 3);
      }
    } else if (actor.kind === 'gate') {
      rect(ctx, '#2029329d', x + 2, y + 20, 20, 4);
      rect(ctx, p.dark, x + 3, y + 6, 18, 14);
      rect(ctx, p.stone, x + 5, y + 8, 3, 13);
      rect(ctx, p.stone, x + 16, y + 8, 3, 13);
      rect(ctx, p.light, x + 7, y + 6, 10, 3);
      rect(ctx, p.ripple, x + 8, y + 17, 8, 2);
      rect(ctx, p.bright, x + 11, y + 11 + phase, 2, 4);
    } else if (actor.kind === 'relic') {
      rect(ctx, '#202731a0', x + 4, y + 18, 16, 4);
      rect(ctx, p.stone, x + 6, y + 14, 12, 6);
      rect(ctx, p.dark, x + 7, y + 16, 10, 2);
      const gem = actor.done ? p.ripple : p.bright;
      polygon(ctx, gem, [[x+12,y+5-phase],[x+17,y+10-phase],[x+12,y+15-phase],[x+7,y+10-phase]]);
      if (!actor.done) sparkle(ctx, p.bright, x + 17, y + 4 + phase);
    } else if (actor.kind === 'chest') {
      rect(ctx, p.dark, x + 4, y + 11, 17, 10);
      rect(ctx, actor.done ? p.pathDark : '#a96b4c', x + 6, y + 12, 13, 7);
      rect(ctx, actor.done ? p.stone : '#d5ac71', x + 6, y + 13, 13, 1);
      rect(ctx, p.bright, x + 11, y + 15, 2, 3);
      if (!actor.done) sparkle(ctx, p.bright, x + 17, y + 5 + phase);
    }
  }
  function render(canvas, {map, theme, player, actors = [], time = 0}) {
    if (!canvas || !map?.tiles?.length) return;
    const ctx = canvas.getContext('2d');
    const {width, height} = canvas;
    const grid = map.tiles;
    const p = themeFor(theme);
    const worldWidth = Math.max(...grid.map(row => row.length)) * size;
    const worldHeight = grid.length * size;
    const focusX = player ? (player.x + .5) * size : worldWidth * .5;
    const focusY = player ? (player.y + .5) * size : worldHeight * .5;
    const cameraX = Math.floor(Math.max(0, Math.min(worldWidth - width, focusX - width * .5)));
    const cameraY = Math.floor(Math.max(0, Math.min(worldHeight - height, focusY - height * .52)));
    const firstX = Math.floor(cameraX / size);
    const firstY = Math.floor(cameraY / size);
    const lastX = Math.min(worldWidth / size, Math.ceil((cameraX + width) / size));
    const lastY = Math.min(grid.length, Math.ceil((cameraY + height) / size) + 1);
    const units = [...actors, ...(player ? [{...player, kind:'player'}] : [])].sort((a,b) => a.y - b.y);
    rect(ctx, p.dark, 0, 0, width, height);
    for (let y = firstY; y < lastY; y++) {
      for (let x = firstX; x < lastX; x++) {
        const tile = grid[y][x] || '#';
        const px = x * size - cameraX;
        const py = y * size - cameraY;
        terrain(ctx, tile, p, px, py, x, y, time);
        if (tile === '~') {
          if (grid[y-1]?.[x] && grid[y-1][x] !== '~' && grid[y-1][x] !== '=') rect(ctx, p.ripple, px, py, size, 1);
          if (grid[y]?.[x-1] && grid[y][x-1] !== '~' && grid[y][x-1] !== '=') rect(ctx, p.ripple, px, py, 1, size);
        }
      }
    }
    if (isVillage(p)) villageRoofs(ctx, p, grid, cameraX, cameraY, width, height);
    for (let y = firstY; y < lastY; y++) {
      for (let x = firstX; x < lastX; x++) {
        if (grid[y][x] === '#') barrier(ctx, p, x * size - cameraX, y * size - cameraY, rand(x,y,25));
      }
      for (const actor of units) {
        if (actor.y !== y || actor.x < firstX || actor.x > lastX) continue;
        const x = actor.x * size - cameraX;
        const py = y * size - cameraY;
        if (actor.kind === 'player') {
          person(ctx, x, py, people.Ari, actor.facing);
          rect(ctx, p.bright, x + 6, py + 22, 12, 1);
        } else actorSprite(ctx, actor, p, x, py, time);
      }
    }
    if (p === themes.void || p === themes.ember || p === themes.frost) {
      ctx.globalAlpha = p === themes.void ? .6 : .47;
      for (let dot = 0; dot < 24; dot++) {
        const x = (rand(dot,2) * width + time * 2 * (dot % 3 + 1)) % width;
        const y = (rand(dot,5) * height + time * (dot % 2 === 0 ? 3 : 6)) % height;
        rect(ctx, dot % 3 ? p.bloom : p.bright, x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
  function ridge(ctx, color, height, width, baseline, depth, seed, step) {
    const points = [];
    for (let x = 0; x <= width + step; x += step) {
      const rounded = Math.cos((x / width + seed * .13) * 9) * .27 + Math.sin((x / width + seed * .2) * 21) * .13;
      points.push([x, baseline - (rounded + rand(Math.floor(x / step), seed) * .43) * depth]);
    }
    polygon(ctx, color, [...points, [width, height], [0, height]]);
    return points;
  }
  function steppedCloud(ctx, x, y, width, color, depth = 1) {
    rect(ctx, color, x + width * .18, y, width * .22, 2 * depth);
    rect(ctx, color, x + width * .11, y + 2 * depth, width * .58, 2 * depth);
    rect(ctx, color, x, y + 4 * depth, width, 2 * depth);
    rect(ctx, color, x + width * .38, y + 6 * depth, width * .46, depth);
  }
  function landscapeTrees(ctx, p, width, horizon, seed, height, color) {
    for (let x = -7; x < width + 7; x += 4 + seed % 4) {
      const n = rand(x, seed);
      const base = horizon + Math.sin(x / 17 + seed) * 4;
      const tall = Math.floor(height * (.5 + n * .65));
      const spread = Math.max(3, Math.floor(tall * .26));
      rect(ctx, p.dark, x, base - tall, 1, tall + 2);
      for (let i = 0; i < 4; i++) {
        const middle = base - tall + tall * (.21 + i * .18);
        const side = 1 + spread * i / 3;
        polygon(ctx, color, [[x,middle-tall*.22],[x+side,middle+2],[x-side,middle+2]]);
      }
    }
  }
  function tower(ctx, p, cx, y, scale, brightness) {
    ctx.save();
    ctx.translate(Math.round(cx), Math.round(y));
    ctx.scale(scale, scale);
    const mortar = brightness ? '#a79480' : p.stone;
    const shadow = brightness ? '#514957' : p.dark;
    const shoulder = brightness ? '#777177' : p.shade;
    rect(ctx, shadow, -21, 20, 42, 9);
    rect(ctx, mortar, -19, 18, 7, 10);
    rect(ctx, shoulder, 11, 17, 10, 12);
    rect(ctx, shadow, -12, -26, 25, 55);
    rect(ctx, mortar, -11, -25, 18, 54);
    rect(ctx, shoulder, 5, -23, 7, 52);
    for (let height = -23; height < 28; height += 6) {
      rect(ctx, shoulder, -10, height, 15, 1);
      rect(ctx, shoulder, height % 2 ? -7 : -4, height, 1, 5);
    }
    rect(ctx, shadow, -5, -17, 10, 22);
    rect(ctx, shadow, -3, -19, 6, 2);
    rect(ctx, p.bright, -2, -13, 3, 12);
    rect(ctx, p.bright, -3, -9, 5, 5);
    rect(ctx, shoulder, -4, 15, 9, 14);
    rect(ctx, shadow, -2, 15, 6, 14);
    polygon(ctx, shadow, [[-18,-25],[0,-48],[17,-25],[17,-22],[-18,-22]]);
    polygon(ctx, brightness ? '#9c625d' : p.near, [[-15,-25],[0,-45],[1,-25]]);
    rect(ctx, p.bright, 0, -47, 1, 4);
    rect(ctx, mortar, -12, -24, 23, 2);
    ctx.restore();
  }
  function landmark(ctx, p, x, y, graphic, scale, grand) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale, scale);
    if (graphic === 'tower' || graphic === 'keep') {
      if (graphic === 'keep') {
        rect(ctx, p.dark, -44, -12, 88, 41);
        for (let i = -43; i < 45; i += 9) rect(ctx, p.stone, i, -13, 6, 4);
        tower(ctx,p,-31,5,.65,false);
        tower(ctx,p,31,8,.55,false);
      }
      tower(ctx,p,0,0,1,grand);
    } else if (graphic === 'ship') {
      polygon(ctx, p.dark, [[-40,4],[36,4],[24,17],[-26,17]]);
      rect(ctx, p.path, -36, 4, 68, 2);
      rect(ctx, p.dark,-6,-31,2,38);
      polygon(ctx, p.bloom, [[-7,-27],[-34,0],[-7,0]]);
      polygon(ctx, p.bright, [[-3,-25],[17,-2],[-3,-2]]);
      polygon(ctx, p.light, [[18,-14],[29,0],[18,0]]);
      rect(ctx, p.dark,17,-19,2,26);
    } else if (graphic === 'crystals') {
      for (const [x,y,s] of [[-38,8,.8],[-21,3,1.1],[4,-14,1.8],[25,8,1],[35,9,.7]]) {
        ctx.save();
        ctx.translate(x,y);
        ctx.scale(s,s);
        crystal(ctx, p, -12, -10, 1);
        ctx.restore();
      }
    } else if (graphic === 'bridge') {
      rect(ctx, p.dark, -53, 2, 106, 6);
      rect(ctx, p.stone, -51, 1, 103, 2);
      for (let i = -48; i <= 46; i += 16) {
        rect(ctx, p.shade, i, 3, 5, 17);
        rect(ctx, p.light, i, 4, 1, 16);
      }
      rect(ctx, p.stone, -50, 16, 102, 1);
    } else {
      for (const offset of [-39, -29, 27, 38]) {
        rect(ctx, p.dark, offset, -11 + offset % 9, 7, 29);
        rect(ctx, p.stone, offset + 1, -11 + offset % 9, 2, 24);
      }
      rect(ctx, p.dark, -21, -29, 42, 47);
      rect(ctx, p.stone, -20, -29, 40, 4);
      rect(ctx, p.shade, -19, -25, 39, 5);
      rect(ctx, p.light, -19, -28, 37, 1);
      rect(ctx, p.stone, -15, -19, 5, 35);
      rect(ctx, p.stone, 10, -19, 5, 35);
      rect(ctx, p.water, -9, -18, 18, 34);
      if (graphic === 'eye') {
        rect(ctx, p.bloom, -7, -3, 14, 3);
        rect(ctx, p.bright, -2, -4, 4, 4);
      } else {
        rect(ctx, p.ripple, -3, -13, 6, 25);
        rect(ctx, p.bright, -1, -8, 2, 14);
      }
    }
    ctx.restore();
  }
  const landmarks = ['tower', 'temple', 'ship', 'crystals', 'keep', 'bridge', 'crystals', 'temple', 'keep', 'eye'];
  function landscape(canvas, theme, time, index, grand = false) {
    const ctx = canvas.getContext('2d');
    const {width, height} = canvas;
    const p = themeFor(theme);
    const seed = grand ? 4 : index + 1;
    const horizon = height * .64;
    const scale = (grand ? .96 : .72) * width / 240;
    const cx = width * (grand ? .72 : .62);
    const ground = height * .77;
    const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
    gradient.addColorStop(0, p.sky);
    gradient.addColorStop(.64, p.sky);
    gradient.addColorStop(1, p.haze);
    rect(ctx, gradient, 0, 0, width, height);
    for (let n = 0; n < 35; n++) {
      const x = rand(n,seed,4) * width;
      const y = rand(n,seed,7) * height * .48;
      ctx.globalAlpha = .25 + rand(n,4,seed) * .25;
      rect(ctx,p.bright,x,y,n % 9 === 0 ? 2 : 1,1);
    }
    ctx.globalAlpha = 1;
    const radius = Math.floor(height * (grand ? .15 : .16));
    pixelCircle(ctx, p.haze, width * .80, height * .34, radius + Math.round(radius * .24));
    pixelCircle(ctx, p.bright, width * .80, height * .34, radius);
    for (let n = 0; n < 11; n++) {
      ctx.globalAlpha = .22 + rand(n,seed,80) * .36;
      const x = (rand(n,seed,44) * width + time * (n % 4 + 1)) % (width * 1.28) - width * .13;
      const y = height * (.15 + rand(n,seed,81) * .38);
      steppedCloud(ctx, x, y, width * (.08 + rand(n,seed,92) * .20), n % 3 ? p.haze : p.bright, Math.max(1, height / 100));
    }
    ctx.globalAlpha = 1;
    ridge(ctx, p.far, height, width, horizon, height * .66, seed, Math.max(5, Math.round(width/19)));
    ridge(ctx, p.middle, height, width, horizon + height * .11, height * .48, seed + 7, Math.max(5, Math.round(width/31)));
    const hills = ridge(ctx, p.near, height, width, ground, height * .29, seed + 16, Math.max(5, Math.round(width/34)));
    const watery = p === themes.water || p === themes.coast;
    if (watery || grand) {
      polygon(ctx, p.water, [[0,height*.73],[width*.13,height*.74],[width*.39,height*.70],[width*.58,height*.72],[width,height*.65],[width,height],[0,height]]);
      for (let n = 0; n < 68; n++) {
        const x = rand(n,seed,13) * width;
        const y = height * (.70 + rand(n,seed,73) * .31);
        ctx.globalAlpha = .24 + rand(n,seed,8) * .42;
        rect(ctx, n % 3 ? p.ripple : p.haze, x + Math.sin(time + n) * 3, y, Math.max(2,rand(n,seed,87)*width*.10), n % 6 === 0 ? 2 : 1);
      }
      ctx.globalAlpha = 1;
    }
    if (!watery || grand) {
      const shoulder = grand ? width * .31 : 0;
      polygon(ctx, p.shade, [[shoulder,height],[width*.46,height*.83],[width*.59,height*.80],[width*.64,ground],[width*.80,height*.71],[width*.91,height*.77],[width,height*.74],[width,height]]);
      polygon(ctx, p.pathDark, [[width*.42,height],[width*.51,height*.92],[width*.64,height*.84],[width*.69,height*.74],[width*.73,height*.75],[width*.68,height*.87],[width*.56,height*.94],[width*.53,height]]);
    }
    if (grand) {
      landscapeTrees(ctx, p, width * .44, height * .79, seed, height * .14, p.near);
      ctx.save();
      ctx.translate(width * .82, 0);
      landscapeTrees(ctx, p, width * .18, height * .84, seed + 4, height * .21, p.shade);
      ctx.restore();
    }
    landmark(ctx, p, cx, ground - (grand ? 11 : 3), grand ? 'tower' : landmarks[index] || 'tower', scale, grand);
    if (grand) {
      for (let n = 0; n < 10; n++) {
        const x = width * (.56 + n * .034);
        const y = ground + Math.sin(n * 1.4) * 4;
        rect(ctx, p.dark, x-3,y+4,8,6);
        polygon(ctx, n % 2 ? '#a56661' : '#706473', [[x-5,y+4],[x+1,y-2],[x+6,y+4]]);
        rect(ctx, p.bright,x+1,y+6,1,2);
      }
      const front = [[0,height],[0,height*.89],[width*.18,height*.91],[width*.32,height*.87],[width*.48,height*.96],[width*.66,height],[width*.83,height*.93],[width,height*.88],[width,height]];
      polygon(ctx, p.dark, front);
      for (let n = 0; n < 38; n++) {
        const x = rand(n,9,14) * width;
        const y = height * (.935 + rand(n,13,7) * .068);
        rect(ctx, n % 3 ? p.shade : p.light, x, y, n % 4 + 1, 1);
      }
      const trailX = width * .53;
      const trailY = height * .87;
      person(ctx, trailX, trailY, people.Ari, 'up');
      person(ctx, trailX - width * .06, trailY + 12, people.Mira, 'up');
      person(ctx, trailX - width * .12, trailY + 18, people.Bram, 'up');
    } else if (!watery) {
      for (const [x,y] of hills.filter((_,k) => k % 3 === 0)) {
        if (Math.abs(cx - x) < width * .25) continue;
        const n = height * .035;
        rect(ctx,p.shade,x,y + n,n * 2,1);
        rect(ctx,p.light,x + 2,y + n,n,1);
      }
    }
    for (let n = 0; n < 8; n++) {
      const x = (rand(n,7,6) * width + time * (n % 2 ? 4 : 7)) % width;
      const y = height * (.52 + rand(n,21,3) * .42) + Math.sin(time + n) * 2;
      ctx.globalAlpha = .45 + Math.sin(time * 2 + n) * .2;
      rect(ctx, p.bright, x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
  function cover(canvas, time = 0) {
    landscape(canvas, 'meadow', time, 0, true);
  }
  function thumbnail(canvas, theme, index = 0) {
    landscape(canvas, theme, 0, index);
  }

  window.MissingCenturyArt = {render, cover, thumbnail};
})();
