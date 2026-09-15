import {Game} from './Game.js';
const canvas=document.getElementById('game') as HTMLCanvasElement;

function showFallback(err:unknown){
  console.error(err);
  const loading=document.getElementById('loading')!;
  loading.classList.add('fallback');
  loading.replaceChildren();
  const image=document.createElement('img');
  image.src=new URL('../preview-cozy.webp',import.meta.url).href;
  image.alt='Rally House tennis clubhouse preview';
  const copy=document.createElement('div');
  const title=document.createElement('strong');
  title.textContent='Rally House needs WebGL 2';
  const detail=document.createElement('span');
  detail.textContent='Turn on hardware acceleration or open the game in current Safari, Chrome, Edge, or Firefox.';
  const retry=document.createElement('button');
  retry.type='button';
  retry.textContent='Try again';
  retry.onclick=()=>location.reload();
  copy.append(title,detail,retry);
  loading.append(image,copy);
}

try{
  const game=new Game(canvas);
  await game.init();
}catch(err){showFallback(err);}
