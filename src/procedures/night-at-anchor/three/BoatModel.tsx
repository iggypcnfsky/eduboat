import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/models/boat-1/boat-1.gltf'

export const MODEL_SCALE = 1.4
export const MODEL_CENTER_X = 3.65

/** Per-material PBR: matte gelcoat vs glossy trim / stainless. */
const MATERIAL_STYLE: Record<
  string,
  { color: string; roughness: number; metalness: number; envIntensity?: number }
> = {
  mat_0: { color: '#4d6a82', roughness: 0.84, metalness: 0.06 }, // hull — matte gelcoat
  mat_1: { color: '#6d8498', roughness: 0.32, metalness: 0.28 }, // deck trim — semi-gloss
  mat_2: { color: '#2f4558', roughness: 0.9, metalness: 0.04 }, // dark matte areas
  mat_3: { color: '#283848', roughness: 0.78, metalness: 0.1 },
  mat_4: { color: '#95aac0', roughness: 0.22, metalness: 0.42, envIntensity: 1.2 }, // stainless / brightwork
  mat_5: { color: '#506a80', roughness: 0.58, metalness: 0.18 },
}

const SAIL_NODES = ['mainsail', 'forsail']

let sharedRoughnessMap: THREE.CanvasTexture | null = null

function getRoughnessMap() {
  if (sharedRoughnessMap) return sharedRoughnessMap
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const n = 200 + Math.random() * 55
      img.data[i] = n
      img.data[i + 1] = n
      img.data[i + 2] = n
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  sharedRoughnessMap = new THREE.CanvasTexture(canvas)
  sharedRoughnessMap.wrapS = sharedRoughnessMap.wrapT = THREE.RepeatWrapping
  sharedRoughnessMap.repeat.set(6, 6)
  return sharedRoughnessMap
}

function styleMaterial(mat: THREE.Material, isSail: boolean): THREE.Material {
  const m = mat.clone() as THREE.MeshStandardMaterial
  if (!m.isMeshStandardMaterial) return m

  const roughnessMap = getRoughnessMap()

  if (isSail) {
    m.color.set('#a8b8c6')
    m.roughness = 0.94
    m.metalness = 0.02
    m.emissive.set('#1a2430')
    m.emissiveIntensity = 0.1
  } else {
    const style = MATERIAL_STYLE[m.name] ?? { color: '#556e84', roughness: 0.72, metalness: 0.12 }
    m.color.set(style.color)
    m.roughness = style.roughness
    m.metalness = style.metalness
    m.roughnessMap = roughnessMap
    if (style.envIntensity !== undefined) {
      m.envMapIntensity = style.envIntensity
    }
  }

  m.side = THREE.DoubleSide
  return m
}

export function BoatModel() {
  const { scene } = useGLTF(MODEL_URL)

  const prepared = useMemo(() => {
    const root = scene.clone(true)

    root.traverse((obj) => {
      const plain = obj.name.toLowerCase().replace(/[^a-z]/g, '')
      const isSail = SAIL_NODES.some((n) => plain.includes(n))
      if (!(obj as THREE.Mesh).isMesh) return
      const mesh = obj as THREE.Mesh
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((mat) => styleMaterial(mat, isSail))
        : styleMaterial(mesh.material, isSail)
    })

    const group = root.children[0] ?? root
    const box = new THREE.Box3()
    for (const child of group.children) {
      box.setFromObject(child)
      if (box.isEmpty()) continue
      if (box.min.z > 1.4 || box.max.z < -1.4) child.visible = false
    }

    return root
  }, [scene])

  return (
    <primitive
      object={prepared}
      position={[-MODEL_CENTER_X * MODEL_SCALE, 0, 0]}
      scale={MODEL_SCALE}
    />
  )
}

useGLTF.preload(MODEL_URL)
