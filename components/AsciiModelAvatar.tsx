'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Extremely clean matrix/terminal progression mimicking the reference image
const DENSITY_RAMP = '   ...---:::===+++***???%%%@@@###WWW';
// Uppercase and distinct characters to match the bold clean look of the reference
const CRYPTO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&*';
const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const SYMBOLS = '░▒▓█▄▀▐▌■□●○◆◇◈▲△▼▽★☆⬡⬢⊕⊗⊞⊟∞≈≠±×÷√∑∏∫∂Δ∇Ω';

// Morph target name candidates
const MOUTH_NAMES = [
  'mouthOpen', 'jawOpen', 'mouth_open', 'jaw_open',
  'viseme_aa', 'viseme_O', 'Mouth_Open', 'JawOpen',
  'A', 'aa', 'oh', 'MouthOpen',
];
const SMILE_NAMES = ['mouthSmile', 'mouth_smile', 'Mouth_Smile', 'smile'];
const BLINK_NAMES = [
  'eyesClosed', 'eyeBlink', 'eyeBlinkLeft', 'eyeBlinkRight',
  'eye_blink', 'EyesClosed', 'Blink', 'blink', 'eyes_closed',
];

function findMorph(dict: Record<string, number>, names: string[]): number | undefined {
  for (const n of names) if (dict[n] !== undefined) return dict[n];
  return undefined;
}

function charForBrightness(brightness: number): string {
  const boosted = Math.pow(brightness, 0.65);
  const idx = Math.min(
    DENSITY_RAMP.length - 1,
    Math.max(0, Math.floor(boosted * (DENSITY_RAMP.length - 1)))
  );
  return DENSITY_RAMP[idx];
}

interface Props {
  amplitude: number;
  modelUrl?: string;
  humanMode?: boolean;
  onLoaded?: () => void;
  onProgress?: (pct: number) => void;
}

export default function AsciiModelAvatar({
  amplitude,
  modelUrl = '/model.glb',
  humanMode = false,
  onLoaded,
  onProgress,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ampRef = useRef(0);
  const zoomRef = useRef(0);
  const mouseCanvasRef = useRef({ x: -1, y: -1 });
  const mouseScreenRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, rotY: 0, rotX: 0 });
  const modelRotRef = useRef({ y: 0, x: 0 });
  const humanModeRef = useRef(humanMode);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => { ampRef.current = amplitude; }, [amplitude]);
  useEffect(() => { humanModeRef.current = humanMode; }, [humanMode]);

  // ── Mouse / wheel / drag listeners ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseCanvasRef.current.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      mouseCanvasRef.current.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      mouseScreenRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseScreenRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (dragRef.current.active) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        modelRotRef.current.y = dragRef.current.rotY + dx * 0.006;
        modelRotRef.current.x = dragRef.current.rotX + dy * 0.004;
        modelRotRef.current.x = Math.max(-0.6, Math.min(0.6, modelRotRef.current.x));
      }
    };
    const onLeave = () => {
      mouseCanvasRef.current.x = -1;
      mouseCanvasRef.current.y = -1;
      dragRef.current.active = false;
    };
    const onDown = (e: MouseEvent) => {
      dragRef.current.active = true;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.rotY = modelRotRef.current.y;
      dragRef.current.rotX = modelRotRef.current.x;
      canvas.style.cursor = 'grabbing';
    };
    const onUp = () => {
      dragRef.current.active = false;
      canvas.style.cursor = 'grab';
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 0.05 : -0.05;
      zoomRef.current = Math.max(-0.3, Math.min(1, zoomRef.current + delta));
    };

    const onTouchDown = (e: TouchEvent) => {
      dragRef.current.active = true;
      dragRef.current.startX = e.touches[0].clientX;
      dragRef.current.startY = e.touches[0].clientY;
      dragRef.current.rotY = modelRotRef.current.y;
      dragRef.current.rotX = modelRotRef.current.x;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      modelRotRef.current.y = dragRef.current.rotY + dx * 0.006;
      modelRotRef.current.x = dragRef.current.rotX + dy * 0.004;
      modelRotRef.current.x = Math.max(-0.6, Math.min(0.6, modelRotRef.current.x));
    };

    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none'; // Prevent scrolling while rotating
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onTouchDown, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onUp);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', onTouchDown);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onUp);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  // ── Canvas-based ASCII Render ──────────────────
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.style.position = 'relative';

    const w = container.clientWidth || 900;
    const h = container.clientHeight || 650;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x0a0a0a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // ASCII Setup (Pixel-Perfect Grid)
    const fontSize = 9; // Increased slightly to heavily optimize frame performance (reduces loop iterations by ~40%)
    const charWidth = fontSize * 0.55; // Standard monospace aspect ratio
    const charHeight = fontSize;
    const cols = Math.floor(w / charWidth);
    const rows = Math.floor(h / charHeight);

    const renderTarget = new THREE.WebGLRenderTarget(cols, rows, {
      format: THREE.RGBAFormat,
    });
    const pixelBuffer = new Uint8Array(cols * rows * 4);

    // Front facing Canvas
    const canvas2d = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas2d.width = w * dpr;
    canvas2d.height = h * dpr;
    canvas2d.style.position = 'absolute';
    canvas2d.style.top = '0';
    canvas2d.style.left = '0';
    canvas2d.style.width = '100%';
    canvas2d.style.height = '100%';
    canvas2d.style.cursor = 'grab';
    canvas2d.style.opacity = '0'; // start hidden
    container.appendChild(canvas2d);

    const ctx = canvas2d.getContext('2d', { alpha: false })!;
    ctx.scale(dpr, dpr);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, w / h, 0.01, 200);
    camera.position.set(0, 1.6, 2.8);
    camera.lookAt(0, 1.6, 0);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // High-contrast dramatic lighting to define facial features distinctly
    scene.add(new THREE.AmbientLight(0xffffff, 0.15)); // Increased ambient slightly to rescue pure dark sockets

    // Strong, sharp key light specifically from the right/top to carve out the contour
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    keyLight.position.set(3, 2, 4);
    scene.add(keyLight);

    // Dedicated straight-on front light to penetrate the eye sockets and mouth cavity, ensuring eyeballs are visible
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontLight.position.set(0, 0, 5);
    scene.add(frontLight);

    // Fill light on the left so it isn't completely pitch black
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight.position.set(-3, 1, 2);
    scene.add(fillLight);

    // Strong rim light from behind to give the jaw and shoulders edge definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
    rimLight.position.set(-2, 3, -4);
    scene.add(rimLight);

    let morphMesh: (THREE.Mesh & {
      morphTargetDictionary?: Record<string, number>;
      morphTargetInfluences?: number[];
    }) | null = null;
    let jawIdx: number | undefined;
    let smileIdx: number | undefined;
    let blinkLIdx: number | undefined;
    let blinkRIdx: number | undefined;
    let headBone: THREE.Object3D | null = null;
    let modelLoaded = false;
    let modelLoadedTime = 0;

    let headCenter = new THREE.Vector3(0, 1.6, 0);
    let baseZ = 2.8;

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        if (gltf.animations && gltf.animations.length > 0) {
          console.log('[3DDebug] Animations:', gltf.animations.map(a => `${a.name} (${a.duration.toFixed(2)}s)`));
          const mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.play();
          action.paused = true;
          mixer.setTime(0);
          mixer.update(0);
        } else {
          console.log('[3DDebug] No animations in GLB');
        }

        model.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            if (mesh.morphTargetDictionary && Object.keys(mesh.morphTargetDictionary).length > 0 && !morphMesh) {
              morphMesh = mesh as any;
              const dict = mesh.morphTargetDictionary;
              console.log('[3DDebug] Morph targets:', Object.keys(dict));
              jawIdx = findMorph(dict, MOUTH_NAMES);
              smileIdx = findMorph(dict, SMILE_NAMES);
              blinkLIdx = dict['eyeBlinkLeft'] ?? dict['eye_blink_left'];
              blinkRIdx = dict['eyeBlinkRight'] ?? dict['eye_blink_right'];
              if (blinkLIdx === undefined) {
                blinkLIdx = findMorph(dict, BLINK_NAMES);
                blinkRIdx = undefined;
              }
              console.log('[3DDebug] Jaw:', jawIdx, '| BlinkL:', blinkLIdx, '| BlinkR:', blinkRIdx);
            }
          }
          const n = obj.name.toLowerCase();
          if (!headBone && (n === 'head' || n.includes('head'))) headBone = obj;
        });

        const allBones: string[] = [];
        model.traverse((obj) => {
          if ((obj as THREE.Bone).isBone) allBones.push(obj.name);
        });
        console.log('[3DDebug] All bones:', allBones);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        headCenter = new THREE.Vector3(center.x, box.max.y - size.y * 0.12, center.z);
        const fov = camera.fov * (Math.PI / 180);
        const headRegion = size.y * 0.28;
        baseZ = (headRegion / 2) / Math.tan(fov / 2) * 1.15;

        camera.position.set(headCenter.x, headCenter.y, headCenter.z + baseZ);
        camera.lookAt(headCenter);
        camera.updateProjectionMatrix();

        // Nudge the model slightly right to correct its default left-facing orientation
        model.rotation.y = 0.35;
        pivot.add(model);
        modelLoaded = true;
        modelLoadedTime = Date.now();
        onLoaded?.();
      },
      (progress) => {
        if (progress.total > 0) onProgress?.(Math.round((progress.loaded / progress.total) * 100));
      },
      (err) => {
        console.error('[3DDebug] Load error:', err);
        setLoadError('Failed to load 3D model');
      },
    );

    let t = 0;
    let lastBlink = 0;
    let blinkActive = false;
    let animId: number;
    let smoothRotY = 0;
    let smoothRotX = 0;
    const mouseHover = { x: -1000, y: -1000 };

    const onDown = (e: MouseEvent) => {
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, rotY: modelRotRef.current.y, rotX: modelRotRef.current.x };
      canvas2d.style.cursor = 'grabbing';
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas2d.getBoundingClientRect();
      mouseHover.x = e.clientX - rect.left;
      mouseHover.y = e.clientY - rect.top;

      if (dragRef.current.active) {
        modelRotRef.current.y = dragRef.current.rotY + (e.clientX - dragRef.current.startX) * 0.006;
        modelRotRef.current.x = Math.max(-0.6, Math.min(0.6, dragRef.current.rotX + (e.clientY - dragRef.current.startY) * 0.004));
      }
    };
    const onLeave = () => {
      mouseHover.x = -1000;
      mouseHover.y = -1000;
    };
    const onUp = () => { dragRef.current.active = false; canvas2d.style.cursor = 'grab'; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.08 : -0.08;
      // Allow much deeper zoom in (-0.8) and standard zoom out (0.7)
      zoomRef.current = Math.max(-0.8, Math.min(0.7, zoomRef.current + delta));
    };

    const onTouchDown = (e: TouchEvent) => {
      dragRef.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, rotY: modelRotRef.current.y, rotX: modelRotRef.current.x };
    };
    const onTouchMoveForDistortion = (e: TouchEvent) => {
      const rect = canvas2d.getBoundingClientRect();
      mouseHover.x = e.touches[0].clientX - rect.left;
      mouseHover.y = e.touches[0].clientY - rect.top;

      if (dragRef.current.active) {
        modelRotRef.current.y = dragRef.current.rotY + (e.touches[0].clientX - dragRef.current.startX) * 0.006;
        modelRotRef.current.x = Math.max(-0.6, Math.min(0.6, dragRef.current.rotX + (e.touches[0].clientY - dragRef.current.startY) * 0.004));
      }
    };

    canvas2d.style.touchAction = 'none';
    canvas2d.addEventListener('mousedown', onDown);
    canvas2d.addEventListener('mouseleave', onLeave);
    canvas2d.addEventListener('wheel', onWheel, { passive: false });
    canvas2d.addEventListener('touchstart', onTouchDown, { passive: true });
    canvas2d.addEventListener('touchmove', onTouchMoveForDistortion, { passive: true });
    canvas2d.addEventListener('touchend', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    function draw() {
      t += 0.016;
      const amp = ampRef.current;

      if (morphMesh?.morphTargetInfluences) {
        const inf = morphMesh.morphTargetInfluences;
        if (jawIdx !== undefined) {
          // Exaggerate jaw movement heavily to ensure the mouth cavity shadow drives a visible ASCII change
          inf[jawIdx] = THREE.MathUtils.lerp(inf[jawIdx], amp * 2.2, 0.4);
        }
        if (smileIdx !== undefined) {
          inf[smileIdx] = THREE.MathUtils.lerp(inf[smileIdx], 0.06, 0.04);
        }
        // Keep the eyes closed slightly longer and make blinks more frequent so they stand out
        if (t - lastBlink > (blinkActive ? 0.25 : 2.5 + Math.random() * 2.5)) {
          blinkActive = !blinkActive;
          lastBlink = t;
        }
        // Overshoot blink target to 1.3 to guarantee full eye closure and dramatic shadow change
        const bv = blinkActive ? 1.3 : 0;
        if (blinkLIdx !== undefined) inf[blinkLIdx] = THREE.MathUtils.lerp(inf[blinkLIdx], bv, 0.5);
        if (blinkRIdx !== undefined) inf[blinkRIdx] = THREE.MathUtils.lerp(inf[blinkRIdx], bv, 0.5);
      }

      smoothRotY = THREE.MathUtils.lerp(smoothRotY, modelRotRef.current.y, 0.08);
      smoothRotX = THREE.MathUtils.lerp(smoothRotX, modelRotRef.current.x, 0.08);

      // Idle sway: starts at zero and gradually eases in over 6 seconds after model loads
      // so the clone looks straight at center during the initial reveal transition
      const swayEase = modelLoaded ? Math.min(1, (Date.now() - modelLoadedTime) / 6000) : 0;
      const idleSwayX = Math.sin(t * 0.8) * 0.03 * swayEase;
      const idleSwayY = Math.sin(t * 0.5) * 0.15 * swayEase;
      const idleSwayZ = Math.cos(t * 0.6) * 0.02 * swayEase;

      pivot.rotation.y = smoothRotY + idleSwayY;
      pivot.rotation.x = smoothRotX + idleSwayX;
      pivot.rotation.z = idleSwayZ;

      if (modelLoaded) {
        const zoom = zoomRef.current;
        // Decrease closeZ drastically so users can zoom deeply into the ascii face
        const closeZ = baseZ * 0.35;
        const farZ = baseZ * 2.2;

        const targetZ = headCenter.z + (zoom < 0
          ? THREE.MathUtils.lerp(baseZ, closeZ, Math.abs(zoom))
          : THREE.MathUtils.lerp(baseZ, farZ, zoom));

        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);
        camera.position.x = headCenter.x;
        const camY = headCenter.y - Math.max(0, zoom) * 0.25;
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, camY, 0.08);
        const lookY = headCenter.y - Math.max(0, zoom) * 0.35;
        camera.lookAt(headCenter.x, lookY, headCenter.z);
      }

      // Transition Math
      // After the initial intro transition completes, humanMode controls the crossfade direction
      let transitionVal = 0;
      if (modelLoaded) {
        const elapsed = Date.now() - modelLoadedTime;
        // Initial intro: wait 1200ms then transition to ASCII over 3500ms
        const introProgress = Math.max(0, Math.min(1, (elapsed - 1200) / 3500));

        if (introProgress < 1) {
          // Still in intro sequence
          transitionVal = introProgress;
          if (introProgress > 0 && introProgress < 1) {
            if (Math.random() < 0.15) {
              transitionVal = Math.random() > 0.5 ? 1 : 0;
            }
          }
        } else {
          // Intro is done — humanMode controls which renderer is visible
          // humanMode ON → show 3D (transitionVal = 0), humanMode OFF → show ASCII (transitionVal = 1)
          const targetVal = humanModeRef.current ? 0 : 1;
          // Smooth transition between states
          const prevVal = parseFloat(canvas2d.style.opacity || '1');
          transitionVal = prevVal + (targetVal - prevVal) * 0.06;
          // Glitch effect while transitioning between modes
          if (Math.abs(transitionVal - targetVal) > 0.05 && Math.random() < 0.12) {
            transitionVal = Math.random() > 0.5 ? 1 : 0;
          }
        }
      }

      // Update opacities to crossfade
      renderer.domElement.style.opacity = (1 - transitionVal).toString();
      canvas2d.style.opacity = transitionVal.toString();

      // Render offscreen target for ASCII
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(renderTarget, 0, 0, cols, rows, pixelBuffer);

      // Render 3D directly to screen for the actual face
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      // Draw ASCII to canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h); // Fill logical size, as context is scaled

      ctx.font = `600 ${fontSize}px "SF Mono", Consolas, JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const time = t;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const bufferY = rows - 1 - y;
          const i = (bufferY * cols + x) * 4;
          const r = pixelBuffer[i];
          const g = pixelBuffer[i + 1];
          const b = pixelBuffer[i + 2];

          const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

          if (brightness > 0.015) { // Lower threshold to capture very faint edges like hair
            let char = charForBrightness(brightness);

            // Calculate physical distance to mouse for hover distortion
            const charX = x * charWidth + charWidth * 0.5;
            const charY = y * charHeight + charHeight * 0.5;
            const dx = Math.abs(charX - mouseHover.x);
            const dy = Math.abs(charY - mouseHover.y);

            // Bounding box early exit to save Math.sqrt calls and heavily boost JS performance
            let isHoverDistorted = false;
            if (dx < 45 && dy < 45) {
              const distSq = dx * dx + dy * dy;
              if (distSq < 2025) { // 45 squared
                const dist = Math.sqrt(distSq);
                const distortionIntensity = 1.0 - (dist / 45);
                if (Math.random() < distortionIntensity * 0.25) {
                  char = CRYPTO[Math.floor(Math.random() * CRYPTO.length)];
                  isHoverDistorted = true;
                }
              }
            }

            // Subtle matrix/crypto effect on bright areas (replaced Math.sin with purely Math.random for speed)
            if (!isHoverDistorted && brightness > 0.3 && Math.random() < 0.02) {
              char = CRYPTO[Math.floor(Math.random() * CRYPTO.length)];
            }

            // Round alpha to discrete steps to prevent massive canvas state-change bottleneck
            let baseAlpha = 0.4;
            if (brightness > 0.6) baseAlpha = 0.9;
            else if (brightness > 0.3) baseAlpha = 0.6;

            const alpha = isHoverDistorted ? 1.0 : baseAlpha;
            ctx.fillStyle = `rgba(235, 235, 235, ${alpha})`;
            ctx.fillText(char, charX, charY);
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      canvas2d.removeEventListener('mousedown', onDown);
      canvas2d.removeEventListener('mouseleave', onLeave);
      canvas2d.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (container.contains(canvas2d)) container.removeChild(canvas2d);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
      renderTarget.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach(m => m?.dispose());
          mesh.geometry?.dispose();
        }
      });
    };
  }, [modelUrl, onLoaded, onProgress]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/30 font-mono text-xs">
        {loadError}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[350px] md:min-h-[400px]"
    />
  );
}
