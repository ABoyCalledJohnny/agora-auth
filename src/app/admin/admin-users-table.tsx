"use client";

import type { FullUser } from "@/src/db/schema/index.ts";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { type Column, DataTable } from "@/src/components/table/DataTable.tsx";
import { Pagination } from "@/src/components/table/Pagination.tsx";
import { Avatar } from "@/src/components/ui/Avatar.tsx";
import { Button } from "@/src/components/ui/Button.tsx";
import { Modal } from "@/src/components/ui/Modal.tsx";
import { RolePill, StatusPill } from "@/src/components/ui/Pill.tsx";
import { ROLE_HIERARCHY } from "@/src/config/constants.ts";
import { DEFAULT_PREFERENCES, DEFAULT_PRIVACY_SETTINGS } from "@/src/config/constants.ts";

const MOCK_IDS = [
  "a3f8k2m9x7q1w4z6b5n0",
  "r8t3v6y1c2p5j7d9h4l0",
  "e7g2i5o9s1u4w8a3f6k0",
  "m9x2z5b8n1q4t7v0y3c6",
  "p5j8l1d4h7g0i3o6s9u2",
  "w4a7f0k3m6x9z2b5n8q1",
  "t7v0y3c6p9j2l5d8h1g4",
  "i3o6s9u2w5a8f1k4m7x0",
  "z2b5n8q1t4v7y0c3p6j9",
  "l5d8h1g4i7o0s3u6w9a2",
];

const MOCK_USERS: FullUser[] = Array.from({ length: 10 }, (_, i) => ({
  id: `uuid-${i + 1}`,
  publicId: MOCK_IDS[i]!,
  username: ["alice", "bob", "charlie", "diana", "erik", "fiona", "george", "hannah", "ivan", "julia"][i]!,
  email: `${["alice", "bob", "charlie", "diana", "erik", "fiona", "george", "hannah", "ivan", "julia"][i]}@example.com`,
  emailVerifiedAt: i < 8 ? new Date("2025-06-01") : null,
  status: i === 8 ? "pending" : i === 9 ? "suspended" : "active",
  createdAt: new Date(2025, 0 + i, 10 + i),
  updatedAt: new Date(2025, 0 + i, 15 + i),
  lastSignInAt: i < 7 ? new Date(2026, 3, 9 - i) : null,
  roles: [
    {
      role: {
        id: i === 0 ? "role-admin" : "role-user",
        name: i === 0 ? "admin" : "user",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      },
    },
  ],
  settings: {
    id: `settings-${i + 1}`,
    userId: `uuid-${i + 1}`,
    privacySettings: DEFAULT_PRIVACY_SETTINGS,
    preferences: DEFAULT_PREFERENCES,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  profile: {
    id: `profile-${i + 1}`,
    userId: `uuid-${i + 1}`,
    firstName: null,
    lastName: null,
    displayName: null,
    avatarUrl: i < 6 ? `https://i.pravatar.cc/150?u=${i + 1}` : null,
    tagline: null,
    bio: null,
    hobbies: null,
    websiteUrl: null,
    location: null,
    pronouns: null,
    socialLinks: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
}));

export function AdminUsersTable() {
  const t = useTranslations("Admin.Users");
  const tPagination = useTranslations("Admin.Users.Pagination");
  const format = useFormatter();
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 5;
  const totalPages = Math.ceil(MOCK_USERS.length / perPage);
  const paginatedRows = MOCK_USERS.slice((page - 1) * perPage, page * perPage);

  const columns: Column<FullUser>[] = [
    {
      key: "avatar",
      header: "",
      className: "w-12",
      render: (user) => <Avatar src={user.profile.avatarUrl} alt={user.username} size="sm" />,
    },
    {
      key: "id",
      header: "ID",
      className: "min-w-52",
      render: (user) => user.publicId,
    },
    {
      key: "username",
      header: t("columnUsername"),
      className: "min-w-22",
      render: (user) => user.username,
    },
    {
      key: "email",
      header: t("columnEmail"),
      className: "min-w-48",
      render: (user) => user.email,
    },
    {
      key: "role",
      header: t("columnRole"),
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
      render: (user) => <StatusPill variant={user.status} className="min-w-21 py-0.5" />,
    },
    {
      key: "createdAt",
      header: t("columnCreated"),
      render: (user) => format.dateTime(user.createdAt, { dateStyle: "medium" }),
      className: "min-w-28",
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
      className: "min-w-28",
    },
    {
      key: "actions",
      header: "",
      render: (user) => (
        <div className="flex gap-1.5">
          {user.status === "active" ? (
            <Button variant="secondary" size="sm" onClick={() => setShowModal(true)} className="min-w-20">
              {t("actionSuspend")}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowModal(true)} className="min-w-20">
              {t("actionActivate")}
            </Button>
          )}
          <Button variant="danger-outline" size="sm" onClick={() => setShowModal(true)} className="min-w-18">
            {t("actionDelete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} rows={paginatedRows} keyExtractor={(user) => user.id} emptyState={t("emptyState")} />
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        labels={{
          previous: tPagination("previous"),
          next: tPagination("next"),
          pageOf: tPagination("pageOf", { page, total: totalPages }),
        }}
      />
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Test modal">
        <p>This action cannot be undone.</p>
      </Modal>
    </>
  );
}
