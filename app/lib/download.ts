"use client";

/**
 * Déclenche le téléchargement d'un fichier à partir d'un data URL.
 *
 * Pourquoi pas un simple <a href={dataUrl} download> ?
 * - Sur mobile (iOS Safari surtout), les data URL longs (> 1 Mo)
 *   ne déclenchent pas le téléchargement, ou le font crasher l'onglet.
 * - La conversion en Blob + URL.createObjectURL est la méthode
 *   universellement supportée.
 */
export function telechargerDataUrl(dataUrl: string, nomFichier: string): void {
  if (!dataUrl.startsWith("data:")) {
    // Pas un data URL : on tente le téléchargement direct
    declencherTelechargement(dataUrl, nomFichier);
    return;
  }

  // Parsing du data URL : data:<mime>;base64,<payload>
  const virgule = dataUrl.indexOf(",");
  if (virgule < 0) return;
  const entete = dataUrl.slice(5, virgule); // sans "data:"
  const payload = dataUrl.slice(virgule + 1);

  const partsEntete = entete.split(";");
  const mime = partsEntete[0] || "application/octet-stream";
  const estBase64 = partsEntete.includes("base64");

  const binaire = estBase64 ? atob(payload) : decodeURIComponent(payload);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) {
    octets[i] = binaire.charCodeAt(i);
  }

  const blob = new Blob([octets], { type: mime });
  const url = URL.createObjectURL(blob);
  declencherTelechargement(url, nomFichier);
  // On libère l'URL après quelques secondes (le temps que le download démarre)
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function declencherTelechargement(url: string, nomFichier: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Ouvre un data URL ou URL dans un nouvel onglet (utile pour les PDF). */
export function ouvrirDansNouvelOnglet(dataUrl: string): void {
  if (dataUrl.startsWith("data:")) {
    // On convertit en Blob pour avoir une URL "propre"
    const virgule = dataUrl.indexOf(",");
    if (virgule < 0) return;
    const entete = dataUrl.slice(5, virgule);
    const payload = dataUrl.slice(virgule + 1);
    const partsEntete = entete.split(";");
    const mime = partsEntete[0] || "application/octet-stream";
    const estBase64 = partsEntete.includes("base64");
    const binaire = estBase64 ? atob(payload) : decodeURIComponent(payload);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    const blob = new Blob([octets], { type: mime });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } else {
    window.open(dataUrl, "_blank", "noopener");
  }
}
