export default function SealMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="18.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.6 2.6" />
      <circle cx="20" cy="20" r="14" fill="currentColor" />
      <path
        d="M13 20.5L17.5 25L27.5 14.5"
        stroke="var(--seal-check, #FAF7F0)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
