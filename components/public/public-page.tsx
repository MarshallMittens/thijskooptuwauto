import type { ReactNode } from "react";

import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

export function PublicPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f6f2] text-[#111111]">
      <SiteHeader />
      <main>
        <section className="border-b border-slate-200 bg-white px-5 py-16 sm:px-8 lg:px-10 lg:py-24"><div className="mx-auto max-w-[1000px]"><p className="eyebrow">{eyebrow}</p><h1 className="mt-4 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] font-black leading-[.95] tracking-[-0.055em]">{title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{intro}</p></div></section>
        <section className="px-5 py-14 sm:px-8 lg:px-10 lg:py-20"><div className="mx-auto max-w-[1000px]">{children}</div></section>
      </main>
      <SiteFooter />
    </div>
  );
}
