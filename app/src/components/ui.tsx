import type { ReactNode } from "react";

export type Tone = "ok" | "warn" | "err";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={["panel", className].filter(Boolean).join(" ")}>{children}</section>;
}

export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <b>{title}</b>
      <span>{body}</span>
    </div>
  );
}

export function DataCard({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: Tone }) {
  return (
    <article className={`data-card ${tone}`}>
      <small>{title}</small>
      <b>{value}</b>
      <span>{detail}</span>
    </article>
  );
}

export function MetricCard({ title, value, detail }: { title: string; value: string | number; detail?: string }) {
  return (
    <article className="metric-card">
      <small>{title}</small>
      <b>{value}</b>
      {detail ? <span>{detail}</span> : null}
    </article>
  );
}

export function LockState({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return (
    <section className="lock-strip">
      <div>
        <b>{title}</b>
        <span>{body}</span>
      </div>
      <button className="primary-btn" type="button" onClick={onAction}>
        {action}
      </button>
    </section>
  );
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  if (!message) return null;
  return <div className="toast" onAnimationEnd={onDone}>{message}</div>;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "취소",
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="confirm-dialog panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        <div className="dialog-actions">
          <button type="button" onClick={onCancel}>{cancelLabel}</button>
          <button className="danger-btn" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
