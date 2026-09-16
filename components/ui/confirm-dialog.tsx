"use client";

import type { ReactNode } from "react";

import { Button } from "./button";
import { Modal } from "./modal";

export function ConfirmDialog({
  cancelLabel = "ยกเลิก",
  children,
  confirmLabel = "ยืนยัน",
  isLoading = false,
  onCancel,
  onConfirm,
  open,
  title,
  variant = "danger",
}: {
  cancelLabel?: string;
  children: ReactNode;
  confirmLabel?: string;
  /** กำลังทำงาน — ปิด dialog ไม่ได้ และปุ่มขึ้นสปินเนอร์ */
  isLoading?: boolean;
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
      onClose={isLoading ? () => undefined : onCancel}
      footer={
        <div className="flex justify-end gap-3">
          <Button disabled={isLoading} onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            isLoading={isLoading}
            loadingLabel="กำลังทำงาน..."
            onClick={onConfirm}
            variant={variant}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-sm leading-6 text-slate-600">{children}</div>
    </Modal>
  );
}
