import { useId } from "react";

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
