import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "./ui/utils";

const baseClass = cn(
  "inline-flex h-12 min-h-12 items-center justify-center gap-2",
  "rounded-full px-7 text-base font-semibold shadow-sm",
  "transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

const variantClass = {
  primary: cn(
    "bg-primary text-landing-dark hover:bg-primary-hover",
    "focus-visible:ring-offset-background",
  ),
  /** Primary на тёмном фоне секции. */
  primaryOnDark: cn(
    "bg-primary text-landing-dark hover:bg-primary-hover",
    "focus-visible:ring-offset-landing-dark",
  ),
  outline: cn(
    "border border-black/12 bg-card text-foreground hover:bg-muted/70",
    "dark:border-white/25 dark:bg-white/10 dark:hover:bg-white/15",
    "focus-visible:ring-offset-background",
  ),
  /** Outline в цвете лесного dark (как футер). */
  outlineForest: cn(
    "border border-landing-dark bg-card text-landing-dark hover:bg-landing-dark hover:text-on-landing-dark",
    "focus-visible:ring-offset-background",
  ),
} as const;

export type LandingCtaVariant = keyof typeof variantClass;

type LandingCtaShared = {
  variant?: LandingCtaVariant;
  showArrow?: boolean;
  className?: string;
  children: ReactNode;
};

export type LandingCtaProps = LandingCtaShared &
  (
    | ({ to: string; href?: never } & Omit<
        ComponentPropsWithoutRef<typeof Link>,
        "className" | "children" | "to"
      >)
    | ({ href: string; to?: never } & Omit<
        ComponentPropsWithoutRef<"a">,
        "className" | "children" | "href"
      >)
    | ({ to?: never; href?: never } & Omit<
        ComponentPropsWithoutRef<"button">,
        "className" | "children"
      >)
  );

/**
 * Единая CTA лендинга: pill, primary как в «Питомцы рядом».
 */
export function LandingCta({
  variant = "primary",
  showArrow = false,
  className,
  children,
  ...rest
}: LandingCtaProps) {
  const classes = cn(baseClass, variantClass[variant], className);
  const content = (
    <>
      {children}
      {showArrow ? (
        <ArrowRight className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
      ) : null}
    </>
  );

  if ("to" in rest && rest.to != null) {
    const { to, ...linkRest } = rest;
    return (
      <Link to={to} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }

  if ("href" in rest && rest.href != null) {
    const { href, ...anchorRest } = rest;
    return (
      <a href={href} className={classes} {...anchorRest}>
        {content}
      </a>
    );
  }

  const { type = "button", ...buttonRest } = rest as ComponentPropsWithoutRef<"button">;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {content}
    </button>
  );
}
