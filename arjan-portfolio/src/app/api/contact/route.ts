import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact";
export async function POST(request: Request) {
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ message: "Message received." });
  const apiKey = process.env.RESEND_API_KEY; const to = process.env.CONTACT_TO_EMAIL; const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return NextResponse.json({ message: "Contact delivery is not configured. Please use the email link on this page." }, { status: 503 });
  const response = await fetch("https://api.resend.com/emails", { method:"POST", headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"}, body:JSON.stringify({from,to:[to],reply_to:parsed.data.email,subject:`Portfolio inquiry: ${parsed.data.category}`,text:`From: ${parsed.data.name} <${parsed.data.email}>\nCategory: ${parsed.data.category}\n\n${parsed.data.message}`}) });
  if (!response.ok) return NextResponse.json({ message: "Delivery failed. Please use the email link instead." }, { status: 502 });
  return NextResponse.json({ message: "Your message was sent." });
}
