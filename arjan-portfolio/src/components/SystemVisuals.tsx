type Step = { label: string; note?: string };

export function ProcessFlow({ label, steps }: { label: string; steps: Step[] }) {
  return <figure className="system-figure" aria-label={label}><figcaption>{label}</figcaption><ol className="process-flow">{steps.map((step, index) => <li key={step.label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step.label}</strong>{step.note && <small>{step.note}</small>}</li>)}</ol></figure>;
}

export function CommandMap() {
  const nodes = ["Race control", "Rescue + fire", "Medical command", "Security", "Operations", "Public information", "External mutual aid"];
  return <figure className="system-figure command-map" aria-labelledby="command-caption"><figcaption id="command-caption">Proposed coordination relationships — roles, not a staffing chart</figcaption><div className="command-core"><span>Shared operating picture</span><strong>Coordinated command</strong><small>authority · information · handoffs</small></div><ul>{nodes.map((node, index) => <li key={node} style={{ "--i": index } as React.CSSProperties}><span>{String(index + 1).padStart(2, "0")}</span>{node}</li>)}</ul></figure>;
}

export function EscalationLadder() {
  return <figure className="system-figure" aria-labelledby="escalation-caption"><figcaption id="escalation-caption">Three-level incident framework proposed in the academic study</figcaption><ol className="escalation-ladder"><li><span>01</span><div><strong>Minor</strong><small>Localized; managed with assigned event resources and no material threat to event-wide operations.</small></div></li><li><span>02</span><div><strong>Serious</strong><small>Disrupts safe operations, engages several functions, or may require outside support.</small></div></li><li><span>03</span><div><strong>Major</strong><small>Threatens life at scale, requires broad protective action, or exceeds event capability.</small></div></li></ol></figure>;
}

export function RiskMatrix() {
  const rows = [
    ["High-energy crash", "Rescue + medical", "Access, stabilization, handoff"],
    ["Heat / medical surge", "Medical + operations", "Capacity, triage, transport"],
    ["Fire / hazardous material", "Fire + operations", "Isolation, protection, public safety"],
    ["Wildfire / severe weather", "Unified coordination", "Shelter or movement decision"],
    ["Security threat", "Security + public safety", "Authority, access, communication"],
    ["Communications / utility loss", "All functions", "Redundancy and degraded operations"],
  ];
  return <figure className="system-figure"><figcaption>Modeled scenario families and coordination focus</figcaption><div className="risk-matrix" role="table" aria-label="Modeled scenario families"><div role="row" className="matrix-head"><span role="columnheader">Scenario</span><span role="columnheader">Primary interface</span><span role="columnheader">Design concern</span></div>{rows.map((row) => <div role="row" key={row[0]}>{row.map((cell) => <span role="cell" key={cell}>{cell}</span>)}</div>)}</div></figure>;
}

export function RedundancyMap() {
  return <figure className="system-figure redundancy-map"><figcaption>Proposed communications redundancy — no frequencies or private contacts shown</figcaption><div className="redundancy-source">Incident report</div><div className="redundancy-paths"><span>Approved event radio</span><span>Emergency / bypass path</span><span>Cellular / fixed phone</span><span>Runner / reporting point</span></div><div className="redundancy-end">Read-back + time-stamped log</div></figure>;
}

export function RecoveryGates() {
  return <ProcessFlow label="Recovery and return-to-operations gates proposed in the study" steps={[{label:"People",note:"patients and affected populations accounted for"},{label:"Hazards",note:"appropriate authority confirms control"},{label:"Course + containment",note:"surface, barriers, fencing, and gates checked"},{label:"Communications",note:"critical systems tested"},{label:"Medical + rescue",note:"minimum coverage restored"},{label:"Access + egress",note:"emergency and public routes available"},{label:"Records + evidence",note:"required records initiated and secured"},{label:"Staff readiness",note:"fatigue, relief, and handoff reviewed"},{label:"Public message",note:"open and closed areas stated"},{label:"Decision record",note:"residual risk and authority documented"}]} />;
}
