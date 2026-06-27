"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ActionButton } from "@/admin/components/ui/action-button";
import { DataTable } from "@/admin/components/ui/data-table";
import { EmptyState } from "@/admin/components/ui/empty-state";
import { Modal } from "@/admin/components/ui/modal";
import { StatCard } from "@/admin/components/ui/stat-card";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { ToastItem, ToastViewport } from "@/admin/components/ui/toast";
import { EditIcon, PlusIcon, TrashIcon } from "@/admin/lib/icons";
import { ApiError, apiRequest } from "@/admin/lib/api";

type DriverStatus = "Active" | "Inactive";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  licenseNumber?: string | null;
  licenseImageFilenames?: string[] | null;
  licenseImageUrls?: string[];
  status: DriverStatus;
  notes?: string | null;
}

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
}

type ModalState =
  | { type: "create" }
  | { type: "edit"; driver: Driver }
  | { type: "delete"; driver: Driver }
  | null;

function emptyDriverForm() {
  return {
    name: "",
    phone: "",
    email: "",
    licenseNumber: "",
    status: "Active" as DriverStatus,
    notes: "",
  };
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverForm, setDriverForm] = useState(emptyDriverForm);
  const [selectedLicenseImages, setSelectedLicenseImages] = useState<File[]>([]);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadDrivers();
  }, []);

  const activeCount = useMemo(() => drivers.filter((driver) => driver.status === "Active").length, [drivers]);

  function pushToast(tone: ToastItem["tone"], title: string, message: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, title, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  }

  function openCreateDriver() {
    setDriverForm(emptyDriverForm());
    setSelectedLicenseImages([]);
    setModalState({ type: "create" });
  }

  function openEditDriver(driver: Driver) {
    setDriverForm({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || "",
      licenseNumber: driver.licenseNumber || "",
      status: driver.status,
      notes: driver.notes || "",
    });
    setSelectedLicenseImages([]);
    setModalState({ type: "edit", driver });
  }

  function submitDriver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!driverForm.name.trim() || !driverForm.phone.trim()) {
      pushToast("warning", "Driver Incomplete", "Name and phone are required.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name: driverForm.name.trim(),
          phone: driverForm.phone.trim(),
          email: driverForm.email.trim() || undefined,
          licenseNumber: driverForm.licenseNumber.trim() || undefined,
          status: driverForm.status,
          notes: driverForm.notes.trim() || undefined,
        };
        const isEdit = modalState?.type === "edit";

        const savedDriver = await apiRequest<Driver>(isEdit ? "/fleet/update-driver" : "/fleet/create-driver", {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEdit ? { id: modalState.driver.id, ...payload } : payload),
        });

        if (selectedLicenseImages.length) {
          const formData = new FormData();
          selectedLicenseImages.forEach((image) => formData.append("licenseImages", image));
          await apiRequest<Driver>(`/fleet/update-driver-license-images/${savedDriver.id}`, {
            method: "POST",
            body: formData,
          });
        }

        setModalState(null);
        setSelectedLicenseImages([]);
        pushToast("success", isEdit ? "Driver Updated" : "Driver Registered", `${payload.name} is saved.`);
        await loadDrivers();
      } catch (error) {
        pushToast("error", "Save Failed", getErrorMessage(error, "Unable to save driver."));
      }
    });
  }

  function deleteDriver(driver: Driver) {
    startTransition(async () => {
      try {
        await apiRequest(`/fleet/delete-driver/${driver.id}`, { method: "DELETE" });
        setModalState(null);
        pushToast("warning", "Driver Deleted", `${driver.name} was removed.`);
        await loadDrivers();
      } catch (error) {
        pushToast("error", "Delete Failed", getErrorMessage(error, "Unable to delete driver."));
      }
    });
  }

  async function loadDrivers() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiRequest<CollectionResponse<Driver>>(
        "/fleet/get-drivers?orderBy[0][field]=createdAt&orderBy[0][direction]=DESC",
      );
      setDrivers(response.data || []);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load drivers."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <section className="grid gap-px border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] sm:grid-cols-3">
        <StatCard label="Registered Drivers" value={String(drivers.length)} />
        <StatCard label="Active Drivers" value={String(activeCount)} tone="secondary" />
        <StatCard label="Inactive Drivers" value={String(drivers.length - activeCount)} tone="error" />
      </section>

      <section className="admin-panel bg-white">
        <div className="flex flex-col gap-3 border-b border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">Driver Registry</p>
            <h1 className="admin-headline mt-1 text-[1.6rem] text-primary">Drivers</h1>
          </div>
          <ActionButton onClick={openCreateDriver}>
            <PlusIcon className="h-4 w-4" />
            Driver
          </ActionButton>
        </div>

        {errorMessage ? (
          <div className="px-6 py-12">
            <EmptyState title="Drivers unavailable" description={errorMessage} />
          </div>
        ) : (
          <DataTable columns={["Driver", "Phone", "Email", "License", "Status", "Actions"]}>
            {isLoading ? (
              <TableMessage colSpan={6} message="Loading drivers..." />
            ) : drivers.length ? (
              drivers.map((driver) => (
                <tr key={driver.id} className="admin-table-row">
                  <td className="px-4 py-3 text-[12px] font-bold text-primary">{driver.name}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{driver.phone}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{driver.email || "Not set"}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{driver.licenseNumber || "Not set"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={driver.status} tone={driver.status === "Active" ? "secondary" : "muted"} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center justify-center gap-2">
                      <IconButton label={`Edit ${driver.name}`} onClick={() => openEditDriver(driver)}>
                        <EditIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton label={`Delete ${driver.name}`} tone="danger" onClick={() => setModalState({ type: "delete", driver })}>
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12">
                  <EmptyState title="No drivers yet" description="Register drivers here before creating dashboard bookings." />
                </td>
              </tr>
            )}
          </DataTable>
        )}
      </section>

      <Modal
        open={modalState?.type === "create" || modalState?.type === "edit"}
        title={modalState?.type === "edit" ? "Edit Driver" : "Register Driver"}
        onClose={() => setModalState(null)}
        panelClassName="max-w-3xl"
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton tone="secondary" onClick={() => setModalState(null)} disabled={isPending}>Cancel</ActionButton>
            <ActionButton form="driver-form" type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Driver"}</ActionButton>
          </div>
        }
      >
        <form id="driver-form" className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={submitDriver}>
          <Field label="Full Name">
            <input value={driverForm.name} onChange={(event) => setDriverForm((form) => ({ ...form, name: event.target.value }))} className="fleet-input" placeholder="Driver full name" />
          </Field>
          <Field label="Phone">
            <input value={driverForm.phone} onChange={(event) => setDriverForm((form) => ({ ...form, phone: event.target.value }))} className="fleet-input" placeholder="+251 913 922 700" />
          </Field>
          <Field label="Email">
            <input value={driverForm.email} onChange={(event) => setDriverForm((form) => ({ ...form, email: event.target.value }))} className="fleet-input" placeholder="driver@example.com" />
          </Field>
          <Field label="License Number">
            <input value={driverForm.licenseNumber} onChange={(event) => setDriverForm((form) => ({ ...form, licenseNumber: event.target.value }))} className="fleet-input" placeholder="DRV-1001" />
          </Field>
          <Field label="License Images">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setSelectedLicenseImages(Array.from(event.target.files || []))}
              className="fleet-input pt-2 text-[12px] file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em] file:text-primary-foreground"
            />
            <span className="mt-2 block text-[11px] text-muted-foreground">
              {selectedLicenseImages.length
                ? `${selectedLicenseImages.length} image${selectedLicenseImages.length === 1 ? "" : "s"} selected.`
                : modalState?.type === "edit" && modalState.driver.licenseImageFilenames?.length
                  ? `${modalState.driver.licenseImageFilenames.length} license image${modalState.driver.licenseImageFilenames.length === 1 ? "" : "s"} stored in documents.`
                  : "No license images selected."}
            </span>
          </Field>
          <Field label="Status">
            <select value={driverForm.status} onChange={(event) => setDriverForm((form) => ({ ...form, status: event.target.value as DriverStatus }))} className="fleet-input">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <textarea value={driverForm.notes} onChange={(event) => setDriverForm((form) => ({ ...form, notes: event.target.value }))} className="fleet-input min-h-28 py-3" />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={modalState?.type === "delete"}
        title="Delete Driver"
        tone="danger"
        onClose={() => setModalState(null)}
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton tone="secondary" onClick={() => setModalState(null)} disabled={isPending}>Cancel</ActionButton>
            <ActionButton onClick={() => modalState?.type === "delete" ? deleteDriver(modalState.driver) : undefined} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </ActionButton>
          </div>
        }
      >
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          {modalState?.type === "delete" ? `Delete ${modalState.driver.name}? Existing bookings will keep the original driver name and phone.` : ""}
        </p>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function IconButton({
  label,
  children,
  onClick,
  tone = "default",
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={tone === "danger" ? "p-1.5 text-error transition hover:bg-error/10" : "p-1.5 text-primary transition hover:bg-[var(--surface-low)]"}
    >
      {children}
    </button>
  );
}

function TableMessage({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
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
