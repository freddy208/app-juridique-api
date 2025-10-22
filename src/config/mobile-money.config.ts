import { registerAs } from '@nestjs/config';

export default registerAs('mobileMoney', () => ({
  mtn: {
    apiKey: process.env.MTN_API_KEY,
    apiSecret: process.env.MTN_API_SECRET,
    baseUrl: process.env.MTN_BASE_URL || 'https://api.mtn.cm',
  },
  orange: {
    apiKey: process.env.ORANGE_API_KEY,
    apiSecret: process.env.ORANGE_API_SECRET,
    baseUrl: process.env.ORANGE_BASE_URL || 'https://api.orange.cm',
  },
}));
