import QRCode from 'qrcode'

export async function createQrCodeDataUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(
      'A short URL is required to generate a QR code.',
    )
  }

  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
  })
}