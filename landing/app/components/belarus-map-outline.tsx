/** Упрощённый контур Беларуси для превью на лендинге (декор, не геоточность). */
export function BelarusMapOutline({
  className,
  /** На светлом фоне — тёмный контур; на landing-dark — светлый. */
  tone = "onLight",
}: {
  className?: string;
  tone?: "onLight" | "onDark";
}) {
  const fillStroke =
    tone === "onDark"
      ? "fill-[color-mix(in_srgb,var(--color-on-landing-dark)_12%,transparent)] stroke-[color-mix(in_srgb,var(--color-on-landing-dark)_28%,transparent)]"
      : "fill-[color-mix(in_srgb,var(--color-landing-dark)_10%,transparent)] stroke-[color-mix(in_srgb,var(--color-landing-dark)_28%,transparent)]";

  return (
    <svg
      viewBox="0 0 420 380"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        d="M78 92c28-34 72-52 118-58 36-4 74 6 108 28 22 14 48 22 70 42 18 16 28 40 26 64-2 28-8 54-6 82 2 26-8 52-28 70-22 20-52 28-80 38-30 10-62 22-94 18-34-4-62-24-88-46-24-20-54-30-72-56-16-24-12-56 2-80 12-22 34-42 44-72z"
        className={fillStroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
