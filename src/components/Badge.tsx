interface BadgeProps {
  color: string;
  children: React.ReactNode;
}

/** Generic colored pill, reused by NutriScoreBadge and NovaBadge. */
export function Badge({ color, children }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold tracking-wide text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  );
}
