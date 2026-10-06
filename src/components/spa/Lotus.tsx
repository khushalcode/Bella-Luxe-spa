export function Lotus({
  className,
  strokeWidth = 1.4,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 64 44"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* centre petal */}
      <path d="M32 3C25.5 12 25.5 27 32 38C38.5 27 38.5 12 32 3Z" />
      {/* inner petals */}
      <path d="M32 38C21 36 13 28 12 15C22 15 30 24 32 38Z" />
      <path d="M32 38C43 36 51 28 52 15C42 15 34 24 32 38Z" />
      {/* outer petals */}
      <path d="M32 38C19 42 8 38 2 27C12 25 24 29 32 38Z" />
      <path d="M32 38C45 42 56 38 62 27C52 25 40 29 32 38Z" />
      {/* base */}
      <path d="M20 42C27 44 37 44 44 42" />
    </svg>
  );
}
