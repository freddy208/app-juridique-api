// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST')!;
    const port = parseInt(this.configService.get<string>('SMTP_PORT')!, 10);
    const user = this.configService.get<string>('SMTP_USER')!;
    const pass = this.configService.get<string>('SMTP_PASS')!;

    if (!host || !port || !user || !pass) {
      this.logger.warn('⚠️ SMTP credentials not set. Emails disabled.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true pour SSL, false pour TLS/STARTTLS
      auth: { user, pass },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(`Mail skipped (transporter not configured). To=${to}`);
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
      this.logger.log(`📧 Mail sent: ${info?.messageId ?? '(no id)'}`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('❌ Failed to send email', error?.stack ?? error);
    }
  }
}
