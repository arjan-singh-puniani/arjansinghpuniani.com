export type TennisImpactQuality='perfect'|'clean'|'defensive'|'frame';

/** Original material synthesis: a felt transient, body thump and damped strings. */
export function tennisImpactSignal(quality:TennisImpactQuality,variant:number,sampleRate:number,weight=1){
  const seconds=quality==='frame'?.082:.105;
  const data=new Float32Array(Math.max(1,Math.floor(sampleRate*seconds)));
  let seed=(variant+1)*7919+quality.length*104729;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const profile=quality==='perfect'
    ?{body:146,modes:[420,672,1015,1540],ring:.042,click:.84,bodyGain:.66}
    :quality==='clean'
      ?{body:138,modes:[398,638,948,1435],ring:.036,click:.72,bodyGain:.59}
      :quality==='defensive'
        ?{body:126,modes:[360,575,845,1240],ring:.030,click:.47,bodyGain:.43}
        :{body:108,modes:[228,338,610,920],ring:.025,click:.62,bodyGain:.40};
  const heft=Math.max(.6,Math.min(1.5,weight));
  let lowNoise=0;
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate,white=random()*2-1;lowNoise+=(white-lowNoise)*.18;
    // Half a millisecond of attack avoids a digital discontinuity. The body
    // arrives with the crack, rather than sounding like a note after contact.
    const attack=1-Math.exp(-t/.0005);
    const click=(white-lowNoise)*Math.exp(-t/.0026)*profile.click;
    const body=(Math.sin(Math.PI*2*profile.body*t+.35)+.32*Math.sin(Math.PI*2*profile.body*2.04*t+.8))
      *Math.exp(-t/(.018*heft))*profile.bodyGain*heft;
    let strings=0;
    for(let m=0;m<profile.modes.length;m++){
      const frequency=profile.modes[m]*(1+(variant-1)*.006+(m%2?.003:-.002));
      strings+=Math.sin(Math.PI*2*frequency*t+m*.71)*Math.exp(-t/Math.max(.010,profile.ring*(1-m*.10)))
        *[.19,.13,.075,.045][m];
    }
    const felt=lowNoise*Math.exp(-t/.009)*(quality==='frame'?.20:.14);
    data[i]=(click+body+strings+felt)*attack;
  }
  // Reflections use the original signal, so they cannot recursively ring.
  const dry=data.slice();
  for(const [delay,gain] of [[.007,.11],[.014,.045]]){
    const offset=Math.floor(delay*sampleRate);
    for(let i=offset;i<data.length;i++)data[i]+=dry[i-offset]*gain;
  }
  let peak=.0001;
  for(const sample of data)peak=Math.max(peak,Math.abs(sample));
  for(let i=0;i<data.length;i++)data[i]*=.92/peak;
  return data;
}
