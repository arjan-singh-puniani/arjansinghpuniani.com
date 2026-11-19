import Image from "next/image";
import styles from "./neurotrauma.module.css";

export function IncidentCar({ emphasis }: { emphasis: "car" | "driver" }) {
  return <figure className={styles.incidentCar} data-incident-car data-emphasis={emphasis}>
    <div className={styles.carImage}>
      <Image src="/images/neurotrauma/incident-car-plate.webp" width={1536} height={1024}
        quality={90}
        sizes="(max-width: 800px) 86vw, 600px"
        alt="AI-assisted overhead illustration of a generic open-wheel car: four slick tires, suspension, composite wings and floor, ivory bodywork, a helmeted driver and metallic halo. The nose points right; the driver's left is at the top. No damage or measured loading is depicted."/>
      <svg className={styles.plateMarkers} viewBox="0 0 1536 1024" aria-hidden="true">
        {emphasis === "driver" && <ellipse cx="800" cy="518" rx="196" ry="155" fill="none" stroke="#207a70" strokeWidth="5" strokeDasharray="12 10"/>}
        <path d="M1150 162V204" fill="none" stroke="#985234" strokeWidth="6" strokeDasharray="9 8"/>
        <circle cx="1150" cy="214" r="10" fill="#985234" stroke="#f2f6f5" strokeWidth="3"/>
        {[[695,505],[812,400],[1150,135]].map(([x,y],index)=><g key={index} transform={`translate(${x} ${y})`}>
          <circle r="28" fill={index === 2 ? "#985234" : "#173342"} stroke="#f2f6f5" strokeWidth="3"/>
          <text textAnchor="middle" dominantBaseline="central" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="28" fontWeight="700">{index+1}</text>
        </g>)}
      </svg>
    </div>
    <ol className={styles.carKey}><li>Helmet</li><li>Halo</li><li>Suggested front-left contact</li></ol>
    <figcaption>AI-assisted generic vehicle; geometry and contact cue are illustrative. The cue is not a force vector or damage estimate. The dashed cockpit outline, when shown, marks attention rather than loading.</figcaption>
    <a className={styles.carLink} href="/images/neurotrauma/incident-car-plate.webp">View full-size vehicle illustration</a>
  </figure>;
}
