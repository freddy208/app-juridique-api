import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // ou smtp.mailtrap.io pour tests
      port: 465,
      secure: true, // true pour 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER, // ton email
        pass: process.env.SMTP_PASS, // mot de passe ou app password
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const info = await this.transporter.sendMail({
      from: `"Cabinet Juridix Consulting" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log('Message envoyé: %s', info.messageId);
  }
}
