"use client";

import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";

// Pages où le bouton retour n'est pas affiché (pages "racines").
const SANS_RETOUR = new Set([
  "/",
  "/login",
  "/inscription",
  "/mot-de-passe-oublie",
]);

export function AppHeader({
  title,
  subtitle,
  showBack,
}: {
  title: string;
  subtitle?: string;
  /** Force ou cache le bouton retour ; sinon auto-détection. */
  showBack?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const afficherRetour = showBack ?? !SANS_RETOUR.has(pathname);

  function retour() {
    // Si on a un historique navigable, on revient. Sinon, fallback vers /.
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <header className="bg-[var(--brand-primary)] text-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        {afficherRetour ? (
          <button
            onClick={retour}
            aria-label="Retour"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 active:bg-white/20"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        ) : (
          <Logo size={36} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] opacity-80 truncate leading-tight">
            Les Racines du Future
          </p>
          <h1 className="text-base font-semibold leading-tight truncate">{title}</h1>
          {subtitle ? (
            <p className="text-[10px] opacity-80 truncate leading-tight">{subtitle}</p>
          ) : null}
        </div>
        {afficherRetour ? <Logo size={36} /> : null}
      </div>
    </header>
  );
}
