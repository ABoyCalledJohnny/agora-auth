"use client";

import type { UserWithRolesAndProfile } from "@/src/db/schema/index.ts";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { type Column, DataTable } from "@/src/components/table/DataTable.tsx";
import { Pagination } from "@/src/components/table/Pagination.tsx";
import { Avatar } from "@/src/components/ui/Avatar.tsx";
import { Button } from "@/src/components/ui/Button.tsx";
import { Modal } from "@/src/components/ui/Modal.tsx";
import { RolePill, StatusPill } from "@/src/components/ui/Pill.tsx";
import { ROLE_HIERARCHY } from "@/src/config/constants.ts";
import { useAdminUsers } from "@/src/features/admin/hooks/useAdminUsers.ts";
import { useDeleteUser } from "@/src/features/admin/hooks/useDeleteUser.ts";
import { useUpdateUserStatus } from "@/src/features/admin/hooks/useUpdateUserStatus.ts";

type AdminAction = "suspend" | "activate" | "delete";

type AdminUsersTableProps = {
  users: UserWithRolesAndProfile[];
  total: number;
  page: number;
  limit: number;
};

export function AdminUsersTable({ users, total, page, limit }: AdminUsersTableProps) {
  // Hooks
  const t = useTranslations("Admin.Users");
  const tPagination = useTranslations("Admin.Users.Pagination");
  const format = useFormatter();

  // State
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: AdminAction;
    userId: string;
    username: string;
  } | null>(null);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);

  // Custom hooks
  const { setPage } = useAdminUsers();
  const { updateStatus, isPending: isStatusPending } = useUpdateUserStatus();
  const { deleteUser, isPending: isDeletePending } = useDeleteUser();

  // Vars and constants
  const totalPages = Math.ceil(total / limit);

  // Modal functions
  function openModal(type: AdminAction, userId: string, username: string) {
    setPendingAction({ type, userId, username });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setPendingAction(null);
  }

  // Handles the admin actions and closes the modal again.
  function confirmAction() {
    if (!pendingAction) return;

    const { type, userId, username } = pendingAction;

    if (type === "delete") {
      deleteUser(userId, {
        onSuccess: () => toast.success(t("deleteSuccess", { username })),
        onError: () => toast.error(t("deleteError", { username })),
      });
    } else {
      const status = type === "suspend" ? "suspended" : "active";
      const successKey = type === "suspend" ? "suspendSuccess" : "activateSuccess";
      updateStatus(userId, status, {
        onSuccess: () => {
          toast.success(t(successKey, { username }));
          setHighlightedUserId(userId);
        },
        onError: () => toast.error(t("statusUpdateError", { username })),
      });
    }

    closeModal();
  }

  const columns: Column<UserWithRolesAndProfile>[] = [
    {
      key: "avatar",
      header: "",
      className: "w-12",
      render: (user) => <Avatar src={user.profile.avatarUrl} alt={user.username} size="sm" />,
    },
    {
      key: "id",
      header: "ID",
      className: "w-56 max-w-56",
      render: (user) => (
        <span className="block truncate" title={user.publicId}>
          {user.publicId}
        </span>
      ),
    },
    {
      key: "username",
      header: t("columnUsername"),
      className: "min-w-30",
      render: (user) => (
        <span className="block truncate" title={user.username}>
          {user.username}
        </span>
      ),
    },
    {
      key: "email",
      header: t("columnEmail"),
      className: "min-w-44",
      render: (user) => (
        <span className="block truncate" title={user.email}>
          {user.email}
        </span>
      ),
    },
    {
      key: "role",
      header: t("columnRole"),
      className: "w-24",
      render: (user) => {
        const highest = user.roles
          .map((r) => r.role.name)
          .sort((a, b) => (ROLE_HIERARCHY[b] ?? 0) - (ROLE_HIERARCHY[a] ?? 0))[0];
        return highest ? <RolePill variant={highest} className="min-w-18 py-0.5" /> : null;
      },
    },
    {
      key: "status",
      header: t("columnStatus"),
      className: "w-24",
      render: (user) => <StatusPill variant={user.status} className="min-w-21 py-0.5" />,
    },
    {
      key: "createdAt",
      header: t("columnCreated"),
      render: (user) => format.dateTime(user.createdAt, { dateStyle: "medium" }),
      className: "w-28",
    },
    {
      key: "lastSignInAt",
      header: t("columnLastLogin"),
      render: (user) =>
        user.lastSignInAt ? (
          format.dateTime(user.lastSignInAt, { dateStyle: "medium" })
        ) : (
          <span className="block text-center">-</span>
        ),
      className: "w-28",
    },
    {
      key: "actions",
      header: "",
      render: (user) => (
        <div className="flex justify-end gap-1.5">
          {user.status === "active" ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openModal("suspend", user.id, user.username)}
              className="min-w-20"
            >
              {t("actionSuspend")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openModal("activate", user.id, user.username)}
              className="min-w-20"
            >
              {t("actionActivate")}
            </Button>
          )}
          <Button
            variant="danger-outline"
            size="sm"
            onClick={() => openModal("delete", user.id, user.username)}
            className="min-w-18"
          >
            {t("actionDelete")}
          </Button>
        </div>
      ),
      className: "w-46",
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={users}
        keyExtractor={(user) => user.id}
        rowClassName={(user) => (user.id === highlightedUserId ? "animate-[row-flash_1.5s_ease-out]" : undefined)}
        onRowAnimationEnd={() => setHighlightedUserId(null)}
        emptyState={t("emptyState")}
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        labels={{
          first: tPagination("first"),
          previous: tPagination("previous"),
          next: tPagination("next"),
          last: tPagination("last"),
          pageOf: tPagination("pageOf", { page, total: totalPages }),
        }}
      />
      <Modal
        open={showModal}
        onClose={closeModal}
        title={
          pendingAction?.type === "delete"
            ? t("confirmDeleteTitle")
            : pendingAction?.type === "suspend"
              ? t("confirmSuspendTitle")
              : t("confirmActivateTitle")
        }
      >
        <p>
          {pendingAction?.type === "delete"
            ? t.rich("confirmDeleteMessage", {
                username: pendingAction.username,
                bold: (chunks) => <strong>{chunks}</strong>,
              })
            : pendingAction?.type === "suspend"
              ? t.rich("confirmSuspendMessage", {
                  username: pendingAction.username,
                  bold: (chunks) => <strong>{chunks}</strong>,
                })
              : t.rich("confirmActivateMessage", {
                  username: pendingAction?.username ?? "",
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={closeModal}>
            {t("actionCancel")}
          </Button>
          <Button
            variant={pendingAction?.type === "delete" ? "danger" : "primary"}
            onClick={confirmAction}
            disabled={isStatusPending || isDeletePending}
          >
            {t("actionConfirm")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
