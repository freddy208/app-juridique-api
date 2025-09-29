// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host =
      this.configService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com';
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? '465');
    const secureEnv = this.configService.get<string>('SMTP_SECURE');
    const secure = secureEnv ? secureEnv === 'true' : port === 465;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!user || !pass) {
      this.logger.warn(
        'SMTP_USER or SMTP_PASS not defined. Mail sending disabled.',
      );
      return;
    }

    const options: SMTPTransport.Options = {
      host,
      port,
      secure,
      auth: { user, pass },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.transporter = nodemailer.createTransport(options);
  }

  async sendMail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(
        `Mail skipped (transporter not configured). To=${to} Subject=${subject}`,
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const info = await this.transporter.sendMail({
        from: `"Cabinet Juridix Consulting" <${this.configService.get('SMTP_USER')}>`,
        to,
        subject,
        html,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`Mail sent: ${info?.messageId ?? '(no messageId)'}`);
    } catch (error) {
      // NE PAS relancer l'erreur -> on ne veut pas faire planter l'API
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Failed to send email', error?.stack ?? error);
      // on peut aussi stocker l'erreur quelque part si besoin
    }
  }
}
