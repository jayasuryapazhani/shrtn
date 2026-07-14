import { describe, expect, it } from 'vitest'
import { createQrCodeDataUrl } from '../src/services/qrCodeService'

describe('createQrCodeDataUrl', () => {
  it('generates a PNG data URL', async () => {
    const result = await createQrCodeDataUrl(
      'http://localhost:5056/AbC123x',
    )

    expect(result).toMatch(
      /^data:image\/png;base64,/,
    )
  })

  it('rejects an empty value', async () => {
    await expect(
      createQrCodeDataUrl(''),
    ).rejects.toThrow(
      'A short URL is required to generate a QR code.',
    )
  })
})