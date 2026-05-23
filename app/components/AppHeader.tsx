import { Logo } from "./Logo";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="bg-[var(--brand-primary)] text-white px-5 pt-6 pb-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Logo size={40} />
        <div className="flex-1 min-w-0">
          <p className="text-xs opacity-80 truncate">Les Racines du Future</p>
          <h1 className="text-lg font-semibold leading-tight truncate">{title}</h1>
          {subtitle ? (
            <p className="text-xs opacity-80 mt-0.5 truncate">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
