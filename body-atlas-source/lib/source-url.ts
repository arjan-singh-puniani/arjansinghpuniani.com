import hosts from "@/data/source-hosts.json";

export function isSourceUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "https:" && !u.username && !u.password && !u.port && hosts.includes(u.hostname);
  } catch { return false; }
}
