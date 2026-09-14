import {Game} from './Game.js';
const canvas=document.getElementById('game') as HTMLCanvasElement;
try{const game=new Game(canvas);await game.init();}catch(err){console.error(err);const loading=document.getElementById('loading')!;loading.replaceChildren();const title=document.createElement('strong');title.textContent='Rally House could not open';const detail=document.createElement('span');detail.textContent=err instanceof Error?err.message:'Please check WebGL2 support.';loading.append(title,detail);}
