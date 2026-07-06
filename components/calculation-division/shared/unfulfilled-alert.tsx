import { AlertBanner } from "../../ui/alert-banner";

export function UnfulfilledAlert({ message }: { message: string }) {
  if (!message) return null;
  return <AlertBanner tone="danger">{message}</AlertBanner>;
}

