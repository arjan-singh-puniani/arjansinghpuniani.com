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
    <path d="M59 215H705" fill="none" stroke="#405965" strokeWidth="1" strokeDasharray="4 7"/>
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
    <g fill="none" stroke="#a3bac6" strokeWidth="1.3"><path d="M363 221L302 86H171M429 200L498 338H672M396 245L265 362H65"/></g>
    <g fontFamily="Arial, Helvetica, sans-serif" fontSize="27" fill="#d5e4eb"><text x="171" y="70">Helmet</text><text x="571" y="370">Halo</text><text x="65" y="397">Survival cell</text></g>
    <g fill="#b9e6de" stroke="#101f2a" strokeWidth="1.5"><circle cx="363" cy="221" r="3.5"/><circle cx="429" cy="200" r="3.5"/><circle cx="396" cy="245" r="3.5"/></g>
    <g transform="rotate(-18 638 404)"><path d="M578 404H697m-12-7l12 7-12 7" fill="none" stroke="#b6cbd5" strokeWidth="1.5"/>
    <text x="600" y="391" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fill="#b6cbd5">FRONT</text></g>
  </svg>;
}

export function MotionDrawing() {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 0 680 220" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>Whole-head translation and illustrative pitch</title>
    <desc id={`${id}-desc`}>Two separate conceptual motion components: translation along a straight path, and rotation in the sagittal plane. These arrows do not depict brain displacement, acceleration magnitude, duration, tissue strain or an injury location.</desc>
    <path d="M340 20V200" stroke="#405663"/>
    <g fill="#d5e4eb" fontFamily="Arial, Helvetica, sans-serif" fontSize="24"><text x="40" y="37">Translation</text><text x="390" y="37">Rotation / pitch</text></g>
    {[160,510].map((x,i)=><g key={x} transform={`translate(${x} 122)`}>
      <path d="M-31 19Q-49-23-16-38Q16-50 32-20L40-8L32 0V21L11 23V43H-14V29Z" fill="#294553" stroke="#afc8d4" strokeWidth="2"/>
      <path d="M-26-13Q-21-31 0-29Q16-26 20-9Q24 6 11 12Q-9 15-22 4Z" fill="#86a9bd"/>
      {i===0 ? <path d="M-83 54H86m-11-7l11 7-11 7" fill="none" stroke="#ffb394" strokeWidth="2.5"/> : <path d="M-58 25A62 62 0 1 1 45 44m0-13v13H32" fill="none" stroke="#ffb394" strokeWidth="2.5"/>}
    </g>)}
  </svg>;
}
