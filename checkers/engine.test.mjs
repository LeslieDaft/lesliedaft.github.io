import assert from 'node:assert/strict';import {initial,moves,choose} from './engine.mjs';
let b=initial();assert.equal(b.filter(x=>x===1).length,12);assert.equal(moves(b,1).length,7);
b=Array(64).fill(0);b[42]=1;b[35]=-1;b[21]=-1;let m=moves(b,1);assert.equal(m.length,1);assert.deepEqual(m[0].path,[42,28,14]);assert.equal(m[0].caps.length,2);assert.equal(m[0].board[35],0);
b=Array(64).fill(0);b[17]=1;b[10]=-1;b[12]=-1;m=moves(b,1);assert.deepEqual(m[0].path,[17,3]);assert.equal(m[0].board[3],2);
b=Array(64).fill(0);b[28]=2;assert.equal(moves(b,1).length,4);b[28]=1;assert.equal(moves(b,1).length,2);
b=Array(64).fill(0);b[1]=1;assert.equal(moves(b,1).length,0);
for(let level=0;level<4;level++){let b=initial();let pick=choose(b,1,level);assert(moves(b,1).some(m=>JSON.stringify(m.path)===JSON.stringify(pick.path)))}
for(let game=0;game<5;game++){let b=initial(),s=1;for(let ply=0;ply<180;ply++){let ms=moves(b,s);if(!ms.length)break;let m=choose(b,s,0);assert(m.board.every(x=>[-2,-1,0,1,2].includes(x)));assert(m.board.filter(Boolean).length===b.filter(Boolean).length-m.caps.length);b=m.board;s=-s}}
console.log('Passed: setup, forced/chained captures, crowning, king movement, blocked wins, four AI levels, five simulated games.');
