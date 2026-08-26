"use client";
import { useState } from "react";
const categories = ["Research collaboration", "Clinical translation", "Speaking or teaching", "Neurotechnology", "Motorsport medicine", "Media", "Other"];
export function ContactForm() {
  const [state, setState] = useState<{status: "idle"|"sending"|"success"|"error"; message?: string}>({status:"idle"});
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState({status:"sending"}); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json() as { message?: string };
    if (response.ok) { event.currentTarget.reset(); setState({status:"success", message:data.message}); } else setState({status:"error", message:data.message ?? "Message could not be sent."});
  }
  return <form className="contact-form" onSubmit={submit} noValidate><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div><div className="field-row"><label>Name<input name="name" required minLength={2} autoComplete="name" /></label><label>Email<input name="email" type="email" required autoComplete="email" /></label></div><label>Purpose<select name="category" required defaultValue=""><option value="" disabled>Select one</option>{categories.map((item)=><option key={item}>{item}</option>)}</select></label><label>Message<textarea name="message" required minLength={20} rows={8} /></label><button className="button" type="submit" disabled={state.status === "sending"}>{state.status === "sending" ? "Sending…" : "Send message"}</button><div className={`form-status ${state.status}`} role="status" aria-live="polite">{state.message}</div></form>;
}
