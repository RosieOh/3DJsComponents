import React, { Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, KeyboardControls, useKeyboardControls, PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'

function MountainTempleModel() {
  const gltf = useGLTF('/model/mountain_temple/scene.gltf') as any

  // Freeze the scene graph to avoid accidental mutations
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])

  return <primitive object={scene} />
}

useGLTF.preload('/model/mountain_temple/scene.gltf')

export default function BackgroundScene() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }} aria-hidden>
      <Canvas
        camera={{ position: [5, 3, 6], fov: 50 }}
        shadows
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
        }}
      >
        <KeyboardControls
          map={[
            { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
            { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
            { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
            { name: 'right', keys: ['ArrowRight', 'KeyD'] },
            { name: 'boost', keys: ['ShiftLeft', 'ShiftRight'] },
          ]}
        >
          <Suspense fallback={null}>
            {/* Subtle lighting for outdoor scene */}
            <ambientLight intensity={0.5} />
            <hemisphereLight intensity={0.6} groundColor={0x404040} color={0xffffff} />
            <directionalLight position={[5, 10, 5]} intensity={1.0} castShadow />

            <group position={[0, -1, 0]}>
              <MountainTempleModel />
            </group>

            <PlayerMover />
            <PointerLockControls />
            <ScrollZoom />
          </Suspense>
        </KeyboardControls>
      </Canvas>
      {/* Simple gradient overlay to keep foreground text readable */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.0) 60%)', pointerEvents: 'none' }} />
      
    </div>
  )
}

function PlayerMover() {
  const { camera } = useThree()
  const [, get] = useKeyboardControls()

  useFrame((_, delta) => {
    const baseSpeed = 8
    const boost = get().boost ? 3 : 1
    const speed = baseSpeed * boost * delta

    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3().crossVectors(forward, camera.up).negate().normalize()

    const move = new THREE.Vector3()
    if (get().forward) move.add(forward)
    if (get().backward) move.sub(forward)
    if (get().left) move.sub(right)
    if (get().right) move.add(right)

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed)
      camera.position.add(move)
    }
  })

  return null
}

function ScrollZoom() {
  const { camera, gl } = useThree()

  React.useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const zoomSpeed = 0.004 // higher = more sensitive
      const amount = e.deltaY * zoomSpeed
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      camera.position.addScaledVector(forward, amount)
    }
    const el = gl.domElement
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => el.removeEventListener('wheel', onWheel)
  }, [camera, gl])

  return null
}


