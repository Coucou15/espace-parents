"use client";

import { useRef, useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import { Placeholder, isRealImageUrl } from "../../components/Placeholder";
import {
  albums as albumsInitiaux,
  type Album,
  type AlbumPhoto,
} from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

export default function GalerieAdmin() {
  const [albums, setAlbums] = useSharedStore<Album[]>("albums", albumsInitiaux);
  const [enEditionId, setEnEditionId] = useState<string | null>(null);
  const [creation, setCreation] = useState<{ titre: string; date: string } | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const enEdition = enEditionId ? albums.find((a) => a.id === enEditionId) ?? null : null;

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 2500);
  }

  function ouvrirCreation() {
    setCreation({ titre: "", date: new Date().toISOString().slice(0, 10) });
  }

  function creerAlbum(e: React.FormEvent) {
    e.preventDefault();
    if (!creation) return;
    const nouvel: Album = {
      id: `g${Date.now()}`,
      titre: creation.titre,
      date: creation.date,
      photos: [],
    };
    setAlbums((curr) => [nouvel, ...curr]);
    setCreation(null);
    setEnEditionId(nouvel.id);
    notifier("Album créé. Vous pouvez maintenant ajouter des photos.");
  }

  function supprimerAlbum(id: string) {
    if (!confirm("Supprimer cet album et toutes ses photos ?")) return;
    setAlbums((curr) => curr.filter((a) => a.id !== id));
    if (enEditionId === id) setEnEditionId(null);
    notifier("Album supprimé.");
  }

  function mettreAJourAlbum(albumMaj: Album) {
    setAlbums((curr) => curr.map((a) => (a.id === albumMaj.id ? albumMaj : a)));
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
                Galerie photos
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                {albums.length} album{albums.length > 1 ? "s" : ""} ·{" "}
                {albums.reduce((n, a) => n + a.photos.length, 0)} photos au total
              </p>
            </div>
            <button
              onClick={ouvrirCreation}
              className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-dark)]"
            >
              + Nouvel album
            </button>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a) => (
              <li
                key={a.id}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[var(--surface-muted)]">
                  {a.photos[0] ? (
                    <Vignette
                      src={a.photos[0].src}
                      seed={a.id}
                      label={a.titre}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl text-[var(--text-muted)]">
                      📷
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold">{a.titre}</h3>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {new Date(a.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {a.photos.length} photos
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <button
                      onClick={() => setEnEditionId(a.id)}
                      className="flex-1 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[11px] font-semibold hover:bg-[var(--surface-muted)]"
                    >
                      Gérer photos
                    </button>
                    <button
                      onClick={() => supprimerAlbum(a.id)}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {creation ? (
            <Modal onClose={() => setCreation(null)} titre="Nouvel album">
              <form onSubmit={creerAlbum} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Titre de l&apos;album</label>
                  <input
                    type="text"
                    required
                    value={creation.titre}
                    onChange={(e) => setCreation({ ...creation, titre: e.target.value })}
                    placeholder="Ex: Sortie au musée"
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date de l&apos;événement</label>
                  <input
                    type="date"
                    required
                    value={creation.date}
                    onChange={(e) => setCreation({ ...creation, date: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreation(null)}
                    className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
                  >
                    Créer l&apos;album
                  </button>
                </div>
              </form>
            </Modal>
          ) : null}

          {enEdition ? (
            <EditeurAlbum
              album={enEdition}
              onClose={() => setEnEditionId(null)}
              onChange={mettreAJourAlbum}
              onNotify={notifier}
            />
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

function EditeurAlbum({
  album,
  onClose,
  onChange,
  onNotify,
}: {
  album: Album;
  onClose: () => void;
  onChange: (a: Album) => void;
  onNotify: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enGlisser, setEnGlisser] = useState(false);
  const albumRef = useRef(album);
  albumRef.current = album;

  function lireFichier(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(f);
    });
  }

  async function ajouterFichiers(fichiers: FileList | null) {
    if (!fichiers || fichiers.length === 0) return;
    const images = Array.from(fichiers).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      onNotify("Seuls les fichiers image sont acceptés.");
      return;
    }
    const dataUrls = await Promise.all(images.map(lireFichier));
    const nouvellesPhotos: AlbumPhoto[] = images.map((f, i) => ({
      id: `${album.id}-up${Date.now()}-${i}`,
      src: dataUrls[i],
      nom: f.name,
    }));
    onChange({
      ...albumRef.current,
      photos: [...albumRef.current.photos, ...nouvellesPhotos],
    });
    onNotify(
      `${nouvellesPhotos.length} photo${nouvellesPhotos.length > 1 ? "s" : ""} ajoutée${
        nouvellesPhotos.length > 1 ? "s" : ""
      }.`
    );
  }

  function retirerPhoto(id: string) {
    onChange({ ...album, photos: album.photos.filter((p) => p.id !== id) });
  }

  function modifierMeta(patch: Partial<Pick<Album, "titre" | "date">>) {
    onChange({ ...album, ...patch });
  }

  return (
    <Modal onClose={onClose} titre="Gérer les photos" wide>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
          <div>
            <label className="block text-xs font-medium mb-1">Titre</label>
            <input
              type="text"
              value={album.titre}
              onChange={(e) => modifierMeta({ titre: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Date</label>
            <input
              type="date"
              value={album.date}
              onChange={(e) => modifierMeta({ date: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setEnGlisser(true);
          }}
          onDragLeave={() => setEnGlisser(false)}
          onDrop={(e) => {
            e.preventDefault();
            setEnGlisser(false);
            ajouterFichiers(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition ${
            enGlisser
              ? "border-[var(--brand-primary)] bg-[var(--brand-soft)]"
              : "border-[var(--border)] bg-[var(--surface-muted)]/60"
          }`}
        >
          <div className="text-3xl" aria-hidden>
            📤
          </div>
          <div className="text-sm font-semibold">Glissez vos photos ici</div>
          <div className="text-xs text-[var(--text-muted)]">
            ou cliquez pour les sélectionner (JPG, PNG)
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-primary-dark)]"
          >
            Choisir des fichiers
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              ajouterFichiers(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {album.photos.length > 0 ? (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {album.photos.length} photo{album.photos.length > 1 ? "s" : ""}
            </h3>
            <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
              {album.photos.map((p) => (
                <li
                  key={p.id}
                  className="group relative aspect-square overflow-hidden rounded-md bg-[var(--surface-muted)]"
                >
                  <Vignette
                    src={p.src}
                    seed={p.id}
                    label={p.nom ?? ""}
                    className="h-full w-full"
                  />
                  <button
                    type="button"
                    onClick={() => retirerPhoto(p.id)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    title="Retirer"
                    aria-label={`Retirer ${p.nom ?? "photo"}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-center text-xs text-[var(--text-muted)]">
            Aucune photo dans cet album pour le moment.
          </p>
        )}

        <div className="flex justify-end border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
          >
            Terminer
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Vignette({
  src,
  seed,
  label,
  className,
}: {
  src: string | undefined;
  seed: string;
  label: string;
  className?: string;
}) {
  if (isRealImageUrl(src)) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={src} alt={label} className={`object-cover ${className ?? ""}`} loading="lazy" />
    );
  }
  return <Placeholder seed={seed} label={label} className={className} />;
}

function Modal({
  children,
  onClose,
  titre,
  wide = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  titre: string;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-5 shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--brand-primary-dark)]">{titre}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
