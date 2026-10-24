function VolkswagenBadge({ x, y, radius = 5 }: { x: number; y: number; radius?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${radius / 5})`} strokeWidth="0.9">
    <circle r="5" fill="white" />
    <path d="m-2.3-3 2.3 3 2.3-3M-3.7-.8l1.7 3.5L0 .4l2 2.3L3.7-.8" />
  </g>;
}

function GolfFront() {
  return <g>
    {/* Golf hatchback: short bonnet, straight grille and five-door silhouette. */}
    <path fill="white" d="M17 77q0-10 9-17l24-12 22-18q7-5 21-6l35 1q10 0 16 8l13 17q9 4 9 15l-2 18-12 5-14-1-34 12-19 3-54-5-12-5Z" />
    <path d="m50 48 47 7 25-25q-20-3-46 3Z" />
    <path d="m105 54 21-24 8 2 16 17-26 7Z" />
    <path d="m128 32-5 23M97 55l-3 13M29 60l65 8 61-17M19 77l71 9 69-22M20 91l66 8M116 59l2 25M139 56l4 20M121 64l9-2M145 58l7-2" />
    <path fill="white" d="m101 55 8-6 9 2-2 7-14 2Z" />
    <path d="m23 68 19 3 1 9-22-4ZM72 74l17 1-3 9-18-3Z" />
    <path strokeWidth="1.6" d="m28 72 9 2M74 78l9 1M44 75l22 3M44 79l22 3M26 86l52 6M29 90l44 6" />
    <path fill="white" d="m45 86 19 2-1 6-19-2Z" />
    <VolkswagenBadge x={56} y={77} radius={4} />
    <path fill="white" d="M94 97V85q1-13 11-14 10 0 10 13v9l-5 7-10 2Z" />
    <ellipse cx="105" cy="88" rx="7" ry="12" /><ellipse cx="105" cy="88" rx="3" ry="6" strokeWidth="1.5" />
    <path fill="white" d="M143 85V72q1-11 9-12 8 0 8 11v10l-5 7-7 1Z" />
    <ellipse cx="152" cy="75" rx="5" ry="11" /><path strokeWidth="1.5" d="M152 68v14M101 78l7 19M100 92l10-7M150 69l4 13" />
    <path d="m119 87 18-6" />
  </g>;
}

function GolfRear() {
  return <g>
    {/* Separate rear-right view with upright tailgate and Golf rear-light shapes. */}
    <path fill="white" d="m18 59 8-18 26-13q7-4 22-4l35 2q12 1 21 9l23 18q10 5 11 17l-1 16-13 7-20 1-37 8-51-6-21-8Z" />
    <path d="m28 42 50 5 23-17-28-2-20 3ZM83 48l24-17 13 5 22 18-29 5Z" />
    <path d="m103 34 8 24M27 40l50 5M77 47l4 15M21 59l60 6 71-11M23 82l56 10 79-21M28 90l50 9M113 60l3 23M138 59l7 16M119 65l8-2M144 61l9-2" />
    <path d="m23 61 21 4 3 11-26-5ZM59 68l19 1-1 11-23-4Z" />
    <path strokeWidth="1.5" d="m26 66 13 3M60 72l14 2M29 83l38 7M41 37l24 3M54 51l10 2" />
    <path fill="white" d="m39 77 22 4-1 7-22-4Z" />
    <VolkswagenBadge x={53} y={64} radius={4} />
    <path fill="white" d="M84 100V86q0-13 10-15 10-1 11 13v12l-7 7-9 1Z" />
    <ellipse cx="95" cy="89" rx="7" ry="12" /><ellipse cx="95" cy="89" rx="3" ry="6" strokeWidth="1.5" />
    <path fill="white" d="M143 90V76q1-11 9-12 9 0 9 11v11l-6 7-7 1Z" />
    <ellipse cx="153" cy="79" rx="5" ry="11" /><path strokeWidth="1.5" d="M153 72v14M91 79l7 20M90 93l10-7M150 73l5 13" />
    <path d="m109 91 28-7M28 92l6 1" />
  </g>;
}

export function PhotoAngleIllustration({ angle }: { angle: number }) {
  return <svg viewBox="0 0 180 120" className="h-28 w-40 text-[#202b50]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {angle === 0 ? <GolfFront /> : angle === 1 ? <GolfRear /> : angle === 2 ? <g>
      <path d="m28 89-9-25 15-31 30-15 24 8-9 34-29 9 11 29M31 57l17-24 23-8M46 65l-12 19 19 18M88 93l29-14 23-40q4-7 10-1l-16 54-28 17-34-11Z" />
      <path d="m102 75 23-36q5-7 10-3M84 91l22 8 27-14M61 41l13 9M49 48l9 8" />
    </g> : angle === 3 ? <g>
      <path d="M17 94V39q70-24 146 0v55M22 51h136M119 70h25v20h-25M78 63h26v30H78Z" />
      <circle cx="51" cy="78" r="28" /><circle cx="51" cy="78" r="17" /><path d="M24 77h54M51 95v10M84 102h48M94 70h6M94 78h6M94 86h6" />
      <VolkswagenBadge x={51} y={78} radius={6} />
    </g> : angle === 4 ? <g>
      <path d="M16 99a35 35 0 0 1 55-42M164 99a35 35 0 0 0-55-42" /><path d="M53 91a39 39 0 1 1 75 0" />
      <path d="M90 22v10M62 34l7 8M118 34l-7 8M53 59l11 3M127 59l-11 3M90 66l18-21M33 79l9 8M147 79l-9 8" /><rect x="74" y="83" width="32" height="12" rx="2" /><path d="M80 89h20" />
    </g> : <g>
      <path fill="white" d="M23 83V66l16-8 21-25h54l28 23 16 6v21H23Z" /><path d="m46 57 19-19h21v19ZM92 38h19l22 19H92ZM89 59v20M26 68h13M145 65h10M114 66h7" /><circle cx="52" cy="83" r="12" fill="white" /><circle cx="132" cy="83" r="12" fill="white" /><circle cx="52" cy="83" r="5" /><circle cx="132" cy="83" r="5" /><path d="m94 65-9 8 10 3-12 10M116 26l7-12M146 45l14-8M145 104l10 7" />
    </g>}
  </svg>;
}
