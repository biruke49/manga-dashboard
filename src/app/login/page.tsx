"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ApiError,
  clearAuthSession,
  login,
  setAuthSession,
} from "@/admin/lib/api";
import { CountryPhoneInput } from "@/admin/components/forms/country-phone-input";
import { ActionButton } from "@/admin/components/ui/action-button";
import { getPreferredCountryIso, isValidPhoneNumber, normalizePhoneNumber } from "@/admin/lib/phone";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [phoneCountryIso, setPhoneCountryIso] = useState(getPreferredCountryIso);
  const sessionExpired = searchParams.get("reason") === "expired";
  const [errorMessage, setErrorMessage] = useState<string | null>(sessionExpired ? "Your session expired. Please sign in again." : null);
  const [isPending, startTransition] = useTransition();
  const hasSensitiveParams = useMemo(
    () => searchParams.has("phoneNumber") || searchParams.has("password"),
    [searchParams],
  );

  useEffect(() => {
    if (sessionExpired) {
      clearAuthSession();
    }

    if (!hasSensitiveParams) {
      return;
    }

    const params = new URLSearchParams();
    if (sessionExpired) {
      params.set("reason", "expired");
    }

    const nextUrl = params.size ? `/login?${params.toString()}` : "/login";
    router.replace(nextUrl);
  }, [hasSensitiveParams, router, sessionExpired]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitLogin();
  }

  async function submitLogin() {
    setErrorMessage(null);
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber, phoneCountryIso);

    if (!phoneNumber.trim() || !password) {
      setErrorMessage("Phone number and password are required.");
      return;
    }

    if (!isValidPhoneNumber(phoneNumber, phoneCountryIso)) {
      setErrorMessage("Enter a valid phone number for the selected country.");
      return;
    }

    startTransition(async () => {
      try {
        clearAuthSession();
        const response = await login({
          phoneNumber: normalizedPhoneNumber,
          password,
          type: "employee",
        });

        if (!response?.accessToken || !response?.refreshToken || !response?.profile) {
          setErrorMessage("Login succeeded but the session payload was incomplete.");
          return;
        }

        setAuthSession(response);
        window.location.assign("/admin");
      } catch (error) {
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Unable to sign in. Please try again.",
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f5f1e8_0%,#ece6d8_45%,#f7f4ec_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center">
        <section className="w-full border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white p-8 shadow-[0_24px_60px_rgba(27,28,25,0.08)] sm:p-10 lg:p-14">
          <div className="mx-auto max-w-md">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-secondary">
              Sign In
            </p>
            <h2 className="mt-3 admin-headline text-3xl text-primary">
              Access Dashboard
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Use your employee phone number and password to continue.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} method="post" action="/login">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Phone Number
                </span>
                <CountryPhoneInput
                  name="phoneNumber"
                  countryIso={phoneCountryIso}
                  onCountryChange={setPhoneCountryIso}
                  value={phoneNumber}
                  onValueChange={setPhoneNumber}
                  placeholder="0913922700"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Password
                </span>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full border border-[color:color-mix(in_srgb,var(--border)_22%,transparent)] bg-[var(--surface-low)] px-4 text-sm text-primary outline-none transition focus:border-secondary"
                  autoComplete="current-password"
                  required
                />
              </label>

              {errorMessage ? (
                <div className="border-l-4 border-l-error bg-error/5 px-4 py-3 text-sm text-error">
                  {errorMessage}
                </div>
              ) : null}

              <ActionButton
                type="button"
                disabled={isPending}
                className="h-12 w-full"
                onClick={() => void submitLogin()}
              >
                {isPending ? "Signing In..." : "Sign In"}
              </ActionButton>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
