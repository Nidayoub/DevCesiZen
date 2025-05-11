import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Determine if we're in test mode (no real email sending)
const TEST_MODE = process.env.EMAIL_TEST_MODE === 'true';

// Configure the email transporter
let transporter;

if (process.env.EMAIL_SERVICE === 'mailtrap') {
  // Configuration Mailtrap (service gratuit pour les tests)
  transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log('📧 Mode Mailtrap activé - les emails seront capturés par Mailtrap');
} else {
  // Configuration Gmail par défaut
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Verify transporter configuration on startup
if (!TEST_MODE) {
  transporter.verify()
    .then(() => console.log('✅ Configuration email vérifiée avec succès'))
    .catch((err) => {
      console.error('❌ Erreur de configuration email:', err);
      console.log('⚠️ Pour utiliser Gmail, assurez-vous d\'avoir:');
      console.log('   1. Activé l\'authentification à deux facteurs');
      console.log('   2. Généré un mot de passe d\'application depuis https://myaccount.google.com/apppasswords');
      console.log('   3. Configuré EMAIL_USER et EMAIL_PASSWORD dans votre .env');
      console.log('⚠️ Ou pour utiliser Mailtrap:');
      console.log('   1. Créez un compte gratuit sur mailtrap.io');
      console.log('   2. Récupérez vos identifiants SMTP dans la boîte de réception par défaut');
      console.log('   3. Configurez EMAIL_SERVICE=mailtrap, EMAIL_USER et EMAIL_PASSWORD dans votre .env');
    });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Generate a verification token
 * @returns Object containing token and expiration date
 */
export function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  
  // Token expires in 24 hours
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 24);
  
  return {
    token,
    expires: expirationDate
  };
}

/**
 * Send an email
 * @param options - Email options (to, subject, html)
 * @returns Promise resolving to send info
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, from = process.env.EMAIL_USER } = options;
  
  // In test mode, log the email instead of sending it
  if (TEST_MODE) {
    console.log('📧 [MODE TEST] Email qui aurait été envoyé:');
    console.log(`De: ${from}`);
    console.log(`À: ${to}`);
    console.log(`Sujet: ${subject}`);
    console.log(`Contenu: ${html.substring(0, 100)}...`);
    
    return {
      messageId: `test-${Date.now()}`,
      testMode: true
    };
  }
  
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
    
    console.log('📧 Email envoyé avec succès:', info.messageId);
    
    // Si on utilise Mailtrap, afficher le lien de prévisualisation
    if (process.env.EMAIL_SERVICE === 'mailtrap') {
      console.log('📧 Consultez l\'email dans votre boîte Mailtrap: https://mailtrap.io/inboxes');
    }
    
    return info;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send a verification email
 * @param email - User's email address
 * @param token - Verification token
 * @param firstname - User's first name
 * @returns Promise resolving to send info
 */
export async function sendVerificationEmail(email: string, token: string, firstname: string) {
  // Frontend is on port 3001, backend on port 3000
  const frontendUrl = process.env.FRONTEND_URL;
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
  
  console.log(`📧 Lien de vérification généré: ${verifyUrl}`);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Bienvenue sur CesiZen !</h2>
      <p>Bonjour ${firstname},</p>
      <p>Merci de vous être inscrit(e) sur CesiZen. Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Vérifier mon adresse email
        </a>
      </div>
      <p>Ce lien expirera dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
      <p>Cordialement,<br>L'équipe CesiZen</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Vérification de votre adresse email - CesiZen',
    html
  });
} 