import type {HumanHeadOptions} from '../animation/TaylorHuman.js';
interface AthleteDesign {head:HumanHeadOptions;shoulderScale:number;bottom:string;}
export const CAST_DESIGN:Record<string,AthleteDesign>={
 coach:{head:{width:1.01,height:1,jaw:.95,hair:'#493127',eye:'#506c61',lip:'#ac6d69',hairStyle:'bun'},shoulderScale:.82,bottom:'#f0ecdb'},
 mika:{head:{width:1,height:1.01,jaw:.94,hair:'#4a2922',eye:'#64734c',lip:'#b76d74',hairStyle:'waves'},shoulderScale:.78,bottom:'#fff0df'},
 nia:{head:{width:1.01,height:.99,jaw:.93,hair:'#211d1c',eye:'#5e734c',lip:'#955b69',hairStyle:'bob'},shoulderScale:.80,bottom:'#f1d5ce'},
 leo:{head:{width:1.10,height:1.03,hair:'#40372f',eye:'#587f87',lip:'#ac7f6b',hairStyle:'crop',masculine:true},shoulderScale:.90,bottom:'#eee8d7'},
 arjan:{head:{width:1.08,height:1.01,hair:'#202226',eye:'#62482f',lip:'#96624e',hairStyle:'swept',masculine:true},shoulderScale:.90,bottom:'#36474b'},
 taylor:{head:{},shoulderScale:.78,bottom:'#304e9b'}
};
