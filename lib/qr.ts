import QRCode from 'qrcode';
import { config } from './config';

/** Built once at export time; points table QR codes at the standalone menu page. */
export const menuQrSvg = () =>
  QRCode.toString(`${config.siteUrl}/menu/`, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0b0b0b', light: '#ffffff' },
  });
