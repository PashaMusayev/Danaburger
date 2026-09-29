import QRCode from 'qrcode';
import { config } from './config';

export const branchMenuUrl = (branch: string) => `${config.siteUrl}/${branch}/menu/`;

/** Table QR code for one branch: opens that branch's menu. Works on the server (build) and in the admin panel. */
export const menuQrSvg = (branch: string) =>
  QRCode.toString(branchMenuUrl(branch), {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0b0b0b', light: '#ffffff' },
  });
