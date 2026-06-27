"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ActionButton } from "@/admin/components/ui/action-button";
import { EmptyState } from "@/admin/components/ui/empty-state";
import { StatCard } from "@/admin/components/ui/stat-card";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { ToastItem, ToastViewport } from "@/admin/components/ui/toast";
import { ApiError, apiRequest } from "@/admin/lib/api";
import { cn } from "@/admin/lib/utils";

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
}

interface ConfigurationItem {
  id: string;
  timeout: number;
  isBeingMaintained: boolean;
  boldSignExpiryDays: number;
  isLive: boolean;
  locationBroadcastInterval: number;
  gracePeriod: number;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  defaultDispatchWindow: string;
  weeklySummary: boolean;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  announcement: string;
  announcementSecondary: string;
  address: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  serviceAreaLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  mainNavigationText: string;
  contactPointsText: string;
  licensesText: string;
  processEyebrow: string;
  processTitle: string;
  processDescription: string;
  processStepsText: string;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaDescription: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutStoryTitle: string;
  aboutStoryIntro: string;
  aboutStoryBodyText: string;
  aboutNavigationText: string;
  updatedAt?: string;
}

type ConfigurationForm = Omit<ConfigurationItem, "updatedAt">;
type ConfigKey = keyof ConfigurationForm;
type SectionField = {
  key: ConfigKey;
  label: string;
  type?: string;
  multiline?: boolean;
};

const emptyConfiguration: ConfigurationForm = {
  id: "",
  timeout: 30,
  isBeingMaintained: false,
  boldSignExpiryDays: 2,
  isLive: true,
  locationBroadcastInterval: 5,
  gracePeriod: 3,
  companyName: "",
  supportEmail: "",
  supportPhone: "",
  defaultDispatchWindow: "",
  weeklySummary: false,
  defaultMetaTitle: "",
  defaultMetaDescription: "",
  announcement: "",
  announcementSecondary: "",
  address: "",
  primaryCtaLabel: "",
  primaryCtaHref: "",
  secondaryCtaLabel: "",
  secondaryCtaHref: "",
  serviceAreaLabel: "",
  heroEyebrow: "",
  heroTitle: "",
  heroDescription: "",
  mainNavigationText: "",
  contactPointsText: "",
  licensesText: "",
  processEyebrow: "",
  processTitle: "",
  processDescription: "",
  processStepsText: "",
  ctaEyebrow: "",
  ctaTitle: "",
  ctaDescription: "",
  aboutEyebrow: "",
  aboutTitle: "",
  aboutDescription: "",
  aboutStoryTitle: "",
  aboutStoryIntro: "",
  aboutStoryBodyText: "",
  aboutNavigationText: "",
};

const numericFields = [
  { key: "timeout", label: "Timeout", suffix: "sec" },
  { key: "boldSignExpiryDays", label: "Signature Expiry", suffix: "days" },
  { key: "locationBroadcastInterval", label: "Broadcast Interval", suffix: "min" },
  { key: "gracePeriod", label: "Grace Period", suffix: "days" },
] satisfies Array<{ key: ConfigKey; label: string; suffix: string }>;

const sections: Array<{
  title: string;
  fields: SectionField[];
}> = [
  {
    title: "Brand And Contact",
    fields: [
      { key: "companyName", label: "Company Name" },
      { key: "supportEmail", label: "Support Email", type: "email" },
      { key: "supportPhone", label: "Support Phone" },
      { key: "address", label: "Address" },
      { key: "defaultDispatchWindow", label: "Dispatch Window" },
      { key: "serviceAreaLabel", label: "Service Area" },
    ],
  },
  {
    title: "SEO And Announcement",
    fields: [
      { key: "defaultMetaTitle", label: "Meta Title" },
      { key: "defaultMetaDescription", label: "Meta Description", multiline: true },
      { key: "announcement", label: "Announcement" },
      { key: "announcementSecondary", label: "Secondary Announcement" },
    ],
  },
  {
    title: "Hero And CTA",
    fields: [
      { key: "heroEyebrow", label: "Hero Eyebrow" },
      { key: "heroTitle", label: "Hero Title", multiline: true },
      { key: "heroDescription", label: "Hero Description", multiline: true },
      { key: "primaryCtaLabel", label: "Primary CTA Label" },
      { key: "primaryCtaHref", label: "Primary CTA Link" },
      { key: "secondaryCtaLabel", label: "Secondary CTA Label" },
      { key: "secondaryCtaHref", label: "Secondary CTA Link" },
      { key: "ctaEyebrow", label: "CTA Eyebrow" },
      { key: "ctaTitle", label: "CTA Title", multiline: true },
      { key: "ctaDescription", label: "CTA Description", multiline: true },
    ],
  },
  {
    title: "Structured Public Content",
    fields: [
      { key: "mainNavigationText", label: "Main Navigation", multiline: true },
      { key: "contactPointsText", label: "Contact Points", multiline: true },
      { key: "licensesText", label: "Licenses", multiline: true },
      { key: "processStepsText", label: "Process Steps", multiline: true },
      { key: "aboutNavigationText", label: "About Navigation", multiline: true },
    ],
  },
  {
    title: "Process And About",
    fields: [
      { key: "processEyebrow", label: "Process Eyebrow" },
      { key: "processTitle", label: "Process Title", multiline: true },
      { key: "processDescription", label: "Process Description", multiline: true },
      { key: "aboutEyebrow", label: "About Eyebrow" },
      { key: "aboutTitle", label: "About Title", multiline: true },
      { key: "aboutDescription", label: "About Description", multiline: true },
      { key: "aboutStoryTitle", label: "Story Title", multiline: true },
      { key: "aboutStoryIntro", label: "Story Intro", multiline: true },
      { key: "aboutStoryBodyText", label: "Story Body", multiline: true },
    ],
  },
];

export default function ConfigurationPage() {
  const [configuration, setConfiguration] = useState<ConfigurationForm>(emptyConfiguration);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadConfiguration();
  }, []);

  const updatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return "Not saved";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(lastUpdatedAt));
  }, [lastUpdatedAt]);

  function pushToast(tone: ToastItem["tone"], title: string, message: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, title, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  }

  function setField<K extends ConfigKey>(key: K, value: ConfigurationForm[K]) {
    setConfiguration((current) => ({ ...current, [key]: value }));
  }

  function saveConfiguration() {
    if (!configuration.id) {
      pushToast("error", "Configuration Missing", "No configuration record was loaded.");
      return;
    }

    startTransition(async () => {
      try {
        const saved = await apiRequest<ConfigurationItem>("/configurations/update-configuration", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(configuration),
        });

        setConfiguration(mapConfiguration(saved));
        setLastUpdatedAt(saved.updatedAt || new Date().toISOString());
        pushToast("success", "Configuration Saved", "Public site settings were updated.");
      } catch (error) {
        pushToast("error", "Save Failed", getErrorMessage(error, "Unable to save configuration."));
      }
    });
  }

  async function loadConfiguration() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiRequest<CollectionResponse<ConfigurationItem>>(
        "/configurations/get-configurations?top=1&orderBy[0][field]=createdAt&orderBy[0][direction]=ASC",
      );
      const firstConfiguration = response.data?.[0];

      if (!firstConfiguration) {
        setErrorMessage("No configuration record exists yet.");
        return;
      }

      setConfiguration(mapConfiguration(firstConfiguration));
      setLastUpdatedAt(firstConfiguration.updatedAt || null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load configuration."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <section className="grid gap-px border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] md:grid-cols-4">
        <StatCard label="Site" value={configuration.companyName || "YISHAK"} />
        <StatCard label="Public Status" value={configuration.isLive ? "Live" : "Draft"} tone={configuration.isLive ? "secondary" : "error"} />
        <StatCard label="Maintenance" value={configuration.isBeingMaintained ? "On" : "Off"} tone={configuration.isBeingMaintained ? "error" : "secondary"} />
        <StatCard label="Updated" value={updatedLabel} />
      </section>

      <section className="admin-panel bg-white">
        <div className="flex flex-col gap-4 border-b border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">Public Site</p>
            <h1 className="admin-headline mt-1 text-[1.6rem] text-primary">Configuration</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={configuration.isBeingMaintained ? "Maintenance" : "Operational"} tone={configuration.isBeingMaintained ? "error" : "secondary"} />
            <ActionButton onClick={saveConfiguration} disabled={isPending || isLoading || Boolean(errorMessage)}>
              {isPending ? "Saving..." : "Save Changes"}
            </ActionButton>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading configuration...</div>
        ) : errorMessage ? (
          <div className="px-6 py-12">
            <EmptyState title="Configuration unavailable" description={errorMessage} />
          </div>
        ) : (
          <div className="grid gap-0 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border-b border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] bg-[var(--surface-low)] p-4 xl:border-b-0 xl:border-r">
              <div className="grid gap-3">
                <ToggleField label="Live Site" checked={configuration.isLive} onChange={(checked) => setField("isLive", checked)} />
                <ToggleField label="Maintenance Mode" checked={configuration.isBeingMaintained} onChange={(checked) => setField("isBeingMaintained", checked)} />
                <ToggleField label="Weekly Summary" checked={configuration.weeklySummary} onChange={(checked) => setField("weeklySummary", checked)} />
              </div>

              <div className="mt-6 grid gap-4">
                {numericFields.map((field) => (
                  <NumberField
                    key={field.key}
                    label={field.label}
                    suffix={field.suffix}
                    value={Number(configuration[field.key])}
                    onChange={(value) => setField(field.key, value as never)}
                  />
                ))}
              </div>
            </aside>

            <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_16%,transparent)]">
              {sections.map((section) => (
                <section key={section.title} className="p-4 sm:p-5">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{section.title}</h2>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {section.fields.map((field) => (
                      <Field
                        key={field.key}
                        label={field.label}
                        type={field.type}
                        multiline={field.multiline}
                        value={String(configuration[field.key] ?? "")}
                        onChange={(value) => setField(field.key, value as never)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  const inputClass = "mt-2 w-full border border-[color:color-mix(in_srgb,var(--border)_26%,transparent)] bg-white px-3 text-sm text-primary outline-none transition focus:border-secondary";

  return (
    <label className={multiline ? "lg:col-span-2" : undefined}>
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className={cn(inputClass, "min-h-28 resize-y py-3")}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(inputClass, "h-11")}
        />
      )}
    </label>
  );
}

function NumberField({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <div className="mt-2 flex h-11 border border-[color:color-mix(in_srgb,var(--border)_26%,transparent)] bg-white">
        <input
          type="number"
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-primary outline-none"
        />
        <span className="flex items-center border-l border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
          {suffix}
        </span>
      </div>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 border border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] bg-white px-3 py-3">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}

function mapConfiguration(configuration: ConfigurationItem): ConfigurationForm {
  return {
    ...emptyConfiguration,
    ...configuration,
    timeout: Number(configuration.timeout) || 0,
    boldSignExpiryDays: Number(configuration.boldSignExpiryDays) || 0,
    locationBroadcastInterval: Number(configuration.locationBroadcastInterval) || 0,
    gracePeriod: Number(configuration.gracePeriod) || 0,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
