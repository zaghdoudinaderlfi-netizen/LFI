// Envoi d'emails transactionnels via l'API Resend (https://resend.com).
// Si RESEND_API_KEY n'est pas défini (dev local / Codespace), le lien de
// réinitialisation est simplement imprimé dans les logs du serveur Next.js.
//
// Variables d'environnement à ajouter dans .env pour activer l'envoi réel :
//   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx   (clé Resend, plan gratuit suffit)
//   EMAIL_FROM=Nadtech <noreply@tondomaine.fr>  (domaine vérifié dans Resend)

const RESEND_API = "https://api.resend.com/emails";

export async function envoyerEmailReinit(
  email: string,
  prenom: string | null,
  lienReinit: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `\n[NADTECH – MOT DE PASSE OUBLIÉ]\nEmail : ${email}\nLien  : ${lienReinit}\n`,
    );
    return;
  }

  const from = process.env.EMAIL_FROM ?? "Nadtech <noreply@tondomaine.fr>";
  const salutation = prenom ? `Bonjour ${prenom},` : "Bonjour,";

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Réinitialisation de ton mot de passe – Nadtech",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#e2e8f0">
          <p>${salutation}</p>
          <p>Tu as demandé à réinitialiser ton mot de passe sur <strong>Nadtech</strong>.</p>
          <p style="margin:24px 0">
            <a href="${lienReinit}"
               style="background:#06b6d4;color:#fff;padding:12px 28px;border-radius:8px;
                      text-decoration:none;font-weight:600;display:inline-block;">
              Choisir un nouveau mot de passe
            </a>
          </p>
          <p style="color:#94a3b8;font-size:13px">
            Ce lien expire dans <strong>1 heure</strong>. S'il ne fonctionne plus,
            refais la demande depuis la page de connexion.
          </p>
          <p style="color:#94a3b8;font-size:13px">
            Si tu n'es pas à l'origine de cette demande, ignore cet email.
          </p>
        </div>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(pas de corps)");
    console.error(`[email] Resend a retourné ${res.status}: ${body}`);
    throw new Error("Échec de l'envoi de l'email.");
  }
}
