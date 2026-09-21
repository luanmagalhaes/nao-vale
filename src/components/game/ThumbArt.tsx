export function ThumbArt({
  direction,
  className = "",
}: {
  direction: "up" | "down";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={direction === "down" ? { transform: "rotate(180deg)" } : undefined}
      aria-hidden="true"
    >
      <g
        fill="#fbf5f4"
        stroke="#000000"
        strokeWidth="3.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M20 58h-6a4 4 0 0 1-4-4V33a4 4 0 0 1 4-4h6z" />
        <path d="M20 29c4-2 6-5 7-9 1-3 0-6 1-9 1-2 3-4 6-3 3 1 4 4 4 7 0 3-1 6-2 9h11c3 0 5 2 5 5 0 2-1 3-2 4 2 1 3 2 3 4s-1 3-3 4c1 1 2 2 2 4s-1 3-3 4c1 1 1 2 1 3 0 3-2 5-5 5H27a7 7 0 0 1-7-7z" />
      </g>
      <g stroke="#000000" strokeWidth="2.6" strokeLinecap="round">
        <path d="M32 6l2-5M40 9l4-4M25 9l-4-4" />
      </g>
    </svg>
  );
}
