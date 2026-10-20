import test from 'node:test';
import assert from 'node:assert/strict';
import {hitRegionUV} from './interior.mjs';

test('physical touchscreen maps WebGL bottom-left UV to Canvas top-left pixels',()=>{
 const top={x:0,y:0,w:500,h:150,name:'helm'},bottom={x:0,y:800,w:500,h:140,name:'fabricator'};
 assert.equal(hitRegionUV({x:.2,y:.95},1080,940,[top,bottom]),top);
 assert.equal(hitRegionUV({x:.2,y:.08},1080,940,[top,bottom]),bottom);
 assert.equal(hitRegionUV({x:.8,y:.5},1080,940,[top,bottom]),null);
});
test('touchscreen edges are inclusive and unrelated surface clicks do not trigger a control',()=>{
 const b={x:100,y:100,w:200,h:80};
 assert.equal(hitRegionUV({x:.1,y:.9},1000,1000,[b]),b);
 assert.equal(hitRegionUV({x:.05,y:.9},1000,1000,[b]),null);
 assert.equal(hitRegionUV({x:.11,y:.7},1000,1000,[b]),null);
});
