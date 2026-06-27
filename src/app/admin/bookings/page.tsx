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
import { TrashIcon } from "@/admin/lib/icons";
import { ApiError, apiRequest } from "@/admin/lib/api";

type VehicleStatus = "Available" | "Booked" | "In Service" | "Maintenance" | "Retired";
type BookingStatus = "Pending" | "Confirmed" | "Active" | "Completed" | "Cancelled";
type DriverStatus = "Active" | "Inactive";

interface Vehicle {
  id: string;
  name: string;
  plate: string;
  location?: string | null;
  status: VehicleStatus;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
}

interface Booking {
  id: string;
  driverName: string;
  phone: string;
  driverId?: string | null;
  driver?: Driver | null;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  startDate: string;
  durationWeeks: number;
  status: BookingStatus;
  notes?: string | null;
  createdAt: string;
}

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
}

type BookingModalState = { type: "delete"; booking: Booking } | null;

const bookingStatuses: BookingStatus[] = ["Pending", "Confirmed", "Active", "Completed", "Cancelled"];

const emptyBookingForm = {
  driverId: "",
  vehicleId: "",
  startDate: "",
  durationWeeks: 1,
  notes: "",
};

export default function BookingsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);
  const [bookingModal, setBookingModal] = useState<BookingModalState>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadBookings();
  }, []);

  const assignableVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === "Available" || vehicle.status === "Booked"),
    [vehicles],
  );
  const activeDrivers = useMemo(() => drivers.filter((driver) => driver.status === "Active"), [drivers]);
  const activeBookings = bookings.filter((booking) => ["Pending", "Confirmed", "Active"].includes(booking.status)).length;
  const publicApplications = bookings.filter((booking) => !booking.driverId).length;

  function pushToast(tone: ToastItem["tone"], title: string, message: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, title, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  }

  function createBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!bookingForm.driverId || !bookingForm.vehicleId || !bookingForm.startDate) {
      pushToast("warning", "Booking Incomplete", "Select a driver, vehicle, and start date.");
      return;
    }

    const selectedDriver = activeDrivers.find((driver) => driver.id === bookingForm.driverId);
    if (!selectedDriver) {
      pushToast("warning", "Driver Required", "Select an active registered driver.");
      return;
    }

    startTransition(async () => {
      try {
        await apiRequest<Booking>("/fleet/create-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverId: bookingForm.driverId,
            vehicleId: bookingForm.vehicleId,
            startDate: bookingForm.startDate,
            durationWeeks: Number(bookingForm.durationWeeks) || 1,
            notes: bookingForm.notes.trim() || undefined,
          }),
        });
        setBookingForm(emptyBookingForm);
        pushToast("success", "Booking Created", "Vehicle reservation is saved.");
        await loadBookings();
      } catch (error) {
        pushToast("error", "Booking Failed", getErrorMessage(error, "Unable to create booking."));
      }
    });
  }

  async function updateBookingStatus(bookingId: string, status: BookingStatus) {
    try {
      await apiRequest<Booking>("/fleet/update-booking-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, status }),
      });
      pushToast("success", "Booking Updated", `Booking marked ${status}.`);
      await loadBookings();
    } catch (error) {
      pushToast("error", "Status Failed", getErrorMessage(error, "Unable to update booking status."));
    }
  }

  function deleteBooking(booking: Booking) {
    startTransition(async () => {
      try {
        await apiRequest(`/fleet/delete-booking/${booking.id}`, { method: "DELETE" });
        setBookingModal(null);
        pushToast("warning", "Booking Deleted", `${booking.driverName}'s booking was removed.`);
        await loadBookings();
      } catch (error) {
        pushToast("error", "Delete Failed", getErrorMessage(error, "Unable to delete booking."));
      }
    });
  }

  async function loadBookings() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [vehiclesResponse, driversResponse, bookingsResponse] = await Promise.all([
        apiRequest<CollectionResponse<Vehicle>>(
          "/fleet/get-vehicles?orderBy[0][field]=createdAt&orderBy[0][direction]=ASC",
        ),
        apiRequest<CollectionResponse<Driver>>(
          "/fleet/get-drivers?orderBy[0][field]=name&orderBy[0][direction]=ASC",
        ),
        apiRequest<CollectionResponse<Booking>>(
          "/fleet/get-bookings?orderBy[0][field]=createdAt&orderBy[0][direction]=DESC&includes[0]=vehicle&includes[1]=driver",
        ),
      ]);
      setVehicles(vehiclesResponse.data || []);
      setDrivers(driversResponse.data || []);
      setBookings(bookingsResponse.data || []);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load bookings."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <section className="grid gap-px border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] sm:grid-cols-4">
        <StatCard label="Bookings" value={String(bookings.length)} />
        <StatCard label="Active Pipeline" value={String(activeBookings)} tone="secondary" />
        <StatCard label="Registered Drivers" value={String(activeDrivers.length)} />
        <StatCard label="Public Applications" value={String(publicApplications)} tone="primary" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="admin-panel bg-white">
          <div className="border-b border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] px-4 py-3 sm:px-5">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">Reservations</p>
            <h1 className="admin-headline mt-1 text-[1.6rem] text-primary">Bookings</h1>
          </div>

          {errorMessage ? (
            <div className="px-6 py-12">
              <EmptyState title="Bookings unavailable" description={errorMessage} />
            </div>
          ) : isLoading ? (
            <DataTable columns={["Driver", "Vehicle", "Start", "Term", "Status", "Actions"]}>
              <TableMessage colSpan={6} message="Loading bookings..." />
            </DataTable>
          ) : bookings.length ? (
            <DataTable columns={["Driver", "Vehicle", "Start", "Term", "Status", "Actions"]}>
              {bookings.map((booking) => (
                <tr key={booking.id} className="admin-table-row">
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-bold text-primary">{booking.driver?.name || booking.driverName}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{booking.driver?.phone || booking.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[12px] text-primary">{booking.vehicle?.name || "Unassigned vehicle"}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {[booking.vehicle?.plate || booking.vehicleId || "Application only", booking.vehicle?.location].filter(Boolean).join(" / ")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{formatDate(booking.startDate)}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{booking.durationWeeks} wk</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={booking.status} tone={getBookingTone(booking.status)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center justify-center gap-2">
                      <select
                        aria-label={`Set ${booking.driverName} booking status`}
                        value={booking.status}
                        onChange={(event) => void updateBookingStatus(booking.id, event.target.value as BookingStatus)}
                        className="h-9 min-w-36 border border-[color:color-mix(in_srgb,var(--border)_28%,transparent)] bg-white px-3 text-[11px] font-semibold text-primary outline-none transition focus:border-secondary"
                      >
                        {bookingStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      {booking.status !== "Cancelled" ? (
                        <ActionButton tone="secondary" className="h-9 px-3 py-0 text-[11px]" onClick={() => void updateBookingStatus(booking.id, "Cancelled")}>
                          Cancel
                        </ActionButton>
                      ) : null}
                      <IconButton label={`Delete ${booking.driverName} booking`} tone="danger" onClick={() => setBookingModal({ type: "delete", booking })}>
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <div className="px-6 py-12">
              <EmptyState title="No bookings yet" description="Create a booking after registering drivers, or review public applications as they arrive." />
            </div>
          )}
        </section>

        <form className="admin-panel bg-white p-5" onSubmit={createBooking}>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">New Booking</p>
          <h2 className="admin-headline mt-1 text-[1.5rem] text-primary">Book Vehicle</h2>
          <div className="mt-5 space-y-4">
            <Field label="Driver">
              <select value={bookingForm.driverId} onChange={(event) => setBookingForm((form) => ({ ...form, driverId: event.target.value }))} className="fleet-input">
                <option value="">Select registered driver</option>
                {activeDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} / {driver.phone}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vehicle">
              <select value={bookingForm.vehicleId} onChange={(event) => setBookingForm((form) => ({ ...form, vehicleId: event.target.value }))} className="fleet-input">
                <option value="">Select vehicle</option>
                {assignableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {[vehicle.name, vehicle.plate, vehicle.location, vehicle.status].filter(Boolean).join(" / ")}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date">
                <input type="date" value={bookingForm.startDate} onChange={(event) => setBookingForm((form) => ({ ...form, startDate: event.target.value }))} className="fleet-input" />
              </Field>
              <Field label="Weeks">
                <input type="number" min={1} max={52} value={bookingForm.durationWeeks} onChange={(event) => setBookingForm((form) => ({ ...form, durationWeeks: Number(event.target.value) }))} className="fleet-input" />
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={bookingForm.notes} onChange={(event) => setBookingForm((form) => ({ ...form, notes: event.target.value }))} className="fleet-input min-h-24 py-3" />
            </Field>
          </div>

          <ActionButton type="submit" className="mt-5 h-11 w-full" disabled={isPending}>
            Create Booking
          </ActionButton>
        </form>
      </section>

      <Modal
        open={bookingModal?.type === "delete"}
        title="Delete Booking"
        tone="danger"
        onClose={() => setBookingModal(null)}
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton tone="secondary" onClick={() => setBookingModal(null)} disabled={isPending}>Cancel</ActionButton>
            <ActionButton onClick={() => bookingModal?.type === "delete" ? deleteBooking(bookingModal.booking) : undefined} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </ActionButton>
          </div>
        }
      >
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          {bookingModal?.type === "delete" ? `Delete ${bookingModal.booking.driverName}'s booking?` : ""}
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

function getBookingTone(status: BookingStatus): "primary" | "secondary" | "muted" | "error" {
  if (status === "Completed") return "secondary";
  if (status === "Cancelled") return "error";
  if (status === "Pending") return "muted";
  return "primary";
}

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
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
