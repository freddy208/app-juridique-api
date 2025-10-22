import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Récupération sécurisée de la config email
    const host = this.configService.get<string>('email.host');
    const port = this.configService.get<number>('email.port');
    const secure = this.configService.get<boolean>('email.secure');
    const user = this.configService.get<string>('email.auth.user');
    const pass = this.configService.get<string>('email.auth.pass');

    if (!host || !port || secure === undefined || !user || !pass) {
      throw new Error('Configuration email incomplète !');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  private getFrom(): string {
    const from = this.configService.get<string>('email.from');
    if (!from) throw new Error('Adresse email "from" non configurée !');
    return from;
  }

  async sendWelcomeEmail(to: string, name: string) {
    const mailOptions = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      from: this.configService.get('email.from'),
      to,
      subject: 'Bienvenue sur Cabinet Juridique 237',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">Bienvenue sur Cabinet Juridique 237</h2>
          <p>Bonjour ${name},</p>
          <p>Nous sommes ravis de vous accueillir sur notre plateforme de gestion de cabinet juridique.</p>
          <p>Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter et commencer à utiliser notre application.</p>
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          <p>Cordialement,<br>L'équipe de Cabinet Juridique 237</p>
        </div>
      `,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const resetUrl = `${this.configService.get('app.frontendUrl')}/reset-password?token=${token}`;
    const mailOptions = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      from: this.configService.get('email.from'),
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">Réinitialisation de votre mot de passe</h2>
          <p>Bonjour ${name},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Réinitialiser mon mot de passe</a>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe de Cabinet Juridique 237</p>
        </div>
      `,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetConfirmationEmail(to: string, name: string) {
    const mailOptions = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      from: this.configService.get('email.from'),
      to,
      subject: 'Votre mot de passe a été réinitialisé',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">Mot de passe réinitialisé</h2>
          <p>Bonjour ${name},</p>
          <p>Votre mot de passe a été réinitialisé avec succès.</p>
          <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <p>Cordialement,<br>L'équipe de Cabinet Juridique 237</p>
        </div>
      `,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.transporter.sendMail(mailOptions);
  }

  async sendPasswordChangeConfirmationEmail(to: string, name: string) {
    const mailOptions = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      from: this.configService.get('email.from'),
      to,
      subject: 'Votre mot de passe a été changé',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">Mot de passe changé</h2>
          <p>Bonjour ${name},</p>
          <p>Votre mot de passe a été changé avec succès.</p>
          <p>Si vous n'êtes pas à l'origine de ce changement, veuillez contacter immédiatement notre support.</p>
          <p>Cordialement,<br>L'équipe de Cabinet Juridique 237</p>
        </div>
      `,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.transporter.sendMail(mailOptions);
  }
}
