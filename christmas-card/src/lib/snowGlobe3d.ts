/**
 * 히어로 스노볼 3D 장면. 이 파일은 동적 import로만 불러와,
 * 3D가 실패해도 카드 제작 기능에는 영향이 없습니다.
 */
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { COOKIE_BOX, COOKIE_PATH, ICING, bowWings, smilePoints, type Pt } from './cookieShape';
import { loadCookieModel } from './cookieModel';

export type GlobeHandle = {
  burst: () => void;
  dispose: () => void;
};

type Options = {
  mobile: boolean;
  reducedMotion: boolean;
  modelUrl: string[];
  onCookie?: (source: 'glb' | 'procedural') => void;
  /** 셰이더 컴파일 실패 등으로 3D를 그릴 수 없을 때 */
  onFail?: (reason: string) => void;
};

const COOKIE_SCALE = 0.0043;

function cookieGroup(): THREE.Group {
  const group = new THREE.Group();
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${COOKIE_PATH}"/></svg>`);
  const shapes = svg.paths.flatMap((p) => p.toShapes());

  // 구운 과자 결: 작은 노이즈 텍스처를 범프맵으로 사용
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const cx = c.getContext('2d')!;
  const img = cx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 120 + Math.random() * 90;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  const bump = new THREE.CanvasTexture(c);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(0.02, 0.02);

  const depth = 14;
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: 5,
    bevelSize: 4.5,
    bevelSegments: 5,
    curveSegments: 28,
  });
  // SVG 좌표(y 아래)를 3D(y 위)로: y·z를 함께 뒤집어 면 방향을 유지
  geo.scale(1, -1, -1);
  geo.translate(-COOKIE_BOX.w / 2, COOKIE_BOX.h / 2, 0);
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  const front = geo.boundingBox!.max.z;

  const cookieMat = new THREE.MeshStandardMaterial({
    color: '#B5733D',
    roughness: 0.93,
    metalness: 0,
    bumpMap: bump,
    bumpScale: 0.9,
  });
  group.add(new THREE.Mesh(geo, cookieMat));

  const icingMat = new THREE.MeshStandardMaterial({ color: '#FFF4E1', roughness: 0.42, metalness: 0, emissive: '#3a2a20', emissiveIntensity: 0.12 });
  const bowMat = new THREE.MeshStandardMaterial({ color: '#C71D2A', roughness: 0.32, metalness: 0 });
  const z = front - 1.2;
  const toV = ([x, y]: Pt) => new THREE.Vector3(x - COOKIE_BOX.w / 2, COOKIE_BOX.h / 2 - y, z);

  const dot = (p: Pt, r: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat);
    m.scale.z = 0.55;
    m.position.copy(toV(p));
    m.position.z += r * 0.25;
    group.add(m);
  };
  ICING.eyes.forEach((p) => dot(p, ICING.eyeR, icingMat));
  ICING.buttons.forEach((p) => dot(p, ICING.buttonR, icingMat));

  const tube = (pts: Pt[], smooth: boolean) => {
    const vs = pts.map(toV);
    const path = smooth
      ? new THREE.CatmullRomCurve3(vs)
      : (() => {
          const cp = new THREE.CurvePath<THREE.Vector3>();
          for (let i = 0; i < vs.length - 1; i++) cp.add(new THREE.LineCurve3(vs[i], vs[i + 1]));
          return cp;
        })();
    const r = ICING.lineW / 2;
    const m = new THREE.Mesh(new THREE.TubeGeometry(path, smooth ? 32 : vs.length * 8, r, 8, false), icingMat);
    m.scale.z = 0.7;
    group.add(m);
    for (const v of [vs[0], vs[vs.length - 1]]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), icingMat);
      cap.position.copy(v);
      cap.scale.z = 0.7;
      group.add(cap);
    }
    // 꺾이는 지점을 둥글게
    if (!smooth)
      vs.slice(1, -1).forEach((v) => {
        const j = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), icingMat);
        j.position.copy(v);
        j.scale.z = 0.7;
        group.add(j);
      });
  };
  tube(smilePoints(), true);
  ICING.zigzags.forEach((zz) => tube(zz, false));

  // 나비넥타이
  for (const wing of bowWings()) {
    const shape = new THREE.Shape(wing.map(([x, y]) => new THREE.Vector2(x - COOKIE_BOX.w / 2, COOKIE_BOX.h / 2 - y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.6, bevelSegments: 3 });
    const m = new THREE.Mesh(g, bowMat);
    m.position.z = z;
    group.add(m);
  }
  dot(ICING.bow.c, 5, bowMat);

  group.scale.setScalar(COOKIE_SCALE);
  return group;
}

function tree(h: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#F3E3C6', roughness: 0.95 });
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const r = (0.42 - i * 0.1) * h;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h * 0.42, 20), mat);
    cone.position.y = h * (0.2 + i * 0.22);
    g.add(cone);
  }
  // 꼭대기 별
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? 0.4 : 1;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i) star.lineTo(x, y);
    else star.moveTo(x, y);
  }
  const sg = new THREE.ExtrudeGeometry(star, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 });
  sg.center();
  const s = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: '#F7C66A', roughness: 0.4, emissive: '#7a4a10', emissiveIntensity: 0.35 }));
  s.scale.setScalar(h * 0.085);
  s.position.y = h * 0.86;
  g.add(s);
  return g;
}

function snowFloor(radius: number, y: number): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 64, 0, Math.PI * 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const yy = pos.getY(i);
    const d = Math.hypot(x, yy) / radius;
    const bump = (Math.sin(x * 7) * Math.cos(yy * 6) * 0.025 + 0.06) * (1 - d * d);
    pos.setZ(i, bump);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#FFF6EA', roughness: 1, emissive: '#5a2a24', emissiveIntensity: 0.18 }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

function glass(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {},
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main(){
        float f = 1.0 - max(dot(vN, vV), 0.0);
        float rim = pow(f, 3.0);
        vec3 L = normalize(vec3(-0.55, 0.65, 0.55));
        vec3 Hh = normalize(L + vV);
        float spec = pow(max(dot(vN, Hh), 0.0), 90.0);
        float spec2 = pow(max(dot(vN, normalize(vec3(0.7, -0.2, 0.7) + vV)), 0.0), 160.0);
        vec3 col = mix(vec3(1.0, 0.86, 0.78), vec3(1.0, 0.97, 0.9), rim);
        float a = 0.025 + rim * 0.5 + spec * 0.55 + spec2 * 0.25;
        gl_FragColor = vec4(col + spec * 0.3, clamp(a, 0.0, 0.85));
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat);
  m.renderOrder = 10;
  return m;
}

function base(): THREE.Group {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.0, -0.86),
    new THREE.Vector2(0.72, -0.86),
    new THREE.Vector2(0.78, -0.9),
    new THREE.Vector2(0.82, -1.04),
    new THREE.Vector2(0.92, -1.16),
    new THREE.Vector2(0.92, -1.24),
    new THREE.Vector2(0.0, -1.24),
  ];
  const wood = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), new THREE.MeshStandardMaterial({ color: '#5E1117', roughness: 0.55, metalness: 0.05 }));
  g.add(wood);
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.875, 0.865, 0.035, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: '#F2DDB4', roughness: 0.35, metalness: 0.4 }),
  );
  band.position.y = -1.1;
  g.add(band);
  return g;
}

function snowSprite(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,250,240,0.9)');
  g.addColorStop(1, 'rgba(255,250,240,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function mountSnowGlobe(container: HTMLElement, opts: Options): GlobeHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: !opts.mobile, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  let failed = false;
  renderer.debug.onShaderError = (gl, program) => {
    if (failed) return;
    failed = true;
    opts.onFail?.('셰이더 컴파일 실패: ' + (gl.getProgramInfoLog(program) || '알 수 없음'));
  };
  renderer.domElement.addEventListener('webglcontextlost', () => {
    if (failed) return;
    failed = true;
    opts.onFail?.('WebGL 컨텍스트를 잃었습니다.');
  });
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0.02, 5.1);
  camera.lookAt(0, -0.11, 0);

  scene.add(new THREE.HemisphereLight('#FFF1D0', '#7A1018', 1.25));
  const key = new THREE.DirectionalLight('#FFE7C4', 2.2);
  key.position.set(-2.5, 3, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#FF6A5C', 1.4);
  rim.position.set(2.5, 1, -3);
  scene.add(rim);
  const fill = new THREE.PointLight('#FFD9A8', 2.2, 4, 1.6);
  fill.position.set(0.2, 0.2, 1.4);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);

  const FLOOR_Y = -0.56;
  const inner = new THREE.Group();
  world.add(inner);
  inner.add(snowFloor(Math.sqrt(0.97 * 0.97 - FLOOR_Y * FLOOR_Y), FLOOR_Y));
  // 유리 아래쪽을 채우는 눈 더미(받침대 윗면이 비쳐 보이지 않도록)
  const capStart = Math.acos(FLOOR_Y / 0.97);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.97, 64, 16, 0, Math.PI * 2, capStart, Math.PI - capStart),
    new THREE.MeshStandardMaterial({ color: '#FFF3E4', roughness: 1, emissive: '#6a3a30', emissiveIntensity: 0.45 }),
  );
  inner.add(cap);

  const cookieHolder = new THREE.Group();
  let disposed = false;
  // 제공된 GLB 모델을 우선 사용하고, 불러오지 못하면 같은 윤곽의 절차적 모델로 대체합니다.
  loadCookieModel(opts.modelUrl, 1.2)
    .then((model) => {
      if (disposed) return;
      cookieHolder.add(model);
      opts.onCookie?.('glb');
    })
    .catch((err) => {
      console.warn('[스노볼] 쿠키 GLB를 불러오지 못해 단순 모델로 표시합니다:', err);
      if (disposed) return;
      cookieHolder.add(cookieGroup());
      opts.onCookie?.('procedural');
    })
    .finally(() => {
      renderOnce();
      wake();
    });
  cookieHolder.position.set(0.03, FLOOR_Y + 0.6, 0.1);
  cookieHolder.rotation.z = 0; // 제공 모델 자체가 살짝 기울어진 자세입니다.
  inner.add(cookieHolder);

  const t1 = tree(0.62);
  t1.position.set(-0.5, FLOOR_Y + 0.02, -0.28);
  inner.add(t1);
  const t2 = tree(0.4);
  t2.position.set(0.56, FLOOR_Y + 0.02, -0.34);
  inner.add(t2);

  world.add(base());
  world.add(glass());

  // 눈 입자: 고정된 개수의 버퍼를 재사용하므로 연속 클릭해도 누적되지 않습니다.
  const N = opts.mobile ? 140 : 280;
  const R = 0.9;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const rand = () => {
    for (;;) {
      const x = (Math.random() * 2 - 1) * R;
      const y = FLOOR_Y + Math.random() * (R - FLOOR_Y);
      const z = (Math.random() * 2 - 1) * R;
      if (x * x + y * y + z * z < R * R) return [x, y, z];
    }
  };
  for (let i = 0; i < N; i++) {
    const [x, y, z] = rand();
    pos.set([x, y, z], i * 3);
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snowMat = new THREE.PointsMaterial({
    size: opts.mobile ? 0.05 : 0.04,
    map: snowSprite(),
    transparent: true,
    depthWrite: false,
    color: '#FFFFFF',
    sizeAttenuation: true,
  });
  const snow = new THREE.Points(snowGeo, snowMat);
  snow.renderOrder = 5;
  world.add(snow);

  let energy = 0;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let lastRender = 0;
  const target = { x: 0, y: 0 };
  const tilt = { x: 0, y: 0 };

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderOnce();
  };

  const onPointer = (e: PointerEvent) => {
    if (opts.reducedMotion || e.pointerType === 'touch') return;
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
    wake();
  };

  function step(dt: number, t: number) {
    // 아주 약한 기울기
    tilt.x += (target.y * 0.09 - tilt.x) * Math.min(1, dt * 4);
    tilt.y += (target.x * 0.16 - tilt.y) * Math.min(1, dt * 4);
    world.rotation.x = tilt.x;
    world.rotation.y = tilt.y;
    // 쿠키는 얼굴이 보이는 방향을 유지하며 아주 천천히 흔들립니다.
    if (!opts.reducedMotion) cookieHolder.rotation.y = Math.sin(t * 0.45) * 0.12;

    const fall = opts.reducedMotion ? 0.012 : 0.05;
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      let x = pos[k];
      let y = pos[k + 1];
      let z = pos[k + 2];
      if (energy > 0.001) {
        // 소용돌이
        const sw = energy * 1.8;
        vel[k] += (-z * sw - x * 0.2 * energy) * dt + (Math.random() - 0.5) * energy * dt * 3;
        vel[k + 2] += (x * sw - z * 0.2 * energy) * dt + (Math.random() - 0.5) * energy * dt * 3;
        vel[k + 1] += (Math.random() - 0.35) * energy * dt * 4;
      }
      vel[k + 1] -= fall * dt;
      const damp = Math.pow(0.18, dt);
      vel[k] *= damp;
      vel[k + 1] *= damp;
      vel[k + 2] *= damp;
      x += vel[k] * dt + Math.sin(t * 0.7 + i) * 0.0006;
      y += vel[k + 1] * dt - fall * 0.25 * dt;
      z += vel[k + 2] * dt;
      // 바닥에 닿으면 위쪽에서 다시 떨어짐(유리 안에서만 움직임)
      if (y < FLOOR_Y + 0.02) {
        const [nx, , nz] = rand();
        x = nx * 0.85;
        z = nz * 0.85;
        y = R * 0.85;
        vel[k] = vel[k + 1] = vel[k + 2] = 0;
      }
      const d = Math.hypot(x, y, z);
      if (d > R) {
        const s = R / d;
        x *= s;
        y *= s;
        z *= s;
        vel[k] *= -0.4;
        vel[k + 1] *= -0.4;
        vel[k + 2] *= -0.4;
      }
      pos[k] = x;
      pos[k + 1] = y;
      pos[k + 2] = z;
    }
    snowGeo.attributes.position.needsUpdate = true;
    energy = Math.max(0, energy - dt / 2.4);
  }

  function renderOnce() {
    renderer.render(scene, camera);
  }

  function loop(now: number) {
    raf = 0;
    if (failed || !visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt, now / 1000);
    // 평소에는 30fps, 눈이 흩날릴 때만 60fps
    const minGap = energy > 0 ? 0 : 1000 / 30;
    if (now - lastRender >= minGap) {
      renderOnce();
      lastRender = now;
    }
    if (opts.reducedMotion && energy <= 0) return; // 동작 줄이기: 효과가 끝나면 정지
    raf = requestAnimationFrame(loop);
  }

  function wake() {
    if (!raf && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    },
    { threshold: 0.01 },
  );
  io.observe(container);
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  const onVis = () => wake();
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pointermove', onPointer, { passive: true });

  resize();
  wake();

  return {
    burst() {
      energy = Math.min(1, energy + (opts.reducedMotion ? 0.35 : 0.85));
      if (!opts.reducedMotion) {
        for (let i = 0; i < N; i++) vel[i * 3 + 1] += Math.random() * 0.9;
      }
      wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
