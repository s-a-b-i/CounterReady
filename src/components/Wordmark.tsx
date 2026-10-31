export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="14" height="26" viewBox="0 0 14 26" aria-hidden="true">
        <circle cx="7" cy="3" r="2.2" fill="var(--gold)" />
        <path d="M7 5.2v9" stroke="var(--ink)" strokeWidth="1.2" />
        <path d="M7 14c3 3.4 4.6 6 0 11-4.6-5-3-7.600 0-11z" fill="var(--gold)" stroke="var(--ink)" strokeWidth="1" />
      </svg>
      <span className="display text-[1.35rem] leading-none">SmallPrint</span>
    </span>
  );
}
