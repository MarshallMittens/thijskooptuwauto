import localFont from "next/font/local";
import { formatRegistration } from "@/lib/applications/schema";

const font = localFont({ src: "../../public/fonts/Kenteken.ttf", display: "swap", weight: "400" });

export function LicensePlate({ registration }: { registration: string }) {
  return <span aria-label={`Kenteken ${formatRegistration(registration)}`} className="inline-flex h-14 items-stretch overflow-hidden rounded-lg border-[3px] border-[#111111] bg-[#f9cf00] text-[#080808]">
    <span aria-hidden="true" className="flex w-10 shrink-0 flex-col items-center justify-center bg-[#003f8f] text-white">
      <svg viewBox="0 0 32 32" className="size-6" focusable="false"><g fill="#ffdf00">{Array.from({ length: 12 }, (_, i) => { const angle = (i * 30 - 90) * Math.PI / 180; return <circle key={i} cx={16 + 12 * Math.cos(angle)} cy={16 + 12 * Math.sin(angle)} r="1.25" />; })}</g></svg>
      <span className="text-xs font-black leading-none">NL</span>
    </span>
    <span className={`${font.className} flex items-center px-4 text-[2.5rem] leading-none tracking-wide`}>{formatRegistration(registration)}</span>
  </span>;
}
