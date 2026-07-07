"use client";

import type { ReactNode } from "react";

import { Button } from "./button";
import { Modal } from "./modal";

export function ConfirmDialog({
  cancelLabel = "ยกเลิก",
  children,
  confirmLabel = "ยืนยัน",
  loading = false,
  onCancel,
  onConfirm,
  open,
  title,
  variant = "danger",
}: {
  cancelLabel?: string;
  children: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  variant?: "danger" | "primary" | "success" | "warning";
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => undefined : onCancel}
      footer={
        <div className="flex justify-end gap-3">
          <Button disabled={loading} onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button disabled={loading} onClick={onConfirm} variant={variant}>
            {loading ? "กำลังทำงาน..." : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-sm leading-6 text-slate-600">{children}</div>
    </Modal>
  );
}
