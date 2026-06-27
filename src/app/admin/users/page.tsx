"use client";

import { useEffect, useEffectEvent, useMemo, useState, useTransition } from "react";
import { apiRequest, ApiError, hasStoredPermission } from "@/admin/lib/api";
import { DataTable } from "@/admin/components/ui/data-table";
import { EmptyState } from "@/admin/components/ui/empty-state";
import { Modal } from "@/admin/components/ui/modal";
import { Pagination } from "@/admin/components/ui/pagination";
import { ActionButton } from "@/admin/components/ui/action-button";
import { SearchInput } from "@/admin/components/ui/search-input";
import { StatCard } from "@/admin/components/ui/stat-card";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { ToastItem, ToastViewport } from "@/admin/components/ui/toast";
import { CountryPhoneInput } from "@/admin/components/forms/country-phone-input";
import { EditIcon, KeyIcon, PlusIcon, PowerIcon, ShieldIcon, TrashIcon } from "@/admin/lib/icons";
import {
  getNationalPhoneNumber,
  getPreferredCountryIso,
  inferCountryIsoFromPhoneNumber,
  isValidPhoneNumber,
  normalizePhoneNumber,
} from "@/admin/lib/phone";

const RECENT_ORDER_QUERY = "orderBy[0][field]=createdAt&orderBy[0][direction]=DESC";

function initialFormState() {
  return {
    name: "",
    email: "",
    phone: "",
    phoneCountryIso: getPreferredCountryIso(),
    password: "",
    gender: "male" as "male" | "female",
    roleIds: [] as string[],
  };
}

function initialPermissionForm() {
  return {
    roleId: "",
    permissionIds: [] as string[],
  };
}

interface EmployeeAddress {
  subCity?: string;
  woreda?: string;
  houseNumber?: string;
}

interface EmployeeEmergencyContact {
  name?: string;
  phoneNumber?: string;
  relationship?: string;
}

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  gender: "male" | "female";
  enabled: boolean;
  profileImageFilename?: string | null;
  minioProfileImage?: string | null;
  address?: EmployeeAddress | null;
  emergencyContact?: EmployeeEmergencyContact | null;
}

interface RoleItem {
  id: string;
  name: string;
  key: string;
}

interface PermissionItem {
  id: string;
  name: string;
  key: string;
}

interface AccountPermissionItem {
  id: string;
  accountId: string;
  permissionId: string;
  roleId: string;
}

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  roles: string[];
  roleIds: string[];
  lastActivity: string;
  initials?: string;
  avatar?: string;
  gender: "male" | "female";
}

type ModalState =
  | { type: "register" }
  | { type: "edit"; user: AdminUser }
  | { type: "permissions"; user: AdminUser }
  | { type: "delete"; user: AdminUser }
  | { type: "toggle-status"; user: AdminUser }
  | null;

export default function Page() {
  const pageSize = 5;
  const canViewUsers = hasStoredPermission(["manage-employees", "view-employees"]);
  const canManageUsers = hasStoredPermission("manage-employees");
  const canManageAccountRoles = hasStoredPermission("manage-account-roles");
  const canManageAccountPermissions = hasStoredPermission("manage-account-permissions");
  const canActivateUsers = hasStoredPermission("activate-or-block-users");
  const [query, setQuery] = useState("");
  const [modalState, setModalState] = useState<ModalState>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [permissionForm, setPermissionForm] = useState(initialPermissionForm);
  const [activeTab, setActiveTab] = useState<"details" | "roles">("details");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [accountPermissions, setAccountPermissions] = useState<AccountPermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        normalized.length === 0 ||
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized) ||
        user.phone.toLowerCase().includes(normalized) ||
        user.roles.some((role) => role.toLowerCase().includes(normalized));

      return matchesQuery;
    });
  }, [query, users]);

  const activeCount = users.filter((user) => user.status === "Active").length;
  const incidentCount = users.filter((user) => user.status === "Inactive").length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const displayStart = totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const displayEnd = totalUsers === 0 ? 0 : displayStart + users.length - 1;

  const loadInitialDataEvent = useEffectEvent(async () => {
    await loadInitialData();
  });

  useEffect(() => {
    void loadInitialDataEvent();
  }, []);

  function pushToast(tone: ToastItem["tone"], title: string, message: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, title, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  }

  function handlePageChange(page: number) {
    if (page === currentPage || page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
    setIsLoading(true);
    setErrorMessage(null);

    void loadUsers(roles, page).catch((error) => {
      setErrorMessage(getErrorMessage(error, "Unable to load users."));
    }).finally(() => {
      setIsLoading(false);
    });
  }

  function openRegisterModal() {
    setFormState(initialFormState());
    setFormError(null);
    setActiveTab("details");
    setModalState({ type: "register" });
  }

  async function openEditModal(user: AdminUser) {
    setFormState({
      name: user.name,
      email: user.email,
      phone: getNationalPhoneNumber(user.phone, inferCountryIsoFromPhoneNumber(user.phone) || getPreferredCountryIso()),
      phoneCountryIso: inferCountryIsoFromPhoneNumber(user.phone) || getPreferredCountryIso(),
      password: "",
      gender: user.gender,
      roleIds: user.roleIds,
    });
    setFormError(null);
    setActiveTab("details");

    try {
      const nextRoleIds = await loadUserRoleIds(user.id);
      setFormState((current) => ({ ...current, roleIds: nextRoleIds }));
      setModalState({ type: "edit", user: { ...user, roleIds: nextRoleIds, roles: mapRoleNames(nextRoleIds) } });
    } catch (error) {
      setModalState({ type: "edit", user });
      pushToast(
        "warning",
        "Roles Unavailable",
        getErrorMessage(error, "User details loaded, but roles could not be fetched."),
      );
    }
  }

  async function openPermissionsModal(user: AdminUser) {
    try {
      const [nextRoleIds, nextAccountPermissions] = await Promise.all([
        loadUserRoleIds(user.id),
        loadAccountPermissions(user.id),
      ]);

      const nextRoleId = nextRoleIds[0] || "";
      setAccountPermissions(nextAccountPermissions);
      setPermissionForm({
        roleId: nextRoleId,
        permissionIds: getPermissionIdsForRole(nextAccountPermissions, nextRoleId),
      });
      setModalState({
        type: "permissions",
        user: { ...user, roleIds: nextRoleIds, roles: mapRoleNames(nextRoleIds) },
      });
    } catch (error) {
      pushToast("error", "Permissions Unavailable", getErrorMessage(error, "Unable to load account permissions."));
    }
  }

  function handleSave() {
    const trimmedName = formState.name.trim();
    const trimmedEmail = formState.email.trim();
    const trimmedPhone = formState.phone.trim();
    const normalizedPhone = normalizePhoneNumber(trimmedPhone, formState.phoneCountryIso);

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setFormError("Name, work email, and phone are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError("Enter a valid work email address.");
      return;
    }

    if (!isValidPhoneNumber(trimmedPhone, formState.phoneCountryIso)) {
      setFormError("Enter a valid phone number for the selected country.");
      return;
    }

    if (modalState?.type === "register" && formState.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    const duplicateUser = users.some((user) => {
      if (modalState?.type === "edit" && user.id === modalState.user.id) {
        return false;
      }

      return (
        user.email.trim().toLowerCase() === trimmedEmail.toLowerCase() ||
        normalizePhoneNumber(
          user.phone,
          inferCountryIsoFromPhoneNumber(user.phone) || formState.phoneCountryIso,
        ) === normalizedPhone
      );
    });

    if (duplicateUser) {
      setFormError("Email or phone already exists for another loaded user.");
      return;
    }

    setFormError(null);

    startTransition(async () => {
      try {
        if (modalState?.type === "edit") {
          await updateUser(modalState.user);
          pushToast("info", "User Updated", `${formState.name} was updated successfully.`);
        } else {
          await createUser();
          pushToast("success", "User Added", `${formState.name} was added successfully.`);
        }

        setModalState(null);
        await loadUsers(roles, currentPage);
      } catch (error) {
        pushToast("error", "Save Failed", getErrorMessage(error, "Unable to save user changes."));
      }
    });
  }

  function handleDelete() {
    if (modalState?.type !== "delete") {
      return;
    }

    startTransition(async () => {
      try {
        await deleteUser(modalState.user);
        pushToast("warning", "User Deleted", `${modalState.user.name} was deleted successfully.`);
        setModalState(null);
        await loadUsers(roles, currentPage);
      } catch (error) {
        pushToast("error", "Delete Failed", getErrorMessage(error, "Unable to delete this user."));
      }
    });
  }

  function handleSavePermissions() {
    if (modalState?.type !== "permissions") {
      return;
    }

    if (!permissionForm.roleId) {
      pushToast("warning", "Role Required", "Assign a role to this user before updating account permissions.");
      return;
    }

    startTransition(async () => {
      try {
        const currentRolePermissions = accountPermissions.filter((item) => item.roleId === permissionForm.roleId);
        const currentRolePermissionIds = currentRolePermissions.map((item) => item.permissionId);
        const removedPermissions = currentRolePermissions.filter((item) => !permissionForm.permissionIds.includes(item.permissionId));
        const addedPermissionIds = permissionForm.permissionIds.filter((permissionId) => !currentRolePermissionIds.includes(permissionId));

        await Promise.all(
          removedPermissions.map((item) =>
            apiRequest("/accounts/remove-account-permission", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: item.id,
                accountId: item.accountId,
                roleId: item.roleId,
                permissionId: item.permissionId,
              }),
            }),
          ),
        );

        if (addedPermissionIds.length > 0) {
          await apiRequest("/accounts/add-account-permission", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accountId: modalState.user.id,
              roleId: permissionForm.roleId,
              permissions: permissionForm.permissionIds,
            }),
          });
        }

        pushToast("success", "Permissions Updated", `${modalState.user.name} account permissions were updated.`);
        setModalState(null);
        setPermissionForm(initialPermissionForm());
        setAccountPermissions([]);
      } catch (error) {
        pushToast("error", "Save Failed", getErrorMessage(error, "Unable to update account permissions."));
      }
    });
  }

  function handleConfirmToggleStatus() {
    if (modalState?.type !== "toggle-status") {
      return;
    }

    startTransition(async () => {
      try {
        await apiRequest(`/employees/activate-or-block-employee/${modalState.user.id}`, {
          method: "POST",
        });
        pushToast(
          modalState.user.status === "Inactive" ? "success" : "warning",
          modalState.user.status === "Inactive" ? "User Activated" : "User Deactivated",
          `${modalState.user.name} status was updated successfully.`,
        );
        setModalState(null);
        await loadUsers(roles, currentPage);
      } catch (error) {
        pushToast("error", "Status Update Failed", getErrorMessage(error, "Unable to update user status."));
      }
    });
  }

  return (
    <div>
      {!canViewUsers ? (
        <EmptyState title="Access denied" description="You do not have permission to view users." />
      ) : (
      <>
      <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <section className="mb-6 grid gap-px border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] md:grid-cols-3">
        <StatCard label="Total Users" value={String(users.length)} tone="default" />
        <StatCard label="Active Users" value={String(activeCount)} tone="secondary" />
        <StatCard label="Inactive Users" value={String(incidentCount)} tone="error" />
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-[280px]">
          <SearchInput placeholder="SEARCH USERS..." value={query} onChange={setQuery} />
        </div>
        {canManageUsers ? (
          <ActionButton onClick={openRegisterModal} disabled={isPending}>
            <PlusIcon className="h-4 w-4" />
            Register New User
          </ActionButton>
        ) : null}
      </div>

      <section className="overflow-hidden border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white">
        <DataTable columns={["User", "Email", "Phone", "Roles", "Status", "Actions"]}>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                Loading users...
              </td>
            </tr>
          ) : errorMessage ? (
            <tr>
              <td colSpan={6} className="px-6 py-10">
                <EmptyState
                  title="Users unavailable"
                  description={errorMessage}
                />
                <div className="mt-4 flex justify-center">
                  <ActionButton onClick={() => void loadInitialData()}>
                    Retry
                  </ActionButton>
                </div>
              </td>
            </tr>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <tr key={user.id} className="admin-table-row">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden border border-primary/10 bg-[var(--surface-high)] text-[9px] font-black uppercase text-primary">
                      {user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover grayscale" />
                      ) : (
                        <span>{user.initials ?? user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                      )}
                    </div>
                    <div>
                      <p className="admin-headline text-[1rem] leading-none text-primary">{user.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[10px] font-medium text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-[10px] font-medium text-muted-foreground">{user.phone}</td>
                <td className="px-4 py-3 text-[10px] font-medium text-muted-foreground">
                  {user.roles.length > 0 ? user.roles.join(", ") : "No roles"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={user.status} tone={user.status === "Active" ? "secondary" : "muted"} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center justify-center gap-1">
                    {canManageUsers ? (
                      <button onClick={() => void openEditModal(user)} disabled={isPending} className="p-1.5 text-primary transition hover:bg-[var(--surface-low)] disabled:opacity-50" aria-label={`Edit ${user.name}`} title="Edit user">
                        <EditIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                    {canManageAccountPermissions ? (
                      <button
                        onClick={() => void openPermissionsModal(user)}
                        disabled={isPending}
                        className="p-1.5 text-primary transition hover:bg-[var(--surface-low)] disabled:opacity-50"
                        aria-label={`Manage account permissions for ${user.name}`}
                        title="Manage account permissions"
                      >
                        <ShieldIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                    {canManageUsers ? (
                      <button
                        onClick={() => void handleResetPassword(user)}
                        disabled={isPending}
                        className="p-1.5 text-primary transition hover:bg-[var(--surface-low)] disabled:opacity-50"
                        aria-label={`Reset password for ${user.name}`}
                        title="Reset password"
                      >
                        <KeyIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                    {canActivateUsers ? (
                      <button
                        onClick={() => setModalState({ type: "toggle-status", user })}
                        disabled={isPending}
                        className="p-1.5 text-secondary transition hover:bg-[var(--surface-low)] disabled:opacity-50"
                        aria-label={`${user.status === "Inactive" ? "Activate" : "Deactivate"} ${user.name}`}
                        title={user.status === "Inactive" ? "Activate user" : "Deactivate user"}
                      >
                        <PowerIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                    {canManageUsers ? (
                      <button onClick={() => setModalState({ type: "delete", user })} disabled={isPending} className="p-1.5 text-error transition hover:bg-error/10 disabled:opacity-50" aria-label={`Delete ${user.name}`} title="Delete user">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-10">
                <EmptyState
                  title="No users yet"
                  description="Create the first operations user, then assign roles and permissions."
                />
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <p className="admin-headline text-xl text-primary">No matching users</p>
                <p className="mt-2 text-sm text-muted-foreground">Try a different search term.</p>
              </td>
            </tr>
          )}
        </DataTable>
        <Pagination
          summary={`Displaying ${displayStart} - ${displayEnd} of ${totalUsers} records`}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </section>

      <Modal
        open={modalState?.type === "register" || modalState?.type === "edit"}
        title={modalState?.type === "edit" ? "Edit User" : "Register New User"}
        description="Employee-backed user management wired to the backend."
        onClose={() => setModalState(null)}
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton tone="secondary" onClick={() => setModalState(null)} disabled={isPending}>
              Cancel
            </ActionButton>
            <ActionButton onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </ActionButton>
          </div>
        }
      >
        <div className="mb-4 flex gap-2 border-b border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={activeTab === "details" ? "border-b-2 border-primary px-1 pb-2 text-sm font-semibold text-primary" : "px-1 pb-2 text-sm text-muted-foreground"}
          >
            User Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("roles")}
            disabled={!canManageAccountRoles}
            className={activeTab === "roles" ? "border-b-2 border-primary px-1 pb-2 text-sm font-semibold text-primary" : "px-1 pb-2 text-sm text-muted-foreground"}
          >
            Role Management
          </button>
        </div>

        {formError ? (
          <div className="mb-4 border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {formError}
          </div>
        ) : null}

        {activeTab === "details" ? (
          <div className="grid gap-4 pt-2 md:grid-cols-2">
            <Field label="Full Name">
              <input value={formState.name} onChange={(event) => {
                setFormError(null);
                setFormState((current) => ({ ...current, name: event.target.value }));
              }} className="h-11 w-full bg-[var(--surface-low)] px-3 text-sm text-primary outline-none" placeholder="Elias Thorne" />
            </Field>
            <Field label="Work Email">
              <input value={formState.email} onChange={(event) => {
                setFormError(null);
                setFormState((current) => ({ ...current, email: event.target.value }));
              }} className="h-11 w-full bg-[var(--surface-low)] px-3 text-sm text-primary outline-none" placeholder="name@company.com" />
            </Field>
            <Field label="Phone">
              <CountryPhoneInput
                countryIso={formState.phoneCountryIso}
                onCountryChange={(countryIso) => {
                  setFormError(null);
                  setFormState((current) => ({ ...current, phoneCountryIso: countryIso }));
                }}
                value={formState.phone}
                onValueChange={(value) => {
                  setFormError(null);
                  setFormState((current) => ({ ...current, phone: value }));
                }}
                placeholder="0913922700"
              />
            </Field>
            {modalState?.type === "register" ? (
              <Field label="Password">
                <input
                  type="password"
                  value={formState.password}
                  onChange={(event) => {
                    setFormError(null);
                    setFormState((current) => ({ ...current, password: event.target.value }));
                  }}
                  className="h-11 w-full bg-[var(--surface-low)] px-3 text-sm text-primary outline-none"
                  placeholder="At least 6 characters"
                />
              </Field>
            ) : null}
            <Field label="Gender">
              <select value={formState.gender} onChange={(event) => setFormState((current) => ({ ...current, gender: event.target.value as "male" | "female" }))} className="h-11 w-full bg-[var(--surface-low)] px-3 text-sm text-primary outline-none">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Assign one or more seeded roles to this user using the existing account-role backend endpoints.</p>
            {!canManageAccountRoles ? (
              <p className="text-sm text-muted-foreground">You do not have permission to change account roles.</p>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              {roles.map((role) => {
                const selected = formState.roleIds.includes(role.id);

                return (
                  <label key={role.id} className={selected ? "border border-primary bg-[var(--surface-low)] p-4" : "border border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] p-4"}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{role.name}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">{role.key}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!canManageAccountRoles}
                        onChange={() => {
                          setFormError(null);
                          setFormState((current) => ({
                            ...current,
                            roleIds: selected ? current.roleIds.filter((item) => item !== role.id) : [...current.roleIds, role.id],
                          }));
                        }}
                        className="mt-1 h-4 w-4"
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={canManageAccountPermissions && modalState?.type === "permissions"}
        title="Account Permissions"
        description="Manage permissions for one assigned role at a time."
        onClose={() => setModalState(null)}
        panelClassName="max-w-5xl"
        bodyClassName="pt-6"
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton tone="secondary" onClick={() => setModalState(null)} disabled={isPending}>
              Cancel
            </ActionButton>
            <ActionButton onClick={handleSavePermissions} disabled={isPending}>
              {isPending ? "Saving..." : "Save Permissions"}
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-5">
          {modalState?.type === "permissions" && modalState.user.roleIds.length > 0 ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                <div className="space-y-4 border border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] bg-[var(--surface-low)] p-4">
                  <Field label="Role">
                    <select
                      value={permissionForm.roleId}
                      onChange={(event) =>
                        setPermissionForm({
                          roleId: event.target.value,
                          permissionIds: getPermissionIdsForRole(accountPermissions, event.target.value),
                        })
                      }
                      className="h-11 w-full bg-white px-3 text-sm text-primary outline-none"
                    >
                      {modalState.user.roleIds.map((roleId) => {
                        const role = roles.find((item) => item.id === roleId);
                        if (!role) {
                          return null;
                        }

                        return (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        );
                      })}
                    </select>
                  </Field>
                  <p className="text-sm text-muted-foreground">
                    Permissions below apply to the selected role for this account.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {permissionForm.permissionIds.length} permission override{permissionForm.permissionIds.length === 1 ? "" : "s"} selected.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">Permissions</p>
                      <p className="text-sm text-muted-foreground">Toggle only the overrides you want on this account.</p>
                    </div>
                  </div>

                  <div className="max-h-[52vh] overflow-y-auto pr-1">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {permissions.map((permission) => {
                  const selected = permissionForm.permissionIds.includes(permission.id);

                  return (
                    <label
                      key={permission.id}
                      className={selected ? "border border-primary bg-[var(--surface-low)] p-4" : "border border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] p-4"}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{permission.name}</p>
                          <p className="mt-1 text-[12px] text-muted-foreground">{permission.key}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            setPermissionForm((current) => ({
                              ...current,
                              permissionIds: selected
                                ? current.permissionIds.filter((item) => item !== permission.id)
                                : [...current.permissionIds, permission.id],
                            }))
                          }
                          className="mt-1 h-4 w-4"
                        />
                      </div>
                    </label>
                  );
                })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Assign a role to this user before managing account permissions.</p>
          )}
        </div>
      </Modal>

      <Modal
        open={modalState?.type === "delete"}
        title="Delete User"
        description="This is permanent."
        onClose={() => setModalState(null)}
        tone="danger"
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton tone="secondary" onClick={() => setModalState(null)} disabled={isPending}>
              Cancel
            </ActionButton>
            <ActionButton onClick={handleDelete} className="bg-error hover:bg-error/90" disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </ActionButton>
          </div>
        }
      >
        <div className="pt-2 text-sm text-muted-foreground">
          {modalState?.type === "delete" ? `Delete ${modalState.user.name}?` : ""}
        </div>
      </Modal>

      <Modal
        open={canActivateUsers && modalState?.type === "toggle-status"}
        title={modalState?.type === "toggle-status" && modalState.user.status === "Inactive" ? "Activate User" : "Deactivate User"}
        onClose={() => setModalState(null)}
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton tone="secondary" onClick={() => setModalState(null)} disabled={isPending}>
              Cancel
            </ActionButton>
            <ActionButton onClick={handleConfirmToggleStatus} disabled={isPending}>
              {isPending
                ? modalState?.type === "toggle-status" && modalState.user.status === "Inactive"
                  ? "Activating..."
                  : "Deactivating..."
                : modalState?.type === "toggle-status" && modalState.user.status === "Inactive"
                  ? "Activate"
                  : "Deactivate"}
            </ActionButton>
          </div>
        }
      >
        <div className="pt-2 text-sm text-muted-foreground">
          {modalState?.type === "toggle-status"
            ? `${modalState.user.status === "Inactive" ? "Activate" : "Deactivate"} ${modalState.user.name}?`
            : ""}
        </div>
      </Modal>
      </>
      )}
    </div>
  );

  async function loadInitialData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [nextRoles] = await Promise.all([loadRoles(), loadPermissions()]);
      await loadUsers(nextRoles, 1);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load users."));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUsers(availableRoles: RoleItem[] = roles, page = currentPage) {
    const skip = (page - 1) * pageSize;
    const response = await apiRequest<CollectionResponse<EmployeeItem>>(
      `/employees/get-employees?top=${pageSize}&skip=${skip}&${RECENT_ORDER_QUERY}`,
    );

    const nextUsers = await Promise.all(
      (response.data || []).map(async (employee) => {
        const roleIds = await loadUserRoleIds(employee.id).catch(() => []);
        return mapEmployeeToAdminUser(employee, roleIds, availableRoles);
      }),
    );

    const nextTotalUsers = response.count || 0;
    const nextTotalPages = Math.ceil(nextTotalUsers / pageSize);

    if (nextTotalPages === 0 && page !== 1) {
      setCurrentPage(1);
      return;
    }

    if (nextTotalPages > 0 && page > nextTotalPages) {
      setCurrentPage(nextTotalPages);
      return;
    }

    setUsers(nextUsers);
    setTotalUsers(nextTotalUsers);
  }

  async function loadRoles() {
    const response = await apiRequest<CollectionResponse<RoleItem>>(
      "/roles/get-roles",
    );

    const nextRoles = response.data || [];
    setRoles(nextRoles);
    return nextRoles;
  }

  async function loadPermissions() {
    const response = await apiRequest<CollectionResponse<PermissionItem>>(
      "/permissions/get-permissions",
    );

    const nextPermissions = response.data || [];
    setPermissions(nextPermissions);
    return nextPermissions;
  }

  async function loadUserRoleIds(accountId: string) {
    const response = await apiRequest<CollectionResponse<RoleItem>>(
      `/accounts/get-user-roles/${accountId}`,
    );

    return (response.data || []).map((role) => role.id);
  }

  async function loadAccountPermissions(accountId: string) {
    const response = await apiRequest<CollectionResponse<AccountPermissionItem>>(
      `/accounts/get-user-account-permissions/${accountId}`,
    );

    return response.data || [];
  }

  function mapRoleNames(roleIds: string[]) {
    return roleIds
      .map((roleId) => roles.find((role) => role.id === roleId)?.name)
      .filter(Boolean) as string[];
  }

  async function createUser() {
    const createPayload = {
      name: formState.name.trim(),
      email: formState.email.trim(),
      phoneNumber: normalizePhoneNumber(formState.phone.trim(), formState.phoneCountryIso),
      password: formState.password,
      gender: formState.gender,
      address: {},
      emergencyContact: {},
    };

    const created = await apiRequest<EmployeeItem>("/employees/create-employee", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });

    await syncRoles(created.id, [], formState.roleIds);
  }

  async function updateUser(user: AdminUser) {
    const updatePayload = {
      id: user.id,
      name: formState.name.trim(),
      email: formState.email.trim(),
      phoneNumber: normalizePhoneNumber(formState.phone.trim(), formState.phoneCountryIso),
      gender: formState.gender,
      address: {},
      emergencyContact: {},
    };

    await apiRequest("/employees/update-employee", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });

    await syncRoles(user.id, user.roleIds, formState.roleIds);
  }

  async function syncRoles(accountId: string, currentRoleIds: string[], nextRoleIds: string[]) {
    const removedRoleIds = currentRoleIds.filter((roleId) => !nextRoleIds.includes(roleId));
    const addedRoleIds = nextRoleIds.filter((roleId) => !currentRoleIds.includes(roleId));

    await Promise.all(
      removedRoleIds.map((roleId) =>
        apiRequest("/accounts/remove-account-role", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accountId, roleId }),
        }),
      ),
    );

    if (addedRoleIds.length > 0) {
      await apiRequest("/accounts/add-account-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId, roles: addedRoleIds }),
      });
    }
  }

  async function deleteUser(user: AdminUser) {
    await apiRequest(`/employees/delete-employee/${user.id}`, {
      method: "DELETE",
    });
  }

  async function handleResetPassword(user: AdminUser) {
    startTransition(async () => {
      try {
        await apiRequest(`/accounts/send-account-credentials/${user.id}`, {
          method: "DELETE",
        });
        pushToast("info", "Credentials Sent", `Reset credentials were sent for ${user.name}.`);
      } catch (error) {
        pushToast("error", "Reset Failed", getErrorMessage(error, "Unable to send reset credentials."));
      }
    });
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function getPermissionIdsForRole(accountPermissions: AccountPermissionItem[], roleId: string) {
  if (!roleId) {
    return [];
  }

  return accountPermissions
    .filter((item) => item.roleId === roleId)
    .map((item) => item.permissionId);
}

function mapEmployeeToAdminUser(employee: EmployeeItem, roleIds: string[], availableRoles: RoleItem[]): AdminUser {
  const initials = employee.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    phone: employee.phoneNumber,
    status: employee.enabled ? "Active" : "Inactive",
    roleIds,
    roles: roleIds
      .map((roleId) => availableRoles.find((role) => role.id === roleId)?.name)
      .filter(Boolean) as string[],
    lastActivity: "",
    initials,
    avatar: employee.minioProfileImage || undefined,
    gender: employee.gender || "male",
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
