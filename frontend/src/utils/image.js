// Resize + compress an image file in the browser and return it as a data URL.
// Keeps the saved size small (usually 100-300 KB) so it fits easily in MongoDB.
export function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (PNG, JPG or WEBP).'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))

    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load the image.'))

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        const ctx = canvas.getContext('2d')
        // White background so transparent PNGs do not turn black
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        resolve(canvas.toDataURL('image/jpeg', quality))
      }

      img.src = reader.result
    }

    reader.readAsDataURL(file)
  })
}