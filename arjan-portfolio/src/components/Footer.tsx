import Link from "next/link";

export function Footer() {
  return <footer className="footer"><div className="shell footer-grid"><div><strong>Arjan Singh Puniani</strong><p>Neural engineer pursuing medicine.</p></div><div><Link href="/work">Selected work</Link><Link href="/research">Research</Link><Link href="/notes">Notes</Link><Link href="/playground">Playground</Link><Link href="/cv">CV</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link></div><p className="fine">© {new Date().getFullYear()} Arjan Singh Puniani.</p></div></footer>;
}
