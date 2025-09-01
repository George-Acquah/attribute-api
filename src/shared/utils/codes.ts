import * as QRCode from 'qrcode';

export const generateQrDataUrl = async (data: string) => {
  try {
    return await QRCode.toDataURL(data);
  } catch (err) {
    console.error('[QR GENERATION ERROR]', err);
    throw err;
  }
};
