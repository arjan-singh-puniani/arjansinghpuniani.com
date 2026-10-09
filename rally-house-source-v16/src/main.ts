import {Game,SavedClubLoadError} from './Game.js';
const canvas=document.getElementById('game') as HTMLCanvasElement;

function showFallback(err:unknown,stage:'graphics'|'restore'|'startup'){
  console.error(err);
  const loading=document.getElementById('loading')!;
  loading.classList.add('fallback');
  loading.classList.remove('hide');
  loading.setAttribute('role','alert');
  // A failed startup cannot expose club actions behind its recovery message.
  for(const child of document.getElementById('app')!.children){
    if(child!==loading && child instanceof HTMLElement)child.inert=true;
  }
  loading.replaceChildren();
  const image=document.createElement('img');
  image.src=new URL('../preview-cozy.webp',import.meta.url).href;
  image.alt='Illustration of a cozy tennis clubhouse';
  const copy=document.createElement('div');
  const title=document.createElement('strong');
  title.textContent=stage==='graphics'?'The club’s graphics could not start':stage==='restore'?'Your saved club could not open':'The club could not finish opening';
  const detail=document.createElement('span');
  detail.textContent=stage==='graphics'
    ?'Rally House needs WebGL 2. Check hardware acceleration, or try another current browser.'
    :stage==='restore'?'Your saved data has been left untouched. Try the latest game in a new tab. If this browser’s storage is unavailable, reopen the browser and retry.'
    :'Reload the game, or try opening it in another current browser.';
  const retry=document.createElement('button');
  retry.type='button';
  retry.textContent='Try again';
  retry.onclick=()=>location.reload();
  const fresh=document.createElement('a');
  fresh.href=location.pathname;
  fresh.target='_blank';fresh.rel='noreferrer';
  fresh.textContent='Open game in a new tab ↗';
  copy.append(title,detail,retry,fresh);
  loading.append(image,copy);
}

let game:Game|undefined;
try{game=new Game(canvas);}catch(err){showFallback(err,'graphics');}
if(game){try{await game.init();}catch(err){showFallback(err,err instanceof SavedClubLoadError?'restore':'startup');}}
