"use client";
import { recordById, familyById } from '@/lib/atlas';
import { External } from './Evidence';

export default function NeuralinkEvidence({onStudies,onCompare}:{onStudies:()=>void;onCompare:()=>void}){
  const trials=familyById('neuralink')!.studyIds.map(recordById).filter(r=>!!r);
  const results=trials.filter(r=>r.hasResults===true).length;
  return <section className="neuralink-evidence" aria-label="Neuralink evidence at a glance">
    <div className="research-facts"><span><strong>Investigational</strong>Not FDA marketing approved</span><span><strong>{trials.length} studies</strong>Registry records linked</span><span><strong>{results}/{trials.length}</strong>With posted registry results</span></div>
    <p>Recording → decoding → external device control. This entry does not depict therapeutic electrical stimulation or restored limb movement.</p>
    <div className="neuralink-actions"><button onClick={onStudies}>Inspect all {trials.length} studies</button><button onClick={onCompare}>Compare recording interfaces</button></div>
    <details className="hardware-scope"><summary>Hardware specifications differ across sources</summary>
      <dl><dt>PRIME sponsor brochure</dt><dd>64 threads × 16 electrodes = 1,024 electrodes. The PDF has no established revision date here. <External href="https://neuralink.com/pdfs/PRIME-Study-Brochure.pdf">Original brochure</External></dd>
      <dt>UCLH · 31 July 2025</dt><dd>128 threads × 8 electrodes = 1,024 electrodes. <External href="https://www.uclh.nhs.uk/news/uclh-evaluate-safety-and-functionality-neuralinks-brain-computer-interface-bci-technology">Clinical-site description</External></dd></dl>
      <p>No universal patient configuration or revision crosswalk is established. The inset draws illustrative threads, not a complete electrode inventory.</p>
    </details>
    <details><summary>Reported limitation: thread retention</summary><p>In May 2024, Neuralink reported thread retraction and a decrease in effective recording electrodes in an early participant. The company also described software changes. This sponsor report does not establish a cohort-wide risk rate or an FDA recall.</p><External href="https://neuralink.com/updates/prime-study-progress-update-user-experience/">Original manufacturer report</External></details>
    <p className="research-limit">Registry results status reflects the retrieved records, not all research worldwide. The 2019 platform paper predates these human trials. Study permission and an IDE are separate from marketing authorization. <External href="https://neuralink.com/trials/">Manufacturer research-status notice</External></p>
  </section>;
}
