import * as QRCode from 'qrcode';

export function generateUniqueCode(): string {
  return Math.random().toString(36).substring(2, 10);
}

export const generateQrDataUrl = async (data: string) => {
  try {
    return await QRCode.toDataURL(data);
  } catch (err) {
    console.error('[QR GENERATION ERROR]', err);
    throw err;
  }
};
