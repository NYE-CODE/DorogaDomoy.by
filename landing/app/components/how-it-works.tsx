import { useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Camera,
  FileText,
  Heart,
  HeartHandshake,
  Home,
  Map,
  Phone,
  Search,
} from "lucide-react";
import { useI18n } from "../../../context/I18nContext";
import { cn } from "./ui/utils";
import { petScenarioAccentClass, type PetScenario } from "@/shared/lib/pet-scenario-colors";
import {
  landingContainerWide,
  landingH2,
  landingLeadWideCenter,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

type HowItWorksTab = PetScenario;

const TAB_ORDER: HowItWorksTab[] = ["lost", "found", "shelter"];

const tabMeta: Record<
  HowItWorksTab,
  {
    icon: LucideIcon;
    stepIcons: readonly LucideIcon[];
  }
> = {
  lost: {
    icon: Search,
    stepIcons: [FileText, Map, Heart],
  },
  found: {
    icon: HeartHandshake,
    stepIcons: [Camera, Bell, Heart],
  },
  shelter: {
    icon: Home,
    stepIcons: [Search, Phone, Home],
  },
};

function defaultTab(): HowItWorksTab {
  return "lost";
}

function ScenarioTabButton({
  tabId,
  tablistId,
  isActive,
  onSelect,
  variant,
  buttonId,
}: {
  tabId: HowItWorksTab;
  tablistId: string;
  isActive: boolean;
  onSelect: () => void;
  variant: "mobile" | "desktop";
  buttonId: string;
}) {
  const { t } = useI18n();
  const tab = t.landing.howItWorks.tabs[tabId];
  const meta = tabMeta[tabId];
  const accent = petScenarioAccentClass[tabId];
  const Icon = meta.icon;

  if (variant === "mobile") {
    return (
      <button
        type="button"
        role="tab"
        id={buttonId}
        aria-selected={isActive}
        aria-controls={`${tablistId}-panel-${tabId}`}
        onClick={onSelect}
        className={cn(
          "flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-md px-1.5 py-2 text-center transition-all duration-200",
          isActive
            ? cn("bg-background shadow-sm ring-1", accent.ring)
            : "bg-transparent text-muted-foreground hover:bg-background/80",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            isActive ? cn(accent.soft, accent.text) : "bg-muted/80 text-muted-foreground",
          )}
        >
          <Icon size={18} aria-hidden />
        </span>
        <span
          className={cn(
            "text-[0.7rem] font-semibold leading-tight",
            isActive ? "text-foreground" : "text-foreground/80",
          )}
        >
          {tab.shortLabel}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="tab"
      id={buttonId}
      aria-selected={isActive}
      aria-controls={`${tablistId}-panel-${tabId}`}
      onClick={onSelect}
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-all duration-200",
        isActive
          ? cn("border-border bg-background shadow-sm ring-1", accent.ring)
          : "border-transparent bg-transparent hover:border-border/60 hover:bg-background/70",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors",
          isActive ? cn(accent.soft, accent.text) : "bg-muted text-muted-foreground",
        )}
      >
        <Icon size={20} aria-hidden />
      </span>
      <span className="min-w-0 pt-0.5">
        <span
          className={cn(
            "block text-sm font-semibold leading-snug",
            isActive ? "text-foreground" : "text-foreground/85",
          )}
        >
          {tab.label}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{tab.summary}</span>
      </span>
    </button>
  );
}

export function HowItWorks() {
  const { t } = useI18n();
  const hw = t.landing.howItWorks;
  const tablistId = useId();
  const [activeTab, setActiveTab] = useState<HowItWorksTab>(() => defaultTab());

  return (
    <section
      id="how-it-works"
      className={`${landingSectionY} scroll-mt-24 bg-gradient-to-b from-background via-muted/30 to-background`}
    >
      <div className={landingContainerWide}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{hw.title}</h2>
          <p className={landingLeadWideCenter}>{hw.subtitle}</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-[0_16px_48px_-20px_rgba(0,0,0,0.16)] ring-1 ring-foreground/5 sm:rounded-lg lg:shadow-[0_20px_60px_-24px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_70px_-28px_rgba(0,0,0,0.55)]">
          <div className="grid lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
            {/* ������������� ��������� */}
            <div
              className="border-b border-border/70 bg-muted/30 p-2 sm:p-3 lg:border-b-0 lg:border-r lg:bg-muted/25 lg:p-5"
              role="tablist"
              id={tablistId}
              aria-label={hw.title}
            >
              <p className="mb-3 hidden px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:block">
                {hw.scenarioLabel}
              </p>

              <div className="grid grid-cols-3 gap-1.5 rounded-md bg-muted/50 p-1 lg:hidden">
                {TAB_ORDER.map((tabId) => (
                  <ScenarioTabButton
                    key={`mobile-${tabId}`}
                    tabId={tabId}
                    tablistId={tablistId}
                    buttonId={`${tablistId}-tab-${tabId}`}
                    isActive={activeTab === tabId}
                    onSelect={() => setActiveTab(tabId)}
                    variant="mobile"
                  />
                ))}
              </div>
              <p className="mt-2.5 px-1 text-center text-xs leading-snug text-muted-foreground lg:hidden">
                {hw.tabs[activeTab].summary}
              </p>

              <div className="hidden flex-col gap-2 lg:flex">
                {TAB_ORDER.map((tabId) => (
                  <ScenarioTabButton
                    key={`desktop-${tabId}`}
                    tabId={tabId}
                    tablistId={tablistId}
                    buttonId={`${tablistId}-tab-${tabId}`}
                    isActive={activeTab === tabId}
                    onSelect={() => setActiveTab(tabId)}
                    variant="desktop"
                  />
                ))}
              </div>
            </div>

            {/* ���� */}
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div
                className="pointer-events-none absolute -right-16 -top-16 hidden size-48 rounded-full bg-primary/10 blur-3xl lg:block"
                aria-hidden
              />

              {TAB_ORDER.map((tabId) => {
                const meta = tabMeta[tabId];
                const accent = petScenarioAccentClass[tabId];
                const tab = hw.tabs[tabId];
                const isActive = activeTab === tabId;
                const ScenarioIcon = meta.icon;

                return (
                  <div
                    key={tabId}
                    role="tabpanel"
                    id={`${tablistId}-panel-${tabId}`}
                    aria-labelledby={`${tablistId}-tab-${tabId}`}
                    hidden={!isActive}
                    className={cn(!isActive && "hidden")}
                  >
                    <div className="mb-4 hidden items-center gap-3 border-b border-border/60 pb-5 lg:mb-6 lg:flex">
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-lg",
                          accent.soft,
                          accent.text,
                        )}
                      >
                        <ScenarioIcon size={22} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {hw.stepsCount}
                        </p>
                        <h3 className="text-lg font-semibold text-foreground sm:text-xl">{tab.label}</h3>
                      </div>
                    </div>

                    {/* ��������� �������� ����� */}
                    <ol className="space-y-2.5 lg:hidden">
                      {tab.steps.map((step, index) => {
                        const StepIcon = meta.stepIcons[index];

                        return (
                          <li
                            key={`${tabId}-mobile-${index}`}
                            className="rounded-md border border-border/70 bg-muted/15 p-3.5"
                          >
                            <div className="flex gap-3">
                              <div className="flex shrink-0 flex-col items-center gap-1">
                                <span
                                  className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-md",
                                    accent.soft,
                                    accent.text,
                                  )}
                                >
                                  <StepIcon size={17} aria-hidden />
                                </span>
                                <span className="text-[0.6rem] font-bold tabular-nums text-muted-foreground">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <h4 className="text-sm font-semibold leading-snug text-foreground">
                                  {step.title}
                                </h4>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>

                    {/* ���������� �������� */}
                    <ol className="relative hidden space-y-0 lg:block">
                      {tab.steps.map((step, index) => {
                        const StepIcon = meta.stepIcons[index];
                        const isLast = index === tab.steps.length - 1;

                        return (
                          <li key={`${tabId}-desktop-${index}`} className="relative flex gap-5 pb-8 last:pb-0">
                            {!isLast ? (
                              <span
                                className="absolute left-[1.45rem] top-12 bottom-0 w-px bg-gradient-to-b from-border via-border/80 to-transparent"
                                aria-hidden
                              />
                            ) : null}

                            <div className="relative z-[1] flex flex-col items-center">
                              <span
                                className={cn(
                                  "flex h-11 w-11 items-center justify-center rounded-lg ring-4 ring-background",
                                  accent.soft,
                                  accent.text,
                                )}
                              >
                                <StepIcon size={20} aria-hidden />
                              </span>
                              <span className="mt-2 text-[0.65rem] font-bold tabular-nums text-muted-foreground">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1 pt-1">
                              <h4 className="text-lg font-semibold leading-snug text-foreground">{step.title}</h4>
                              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">
                                {step.desc}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
