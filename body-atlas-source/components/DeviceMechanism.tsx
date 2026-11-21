"use client";

import React, { useId } from 'react';
import type { DeviceAction } from '@/lib/device-action';
import { deviceIllustrations } from '@/lib/device-illustrations';

export default function DeviceMechanism({ id, action, step, playing }: {
  id: string; action: DeviceAction; step: number; playing: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const illustration = deviceIllustrations[id];
  if (!illustration) return null;
  const metal = `url(#${uid}-metal)`, polymer = `url(#${uid}-polymer)`, tissue = `url(#${uid}-tissue)`;
  const electrode = ['activa', 'vns', 'precision'].includes(id);
  const valve = id === 'source-fda-p140031';
  const flow = 'mechanism-signal';

  const generator = <g>
    <path d="M91 171Q87 149 109 145H166Q187 146 191 170L195 232Q194 258 169 262H119Q94 260 92 236Z" fill={metal} stroke="#d3e5e9" strokeWidth="2"/>
    <path d="M108 146V131Q108 120 119 120H162Q176 120 176 133V147" fill={polymer} stroke="#a3bec7" strokeWidth="2"/>
    <path d="M104 179Q105 164 120 162H168M107 184V230Q107 245 123 246H170" stroke="#f4fbff" opacity=".45"/>
    <path d="M119 195H139L145 184L154 214L164 195H177" className={flow} strokeWidth="2"/>
    <ellipse cx="123" cy="135" rx="5" ry="3" fill="#152b36"/>
    <ellipse cx="161" cy="135" rx="5" ry="3" fill="#152b36"/>
  </g>;

  return <figure className="device-mechanism" data-device={id} data-step={step} data-playing={playing}>
    <figcaption>
      <span>Device mechanism <span className="mechanism-drawing-type">Illustrated</span></span>
      <strong>{illustration.title}</strong>
    </figcaption>
    <svg viewBox="0 0 560 340" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
      <title id={`${uid}-title`}>{`${illustration.title} — component illustration`}</title>
      <desc id={`${uid}-desc`}>{`${illustration.parts.join('; ')}. Qualitative illustration, not manufacturer CAD, true scale or implant placement. ${action.steps[step]}.`}</desc>
      <defs>
        <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2=".85"><stop stopColor="#dce9ed"/><stop offset=".24" stopColor="#8fa9b5"/><stop offset=".48" stopColor="#e5eff1"/><stop offset=".72" stopColor="#6a8999"/><stop offset="1" stopColor="#bbced6"/></linearGradient>
        <linearGradient id={`${uid}-polymer`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#405b6a"/><stop offset="1" stopColor="#182e3b"/></linearGradient>
        <linearGradient id={`${uid}-tissue`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#72c2cd" stopOpacity=".3"/><stop offset="1" stopColor="#5598af" stopOpacity=".07"/></linearGradient>
        <radialGradient id={`${uid}-light`}><stop stopColor="#356074" stopOpacity=".4"/><stop offset="1" stopColor="#0b1d29" stopOpacity="0"/></radialGradient>
      </defs>
      <ellipse cx="280" cy="174" rx="255" ry="151" fill={`url(#${uid}-light)`}/>
      <g fill="none" stroke="#87b4c4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 292H524" opacity=".16"/>
        <ellipse cx="280" cy="282" rx="167" ry="12" fill="#020d16" stroke="none" opacity=".35"/>

        {id === 'rns' && <>
          <path d="M103 137C94 105 113 82 146 80L239 82Q266 85 270 112L270 193Q268 222 241 224L149 229Q119 227 112 201Z" fill={metal} stroke="#dce9ee" strokeWidth="2"/>
          <path d="M122 123Q119 103 141 99L239 101Q251 103 253 118L253 187Q253 204 237 207L151 212Q134 211 130 193Z" stroke="#f2fcff" opacity=".55"/>
          <path d="M132 82L139 62Q141 56 150 57L220 59Q231 59 232 69L232 82" fill={polymer} stroke="#a4c2cb" strokeWidth="2"/>
          <path d="M159 65C176 26 293 42 326 84S342 130 377 137" stroke="#48727e" strokeWidth="8"/>
          <path d="M159 65C176 26 293 42 326 84S342 130 377 137" stroke="#bbd6dd" strokeWidth="3"/>
          <path d="M201 67C245 48 281 76 299 122S325 224 370 229" stroke="#48727e" strokeWidth="7"/>
          <path d="M201 67C245 48 281 76 299 122S325 224 370 229" stroke="#c0d8df" strokeWidth="2.5"/>
          <path d="M375 126Q371 122 374 117L466 126Q474 128 471 136L467 146Q466 152 458 151L376 141Z" fill={tissue} stroke="#96d3db"/>
          {[390,411,432,453].map(x=><ellipse key={x} cx={x} cy={134+(x-390)*.12} rx="6" ry="4" fill={metal} stroke="#d7f1f4"/>)}
          <path d="M369 229L466 251" stroke="#bad3da" strokeWidth="5"/>
          {[414,428,442,456].map(x=><path key={x} d={`M${x} ${236+(x-414)*.23}l-2 9`} stroke="#efcb96" strokeWidth="5"/>)}
          <path d="M147 161H166L175 142L186 181L197 159H235" className={flow} strokeWidth="2.5"/>
          <path d="M370 228L462 250" className={flow} strokeWidth="2"/>
        </>}

        {electrode && <>
          {generator}
          <path d="M122 122C98 69 193 40 262 68S325 109 359 97" stroke="#466e7e" strokeWidth="8"/>
          <path d="M122 122C98 69 193 40 262 68S325 109 359 97" stroke="#c6dce3" strokeWidth="3"/>
          {id === 'vns' ? <>
            <path d="M403 61C398 120 420 173 408 259" stroke="#bd9b78" strokeWidth="17" opacity=".32"/>
            <path d="M404 62C398 119 420 175 408 259" stroke="#deb995" strokeWidth="5"/>
            <path d="M359 97Q387 100 402 118M402 118C377 102 379 139 407 132S433 159 409 153S383 181 413 176S436 201 414 197" stroke="#d5e6eb" strokeWidth="5"/>
            <path d="M401 117C378 104 382 139 406 132M411 154C386 144 386 178 413 176" className={flow} strokeWidth="3"/>
          </> : <>
            {id === 'precision' ? <>
              <path d="M387 56Q369 148 391 265M428 56Q412 149 432 265" stroke="#92cbd1" opacity=".28"/>
              <path d="M406 56Q390 149 412 265" stroke="#85b6c9" strokeWidth="15" opacity=".22"/>
            </> : <path d="M345 164C322 130 334 76 369 58C407 38 456 62 458 108C483 145 449 195 408 196C380 207 350 194 345 164Z" fill={tissue} stroke="#709cae" opacity=".65"/>}
            <path d={`M358 97Q374 97 374 117V${id === 'precision' ? 259 : 187}`} stroke="#d5e6eb" strokeWidth="5"/>
            {(id === 'precision' ? [169,181,193,205,217,229,241,253] : [136,151,166,181]).map(y=><path key={y} d={`M369 ${y}h10`} stroke="#e9c690" strokeWidth="7"/>)}
            <path d={`M374 118V${id === 'precision' ? 253 : 181}`} className={flow} strokeWidth="2"/>
          </>}
        </>}

        {id === 'neuralink' && <>
          <ellipse cx="168" cy="102" rx="55" ry="23" fill={polymer} stroke="#b5d0d9" strokeWidth="2"/>
          <path d="M113 101V117C114 151 222 151 223 117V101" fill={metal} stroke="#c9dfe6" strokeWidth="2"/>
          <ellipse cx="168" cy="100" rx="47" ry="17" fill={metal} stroke="#e0eff2"/>
          {[-40,-24,-8,8,24,40].map((x,i)=><path key={x} d={`M${168+x*.7} 143C${168+x} 166 ${156+x} 207 ${164+x*1.4} ${233+i%3*9}`} stroke="#a3d4df" strokeWidth="1.7"/>)}
          <path d="M83 237C92 206 130 212 145 230C159 202 195 204 208 228C225 210 256 220 259 245" stroke="#72a6b8" opacity=".6"/>
          <path d="M240 83Q261 107 240 132M255 69Q290 108 255 147" className={flow} strokeWidth="2"/>
          <rect x="325" y="91" width="161" height="117" rx="12" fill={polymer} stroke="#a8c5d0" strokeWidth="2"/>
          <rect x="335" y="101" width="141" height="96" rx="5" fill="#0b202d" stroke="#4d7183"/>
          <path d="M350 131H372L379 116L389 155L400 131H459M350 174H390M400 174H438" stroke="#82b8c9"/>
          <path d="M406 208V232M370 234H441" stroke="#94b5c3" strokeWidth="5"/>
          <path d="M440 151L451 174L439 171L433 183L429 180L435 168L424 166Z" fill="#f2cf9d" stroke="none"/>
        </>}

        {id === 'tms' && <>
          <path d="M229 269C203 244 210 218 190 204L170 192L187 180Q197 173 195 155C192 95 238 63 291 80C344 97 367 163 348 207L327 247V274" fill={tissue} stroke="#7aaaba" strokeWidth="2"/>
          <path d="M214 148C224 120 251 112 274 124S313 141 315 171C318 196 289 208 268 205C249 218 222 202 219 184" stroke="#77a6b7" opacity=".7"/>
          <g transform="rotate(-18 256 95)">
            <path d="M326 94H428Q438 94 438 104V110Q438 120 428 120H326" fill={polymer} stroke="#9ab8c6" strokeWidth="2"/>
            {[218,291].map(x=><g key={x}><ellipse cx={x} cy="100" rx="47" ry="24" fill={metal} stroke="#d9e9ed" strokeWidth="2"/><ellipse cx={x} cy="100" rx="27" ry="11" fill="#172f3f" stroke="#6f94a6"/>
            <ellipse cx={x} cy="100" rx="35" ry="16" stroke="#547d90"/></g>)}
          </g>
          <path d="M244 131Q262 145 263 170M260 127Q278 144 279 168" className={flow} strokeWidth="2"/>
          <circle cx="271" cy="170" r="12" stroke="#f0c990" strokeWidth="2"/>
        </>}

        {id === 'exablate' && <>
          <path d="M366 86C426 89 459 153 432 217C415 257 370 265 339 245C313 228 299 197 309 165C296 127 323 86 366 86Z" fill={tissue} stroke="#729fae" strokeWidth="2"/>
          <path d="M328 139Q347 115 361 141Q385 109 403 137M329 179Q351 158 369 183Q393 156 421 183M348 213Q369 192 397 217" stroke="#6994a7" opacity=".55"/>
          <path d="M181 53C73 74 66 257 180 281L197 253C112 224 113 104 196 82Z" fill={metal} stroke="#d5e8ed" strokeWidth="2"/>
          <path d="M177 72C91 98 95 231 178 262" stroke="#304f61" strokeWidth="10"/>
          {[100,130,165,201,236].map(y=><path key={y} d={`M${y===165?120:y===130||y===201?130:151} ${y}L371 169`} className={flow} strokeWidth="1.5"/>)}
          <circle cx="371" cy="169" r="13" stroke="#f0c990" strokeWidth="2"/><circle cx="371" cy="169" r="4" fill="#f0c990" stroke="none"/>
        </>}

        {id === 'source-fda-p220023' && <>
          <path d="M73 112C180 104 295 129 485 109L485 225C315 243 190 215 73 230Z" fill={tissue} stroke="#7dabb9" strokeWidth="2"/>
          <path d="M78 123Q277 148 482 120M78 216Q272 198 482 214" stroke="#8abdc8" opacity=".4"/>
          <path d="M50 172H245" stroke="#8ba6b4" strokeWidth="10"/><path d="M50 169H244" stroke="#d2e8ec" strokeWidth="3"/>
          <path d="M220 169C234 121 321 122 338 169C322 220 235 220 220 169Z" fill={tissue} stroke="#bce6ec" strokeWidth="2"/>
          <path d="M224 169H367" stroke="#dcecef" strokeWidth="3"/>
          <rect x="261" y="158" width="36" height="23" rx="5" fill={metal} stroke="#e1eff3"/>
          <path d="M265 147Q279 139 294 147M263 194Q279 201 296 194" className={flow} strokeWidth="2"/>
          <path d="M200 93C250 80 312 91 350 76M207 247C267 257 329 243 370 255" stroke="#e5bb88" strokeWidth="3" opacity=".7"/>
        </>}

        {id === 'source-fda-p060040' && <>
          <path d="M58 175H149" stroke="#bbd1d9" strokeWidth="37"/><path d="M58 165H146" stroke="#ecf5f6" strokeWidth="4" opacity=".65"/>
          <path d="M148 119Q188 93 231 110L347 132V219L231 240Q187 255 148 230Z" fill={metal} stroke="#d4e7ec" strokeWidth="2"/>
          <ellipse cx="148" cy="175" rx="16" ry="55" fill={polymer} stroke="#c2d7df" strokeWidth="2"/>
          <path d="M208 133V218M323 140V213" stroke="#3e6478" strokeWidth="2"/>
          <path d="M347 154H395Q418 154 427 132L447 82" stroke="#83a5b6" strokeWidth="29"/>
          <path d="M347 148H390Q415 148 421 128L440 81" stroke="#e2f0f3" strokeWidth="3"/>
          {[357,369,381,393].map(x=><path key={x} d={`M${x} 143v22`} stroke="#b9d0d9" strokeWidth="2"/>)}
          <path d="M246 237C246 275 305 286 353 271" stroke="#93afbd" strokeWidth="5"/>
          <path d="M224 177Q247 137 268 177T311 177M225 177Q247 217 268 177T311 177" stroke="#517688" strokeWidth="3"/>
          <path d="M61 175H384Q416 175 427 144L447 90" className={flow} strokeWidth="2"/>
        </>}

        {valve && <>
          <path d="M185 104C180 139 190 206 204 245Q280 268 356 245C370 205 380 140 375 104Z" fill={tissue} stroke="#af9e84" strokeWidth="2"/>
          {[0,1,2,3,4,5].map(i=><path key={i} d={`M${185+i*38} 105L${205+i*30} 244M${185+i*38} 105L${203+(i+1)*25} 180L${205+i*30} 244`} stroke="#d0b58d" strokeWidth="2"/>)}
          <path d="M189 142Q280 168 371 142M195 196Q280 221 365 196" stroke="#c9ac80" strokeWidth="2"/>
          <ellipse cx="280" cy="104" rx="95" ry="32" fill={polymer} stroke="#e0c59e" strokeWidth="3"/>
          <path d="M196 104Q232 83 280 112Q326 82 365 104Q339 141 280 130Q221 143 196 104Z" fill={tissue} stroke="#b2d5d9" strokeWidth="2"/>
          <path d="M280 112V130M196 104Q239 121 280 112Q322 124 365 104" stroke="#b9dfe1" strokeWidth="2"/>
          <ellipse cx="280" cy="245" rx="76" ry="23" stroke="#c5ab85" strokeWidth="2"/>
          <path d="M280 250V151M271 163L280 151L289 163" className={flow} strokeWidth="2"/>
        </>}

        {id === 'source-fda-p180002' && <>
          <path d="M201 105Q178 182 208 250Q280 277 352 250Q381 182 359 105Z" fill={tissue} stroke="#b8d6db" strokeWidth="2"/>
          <ellipse cx="280" cy="104" rx="80" ry="28" fill={polymer} stroke="#c6dce1" strokeWidth="3"/>
          {[0,1,2,3,4].map(i=><path key={i} d={`M${201+i*39} 106Q${182+i*49} 179 ${209+i*35} 250M${201+i*39} 106Q${242+i*24} 190 ${209+i*35} 250`} stroke="#9fb6bd" strokeWidth="1.8"/>)}
          <path d="M226 105Q280 92 334 105L307 159Q280 169 253 159Z" fill={`url(#${uid}-tissue)`} stroke="#d0e6e9" strokeWidth="2"/>
          <path d="M253 159Q280 150 307 159" stroke="#f0ce9d" strokeWidth="3"/>
          <ellipse cx="280" cy="250" rx="72" ry="24" stroke="#b4ced7" strokeWidth="2"/>
          <path d="M280 244V183M270 195L280 183L290 195" className={flow} strokeWidth="2"/>
        </>}

        {id === 'source-fda-p040033' && <>
          <path d="M180 145C176 61 326 42 363 122L342 137C311 83 210 96 205 153Z" fill={metal} stroke="#dce9ec" strokeWidth="2"/>
          <path d="M190 143C188 73 316 61 352 125" stroke="#4b6d80" strokeWidth="2"/>
          <path d="M244 183C224 206 227 225 194 240L152 261L175 295L227 271Q256 251 284 246L306 220Z" fill={tissue} stroke="#86afbc" strokeWidth="2"/>
          <circle cx="275" cy="169" r="52" fill={tissue} stroke="#88b7c4" strokeWidth="2"/>
          <path d="M224 178C208 107 322 91 331 162L320 175C311 121 231 132 237 185Z" fill={metal} stroke="#e2edf0" strokeWidth="2"/>
          <path d="M276 164L248 211" stroke="#bacdd5" strokeWidth="6"/>
          <path d="M233 190Q266 207 302 189" stroke="#b0d3db" strokeWidth="2"/>
          <path d="M357 158Q379 192 350 219M350 207V219H362" className={flow} strokeWidth="2"/>
        </>}
      </g>
    </svg>
    <ul className="mechanism-parts" aria-label="Illustrated components">
      {illustration.parts.map(part=><li key={part}>{part}</li>)}
    </ul>
    <div className="mechanism-current-step"><span>{String(step+1).padStart(2,'0')} / 03</span><p>{action.steps[step]}</p></div>
    <p className="mechanism-figure-scope">Source-based schematic · not to scale · not implant placement</p>
    <a className="mechanism-figure-source" href={illustration.sourceUrl} target="_blank" rel="noopener noreferrer">Component reference ↗<span>{illustration.locator}</span></a>
  </figure>;
}
