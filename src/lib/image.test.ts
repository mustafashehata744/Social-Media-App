import { describe, expect, it } from 'vitest'
import { fileToDataUrl } from './image'

describe('fileToDataUrl', () => {
  it('rejects HEIC files with a clear browser-compatibility error', async () => {
    const file = new File(['heic'], 'photo.heic', { type: 'image/heic' })

    await expect(fileToDataUrl(file)).rejects.toThrow(/HEIC|HEIF/)
  })

  it('rejects files larger than 8 MB', async () => {
    const file = new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'photo.jpg', { type: 'image/jpeg' })

    await expect(fileToDataUrl(file)).rejects.toThrow(/8 MB|٨ ميجابايت/)
  })
})
