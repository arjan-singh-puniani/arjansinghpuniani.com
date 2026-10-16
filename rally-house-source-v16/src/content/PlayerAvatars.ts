import type {CharacterSpec} from '../entities/Character.js';
export type PlayerAvatar='taylor'|'arjan';
export const playerAvatars:Record<PlayerAvatar,CharacterSpec>={
 taylor:{id:'player',name:'Taylor',role:'Club founder',avatar:'taylor',appearance:'human',shirt:'#304e9b',skin:'#ce9a7c',hair:'#251e1d',accent:'#cedb68',eye:'#684b35',hairStyle:'ponytail',presentation:'feminine',outfit:'skort',shoe:'#eceee7',playStyle:'curious all-court',goal:'Make a club worth coming back to',quirk:'A composed presence with a competitive spark'},
 arjan:{id:'player',name:'Arjan',role:'Club founder',avatar:'arjan',appearance:'human',shirt:'#28383c',skin:'#bb825b',hair:'#202226',accent:'#c6c6bd',eye:'#4c3022',hairStyle:'swept',presentation:'masculine',outfit:'shorts',shoe:'#f4eee2',playStyle:'curious all-court',goal:'Build a club people want to linger in',quirk:'Always stops for one more rally'}
};
export const playerSpec=(id:PlayerAvatar):CharacterSpec=>({...playerAvatars[id]});
