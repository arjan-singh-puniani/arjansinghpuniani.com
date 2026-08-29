import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";

const nav = [["Work", "/work"], ["Research", "/research"], ["About", "/about"], ["CV", "/cv"], ["Notes", "/notes"], ["Contact", "/contact"]] as const;

export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/" aria-label="Arjan Singh Puniani home"><span>ASP</span><strong>Arjan Singh Puniani</strong></Link>
        <nav className="desktop-nav" aria-label="Primary navigation"><ul>{nav.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></nav>
        <MobileNav />
      </div>
    </header>
  );
}
