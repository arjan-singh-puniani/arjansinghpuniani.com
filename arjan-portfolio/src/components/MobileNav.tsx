"use client";

import Link from "next/link";
import { useState } from "react";

const nav = [["Work", "/work"], ["Motorsport", "/motorsport"], ["Research", "/research"], ["About", "/about"], ["CV", "/cv"], ["Contact", "/contact"]] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-nav">
      <button className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((value) => !value)}>
        <span className="sr-only">Toggle navigation</span>
        <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
      </button>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        </nav>
      )}
    </div>
  );
}
