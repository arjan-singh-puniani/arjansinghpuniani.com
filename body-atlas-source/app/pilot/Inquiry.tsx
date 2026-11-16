"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const recipient = "arjan.singh.puniani.main@gmail.com";
const subject = "BODY//ATLAS evidence brief pilot inquiry";

export default function Inquiry() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [draft, setDraft] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const team = String(fields.get("team") ?? "").trim();
    const question = String(fields.get("question") ?? "").trim();
    const timing = String(fields.get("timing") ?? "");
    const draft = [
      "I'm interested in a BODY//ATLAS evidence brief.",
      "",
      `Organization: ${team}`,
      `Research question: ${question}`,
      `Timing: ${timing}`,
      "",
      "Please let me know if this is a fit and how to scope the work.",
    ].join("\n");
    setDraft(draft);
    requestAnimationFrame(() => heading.current?.focus());
  }

  return (
    <div className="pilot-card pilot-inquiry">
      <h3>Request pilot scoping</h3>
      <p>Use public information in your question. Keep patient data and confidential device details out of the draft.</p>
      <noscript><p>Use the direct email link below to request a pilot.</p></noscript>
      <form onSubmit={prepare} onChange={() => setDraft("")}>
        <fieldset disabled={!ready}>
          <label>Organization<input name="team" autoComplete="organization" required maxLength={80} pattern=".*\S.*" /></label>
          <label>Research question<textarea name="question" required minLength={15} maxLength={300} rows={4} onChange={(event) => {
            const field = event.currentTarget;
            field.setCustomValidity(field.value.trim().length >= 15 || !field.value ? "" : "Enter at least 15 characters about your question.");
          }} /></label>
          <label>When do you need it?
            <select name="timing" required defaultValue="">
              <option value="" disabled>Select timing</option>
              <option>Within one month</option>
              <option>Within three months</option>
              <option>Exploring for later</option>
            </select>
          </label>
          <button className="pilot-button" type="submit">Prepare inquiry</button>
        </fieldset>
      </form>
      {draft && <div className="pilot-draft">
        <h4 ref={heading} tabIndex={-1}>Your draft is ready to send</h4>
        <label>Email draft<textarea readOnly rows={7} value={draft} /></label>
        <p>Open your email app to review and send, or copy the draft into webmail.</p>
        <a className="pilot-button" href={`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`}>Open email draft</a>
      </div>}
      <p>Prefer to write directly? <a href={`mailto:${recipient}?subject=${encodeURIComponent(subject)}`}>{recipient}</a></p>
    </div>
  );
}
