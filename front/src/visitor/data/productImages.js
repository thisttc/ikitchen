// Vite resolves only files that exist. The design stores folder/file keys.
const images = import.meta.glob('../assets/products/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

export function productImageUrl(ref) {
  if (!ref || typeof ref !== 'string') return null
  const localUrl = images[`../assets/products/${ref}`]
  if (localUrl) return localUrl
  try { const u = new URL(ref); return ['http:', 'https:'].includes(u.protocol) ? u.href : null } catch { return null }
}
const bitmapCache = new Map()
export function loadProductBitmap(ref) {
  const url = productImageUrl(ref)
  if (!url) return Promise.resolve(null)
  if (!bitmapCache.has(url)) {
    const promise = new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('โหลดไฟล์ภาพสินค้าไม่สำเร็จ'))
      img.src = url
    }).catch(error => { bitmapCache.delete(url); throw error })
    bitmapCache.set(url, promise)
  }
  return bitmapCache.get(url)
}
