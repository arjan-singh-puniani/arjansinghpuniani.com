import { useId } from "react";

/** Original schematic artwork. Geometry is illustrative, not an F1 chassis or biomechanical model. */
export function CarDrawing({ emphasis = "car" }: { emphasis?: "car" | "driver" }) {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 0 760 430" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>Open-wheel car and protected cockpit, viewed from above</title>
    <desc id={`${id}-desc`}>An original schematic with the nose pointing right. Four exposed wheels surround a survival cell. The driver’s helmet sits inside the halo. A dashed line approaches the front-left corner to indicate the fictional contact location, not a force vector.</desc>
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5b707c"/><stop offset=".48" stopColor="#263d4b"/><stop offset="1" stopColor="#132731"/></linearGradient>
      <linearGradient id={`${id}-wing`}><stop stopColor="#1a2c37"/><stop offset=".5" stopColor="#78909b"/><stop offset="1" stopColor="#2c4351"/></linearGradient>
      <pattern id={`${id}-tread`} width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0V5" stroke="#617078" strokeWidth=".5"/></pattern>
    </defs>
    <g fill="none" stroke="#334851" strokeWidth="1">
      <path d="M36 215H724M380 38V392" strokeDasharray="3 7"/>
      <ellipse cx="380" cy="215" rx="306" ry="168" strokeDasharray="2 8"/>
      <path d="M70 66h16M78 58v16M674 356h16M682 348v16"/>
    </g>
    <g transform="translate(380 215) rotate(-18) translate(-380 -215)">
      <ellipse cx="380" cy="228" rx="270" ry="100" fill="#061017" opacity=".6"/>
      <g stroke="#7d929d" strokeWidth="1.2">
        <path d="M191 133L295 206L191 192M191 297L295 224L191 238M550 139L441 206L550 185M550 291L441 224L550 245" fill="none"/>
        <path d="M206 137L242 204M206 293L242 226M530 151L480 207M530 279L480 223"/>
        {[{x:135,y:105},{x:135,y:259},{x:525,y:105},{x:525,y:259}].map(({x,y})=><g key={`${x}-${y}`}>
          <rect x={x} y={y} width="79" height="66" rx="16" fill="#0b141b"/>
          <rect x={x+7} y={y+3} width="65" height="60" rx="12" fill={`url(#${id}-tread)`} stroke="#263b47"/>
          <path d={`M${x+16} ${y+9}H${x+62}M${x+16} ${y+57}H${x+62}`} stroke="#b1c4cd" opacity=".6"/>
        </g>)}
        <path d="M115 134H130V296H115ZM101 147H115V283H101" fill={`url(#${id}-wing)`}/>
        <path d="M218 186Q235 153 318 159L418 173L459 192L633 204Q654 215 633 226L459 238L418 257L318 271Q235 277 218 244Z" fill={`url(#${id}-body)`}/>
        <path d="M209 198L149 207V223L209 232L271 215Z" fill="#3a515f"/>
        <path d="M245 189Q287 174 348 179L407 193M245 241Q287 256 348 251L407 237" fill="none" stroke="#8ba0a9"/>
        <path d="M248 195L330 188L318 203L261 208ZM248 235L330 242L318 227L261 222Z" fill="#12232e"/>
        <path d="M322 174L365 190V240L322 256" fill="#1c303c" stroke="#526d7b"/>
        <path d="M436 199L622 210M436 231L622 220" fill="none" stroke="#a6bbc3"/>
        <path d="M616 139Q646 151 665 167V263Q646 279 616 291V271L639 251V179L616 159Z" fill={`url(#${id}-wing)`}/>
        <path d="M626 169L653 181V249L626 261M638 172V258" fill="none" stroke="#9bb0ba"/>
      </g>
      <g opacity={emphasis === "driver" ? 1 : .95}>
        <path d="M330 182Q384 173 427 197L439 215L427 233Q384 257 330 248Z" fill="#17252d" stroke="#e8a17e" strokeWidth="1.6"/>
        <path d="M332 194Q362 181 391 194L407 215L391 236Q362 249 332 236Z" fill="#2c4b58" stroke="#768c97"/>
        <path d="M353 199L380 206L383 215L380 224L353 231" fill="none" stroke="#f1c5a3" strokeWidth="5"/>
        <ellipse cx="362" cy="215" rx="21" ry="23" fill="#e9ece7" stroke="#d0e5e0"/>
        <path d="M368 195Q387 215 368 235L373 222V208Z" fill="#111f29"/>
        <path d="M333 180Q395 173 435 208Q442 215 435 222Q395 257 333 250" fill="none" stroke="#a4dfd6" strokeWidth="7"/>
        <path d="M437 215H401" stroke="#a4dfd6" strokeWidth="7"/>
        <path d="M336 185Q386 181 419 202" fill="none" stroke="#e7fcf7" strokeWidth="1.5"/>
        {emphasis === "driver" && <ellipse cx="365" cy="215" rx="56" ry="61" fill="none" stroke="#ffb394" strokeWidth="2" strokeDasharray="4 5"/>}
      </g>
      <path d="M584 65L566 103" fill="none" stroke="#ffb394" strokeWidth="2" strokeDasharray="5 5"/>
      <circle cx="564" cy="108" r="5" fill="#ffb394"/>
    </g>
  </svg>;
}

export function OccupantDrawing() {
  return <svg viewBox="0 0 680 390" role="img" aria-labelledby="occupant-title occupant-desc">
    <title id="occupant-title">Protection around the occupant</title>
    <desc id="occupant-desc">Schematic side view of a reclined driver. The helmet surrounds the head, the frontal head restraint sits behind the shoulders, a halo arches above the cockpit, and the survival cell surrounds the seated body. The barrier is external to the vehicle. These layers have distinct functions; none determines neurological status.</desc>
    <g fill="none" stroke="#c7d3d8"><path d="M36 322H644M120 40V338M560 40V338" strokeDasharray="3 7"/><path d="M24 314v16m628-16v16"/></g>
    <path d="M127 283L144 201L232 223L307 271L466 257L576 204L604 213L582 303L170 313Z" fill="#243c4b" stroke="#92a9b4" strokeWidth="2"/>
    <path d="M150 285L161 226L223 244L296 291L463 275L561 231L548 285Z" fill="#d7e5e7" opacity=".16"/>
    <path d="M214 161Q239 171 242 207L285 244L347 260L409 234L467 258" fill="none" stroke="#b3c5cf" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M235 179L215 214L265 247M224 211L256 192" fill="none" stroke="#e8a17e" strokeWidth="9" strokeLinejoin="round"/>
    <path d="M258 199L296 253" stroke="#111e28" strokeWidth="13"/>
    <path d="M267 202L304 255" stroke="#86a1ac" strokeWidth="3"/>
    <path d="M238 151L246 192L223 210" fill="none" stroke="#e8a17e" strokeWidth="4"/>
    <path d="M181 136Q177 100 210 92Q244 86 254 120L264 145L249 166L209 166Q185 162 181 136Z" fill="#f2f5f1" stroke="#2c4652" strokeWidth="2"/>
    <path d="M232 107L251 119L259 139L230 136Z" fill="#243c4b"/>
    <path d="M159 191L155 100Q283 58 402 121L438 221M244 82L303 228" fill="none" stroke="#287c70" strokeWidth="12" strokeLinecap="round"/>
    <path d="M158 102Q281 62 395 120" fill="none" stroke="#b7e7dc" strokeWidth="2"/>
    <g fill="none" stroke="#58717c" strokeWidth="1.4"><path d="M209 100L188 57H64M242 185L140 180H53M345 94L410 48H600M430 282L478 335H615"/></g>
    <g fill="#233c49" fontFamily="monospace" fontSize="26"><text x="48" y="46">HELMET</text><text x="35" y="168">FHR</text><text x="491" y="38">HALO</text><text x="440" y="366">SURVIVAL CELL</text></g>
    <g fill="#d28462"><circle cx="210" cy="100" r="4"/><circle cx="242" cy="185" r="4"/><circle cx="345" cy="94" r="4"/><circle cx="430" cy="282" r="4"/></g>
  </svg>;
}

export function MotionDrawing() {
  return <svg viewBox="0 0 570 210" role="img" aria-labelledby="motion-title motion-desc">
    <title id="motion-title">Translation and rotation describe different motion</title>
    <desc id="motion-desc">A head outline moving along a straight path illustrates translation. A head outline with a curved path illustrates rotation. Neither drawing represents a measured impact, brain strain or injury probability.</desc>
    {[110,395].map((x,i)=><g key={x} transform={`translate(${x} 76)`}>
      <path d="M-32 23Q-55-30-12-44Q26-58 38-22L47-8L37 1V24L12 26V44H-18V32Z" fill="none" stroke="#b6ccd7" strokeWidth="2"/>
      <path d="M-27-14Q-19-32 0-29Q21-28 23-10Q27 5 12 12Q-9 19-24 5Z" fill="none" stroke="#a4dfd6" strokeWidth="1.5"/>
      {i===0 ? <path d="M-69 62H82m-10-7l10 7-10 7" fill="none" stroke="#ffb394" strokeWidth="2"/> : <path d="M-52 29A61 61 0 1 1 45 44m0-13v13H32" fill="none" stroke="#ffb394" strokeWidth="2"/>}
    </g>)}
    <g fill="#d9e5e9" fontFamily="monospace" fontSize="24" textAnchor="middle"><text x="110" y="183">TRANSLATION</text><text x="395" y="183">ROTATION</text></g>
  </svg>;
}
