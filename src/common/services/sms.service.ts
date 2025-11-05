/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';

interface SMSOptions {
  to: string;
  message: string;
}

type WhatsAppOptions = SMSOptions;

@Injectable()
export class SMSService {
  async sendSMS(options: SMSOptions): Promise<void> {
    // Implémentez l'envoi de SMS
    // Vous pouvez utiliser des services comme Twilio, Africa's Talking, ou Orange SMS API
  }

  async sendWhatsApp(options: WhatsAppOptions): Promise<void> {
    // Implémentez l'envoi de messages WhatsApp
    // Vous pouvez utiliser des services comme Twilio WhatsApp API
  }
}
