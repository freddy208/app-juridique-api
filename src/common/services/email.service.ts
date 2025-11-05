import { Injectable } from '@nestjs/common';

interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: any;
  html?: string;
  text?: string;
}

@Injectable()
export class EmailService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendEmail(options: EmailOptions): Promise<void> {
    // Implémentez l'envoi d'e-mails
    // Vous pouvez utiliser des services comme SendGrid, Mailgun, ou Nodemailer
  }
}
