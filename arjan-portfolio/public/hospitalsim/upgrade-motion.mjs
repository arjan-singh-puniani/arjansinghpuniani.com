export function unfoldPose(seconds,index,reduced=false){
 const t=reduced?1:Math.max(0,Math.min(1,(seconds-index*.18)/1.25)),ease=1-(1-t)**3;
 return{done:t===1,y:-.18*(1-ease),scaleY:.04+.96*ease,scaleXZ:.72+.28*ease+Math.sin(t*Math.PI)*.035,turn:-.18*(1-ease),opacity:ease};
}
