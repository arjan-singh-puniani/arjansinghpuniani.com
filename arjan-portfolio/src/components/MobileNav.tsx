"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const nav = [["Work", "/work"], ["Research", "/research"], ["About", "/about"], ["CV", "/cv"], ["Notes", "/notes"], ["Contact", "/contact"]] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="mobile-nav">
      <button ref={buttonRef} className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={`${open ? "Close" : "Open"} navigation`} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
      </button>
      {open && (
        <nav ref={menuRef} id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        </nav>
      )}
    </div>
  );
}
