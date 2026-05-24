/**
 * Helper d'envoi d'e-mails via Resend.
 * - Si `RESEND_API_KEY` n'est pas définie, on log l'e-mail au lieu de l'envoyer
 *   (utile pour le développement local et pour éviter de planter en production
 *   si la clé n'est pas configurée).
 */
import { Resend } from "resend";

type EnvoiResult = { ok: true; id?: string } | { ok: false; error: string };

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function expediteur(): string {
  return process.env.EMAIL_FROM ?? "Espace Parents <onboarding@resend.dev>";
}

export async function envoyerEmail(opts: {
  to: string;
  sujet: string;
  html: string;
  texte?: string;
}): Promise<EnvoiResult> {
  const client = getClient();
  if (!client) {
    console.log(
      `[email mock] À: ${opts.to}\nSujet: ${opts.sujet}\n` +
        (opts.texte ?? opts.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    );
    return { ok: true };
  }
  try {
    const { data, error } = await client.emails.send({
      from: expediteur(),
      to: opts.to,
      subject: opts.sujet,
      html: opts.html,
      text: opts.texte,
    });
    if (error) {
      console.error("Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("Resend exception:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

// --- Templates HTML ---

function layout(titre: string, contenu: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titre}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f2;font-family:Arial,sans-serif;color:#1a2e22;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f2;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:#1b5e3f;padding:24px;text-align:center;color:#ffffff;">
              <div style="font-size:11px;letter-spacing:2px;opacity:0.8;text-transform:uppercase;">Les Racines du Future</div>
              <div style="font-size:18px;font-weight:700;margin-top:4px;">Espace Parents</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              ${contenu}
            </td>
          </tr>
          <tr>
            <td style="background:#f1f5f2;padding:16px 24px;text-align:center;font-size:11px;color:#5b6e64;">
              École Les Racines du Future · Cet e-mail vous a été envoyé suite à votre activité sur l'application Espace Parents.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function templateCodeAcces(prenom: string, code: string): {
  sujet: string;
  html: string;
  texte: string;
} {
  const sujet = "Votre code d'accès Espace Parents";
  const html = layout(
    sujet,
    `
      <p style="margin:0 0 16px 0;font-size:15px;">Bonjour ${prenom},</p>
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">
        Votre demande d'inscription à l'application <strong>Espace Parents</strong> a été
        approuvée par l'administration de l'école.
      </p>
      <p style="margin:0 0 8px 0;font-size:14px;">Votre code d'accès :</p>
      <div style="background:#e8f1ec;border:2px dashed #1b5e3f;border-radius:8px;padding:20px;text-align:center;margin:16px 0;">
        <div style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#0f3f29;">${code}</div>
      </div>
      <p style="margin:16px 0;font-size:13px;color:#5b6e64;line-height:1.5;">
        Conservez ce code, il vous sera demandé lors de votre première connexion. Vous pourrez
        ensuite le modifier depuis votre profil.
      </p>
      <p style="margin:24px 0 0 0;font-size:14px;">
        Vous pouvez vous connecter dès à présent avec votre adresse e-mail et le mot de
        passe choisi lors de l'inscription.
      </p>
    `
  );
  const texte = `Bonjour ${prenom},

Votre demande d'inscription à l'application Espace Parents a été approuvée.

Votre code d'accès : ${code}

Conservez ce code, il vous sera demandé lors de votre première connexion.

— École Les Racines du Future`;
  return { sujet, html, texte };
}

function formaterDateHeure(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function templateRdvConfirmation(opts: {
  destinataire: "parent" | "enseignant";
  prenomDestinataire: string;
  prenomAutrePartie: string;
  nomAutrePartie: string;
  matiere?: string | null;
  enfantPrenom?: string | null;
  dateHeure: string;
  motif?: string | null;
}): { sujet: string; html: string; texte: string } {
  const estParent = opts.destinataire === "parent";
  const autrePartie = `${opts.prenomAutrePartie} ${opts.nomAutrePartie}`;
  const sujet = estParent
    ? `Rendez-vous confirmé avec ${autrePartie}`
    : `Nouveau rendez-vous avec ${autrePartie}`;
  const intro = estParent
    ? `Votre rendez-vous avec <strong>${autrePartie}</strong>${
        opts.matiere ? ` (${opts.matiere})` : ""
      } est confirmé.`
    : `Un parent vient de réserver un rendez-vous avec vous.`;

  const html = layout(
    sujet,
    `
      <p style="margin:0 0 16px 0;font-size:15px;">Bonjour ${opts.prenomDestinataire},</p>
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">${intro}</p>
      <div style="background:#e8f1ec;border-left:4px solid #1b5e3f;padding:16px;margin:16px 0;border-radius:6px;">
        <p style="margin:0 0 6px 0;font-size:13px;color:#5b6e64;">${estParent ? "Avec" : "Parent"}</p>
        <p style="margin:0 0 12px 0;font-size:15px;font-weight:600;">${autrePartie}${opts.matiere ? ` · ${opts.matiere}` : ""}</p>
        <p style="margin:0 0 6px 0;font-size:13px;color:#5b6e64;">Quand</p>
        <p style="margin:0 0 12px 0;font-size:15px;font-weight:600;">${formaterDateHeure(opts.dateHeure)}</p>
        ${opts.enfantPrenom ? `<p style="margin:0 0 6px 0;font-size:13px;color:#5b6e64;">Concerne</p><p style="margin:0 0 12px 0;font-size:15px;font-weight:600;">${opts.enfantPrenom}</p>` : ""}
        ${opts.motif ? `<p style="margin:0 0 6px 0;font-size:13px;color:#5b6e64;">Motif</p><p style="margin:0;font-size:14px;font-style:italic;">«&nbsp;${opts.motif}&nbsp;»</p>` : ""}
      </div>
      <p style="margin:24px 0 0 0;font-size:12px;color:#5b6e64;">
        Pour annuler ou modifier ce rendez-vous, ${estParent ? "rendez-vous dans la rubrique « Rendez-vous » de l'application" : "consultez votre espace de gestion des rendez-vous"}.
      </p>
    `
  );
  const texte = `Bonjour ${opts.prenomDestinataire},

${estParent
    ? `Votre rendez-vous avec ${autrePartie}${opts.matiere ? ` (${opts.matiere})` : ""} est confirmé.`
    : `Un parent (${autrePartie}) vient de réserver un rendez-vous avec vous.`}

Date : ${formaterDateHeure(opts.dateHeure)}
${opts.enfantPrenom ? `Enfant concerné : ${opts.enfantPrenom}\n` : ""}${opts.motif ? `Motif : ${opts.motif}\n` : ""}
— École Les Racines du Future`;

  return { sujet, html, texte };
}

export function templateRdvAnnulation(opts: {
  destinataire: "parent" | "enseignant";
  prenomDestinataire: string;
  prenomAutrePartie: string;
  nomAutrePartie: string;
  dateHeure: string;
}): { sujet: string; html: string; texte: string } {
  const autrePartie = `${opts.prenomAutrePartie} ${opts.nomAutrePartie}`;
  const sujet = `Rendez-vous annulé`;
  const html = layout(
    sujet,
    `
      <p style="margin:0 0 16px 0;font-size:15px;">Bonjour ${opts.prenomDestinataire},</p>
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">
        Le rendez-vous prévu avec <strong>${autrePartie}</strong> le
        <strong>${formaterDateHeure(opts.dateHeure)}</strong> a été annulé.
      </p>
      <p style="margin:16px 0 0 0;font-size:13px;color:#5b6e64;">
        Vous pouvez prendre un nouveau rendez-vous depuis l'application.
      </p>
    `
  );
  const texte = `Bonjour ${opts.prenomDestinataire},

Le rendez-vous prévu avec ${autrePartie} le ${formaterDateHeure(opts.dateHeure)} a été annulé.

— École Les Racines du Future`;
  return { sujet, html, texte };
}

export function templateReponseMessage(opts: {
  prenomParent: string;
  sujetOriginal: string;
  messageOriginal: string;
  reponse: string;
  signataire: string;
}): { sujet: string; html: string; texte: string } {
  const sujet = `Re: ${opts.sujetOriginal}`;
  const html = layout(
    sujet,
    `
      <p style="margin:0 0 16px 0;font-size:15px;">Bonjour ${opts.prenomParent},</p>
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">
        En réponse à votre message&nbsp;:
      </p>
      <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#1a2e22;">${opts.reponse.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c)}</div>
      <hr style="border:0;border-top:1px solid #d8e3dc;margin:24px 0;">
      <details style="font-size:12px;color:#5b6e64;">
        <summary style="cursor:pointer;">Votre message d'origine</summary>
        <div style="margin-top:8px;padding:12px;background:#f1f5f2;border-radius:6px;font-size:12px;">
          <strong>Sujet :</strong> ${opts.sujetOriginal}<br><br>
          <div style="white-space:pre-wrap;">${opts.messageOriginal.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c)}</div>
        </div>
      </details>
      <p style="margin:24px 0 0 0;font-size:13px;color:#5b6e64;">Cordialement,<br><strong>${opts.signataire}</strong></p>
    `
  );
  const texte = `Bonjour ${opts.prenomParent},

En réponse à votre message :

${opts.reponse}

---
Votre message d'origine (« ${opts.sujetOriginal} ») :
${opts.messageOriginal}

Cordialement,
${opts.signataire}
— École Les Racines du Future`;
  return { sujet, html, texte };
}

export function templateResetPassword(prenom: string, lien: string): {
  sujet: string;
  html: string;
  texte: string;
} {
  const sujet = "Réinitialisation de votre mot de passe";
  const html = layout(
    sujet,
    `
      <p style="margin:0 0 16px 0;font-size:15px;">Bonjour ${prenom},</p>
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">
        Vous avez demandé à réinitialiser votre mot de passe Espace Parents. Cliquez sur
        le bouton ci-dessous pour en choisir un nouveau :
      </p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${lien}" style="background:#1b5e3f;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block;">
          Définir un nouveau mot de passe
        </a>
      </p>
      <p style="margin:16px 0;font-size:12px;color:#5b6e64;line-height:1.5;">
        Si le bouton ne fonctionne pas, copiez-collez cette adresse dans votre navigateur :<br>
        <span style="word-break:break-all;color:#2563a8;">${lien}</span>
      </p>
      <p style="margin:24px 0 0 0;font-size:12px;color:#5b6e64;">
        Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande,
        ignorez simplement cet e-mail — votre mot de passe restera inchangé.
      </p>
    `
  );
  const texte = `Bonjour ${prenom},

Vous avez demandé à réinitialiser votre mot de passe Espace Parents.

Cliquez sur ce lien (valable 1 heure) pour définir un nouveau mot de passe :
${lien}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.

— École Les Racines du Future`;
  return { sujet, html, texte };
}
