import * as THREE from 'three';
import { loadCookieModel } from '../src/lib/cookieModel';

const W = 900;
const H = 1040;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(22, W / H, 0.1, 50);
camera.position.set(0, 0, 3.2);
scene.add(new THREE.HemisphereLight('#FFF4DE', '#8A3A22', 1.6));
const key = new THREE.DirectionalLight('#FFE9CC', 2.6);
key.position.set(-1.5, 2, 3);
scene.add(key);
const fill = new THREE.DirectionalLight('#FFD8B0', 0.9);
fill.position.set(2, -0.5, 2);
scene.add(fill);

loadCookieModel(import.meta.env.BASE_URL + 'models/gingerbread_cookie.glb', 1.08)
  .then((cookie) => {
    cookie.rotation.y = -0.18;
    scene.add(cookie);
    renderer.render(scene, camera);
    (window as unknown as { __cookiePng: string }).__cookiePng = renderer.domElement.toDataURL('image/png');
  })
  .catch((e) => {
    (window as unknown as { __cookieErr: string }).__cookieErr = String(e);
  });
