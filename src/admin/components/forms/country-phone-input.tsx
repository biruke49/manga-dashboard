"use client";

import { ChevronDownIcon } from "@/admin/lib/icons";
import { COUNTRY_PHONE_OPTIONS, getCountryPhoneOption } from "@/admin/lib/phone";

interface CountryPhoneInputProps {
  countryIso: string;
  onCountryChange: (countryIso: string) => void;
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}

export function CountryPhoneInput({
  countryIso,
  onCountryChange,
  value,
  onValueChange,
  name,
  placeholder,
  autoComplete,
  required,
}: CountryPhoneInputProps) {
  const selectedCountry = getCountryPhoneOption(countryIso);

  return (
    <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-2">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-sm text-primary">
          +{selectedCountry.dialCode}
        </span>
        <select
          value={selectedCountry.isoCode}
          onChange={(event) => onCountryChange(event.target.value)}
          className="h-12 w-full appearance-none border border-[color:color-mix(in_srgb,var(--border)_22%,transparent)] bg-[var(--surface-low)] pl-2 pr-7 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-transparent outline-none transition focus:border-secondary"
          aria-label="Country code"
        >
          {COUNTRY_PHONE_OPTIONS.map((option) => (
            <option key={option.isoCode} value={option.isoCode} className="text-primary">
              {option.isoCode}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </span>
      </div>

      <input
        name={name}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="h-12 min-w-0 w-full border border-[color:color-mix(in_srgb,var(--border)_22%,transparent)] bg-[var(--surface-low)] px-4 text-sm text-primary outline-none transition focus:border-secondary"
      />
    </div>
  );
}
