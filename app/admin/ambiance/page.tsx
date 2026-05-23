"use client";

import { useRef, useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import {
  SLOTS_AMBIANCE,
  type Ambiance,
  type SlotAmbiance,
} from "../../components/AmbianceBanner";
import { useSharedStore } from "../../lib/store";

const SLOT_HINTS: Record<SlotAmbiance, string> = {
  login: "Visible sous le formulaire de connexion. Suggère l'ambiance de l'école.",
  accueil:
    "Bandeau en haut de la page d'accueil parent, sous l'entête. Idéal pour une photo de la vie de l'école.",
  menu: "Bandeau de la page menu de la cantine. Photo de plat ou de la cantine.",
  contact: "Bandeau de la page « Nous contacter ». Photo de la cour ou du bâtiment.",
  inscription:
    "Visible sur le formulaire d'inscription. Photo accueillante pour rassurer les nouveaux parents.",
};

export default function AmbianceAdmin() {
  const [ambiance, setAmbiance] = useSharedStore<Ambiance>("ambiance", {});
  const [info, setInfo] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 2500);
  }

  function lireFichier(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(f);
    });
  }

  async function uploader(slot: SlotAmbiance, file: File) {
    setErreur(null);
    if (!file.type.startsWith("image/")) {
      setErreur("Seuls les fichiers image sont acceptés.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErreur("Image trop lourde (3 Mo maximum). Réduisez sa taille d'abord.");
      return;
    }
    const dataUrl = await lireFichier(file);
    setAmbiance({ ...ambiance, [slot]: dataUrl });
    notifier(`Photo enregistrée pour « ${labelSlot(slot)} »`);
  }

  function retirer(slot: SlotAmbiance) {
    if (!confirm("Retirer la photo pour cet emplacement ?")) return;
    const next = { ...ambiance };
    delete next[slot];
    setAmbiance(next);
    notifier(`Photo retirée pour « ${labelSlot(slot)} »`);
  }

  function labelSlot(slot: SlotAmbiance): string {
    return SLOTS_AMBIANCE.find((s) => s.id === slot)?.label ?? slot;
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Photos d&apos;ambiance
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Décorez certaines pages de l&apos;application avec des photos de la vie
              de l&apos;école. Vous pouvez changer ou retirer chaque photo à tout
              moment.
            </p>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}
          {erreur ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              ⚠ {erreur}
            </div>
          ) : null}

          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {SLOTS_AMBIANCE.map((s) => (
              <SlotCard
                key={s.id}
                slot={s.id}
                label={s.label}
                hint={SLOT_HINTS[s.id]}
                src={ambiance[s.id]}
                onUpload={(f) => uploader(s.id, f)}
                onRetirer={() => retirer(s.id)}
              />
            ))}
          </ul>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 p-4 text-xs text-[var(--text-muted)]">
            💡 <strong>Conseils :</strong> utilisez des photos de format paysage
            (plus large que haut) d&apos;au moins 1024 px de large pour un beau
            rendu. Limite 3 Mo par image. Les photos sont stockées en base de
            données — pour les très gros volumes, passer à un stockage type Vercel
            Blob serait plus optimal.
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function SlotCard({
  slot,
  label,
  hint,
  src,
  onUpload,
  onRetirer,
}: {
  slot: SlotAmbiance;
  label: string;
  hint: string;
  src: string | undefined;
  onUpload: (file: File) => void;
  onRetirer: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <li className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
      <div className="aspect-[16/9] overflow-hidden bg-[var(--surface-muted)]">
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
            <span className="text-3xl">🖼️</span>
            <span className="text-xs">Aucune photo pour cet emplacement</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--brand-primary-dark)]">
            {label}
          </h3>
          <span className="text-[10px] text-[var(--text-muted)]">· slot &quot;{slot}&quot;</span>
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
          {hint}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-primary-dark)]"
          >
            {src ? "Changer" : "Ajouter une photo"}
          </button>
          {src ? (
            <button
              onClick={onRetirer}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
            >
              Retirer
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </div>
    </li>
  );
}
