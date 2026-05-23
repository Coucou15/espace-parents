"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import {
  comptesParentsInitiaux,
  genererCodeAcces,
  type CompteParent,
} from "../_lib/adminMockData";

export default function ParentsPage() {
  const [comptes, setComptes] = useState<CompteParent[]>(comptesParentsInitiaux);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"tous" | "actif" | "suspendu">("tous");
  const [info, setInfo] = useState<string | null>(null);

  const comptesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return comptes.filter((c) => {
      if (filtre !== "tous" && c.statut !== filtre) return false;
      if (!q) return true;
      return (
        c.prenom.toLowerCase().includes(q) ||
        c.nom.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [comptes, recherche, filtre]);

  function toggleStatut(id: string) {
    setComptes((curr) =>
      curr.map((c) =>
        c.id === id ? { ...c, statut: c.statut === "actif" ? "suspendu" : "actif" } : c
      )
    );
    notifier("Statut mis à jour");
  }

  function reinitialiserCode(id: string) {
    const code = genererCodeAcces();
    setComptes((curr) => curr.map((c) => (c.id === id ? { ...c, codeAcces: code } : c)));
    notifier(`Nouveau code envoyé : ${code}`);
  }

  function supprimer(id: string) {
    if (confirm("Supprimer définitivement ce compte parent ?")) {
      setComptes((curr) => curr.filter((c) => c.id !== id));
      notifier("Compte supprimé");
    }
  }

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 2500);
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Comptes parents
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {comptesFiltres.length} compte{comptesFiltres.length > 1 ? "s" : ""}
            </p>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom, prénom ou e-mail…"
              className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
            <div className="flex rounded-lg bg-[var(--surface-muted)] p-1 text-xs">
              {(["tous", "actif", "suspendu"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltre(f)}
                  className={`rounded-md px-3 py-1.5 font-semibold capitalize transition ${
                    filtre === f
                      ? "bg-white text-[var(--brand-primary-dark)] shadow-sm"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Parent</th>
                  <th className="hidden px-4 py-3 text-left font-semibold lg:table-cell">
                    Contact
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold lg:table-cell">
                    Enfants
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold lg:table-cell">
                    Code
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold lg:table-cell">
                    Dernière connexion
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comptesFiltres.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-[var(--border)] align-middle hover:bg-[var(--surface-muted)]/40"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {c.prenom} {c.nom}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] lg:hidden">
                        {c.email}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-[var(--text-muted)] lg:table-cell">
                      <div>{c.email}</div>
                      <div>{c.telephone}</div>
                    </td>
                    <td className="hidden px-4 py-3 text-center lg:table-cell">{c.nbEnfants}</td>
                    <td className="hidden px-4 py-3 text-center font-mono text-xs lg:table-cell">
                      {c.codeAcces}
                    </td>
                    <td className="hidden px-4 py-3 text-center text-[11px] text-[var(--text-muted)] lg:table-cell">
                      {new Date(c.derniereConnexion).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          c.statut === "actif"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {c.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => reinitialiserCode(c.id)}
                          title="Réinitialiser le code d'accès"
                          className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] hover:bg-[var(--surface-muted)]"
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => toggleStatut(c.id)}
                          title={c.statut === "actif" ? "Suspendre" : "Réactiver"}
                          className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] hover:bg-[var(--surface-muted)]"
                        >
                          {c.statut === "actif" ? "⏸" : "▶"}
                        </button>
                        <button
                          onClick={() => supprimer(c.id)}
                          title="Supprimer"
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-600 hover:bg-red-100"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {comptesFiltres.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-[var(--text-muted)]"
                    >
                      Aucun compte ne correspond à la recherche.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
