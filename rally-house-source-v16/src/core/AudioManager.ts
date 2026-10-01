export class AudioManager {
  private ctx?:AudioContext;enabled=true;volume=.65;private noise?:AudioBuffer;
  private tennisMaterialBuffers=new Map<string,AudioBuffer[]>();private tennisVariant=0;
  private ambienceSource?:AudioBufferSourceNode;private ambienceGain?:GainNode;private ambienceFilter?:BiquadFilterNode;private ambienceTick=0;private ambienceTarget=-1;
  private ensure(){if(!this.ctx)this.ctx=new AudioContext();if(this.ctx.state==='suspended')void this.ctx.resume();return this.ctx;}
  private getNoise(){const c=this.ensure();if(this.noise)return this.noise;const b=c.createBuffer(1,Math.floor(c.sampleRate*.11),c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);this.noise=b;return b;}
  tone(freq=440,duration=.08,gain=.018,type:OscillatorType='sine',detune=0){if(!this.enabled||this.volume<=0)return;try{const c=this.ensure(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);o.detune.value=detune;g.gain.setValueAtTime(Math.max(.0001,gain*this.volume),c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);o.connect(g).connect(c.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start();o.stop(c.currentTime+duration+.02);}catch{}}
  private noiseBurst(freq=900,duration=.045,gain=.018,q=.9){if(!this.enabled||this.volume<=0)return;try{const c=this.ensure(),src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=this.getNoise();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;g.gain.setValueAtTime(Math.max(.0001,gain*this.volume),c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);src.connect(f).connect(g).connect(c.destination);src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();};src.start();src.stop(c.currentTime+duration+.01);}catch{}}

  /**
   * Maintain a very quiet, procedural interior bed once the browser has already
   * granted audio permission through a player gesture. It intentionally never
   * creates the AudioContext on its own, so simply opening Rally House remains
   * silent until the visitor interacts with it.
   */
  updateClubAmbience(dt:number,minutes:number,weather:string,championship=false){
    if(!this.ctx)return;
    const c=this.ctx;
    if(!this.ambienceSource){
      const seconds=2.6,length=Math.max(1,Math.floor(c.sampleRate*seconds));
      const buffer=c.createBuffer(1,length,c.sampleRate),data=buffer.getChannelData(0);
      let slow=0;
      for(let i=0;i<length;i++){const white=Math.random()*2-1;slow+=(white-slow)*.015;data[i]=(slow*.62+white*.08);}
      const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
      source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=520;filter.Q.value=.45;gain.gain.value=.0001;
      source.connect(filter).connect(gain).connect(c.destination);source.start();
      this.ambienceSource=source;this.ambienceFilter=filter;this.ambienceGain=gain;
    }
    const hour=minutes/60,evening=hour>=17.5||hour<7?1:.35,rain=weather==='rain'?1:0;
    const target=(!this.enabled||this.volume<=0)?0:(championship?.002:(.012+evening*.006+rain*.006))*this.volume;
    if(Math.abs(target-this.ambienceTarget)>.00001){
      this.ambienceGain?.gain.cancelScheduledValues(c.currentTime);
      this.ambienceGain?.gain.setTargetAtTime(target,c.currentTime,.45);this.ambienceTarget=target;
    }
    this.ambienceTick-=Math.max(0,dt);
    if(championship||!this.enabled||this.volume<=0||this.ambienceTick>0)return;
    this.ambienceTick=4.2+Math.random()*5.5;
    const r=Math.random();
    // Barely-there distant life: a cup, a floor/wood tick, or a soft fixture hum.
    if(r<.30)this.tone(760+Math.random()*180,.045,.0009,'sine');
    else if(r<.52)this.tone(145+Math.random()*28,.055,.0010,'triangle');
    else if(r<.68)this.noiseBurst(680,.055,.0007,.8);
  }

  stopAmbience(){
    if(this.ambienceSource){this.ambienceSource.stop();this.ambienceSource.disconnect();}
    this.ambienceFilter?.disconnect();this.ambienceGain?.disconnect();
    this.ambienceSource=undefined;this.ambienceGain=undefined;this.ambienceFilter=undefined;this.ambienceTarget=-1;
  }
  dispose(){this.enabled=false;this.stopAmbience();if(this.ctx){void this.ctx.close();this.ctx=undefined;}this.tennisMaterialBuffers.clear();this.noise=undefined;}
  machine(){this.tone(85,.24,.009,'triangle');this.noiseBurst(420,.10,.004,.6);}
  click(){this.tone(520,.055,.010)}
  paper(){this.noiseBurst(1250,.055,.005,1.6);this.tone(610,.035,.004,'sine')}
  bounce(){this.tone(116+Math.random()*8,.034,.010,'triangle');this.noiseBurst(520+Math.random()*80,.030,.007)}
  hit(quality:'clean'|'frame'|'net'='clean'){
    if(quality==='frame'){this.tone(224,.040,.010,'triangle',240);this.noiseBurst(1550,.030,.010,1.4);return;}
    if(quality==='net'){this.net();return;}
    this.tone(184+Math.random()*12,.054,.015,'triangle');this.tone(365+Math.random()*20,.036,.007,'sine');this.noiseBurst(1100+Math.random()*140,.044,.013,1.05);
  }

  /**
   * Build a short, cached material model of a ball compressing into a string bed.
   *
   * The previous Championship sound layered a handful of pure oscillators. It
   * communicated timing, but the ear could still read it as a synthesized UI
   * effect. This buffer mixes a felt-like impact impulse, damped string modes,
   * racket-body resonance and two tiny early reflections. The result is still
   * generated locally with no sampled/copyrighted audio, but it behaves more
   * like a physical object being struck.
   */
  private tennisMaterialBuffer(
    quality:'perfect'|'clean'|'defensive'|'frame',
    variant:number,
  ){
    const key=`${quality}:${variant}`;
    const cached=this.tennisMaterialBuffers.get(key)?.[0];
    if(cached)return cached;

    const c=this.ensure();
    const seconds=quality==='frame'?.082:.105;
    const length=Math.max(1,Math.floor(c.sampleRate*seconds));
    const buffer=c.createBuffer(1,length,c.sampleRate);
    const data=buffer.getChannelData(0);

    let seed=(variant+1)*7919+quality.length*104729;
    const random=()=>{
      seed=(seed*1664525+1013904223)>>>0;
      return seed/4294967296;
    };

    const profile=quality==='perfect'
      ?{body:138,modes:[420,672,1015,1540],ring:.060,click:.72,bodyGain:.50}
      :quality==='clean'
        ?{body:132,modes:[398,638,948,1435],ring:.052,click:.62,bodyGain:.47}
        :quality==='defensive'
          ?{body:122,modes:[360,575,845,1240],ring:.043,click:.43,bodyGain:.39}
          :{body:108,modes:[228,338,610,920],ring:.035,click:.56,bodyGain:.55};

    let lowNoise=0;
    for(let i=0;i<length;i++){
      const t=i/c.sampleRate;
      const white=random()*2-1;
      lowNoise+=(white-lowNoise)*.18;
      const highNoise=white-lowNoise;

      // The ball/string collision itself: extremely short and broadband.
      const click=highNoise*Math.exp(-t/.0034)*profile.click;

      // A low racket/ball body component gives the hit weight in small speakers.
      const body=(
        Math.sin(Math.PI*2*profile.body*t)+
        .42*Math.sin(Math.PI*2*profile.body*2.04*t+.35)
      )*Math.exp(-t/.024)*profile.bodyGain;

      // Several inharmonic, quickly damped modes read as strings and frame rather
      // than as a pitched musical note.
      let strings=0;
      for(let m=0;m<profile.modes.length;m++){
        const f=profile.modes[m]*(1+(variant-1)*.006+(m%2?.003:-.002));
        const decay=profile.ring*(1-m*.10);
        strings+=Math.sin(Math.PI*2*f*t+(m*.71))
          *Math.exp(-t/Math.max(.012,decay))
          *(m===0?.23:m===1?.17:m===2?.105:.065);
      }

      // A tiny low-passed felt component prevents the transient from becoming a
      // brittle click, especially on laptop and phone speakers.
      const felt=lowNoise*Math.exp(-t/.010)*(quality==='frame'?.20:.11);
      data[i]=(click+body+strings+felt)*.72;
    }

    // Two early reflections add material depth without making the court sound
    // like a cavern. They are copies of the already-generated physical impulse.
    for(const [delay,gain] of [[.009,.15],[.019,.075]] as [number,number][]){
      const offset=Math.floor(delay*c.sampleRate);
      for(let i=offset;i<length;i++)data[i]+=data[i-offset]*gain;
    }

    let peak=.0001;
    for(let i=0;i<length;i++)peak=Math.max(peak,Math.abs(data[i]));
    const normalize=.92/peak;
    for(let i=0;i<length;i++)data[i]*=normalize;

    this.tennisMaterialBuffers.set(key,[buffer]);
    return buffer;
  }

  /** Play the cached material strike at the authoritative racket-contact frame. */
  tennisImpact(quality:'perfect'|'clean'|'defensive'|'frame'='clean'){
    if(!this.enabled||this.volume<=0)return;
    try{
      const c=this.ensure();
      const variant=this.tennisVariant++%3;
      const source=c.createBufferSource();
      const body=c.createBiquadFilter();
      const presence=c.createBiquadFilter();
      const gain=c.createGain();

      source.buffer=this.tennisMaterialBuffer(quality,variant);
      body.type='peaking';body.frequency.value=quality==='frame'?190:155;body.Q.value=.8;body.gain.value=quality==='perfect'?3.0:quality==='clean'?2.2:1.2;
      presence.type='peaking';presence.frequency.value=quality==='frame'?1150:2250;presence.Q.value=.72;presence.gain.value=quality==='perfect'?3.2:quality==='clean'?2.2:quality==='defensive'?.8:-1.0;
      const level=quality==='perfect'?.055:quality==='clean'?.049:quality==='defensive'?.039:.043;
      gain.gain.setValueAtTime(level*this.volume,c.currentTime);
      source.connect(body).connect(presence).connect(gain).connect(c.destination);
      source.onended=()=>{source.disconnect();body.disconnect();presence.disconnect();gain.disconnect();};
      source.start();
    }catch{}
  }
  net(){this.noiseBurst(390,.078,.011,.7);this.tone(92,.07,.007,'triangle')}
  shoe(squeak=false){if(squeak){this.noiseBurst(1750,.045,.0045,2.4);this.tone(720,.025,.0028,'sine');}else this.noiseBurst(260,.025,.0027,.7)}
  cup(){this.tone(1060,.035,.0045,'sine');this.tone(790,.028,.0028,'sine')}
  deskBell(){this.tone(1240,.055,.0065,'sine');this.tone(1860,.075,.0038,'sine');setTimeout(()=>this.tone(930,.10,.0022,'sine'),18)}
  fabric(){this.noiseBurst(340,.075,.0038,.55);this.noiseBurst(980,.032,.0019,.85)}
  woodTap(){this.tone(172,.045,.0055,'triangle');this.noiseBurst(720,.022,.0038,1.1)}
  door(){this.noiseBurst(310,.09,.004,.55);this.tone(138,.07,.0025,'triangle')}
  stringing(){this.tone(940,.045,.004,'triangle');setTimeout(()=>this.tone(1160,.035,.003,'triangle'),45)}
  watering(){this.noiseBurst(750,.10,.003,.5);}
  chuckle(){this.tone(230,.055,.002,'triangle');setTimeout(()=>this.tone(270,.07,.0015,'triangle'),90);}
  success(){this.tone(660,.08,.013);setTimeout(()=>this.tone(880,.10,.011),70)}
}
