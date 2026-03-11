import type { ReactNode } from "react";
import { clsx } from "clsx";

export function Panel(props: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("shield-panel", props.className)}>
      <header className="shield-panel-header">
        <h3>{props.title}</h3>
        {props.subtitle ? <p>{props.subtitle}</p> : null}
      </header>
      <div>{props.children}</div>
    </section>
  );
}

export function StatCard(props: { label: string; value: string | number; tone?: "neutral" | "success" | "warning" | "critical"; detail?: string }) {
  return (
    <article className={clsx("shield-stat", props.tone ? `tone-${props.tone}` : "")}> 
      <p className="label">{props.label}</p>
      <p className="value">{props.value}</p>
      {props.detail ? <p className="detail">{props.detail}</p> : null}
    </article>
  );
}

export function StatusBadge(props: { label: string; tone?: "neutral" | "success" | "warning" | "critical" }) {
  return <span className={clsx("shield-badge", props.tone ? `tone-${props.tone}` : "")}>{props.label}</span>;
}
