import {choose} from './engine.mjs';onmessage=e=>postMessage({id:e.data.id,move:choose(e.data.b,e.data.side,e.data.level)});
