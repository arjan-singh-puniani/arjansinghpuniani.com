import Image from "next/image";
import { atlasPath } from "@/lib/deployment";
import { companyMark } from "@/lib/company-marks";
import "./company-mark.css";

export default function CompanyMark({ organization, role }: {
  organization: string;
  role: "FDA applicant" | "Study sponsor";
}) {
  const mark = companyMark(organization);
  return (
    <div className="company-mark">
      {mark && (
        <span className="company-mark-art" data-tone={mark.tone}>
          <Image unoptimized src={atlasPath(`/company-marks/${mark.id}.svg`)}
            alt="" width={96} height={25} />
        </span>
      )}
      <span className="company-mark-identity"><small>{role}</small>{organization}</span>
    </div>
  );
}
