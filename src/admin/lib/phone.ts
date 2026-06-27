"use client";

export interface CountryPhoneOption {
  isoCode: string;
  label: string;
  dialCode: string;
  trunkPrefix?: string;
  minNationalLength: number;
  maxNationalLength: number;
}

export const COUNTRY_PHONE_OPTIONS: CountryPhoneOption[] = [
  { isoCode: "ET", label: "Ethiopia", dialCode: "251", trunkPrefix: "0", minNationalLength: 9, maxNationalLength: 9 },
  { isoCode: "US", label: "United States", dialCode: "1", minNationalLength: 10, maxNationalLength: 10 },
  { isoCode: "CA", label: "Canada", dialCode: "1", minNationalLength: 10, maxNationalLength: 10 },
  { isoCode: "GB", label: "United Kingdom", dialCode: "44", trunkPrefix: "0", minNationalLength: 10, maxNationalLength: 10 },
  { isoCode: "KE", label: "Kenya", dialCode: "254", trunkPrefix: "0", minNationalLength: 9, maxNationalLength: 9 },
  { isoCode: "NG", label: "Nigeria", dialCode: "234", trunkPrefix: "0", minNationalLength: 10, maxNationalLength: 10 },
  { isoCode: "ZA", label: "South Africa", dialCode: "27", trunkPrefix: "0", minNationalLength: 9, maxNationalLength: 9 },
  { isoCode: "IN", label: "India", dialCode: "91", trunkPrefix: "0", minNationalLength: 10, maxNationalLength: 10 },
  { isoCode: "AE", label: "United Arab Emirates", dialCode: "971", trunkPrefix: "0", minNationalLength: 9, maxNationalLength: 9 },
];

const DEFAULT_COUNTRY_ISO = "US";

function getDigits(value: string) {
  return value.replace(/\D/g, "");
}

function stripInternationalPrefix(digits: string) {
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

function stripNationalTrunkPrefix(digits: string, trunkPrefix?: string) {
  if (!trunkPrefix) {
    return digits;
  }

  return digits.startsWith(trunkPrefix) ? digits.slice(trunkPrefix.length) : digits;
}

export function getCountryPhoneOption(isoCode?: string | null) {
  return (
    COUNTRY_PHONE_OPTIONS.find((option) => option.isoCode === isoCode) ||
    COUNTRY_PHONE_OPTIONS.find((option) => option.isoCode === DEFAULT_COUNTRY_ISO) ||
    COUNTRY_PHONE_OPTIONS[0]
  );
}

export function getPreferredCountryIso() {
  if (typeof window === "undefined") {
    return DEFAULT_COUNTRY_ISO;
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localeCandidates = [...(navigator.languages || []), navigator.language].filter(Boolean);
  const localeCountry = localeCandidates
    .map((locale) => locale.split("-")[1]?.toUpperCase())
    .find((region) => region && COUNTRY_PHONE_OPTIONS.some((option) => option.isoCode === region));

  if (localeCountry) {
    return localeCountry;
  }

  if (timezone === "Africa/Addis_Ababa") {
    return "ET";
  }

  if (timezone.startsWith("Africa/Nairobi")) {
    return "KE";
  }

  if (timezone.startsWith("Europe/London")) {
    return "GB";
  }

  if (timezone.startsWith("America/")) {
    return "US";
  }

  return DEFAULT_COUNTRY_ISO;
}

export function inferCountryIsoFromPhoneNumber(value: string) {
  const digits = stripInternationalPrefix(getDigits(value));
  const sortedOptions = [...COUNTRY_PHONE_OPTIONS].sort((left, right) => right.dialCode.length - left.dialCode.length);

  return sortedOptions.find((option) => digits.startsWith(option.dialCode))?.isoCode || null;
}

export function normalizePhoneNumber(value: string, countryIso?: string | null) {
  const digits = stripInternationalPrefix(getDigits(value));
  const country = getCountryPhoneOption(countryIso);

  if (!digits) {
    return "";
  }

  if (digits.startsWith(country.dialCode)) {
    const nationalDigits = stripNationalTrunkPrefix(
      digits.slice(country.dialCode.length),
      country.trunkPrefix,
    );
    return `+${country.dialCode}${nationalDigits}`;
  }

  if (country.trunkPrefix && digits.startsWith(country.trunkPrefix)) {
    return `+${country.dialCode}${digits.slice(country.trunkPrefix.length)}`;
  }

  return `+${country.dialCode}${digits}`;
}

export function getNationalPhoneNumber(value: string, fallbackCountryIso?: string | null) {
  const digits = stripInternationalPrefix(getDigits(value));

  if (!digits) {
    return "";
  }

  const country = getCountryPhoneOption(inferCountryIsoFromPhoneNumber(value) || fallbackCountryIso);

  if (!digits.startsWith(country.dialCode)) {
    return value.trim();
  }

  const nationalDigits = stripNationalTrunkPrefix(
    digits.slice(country.dialCode.length),
    country.trunkPrefix,
  );
  return country.trunkPrefix ? `${country.trunkPrefix}${nationalDigits}` : nationalDigits;
}

export function isValidPhoneNumber(value: string, countryIso?: string | null) {
  const normalized = normalizePhoneNumber(value, countryIso);

  if (!normalized) {
    return false;
  }

  const country = getCountryPhoneOption(countryIso);
  const digits = normalized.replace(/\D/g, "");
  const nationalDigits = digits.startsWith(country.dialCode) ? digits.slice(country.dialCode.length) : digits;

  return nationalDigits.length >= country.minNationalLength && nationalDigits.length <= country.maxNationalLength;
}
