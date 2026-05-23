import Link from "next/link";

const modules = [
  { href: "/menu", icone: "🍽️", label: "Menu" },
  { href: "/emploi-du-temps", icone: "📅", label: "Emploi du temps" },
  { href: "/evaluations", icone: "📝", label: "Évaluations" },
  { href: "/rendez-vous", icone: "🗓️", label: "Rendez-vous" },
  { href: "/galerie", icone: "📸", label: "Galerie" },
  { href: "/reglement", icone: "📘", label: "Règlement" },
  { href: "/contact", icone: "✉️", label: "Contact" },
];

export function ModuleGrid() {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
        Accès rapide
      </h2>
      <ul className="grid grid-cols-3 gap-2.5">
        {modules.map((m) => (
          <li key={m.href}>
            <Link
              href={m.href}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm p-2 text-center shadow-sm transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-soft)]"
            >
              <span className="text-2xl" aria-hidden>
                {m.icone}
              </span>
              <span className="text-[10px] font-semibold leading-tight text-[var(--foreground)]">
                {m.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
