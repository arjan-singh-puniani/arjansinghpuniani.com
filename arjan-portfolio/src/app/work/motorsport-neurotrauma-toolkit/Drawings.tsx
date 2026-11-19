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

export function OccupantDrawing() {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 0 760 440" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>Driver protection: a lateral cutaway of the cockpit</title>
    <desc id={`${id}-desc`}>The reclined driver faces right. The helmet surrounds the head. A tether links the back of the helmet to the frontal head restraint behind the shoulders, beneath the harness. The halo is above the cockpit; the survival cell encloses the seated body. Equipment placement is explanatory, not an installation specification.</desc>
    <defs>
      <linearGradient id={`${id}-cell`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#496674"/><stop offset="1" stopColor="#233e4c"/></linearGradient>
      <linearGradient id={`${id}-suit`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e0e9eb"/><stop offset="1" stopColor="#9cb6c1"/></linearGradient>
      <linearGradient id={`${id}-helmet`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".65" stopColor="#e1e8e9"/><stop offset="1" stopColor="#bacdd3"/></linearGradient>
    </defs>
    <path d="M91 364H691" fill="none" stroke="#acbfc8"/>
    <path d="M122 278L143 226L214 238L285 280L363 307L496 292L631 227L664 239L641 349L165 354Z" fill={`url(#${id}-cell)`} stroke="#4c6978" strokeWidth="2"/>
    <path d="M148 281L160 253L218 262L283 300L360 327L500 313L636 255L619 329L175 334Z" fill="#1c3543" stroke="#92acb8"/>
    <path d="M231 214L291 290Q317 320 366 323" fill="none" stroke="#c0d0d5" strokeWidth="12"/>
    <path d="M250 199Q273 192 290 217L329 257Q353 278 388 290L458 250Q475 241 492 252L548 286L596 291L604 311L551 310Q541 309 530 301L480 275L403 315Q384 326 363 312L309 283L267 244Z" fill={`url(#${id}-suit)`} stroke="#567785" strokeWidth="2"/>
    <path d="M286 215L326 239Q336 245 346 234L390 202L410 206L413 219L399 225L355 256Q339 268 322 257L296 245" fill={`url(#${id}-suit)`} stroke="#567785" strokeWidth="2"/>
    <path d="M393 180L420 220" stroke="#203f4c" strokeWidth="8" strokeLinecap="round"/>
    <path d="M386 191L402 207L422 207" fill="none" stroke="#203f4c" strokeWidth="4"/>
    <path d="M292 245L324 270M401 302L478 261M549 297L590 299" fill="none" stroke="#f2f7f7" strokeWidth="2"/>
    <path d="M252 177L273 196L272 215L251 209L237 189" fill="#c1a798" stroke="#6c7778"/>
    <path d="M232 180L226 202Q225 214 242 221L274 230L285 217L247 202L249 184Z" fill="#428f86" stroke="#205c5a" strokeWidth="2"/>
    <path d="M258 215L303 258L365 301" fill="none" stroke="#183e51" strokeWidth="16" strokeLinejoin="round"/>
    <path d="M259 215L304 258L365 301" fill="none" stroke="#80a6b8" strokeWidth="2"/>
    <path d="M244 304L367 301L401 311" fill="none" stroke="#183e51" strokeWidth="13"/>
    <rect x="357" y="292" width="19" height="18" rx="3" fill="#c6d3d8" stroke="#335566"/>
    <path d="M213 143Q209 105 239 96Q276 85 299 109L314 136L323 158L309 179L275 187L238 179Q219 171 213 143Z" fill={`url(#${id}-helmet)`} stroke="#365b6c" strokeWidth="2"/>
    <path d="M270 112Q287 113 300 127L313 150L282 146L271 136Z" fill="#183b4c" stroke="#658593" strokeWidth="1.5"/>
    <path d="M225 122Q233 103 259 103M222 151L233 164L265 174" fill="none" stroke="#fff" strokeWidth="3"/>
    <path d="M222 164L233 205" stroke="#b97152" strokeWidth="4"/>
    <circle cx="222" cy="164" r="4" fill="#b97152" stroke="#fff"/>
    <path d="M191 229L191 94Q330 51 457 109L502 237" fill="none" stroke="#2e776f" strokeWidth="10" strokeLinecap="round"/>
    <path d="M192 95Q330 54 454 110" fill="none" stroke="#a4dfd6" strokeWidth="2"/>
    <g fill="none" stroke="#698490" strokeWidth="1.3">
      <path d="M239 105L202 62H35M234 212L165 206H35M224 182L162 277H35M416 89L492 42H675M316 253L531 192H690M476 340L510 382H690"/>
    </g>
    <g fill="#173d50" fontFamily="Arial, Helvetica, sans-serif" fontSize="27">
      <text x="35" y="49">Helmet</text><text x="35" y="193">FHR</text><text x="35" y="309">Tether</text><text x="559" y="29">Halo</text><text x="559" y="179">Harness</text><text x="504" y="418">Survival cell</text>
    </g>
    <g fill="#245f66" stroke="#edf3f3" strokeWidth="1.5">{[[239,105],[234,212],[224,182],[416,89],[316,253],[476,340]].map(([cx,cy])=><circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4"/>)}</g>
  </svg>;
}

export function MotionDrawing() {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 0 680 540" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>Anatomical context and distinct components of head motion</title>
    <desc id={`${id}-desc`}>An illustrative sagittal section faces right. The cerebrum occupies most of the cranial cavity; the cerebellum lies posterior and inferior to it, behind the brainstem. The brainstem continues toward the spinal cord. Separate lower panels show whole-head translation and rotation in the sagittal plane, or pitch. No tissue movement, lesion or strain is depicted.</desc>
    <defs>
      <linearGradient id={`${id}-cerebrum`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e4e9f5"/><stop offset="1" stopColor="#a9bbd8"/></linearGradient>
      <linearGradient id={`${id}-cerebellum`}><stop stopColor="#c7e1d7"/><stop offset="1" stopColor="#8fbeb0"/></linearGradient>
      <clipPath id={`${id}-brain-clip`}><path d="M226 157C217 118 239 83 281 74C327 56 382 80 402 107C417 125 419 156 402 177C390 194 359 199 334 191L310 184C287 196 253 193 237 181Z"/></clipPath>
    </defs>
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#173d50"><text x="20" y="29" fontSize="23" fontWeight="700">A</text><text x="48" y="29" fontSize="20">Anatomical context</text><text x="467" y="29" fontSize="16" fill="#526f7a">Sagittal schematic</text></g>
    <path d="M216 214C189 190 189 144 203 107C219 66 252 49 298 47C355 38 406 62 426 100L432 143L453 164L435 173L437 184L443 194L435 204L434 218Q429 232 405 231L386 229L388 291H282L282 244Q242 238 216 214Z" fill="#e1e9e9" stroke="#738e9a" strokeWidth="1.7"/>
    <path d="M216 201C198 170 202 123 220 96C245 59 286 52 328 59C376 61 410 90 420 125L418 166C410 196 391 212 359 218L318 214L288 235L250 225Z" fill="#e7dfd0" stroke="#a89e88" strokeWidth="1.5"/>
    <path d="M225 198C211 166 214 128 230 103C253 70 289 63 326 70C367 71 399 95 408 127L407 161C401 187 383 203 356 207L316 204L285 225L254 215Z" fill="#f4f6f2" stroke="#c4bca8"/>
    <path d="M312 178Q329 190 327 210Q341 217 329 230L318 241L313 280H300L304 240L299 223L307 208L299 189Z" fill="#d6b5a2" stroke="#9f7c68" strokeWidth="1.5"/>
    <path d="M238 204Q248 191 272 196Q295 197 302 216Q300 238 277 242Q249 239 237 223Z" fill={`url(#${id}-cerebellum)`} stroke="#5a8f83" strokeWidth="1.5"/>
    <g fill="none" stroke="#6c9b8e" strokeWidth="1.1"><path d="M244 204Q268 215 294 207M240 211Q266 224 299 216M241 219Q269 234 295 226M250 231Q273 237 286 233"/></g>
    <path d="M226 157C217 118 239 83 281 74C327 56 382 80 402 107C417 125 419 156 402 177C390 194 359 199 334 191L310 184C287 196 253 193 237 181Z" fill={`url(#${id}-cerebrum)`} stroke="#587394" strokeWidth="1.8"/>
    <g clipPath={`url(#${id}-brain-clip)`} fill="none" stroke="#7d92b0" strokeWidth="1.5" strokeLinecap="round">
      <path d="M238 108Q260 113 252 133Q247 146 257 157M269 79Q282 96 271 111Q263 123 276 137M299 72Q291 95 306 108L298 126M328 78Q343 96 330 110Q320 125 335 139M358 85Q350 102 368 118Q379 130 368 146M387 104Q379 119 393 132Q403 142 395 156M225 140Q241 143 235 163L247 179M262 174Q271 160 291 169Q302 173 309 161M323 182Q324 161 346 163Q363 165 369 181M278 145Q299 129 319 139Q335 149 348 140M282 87Q310 89 317 101M376 159L384 174"/>
      <path d="M254 158Q271 139 285 149M340 104Q356 105 356 121M297 186L289 174M247 118L233 122" stroke="#f1f4f9" strokeWidth="2.2"/>
    </g>
    <path d="M277 151Q290 127 324 129Q348 132 357 149L345 156Q332 145 316 145Q294 144 288 161Z" fill="#edf0f7" stroke="#8196b1" strokeWidth="1.3"/>
    <path d="M298 166Q315 153 329 166L324 182L309 185Z" fill="#9caed0" stroke="#748aa7"/>
    <g fill="none" stroke="#65818c" strokeWidth="1.2"><path d="M219 103L161 77H20M357 100L465 77H655M267 219L161 252H20M315 242L467 266H655"/></g>
    <g fill="#173d50" fontFamily="Arial, Helvetica, sans-serif" fontSize="27"><text x="20" y="65">Skull</text><text x="484" y="65">Cerebrum</text><text x="20" y="283">Cerebellum</text><text x="484" y="297">Brainstem</text></g>
    <g fill="#3c6d80">{[[219,103],[357,100],[267,219],[315,242]].map(([cx,cy])=><circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.5"/>)}</g>
    <g fontFamily="Arial, Helvetica, sans-serif" fontSize="17" fill="#526f7a"><text x="204" y="321">Posterior</text><text x="381" y="321">Anterior</text></g>
    <path d="M20 347H660M340 368V520" stroke="#c0ced3"/>
    <g fill="#173d50" fontFamily="Arial, Helvetica, sans-serif" fontSize="23"><text x="20" y="381" fontWeight="700">B</text><text x="49" y="381">Translation</text><text x="365" y="381" fontWeight="700">C</text><text x="394" y="381">Rotation / pitch</text></g>
    {[160,510].map((x,i)=><g key={x} transform={`translate(${x} 448)`}>
      <path d="M-31 19Q-49-23-16-38Q16-50 32-20L40-8L32 0V21L11 23V43H-14V29Z" fill="#dce7e9" stroke="#5b7b89" strokeWidth="2"/>
      <path d="M-26-13Q-21-31 0-29Q16-26 20-9Q24 6 11 12Q-9 15-22 4Z" fill="#bac9df" stroke="#7e96b4"/>
      {i===0 ? <path d="M-83 54H86m-11-7l11 7-11 7" fill="none" stroke="#9b5a3e" strokeWidth="2.5"/> : <path d="M-58 25A62 62 0 1 1 45 44m0-13v13H32" fill="none" stroke="#9b5a3e" strokeWidth="2.5"/>}
    </g>)}
  </svg>;
}
