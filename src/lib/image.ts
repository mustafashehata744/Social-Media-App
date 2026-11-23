import { pick } from '@/lib/lang'
import { STORAGE_LIMIT, storageBytes } from './storage'

const MAX_INPUT_BYTES = 8 * 1024 * 1024
const IMAGE_LOAD_TIMEOUT_MS = 15_000

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(pick('تعذّرت قراءة الصورة', 'Could not read the image')))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timeout = window.setTimeout(() => {
      image.onload = null
      image.onerror = null
      reject(new Error(pick('استغرق تجهيز الصورة وقتًا طويلًا — جرّب صورة أصغر', 'Preparing the image took too long — try a smaller image')))
    }, IMAGE_LOAD_TIMEOUT_MS)
    image.onload = () => {
      window.clearTimeout(timeout)
      resolve(image)
    }
    image.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error(pick('صيغة الصورة غير مدعومة، أو إن الملف تالف', 'Unsupported or damaged image format')))
    }
    image.src = src
  })
}

function exportImage(image: HTMLImageElement, width: number, height: number, quality: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error(pick('تعذّر معالجة الصورة في هذا المتصفح', 'This browser cannot process the image'))
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

export async function fileToDataUrl(file: File, maxBytes = 320_000): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(pick('الملف اللي اخترته ليس صورة', 'The selected file is not an image'))
  if (/\.heic$/i.test(file.name) || /\.heif$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif') {
    throw new Error(pick('صيغة HEIC/HEIF غير مدعومة في المتصفح — حولها إلى JPG أو PNG', 'HEIC/HEIF is not supported by browsers — convert it to JPG or PNG'))
  }
  if (file.size > MAX_INPUT_BYTES) throw new Error(pick('حجم الصورة كبير جدًا — الحد الأقصى ٨ ميجابايت', 'Image is too large — 8 MB maximum'))

  const original = await readAsDataURL(file)
  const image = await loadImage(original)

  let width = image.naturalWidth || image.width
  let height = image.naturalHeight || image.height
  const longest = Math.max(width, height)
  if (longest > 1024) {
    width = Math.round((width / longest) * 1024)
    height = Math.round((height / longest) * 1024)
  }

  let quality = 0.82
  let result = exportImage(image, width, height, quality)

  while (result.length > maxBytes && quality > 0.45) {
    quality -= 0.1
    result = exportImage(image, width, height, quality)
  }
  while (result.length > maxBytes && width > 480) {
    width = Math.max(480, Math.round(width * 0.8))
    height = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * width))
    result = exportImage(image, width, height, quality)
  }

  if (result.length > maxBytes) {
    throw new Error(pick('تعذّر ضغط الصورة للحجم المطلوب — جرّب صورة أصغر', 'Could not compress the image enough — try a smaller one'))
  }

  return result
}

export async function filesToDataUrls(files: File[], max = 4): Promise<string[]> {
  if (files.length > max) throw new Error(pick(`تقدر ترفع ${max} صور بس في المنشور الواحد`, `You can upload up to ${max} photos per post`))
  const results: string[] = []
  for (const file of files) results.push(await fileToDataUrl(file))

  const incomingBytes = JSON.stringify(results).length * 2
  if (storageBytes() + incomingBytes + 256 > STORAGE_LIMIT) {
    throw new Error(pick('المساحة المتاحة في المتصفح غير كافية — امسح بعض الصور أو أعد البيانات التجريبية من الإعدادات', 'Not enough browser storage — remove some photos or reset the demo data from Settings'))
  }
  return results
}
