"use client";

import { useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import { Placeholder, isRealImageUrl } from "../../components/Placeholder";
import { albums as albumsInitiaux, type Album } from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

export default function GaleriePage() {
  const [albums] = useSharedStore<Album[]>("albums", albumsInitiaux);
  const [albumOuvert, setAlbumOuvert] = useState<Album | null>(null);
  const [photoOuverte, setPhotoOuverte] = useState<{ src: string; label: string } | null>(null);

  // L'album ouvert peut être obsolète si le store a changé entre-temps
  const albumOuvertCourant = albumOuvert
    ? albums.find((a) => a.id === albumOuvert.id) ?? null
    : null;

  return (
    <AuthGuard>
      {() => (
        <>
          <AppHeader
            title={albumOuvertCourant ? albumOuvertCourant.titre : "Galerie photos"}
            subtitle={
              albumOuvertCourant
                ? `${albumOuvertCourant.photos.length} photo${
                    albumOuvertCourant.photos.length > 1 ? "s" : ""
                  }`
                : "Moments forts de l'école"
            }
          />
          <AppShell>
            <div className="px-5 py-4">
              {albumOuvertCourant ? (
                <>
                  <button
                    onClick={() => setAlbumOuvert(null)}
                    className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    ← Retour aux albums
                  </button>
                  {albumOuvertCourant.photos.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">
                      Aucune photo dans cet album pour le moment.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {albumOuvertCourant.photos.map((photo, i) => {
                        const label = photo.nom ?? `Photo ${i + 1}`;
                        return (
                          <button
                            key={photo.id}
                            onClick={() =>
                              setPhotoOuverte({
                                src: photo.src,
                                label,
                              })
                            }
                            className="aspect-square overflow-hidden rounded-md"
                          >
                            <Vignette
                              src={photo.src}
                              seed={photo.id}
                              label={label}
                              className="h-full w-full"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <ul className="grid grid-cols-2 gap-3">
                  {albums.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => setAlbumOuvert(a)}
                        className="group flex w-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] text-left shadow-sm transition hover:shadow-md"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <Vignette
                            src={a.photos[0]?.src}
                            seed={a.id}
                            label={a.titre}
                            className="h-full w-full transition group-hover:scale-105"
                          />
                        </div>
                        <div className="p-2.5">
                          <div className="text-xs font-semibold text-[var(--foreground)] line-clamp-1">
                            {a.titre}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {new Date(a.date).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            · {a.photos.length} photo{a.photos.length > 1 ? "s" : ""}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AppShell>

          {photoOuverte ? (
            <button
              type="button"
              onClick={() => setPhotoOuverte(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
              aria-label="Fermer"
            >
              {isRealImageUrl(photoOuverte.src) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoOuverte.src}
                  alt={photoOuverte.label}
                  className="max-h-full max-w-full rounded-md shadow-2xl"
                />
              ) : (
                <Placeholder
                  seed={photoOuverte.src}
                  label={photoOuverte.label}
                  className="h-[60vh] w-full max-w-md rounded-md text-lg shadow-2xl"
                />
              )}
            </button>
          ) : null}
        </>
      )}
    </AuthGuard>
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
