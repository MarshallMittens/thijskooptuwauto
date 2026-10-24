export function PhotoAngleIllustration({ angle }: { angle: number }) {
  return <svg viewBox="0 0 180 120" className="h-28 w-40 text-[#202b50]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {angle < 2 ? <g transform={angle === 1 ? "translate(180 0) scale(-1 1)" : undefined}>
      <path d="M17 72 27 53 60 34Q84 25 123 33L145 49 154 78 147 89 129 91M111 91 58 99 38 96 18 88Z" />
      <path d="m29 54 48-6 29-15M77 48l39 7 24-5M106 34l10 21 6 27M32 65l40 5 36-11M19 78l48 8 43-12M66 86l-2 10M81 69l-4 14M24 68l16 2-3 8-17-2M94 66l13-5-1 9-14 5M125 58l9-1" />
      <ellipse cx="49" cy="91" rx="9" ry="14" fill="white" /><ellipse cx="133" cy="83" rx="9" ry="15" fill="white" /><path d="M49 83v14M133 75v16" />
      {angle === 1 && <path d="m22 59 23 3M20 65l22 3" />}
    </g> : angle === 2 ? <g>
      <path d="m28 89-9-25 15-31 30-15 24 8-9 34-29 9 11 29M31 57l17-24 23-8M46 65l-12 19 19 18M88 93l29-14 23-40q4-7 10-1l-16 54-28 17-34-11Z" />
      <path d="m102 75 23-36q5-7 10-3M84 91l22 8 27-14M61 41l13 9M49 48l9 8" />
    </g> : angle === 3 ? <g>
      <path d="M17 94V39q70-24 146 0v55M22 51h136M119 70h25v20h-25M78 63h26v30H78Z" />
      <circle cx="51" cy="78" r="28" /><circle cx="51" cy="78" r="17" /><path d="M24 77h54M51 95v10M84 102h48M94 70h6M94 78h6M94 86h6" />
    </g> : angle === 4 ? <g>
      <path d="M16 99a35 35 0 0 1 55-42M164 99a35 35 0 0 0-55-42" /><path d="M53 91a39 39 0 1 1 75 0" />
      <path d="M90 22v10M62 34l7 8M118 34l-7 8M53 59l11 3M127 59l-11 3M90 66l18-21M33 79l9 8M147 79l-9 8" /><rect x="74" y="83" width="32" height="12" rx="2" /><path d="M80 89h20" />
    </g> : <g>
      <path d="M28 83q-9-16 4-31l28-16h65l25 24 5 24H28Z" /><circle cx="53" cy="85" r="12" fill="white" /><circle cx="131" cy="85" r="12" fill="white" /><path d="m90 42-8 15 13 2-15 19 20-11-11-4 13-17M116 30l7-12M140 43l14-8M145 104l10 7" />
    </g>}
  </svg>;
}
