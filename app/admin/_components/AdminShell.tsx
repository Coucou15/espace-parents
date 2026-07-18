"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe, logout, type Compte, type Role } from "../../lib/auth";

const ROLES_ADMIN: Role[] = ["admin-ecole", "super-admin", "enseignant", "cantine"];

const ROLE_LABELS: Record<Role, string> = {
  "super-admin": "Super-administrateur",
  "admin-ecole": "Administrateur école",
  enseignant: "Enseignant",
  cantine: "Personnel de cantine",
  parent: "Parent",
};

export type AdminSession = Compte;

const navItems = [
  { href: "/admin/dashboard", label: "Tableau de bord", icone: "📊" },
  { href: "/admin/demandes", label: "Demandes d'inscription", icone: "📥" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icone: "👥" },
  { href: "/admin/parents", label: "Comptes parents", icone: "👨‍👩‍👧" },
  { href: "/admin/rendez-vous", label: "Rendez-vous", icone: "🗓️" },
  { href: "/admin/annonces", label: "Annonces", icone: "📢" },
  { href: "/admin/emploi-du-temps", label: "Emplois du temps", icone: "📅" },
  { href: "/admin/absences", label: "Feuille d'appel", icone: "🙋" },
  { href: "/admin/evaluations", label: "Évaluations", icone: "📝" },
  { href: "/admin/appreciations", label: "Suivi continu", icone: "💬" },
  { href: "/admin/menu", label: "Menu cantine", icone: "🍽️" },
  { href: "/admin/galerie", label: "Galerie photos", icone: "📸" },
  { href: "/admin/ambiance", label: "Photos d'ambiance", icone: "🖼️" },
  { href: "/admin/reglement", label: "Règlement", icone: "📘" },
  { href: "/admin/ecole", label: "Coordonnées école", icone: "🏫" },
  { href: "/admin/messages", label: "Messages reçus", icone: "✉️" },
];

export function AdminShell({ children }: { children: (session: AdminSession) => React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checked, setChecked] = useState(false);
  const [navOuverte, setNavOuverte] = useState(false);

  useEffect(() => {
    fetchMe().then((user) => {
      if (!user || !ROLES_ADMIN.includes(user.role)) {
        router.replace("/admin");
      } else {
        setSession(user);
      }
      setChecked(true);
    });
  }, [router]);

  useEffect(() => {
    setNavOuverte(false);
  }, [pathname]);

  if (!checked || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
        Chargement…
      </div>
    );
  }

  async function deconnexion() {
    await logout();
    router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen bg-[var(--surface-muted)]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[var(--brand-primary-dark)] text-white">
        <SidebarContent session={session} pathname={pathname} onDeconnexion={deconnexion} />
      </aside>

      {/* Sidebar mobile (overlay) */}
      {navOuverte ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            onClick={() => setNavOuverte(false)}
            className="absolute inset-0 bg-black/50"
            aria-label="Fermer le menu"
          />
          <aside className="relative z-10 flex h-full w-64 flex-col bg-[var(--brand-primary-dark)] text-white">
            <SidebarContent session={session} pathname={pathname} onDeconnexion={deconnexion} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3 lg:px-8">
          <button
            type="button"
            onClick={() => setNavOuverte(true)}
            className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-sm lg:hidden"
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <div className="hidden text-sm font-semibold text-[var(--brand-primary-dark)] lg:block">
            Back-office · Les Racines du Future
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <div className="font-semibold text-[var(--foreground)]">
                {session.prenom} {session.nom}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {ROLE_LABELS[session.role]}
              </div>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-primary)] font-semibold text-white"
              aria-hidden
            >
              {session.prenom[0]}
              {session.nom[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">{children(session)}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  session,
  pathname,
  onDeconnexion,
}: {
  session: AdminSession;
  pathname: string;
  onDeconnexion: () => void;
}) {
  return (
    <>
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="" className="h-10 w-10 rounded-full bg-white object-contain" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider opacity-70">Back-office</div>
            <div className="text-sm font-semibold truncate">Les Racines du Future</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const actif = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    actif ? "bg-white/15 font-semibold" : "hover:bg-white/10"
                  }`}
                >
                  <span aria-hidden>{item.icone}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-md bg-white/5 px-3 py-2 text-[11px] opacity-90 mb-2">
          Connecté : <span className="font-semibold">{ROLE_LABELS[session.role]}</span>
        </div>
        <button
          onClick={onDeconnexion}
          className="w-full rounded-md bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
        >
          Se déconnecter
        </button>
      </div>
    </>
  );
}
