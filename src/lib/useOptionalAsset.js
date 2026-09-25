import { useEffect, useState } from 'react'
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const cache = new Map()

/**
 * Carrega um asset se ele existir; se não, devolve null e a cena segue com o
 * placeholder. Usa o DefaultLoadingManager do three, então entra na
 * porcentagem da tela de loading.
 */
export function useOptionalAsset(url, Loader, prepare) {
  const [asset, setAsset] = useState(() => cache.get(url) ?? null)

  useEffect(() => {
    if (!url) return
    if (cache.has(url)) return setAsset(cache.get(url))
    let alive = true
    new Loader().load(
      url,
      (loaded) => {
        prepare?.(loaded)
        cache.set(url, loaded)
        if (alive) setAsset(loaded)
      },
      undefined,
      (e) => console.info(`[assets] ${url} não encontrado — usando placeholder`, e?.message ?? e),
    )
    return () => {
      alive = false
    }
    // prepare é aplicado uma única vez, no load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return asset
}

export const useOptionalTexture = (url, prepare) =>
  useOptionalAsset(url, TextureLoader, (t) => {
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
    t.anisotropy = 8
    prepare?.(t)
  })

export const useOptionalGLTF = (url) => useOptionalAsset(url, GLTFLoader)
