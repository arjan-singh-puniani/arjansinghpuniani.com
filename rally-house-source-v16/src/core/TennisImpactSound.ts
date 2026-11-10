export type TennisImpactQuality='perfect'|'clean'|'defensive'|'frame';

/** A short felt crack, compressed-ball body and rapidly damped string bed. */
export function tennisImpactSignal(quality:TennisImpactQuality,variant:number,sampleRate:number,weight=1){
  const seconds=quality==='frame'?.082:.105;
  const data=new Float32Array(Math.max(1,Math.floor(sampleRate*seconds)));
  let seed=(variant+1)*7919+quality.length*104729;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const profile=quality==='perfect'
    ?{body:178,modes:[510,827,1325,2120],ring:.027,click:1.05,bodyGain:.72}
    :quality==='clean'
      ?{body:166,modes:[478,772,1238,1950],ring:.024,click:.90,bodyGain:.66}
      :quality==='defensive'
        ?{body:148,modes:[425,685,1080,1700],ring:.021,click:.58,bodyGain:.50}
        :{body:245,modes:[690,1110,1810,2860],ring:.017,click:.94,bodyGain:.32};
  const heft=Math.max(.6,Math.min(1.5,weight));
  let lowNoise=0;
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate,white=random()*2-1;lowNoise+=(white-lowNoise)*.18;
    // A sub-millisecond attack avoids a digital discontinuity. The body
    // arrives with the crack, rather than sounding like a note after contact.
    const attack=1-Math.exp(-t/.00035);
    const click=(white-lowNoise)*Math.exp(-t/.0018)*profile.click;
    // The falling compression pitch adds weight without leaving a bass note behind.
    const phase=Math.PI*2*(profile.body*t+42*.004*(1-Math.exp(-t/.004)));
    const body=(Math.sin(phase+.35)+.38*Math.sin(phase*2.04+.8))
      *Math.exp(-t/(.014*heft))*profile.bodyGain*heft;
    let strings=0;
    for(let m=0;m<profile.modes.length;m++){
      const frequency=profile.modes[m]*(1+(variant-1)*.006+(m%2?.003:-.002));
      strings+=Math.sin(Math.PI*2*frequency*t+m*.71)*Math.exp(-t/Math.max(.010,profile.ring*(1-m*.10)))
        *[.22,.15,.09,.055][m];
    }
    const felt=lowNoise*Math.exp(-t/.009)*(quality==='frame'?.20:.14);
    data[i]=(click+body+strings+felt)*attack;
  }
  // Reflections use the original signal, so they cannot recursively ring.
  const dry=data.slice();
  for(const [delay,gain] of [[.009,.09],[.021,.035]]){
    const offset=Math.floor(delay*sampleRate);
    for(let i=offset;i<data.length;i++)data[i]+=dry[i-offset]*gain;
  }
  // Finish at silence even for heavier strikes; cutting a nonzero tail creates a second click.
  for(let i=0;i<data.length;i++)data[i]*=Math.min(1,(data.length-1-i)/(sampleRate*.008));
  let peak=.0001;
  for(const sample of data)peak=Math.max(peak,Math.abs(sample));
  for(let i=0;i<data.length;i++)data[i]*=.92/peak;
  return data;
}
