import Ceramic from '@ceramicnetwork/http-client'
import { IDX } from '@ceramicstudio/idx'
import type {
  BasicProfile,
  ImageMetadata,
  ImageSources,
} from '@ceramicstudio/idx-constants'

import { CERAMIC_URL, IPFS_PREFIX, IPFS_URL } from './constants'

export type Dimensions = { height: number; width: number }
export type SizeMode = 'contain' | 'cover'

const ceramic = new Ceramic(CERAMIC_URL)
export const idx = new IDX({ ceramic })

export async function loadProfile(did: string): Promise<BasicProfile | null> {
  try {
    return await idx.get('basicProfile', did)
  } catch (err) {
    return null
  }
}

export function formatDID(did: string): string {
  return did.length <= 20 ? did : `${did.slice(0, 10)}...${did.slice(-6, -1)}`
}

function selectCover(
  options: Array<ImageMetadata>,
  { height, width }: Dimensions,
): ImageMetadata | null {
  let selected: ImageMetadata | null = null
  for (const option of options) {
    if (
      option.height >= height &&
      option.width >= width &&
      (selected === null ||
        (selected.size != null &&
          option.size != null &&
          option.size < selected.size) ||
        option.height * option.width < selected.height * selected.width)
    ) {
      selected = option
    }
  }
  return selected
}

function selectContain(
  options: Array<ImageMetadata>,
  { height, width }: Dimensions,
): ImageMetadata | null {
  let selected: ImageMetadata | null = null
  for (const option of options) {
    if (
      option.height <= height &&
      option.width <= width &&
      (selected === null ||
        (selected.size != null &&
          option.size != null &&
          option.size < selected.size) ||
        option.height * option.width > selected.height * selected.width)
    ) {
      selected = option
    }
  }
  return selected
}

export function selectImageSource(
  sources: ImageSources,
  dimensions: Dimensions,
  mode: SizeMode = 'cover',
): ImageMetadata {
  let alternative: ImageMetadata | null = null
  if (Array.isArray(sources.alternatives)) {
    alternative =
      mode === 'cover'
        ? selectCover(sources.alternatives, dimensions)
        : selectContain(sources.alternatives, dimensions)
  }
  return alternative ?? sources.original
}

export function toImageSrc(image: ImageMetadata): string {
  return image.src.replace(IPFS_PREFIX, IPFS_URL)
}

export function getImageSrc(
  sources: ImageSources,
  dimensions: Dimensions,
  mode?: SizeMode,
) {
  return toImageSrc(selectImageSource(sources, dimensions, mode))
}
