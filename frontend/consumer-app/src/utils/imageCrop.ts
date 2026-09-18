export interface CropPosition {
  x: number
  y: number
  zoom: number
}

export interface ImageDimensions {
  width: number
  height: number
}

/**
 * Calculates the base scale needed to completely cover the crop circle of diameter `cropSize`.
 */
export function getBaseScale(image: ImageDimensions, cropSize: number): number {
  if (image.width <= 0 || image.height <= 0 || cropSize <= 0) return 1
  return Math.max(cropSize / image.width, cropSize / image.height)
}

/**
 * Clamps the drag offset (x, y) so the image always covers the crop circle without empty gaps.
 */
export function clampOffset(
  offset: { x: number; y: number },
  image: ImageDimensions,
  cropSize: number,
  zoom: number
): { x: number; y: number } {
  const baseScale = getBaseScale(image, cropSize)
  const effectiveZoom = Math.max(1, zoom)
  const renderedWidth = image.width * baseScale * effectiveZoom
  const renderedHeight = image.height * baseScale * effectiveZoom

  const maxOffsetX = Math.max(0, (renderedWidth - cropSize) / 2)
  const maxOffsetY = Math.max(0, (renderedHeight - cropSize) / 2)

  const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x))
  const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y))
  return {
    x: Object.is(clampedX, -0) ? 0 : clampedX,
    y: Object.is(clampedY, -0) ? 0 : clampedY,
  }
}

/**
 * Renders the cropped circular area of an image element to a canvas and returns a File.
 */
export async function createCroppedImageFile(
  imageElement: HTMLImageElement,
  cropPosition: CropPosition,
  cropSize: number,
  outputSize = 512,
  fileName = 'avatar.jpg',
  mimeType = 'image/jpeg',
  quality = 0.92
): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D canvas context')

  // Brand background fill to prevent transparent artifacts if converting PNG
  ctx.fillStyle = '#060F1F'
  ctx.fillRect(0, 0, outputSize, outputSize)

  const imageDims = {
    width: imageElement.naturalWidth || imageElement.width,
    height: imageElement.naturalHeight || imageElement.height,
  }
  const baseScale = getBaseScale(imageDims, cropSize)
  const renderedWidth = imageDims.width * baseScale * cropPosition.zoom
  const renderedHeight = imageDims.height * baseScale * cropPosition.zoom

  const clamped = clampOffset(cropPosition, imageDims, cropSize, cropPosition.zoom)

  // Top-left of rendered image relative to center of crop circle
  const renderLeft = cropSize / 2 + clamped.x - renderedWidth / 2
  const renderTop = cropSize / 2 + clamped.y - renderedHeight / 2

  // Scale to output resolution
  const multiplier = outputSize / cropSize
  const dx = renderLeft * multiplier
  const dy = renderTop * multiplier
  const dw = renderedWidth * multiplier
  const dh = renderedHeight * multiplier

  ctx.drawImage(imageElement, dx, dy, dw, dh)

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob from canvas.'))
          return
        }
        const file = new File([blob], fileName, { type: mimeType })
        resolve(file)
      },
      mimeType,
      quality
    )
  })
}
