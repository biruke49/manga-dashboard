"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { apiRequest, ApiError, hasStoredPermission } from "@/admin/lib/api";
import { ActionButton } from "@/admin/components/ui/action-button";
import { DataTable } from "@/admin/components/ui/data-table";
import { EmptyState } from "@/admin/components/ui/empty-state";
import { Modal } from "@/admin/components/ui/modal";
import { Pagination } from "@/admin/components/ui/pagination";
import { SearchInput } from "@/admin/components/ui/search-input";
import { StatCard } from "@/admin/components/ui/stat-card";
import { StatusBadge } from "@/admin/components/ui/status-badge";
import { ToastItem, ToastViewport } from "@/admin/components/ui/toast";
import { EditIcon, PlusIcon, ShieldIcon, TrashIcon } from "@/admin/lib/icons";

interface CollectionResponse<T> {
  data?: T[];
  count?: number;
}

interface RoleItem {
  id: string;
  name: string;
  key: string;
  protected?: boolean;
}

interface PermissionItem {
  id: string;
  name: string;
  key: string;
}

type ModalState =
  | { type: "create" }
  | { type: "edit"; role: RoleItem }
  | { type: "permissions"; role: RoleItem }
  | { type: "archive"; role: RoleItem }
  | null;

function initialRoleForm() {
  return {
    name: "",
    key: "",
    protected: false,
    permissions: [] as string[],
    archiveReason: "",
  };
}

export default function Page() {
  const canManageRoles = hasStoredPermission("manage-roles");
  const canManagePermissions = hasStoredPermission("manage-permissions");
  const [query, setQuery] = useState("");
  const [modalState, setModalState] = useState<ModalState>(null);
  const [roleForm, setRoleForm] = useState(initialRoleForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadInitialData();
  }, []);

  const filteredRoles = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return roles.filter((role) => normalized.length === 0 || role.name.toLowerCase().includes(normalized) || role.key.toLowerCase().includes(normalized));
  }, [query, roles]);

  function pushToast(tone: ToastItem["tone"], title: string, message: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, title, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  }

  function openCreateRole() {
    setRoleForm(initialRoleForm());
    setFormError(null);
    setModalState({ type: "create" });
  }

  function openEditRole(role: RoleItem) {
    setRoleForm({
      ...initialRoleForm(),
      name: role.name,
      key: role.key,
      protected: Boolean(role.protected),
    });
    setFormError(null);
    setModalState({ type: "edit", role });
  }

  async function openManagePermissions(role: RoleItem) {
    try {
      const response = await apiRequest<CollectionResponse<PermissionItem>>(`/roles/get-role-permissions/${role.id}`);
      setRoleForm({
        ...initialRoleForm(),
        permissions: (response.data || []).map((permission) => permission.id),
      });
      setModalState({ type: "permissions", role });
    } catch (error) {
      pushToast("error", "Permissions Unavailable", getErrorMessage(error, "Unable to load role permissions."));
    }
  }

  function handleSaveRole() {
    if (modalState?.type !== "create" && modalState?.type !== "edit") {
      return;
    }

    const name = roleForm.name.trim();
    const key = roleForm.key.trim();

    if (!name || !key) {
      setFormError("Role name and key are required.");
      return;
    }

    startTransition(async () => {
      try {
        const isEdit = modalState.type === "edit";
        await apiRequest(isEdit ? "/roles/update-role" : "/roles/create-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: isEdit ? modalState.role.id : undefined,
            name,
            key,
            protected: roleForm.protected,
          }),
        });

        pushToast("success", isEdit ? "Role Updated" : "Role Created", `${name} was saved.`);
        setModalState(null);
        await loadInitialData();
      } catch (error) {
        pushToast("error", "Save Failed", getErrorMessage(error, "Unable to save role."));
      }
    });
  }

  function handleSavePermissions() {
    if (modalState?.type !== "permissions") {
      return;
    }

    startTransition(async () => {
      try {
        const currentResponse = await apiRequest<CollectionResponse<PermissionItem>>(`/roles/get-role-permissions/${modalState.role.id}`);
        const currentPermissionIds = (currentResponse.data || []).map((permission) => permission.id);
        const removedPermissionIds = currentPermissionIds.filter((permissionId) => !roleForm.permissions.includes(permissionId));
        const addedPermissionIds = roleForm.permissions.filter((permissionId) => !currentPermissionIds.includes(permissionId));

        await Promise.all(
          removedPermissionIds.map((permissionId) =>
            apiRequest("/roles/remove-role-permission", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roleId: modalState.role.id, permissionId }),
            }),
          ),
        );

        if (addedPermissionIds.length > 0) {
          await apiRequest("/roles/add-role-permission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleId: modalState.role.id, permissions: roleForm.permissions }),
          });
        }

        pushToast("success", "Permissions Updated", `${modalState.role.name} permissions were updated.`);
        setModalState(null);
        await loadInitialData();
      } catch (error) {
        pushToast("error", "Save Failed", getErrorMessage(error, "Unable to update role permissions."));
      }
    });
  }

  function handleArchiveRole() {
    if (modalState?.type !== "archive") {
      return;
    }

    if (modalState.role.protected) {
      pushToast("warning", "Protected Role", "Protected roles cannot be archived from the dashboard.");
      return;
    }

    startTransition(async () => {
      try {
        await apiRequest("/roles/archive-role", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: modalState.role.id,
            reason: roleForm.archiveReason.trim() || "Archived from dashboard",
          }),
        });

        pushToast("warning", "Role Archived", `${modalState.role.name} was archived.`);
        setModalState(null);
        await loadInitialData();
      } catch (error) {
        pushToast("error", "Archive Failed", getErrorMessage(error, "Unable to archive role."));
      }
    });
  }

  return (
    <div>
      <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <section className="mb-6 grid gap-px border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] md:grid-cols-3">
        <StatCard label="Total Roles" value={String(roles.length)} tone="default" />
        <StatCard label="Active Roles" value={String(roles.length)} tone="secondary" />
        <StatCard label="Archived Roles" value={String(archivedCount)} tone="error" />
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-[280px]">
          <SearchInput placeholder="SEARCH ROLES..." value={query} onChange={setQuery} />
        </div>
        {canManageRoles ? (
          <ActionButton onClick={openCreateRole} disabled={isPending}>
            <PlusIcon className="h-4 w-4" />
            New Role
          </ActionButton>
        ) : null}
      </div>

      <section className="overflow-hidden border border-[color:color-mix(in_srgb,var(--border)_20%,transparent)] bg-white">
        <DataTable columns={["Role", "Key", "Protection", "Permissions", "Status", "Actions"]}>
          {isLoading ? (
            <TableMessage colSpan={6} message="Loading roles..." />
          ) : errorMessage ? (
            <tr>
              <td colSpan={6} className="px-6 py-10">
                <EmptyState title="Roles unavailable" description={errorMessage} />
              </td>
            </tr>
          ) : filteredRoles.length > 0 ? (
            filteredRoles.map((role) => (
              <tr key={role.id} className="admin-table-row">
                <td className="px-4 py-3 text-sm font-semibold text-primary">{role.name}</td>
                <td className="px-4 py-3 text-[12px] text-muted-foreground">{role.key}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={role.protected ? "Protected" : "Editable"} tone={role.protected ? "primary" : "muted"} />
                </td>
                <td className="px-4 py-3 text-[12px] text-muted-foreground">{permissions.length > 0 ? "Manage assigned permissions" : "No permissions available"}</td>
                <td className="px-4 py-3">
                  <StatusBadge label="Active" tone="secondary" />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center justify-center gap-1">
                    {canManagePermissions ? (
                      <IconButton label={`Manage permissions for ${role.name}`} onClick={() => void openManagePermissions(role)}>
                        <ShieldIcon className="h-4 w-4" />
                      </IconButton>
                    ) : null}
                    {canManageRoles ? (
                      <IconButton label={`Edit ${role.name}`} onClick={() => openEditRole(role)}>
                        <EditIcon className="h-4 w-4" />
                      </IconButton>
                    ) : null}
                    {canManageRoles && !role.protected ? (
                      <IconButton
                        label={`Archive ${role.name}`}
                        tone="danger"
                        onClick={() => {
                          setRoleForm(initialRoleForm());
                          setModalState({ type: "archive", role });
                        }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-10">
                <EmptyState title="No roles yet" description="Create a role, then attach the permissions it should grant." />
              </td>
            </tr>
          )}
        </DataTable>
        <Pagination summary={`Displaying 1 - ${filteredRoles.length} of ${roles.length} roles`} />
      </section>

      <Modal
        open={modalState?.type === "create" || modalState?.type === "edit"}
        title={modalState?.type === "edit" ? "Edit Role" : "Create Role"}
        onClose={() => setModalState(null)}
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton tone="secondary" onClick={() => setModalState(null)} disabled={isPending}>
              Cancel
            </ActionButton>
            <ActionButton onClick={handleSaveRole} disabled={isPending}>
              {isPending ? "Saving..." : "Save Role"}
            </ActionButton>
          </div>
        }
      >
        <div className="mt-5 grid gap-4">
          {formError ? <div className="border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{formError}</div> : null}
          <Field label="Role Name">
            <input value={roleForm.name} onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))} className="fleet-input" />
          </Field>
          <Field label="Role Key">
            <input value={roleForm.key} onChange={(event) => setRoleForm((current) => ({ ...current, key: normalizeRoleKey(event.target.value) }))} className="fleet-input" />
          </Field>
          <label className="flex items-center justify-between gap-4 border border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] bg-[var(--surface-low)] px-3 py-3">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Protected Role</span>
            <input type="checkbox" checked={roleForm.protected} onChange={(event) => setRoleForm((current) => ({ ...current, protected: event.target.checked }))} className="h-5 w-5" />
          </label>
        </div>
      </Modal>

      <Modal
        open={modalState?.type === "permissions"}
        title="Manage Permissions"
        onClose={() => setModalState(null)}
        panelClassName="max-w-5xl"
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
        <div className="mt-5 max-h-[60vh] overflow-y-auto pr-1">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Permissions</p>
          <div className="grid gap-3 md:grid-cols-3">
            {permissions.map((permission) => {
              const selected = roleForm.permissions.includes(permission.id);

              return (
                <label key={permission.id} className={selected ? "border border-primary bg-[var(--surface-low)] p-4" : "border border-[color:color-mix(in_srgb,var(--border)_18%,transparent)] p-4"}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">{permission.name}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{permission.key}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        setRoleForm((current) => ({
                          ...current,
                          permissions: selected
                            ? current.permissions.filter((item) => item !== permission.id)
                            : [...current.permissions, permission.id],
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
      </Modal>

      <Modal
        open={modalState?.type === "archive"}
        title="Archive Role"
        tone="danger"
        onClose={() => setModalState(null)}
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton tone="secondary" onClick={() => setModalState(null)} disabled={isPending}>
              Cancel
            </ActionButton>
            <ActionButton onClick={handleArchiveRole} disabled={isPending}>
              {isPending ? "Archiving..." : "Archive"}
            </ActionButton>
          </div>
        }
      >
        <div className="mt-5">
          <p className="text-sm leading-6 text-muted-foreground">
            {modalState?.type === "archive" ? `Archive ${modalState.role.name}? Existing account assignments may be affected.` : ""}
          </p>
          <div className="mt-4">
            <Field label="Reason">
              <input value={roleForm.archiveReason} onChange={(event) => setRoleForm((current) => ({ ...current, archiveReason: event.target.value }))} className="fleet-input" placeholder="No longer used" />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );

  async function loadInitialData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [roleResponse, permissionResponse, archivedRoleResponse] = await Promise.all([
        apiRequest<CollectionResponse<RoleItem>>("/roles/get-roles"),
        apiRequest<CollectionResponse<PermissionItem>>("/permissions/get-permissions"),
        apiRequest<CollectionResponse<RoleItem>>("/roles/get-archived-roles").catch(() => ({ data: [], count: 0 })),
      ]);

      setRoles(roleResponse.data || []);
      setPermissions(permissionResponse.data || []);
      setArchivedCount(archivedRoleResponse.count ?? archivedRoleResponse.data?.length ?? 0);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load roles."));
    } finally {
      setIsLoading(false);
    }
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

function IconButton({
  label,
  children,
  onClick,
  tone = "default",
}: {
  label: string;
  children: React.ReactNode;
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
      <td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}

function normalizeRoleKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
