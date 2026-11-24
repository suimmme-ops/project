/**
 * 제공받은 진저브레드 GLB(public/models/gingerbread_cookie.glb)를 불러와
 * 높이를 맞추고 중심을 원점에 둡니다. 모델의 앞면(아이싱)은 +Z 방향입니다.
 * 웹용 사본은 원본(19.8MB)을 텍스처 1024px·WebP, 메시 meshopt 압축으로 줄인 것(1.75MB)입니다.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/**
 * url 목록을 순서대로 시도합니다. 기본은 .glb이고, .glb를 올릴 수 없는 곳(예: claude.ai 미리보기)에는
 * 같은 모델을 glTF JSON(데이터 내장)으로 바꾼 사본을 둡니다.
 */
export async function loadCookieModel(urls: string | string[], height: number): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const list = Array.isArray(urls) ? urls : [urls];
  let gltf: Awaited<ReturnType<GLTFLoader['loadAsync']>> | null = null;
  let lastErr: unknown = null;
  for (const url of list) {
    try {
      gltf = await loader.loadAsync(url);
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!gltf) throw lastErr ?? new Error('쿠키 모델을 불러오지 못했습니다.');
  const model = gltf.scene;

  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const std = m as THREE.MeshStandardMaterial;
      if (!std.isMeshStandardMaterial) continue;
      // 유리 안에서도 쿠키가 탁하거나 어둡게 보이지 않도록 아주 약한 자체 밝기만 더합니다.
      if (std.name === 'royal_icing') {
        std.emissive = new THREE.Color('#3a2a1e');
        std.emissiveIntensity = 0.25;
      }
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  if (!size.y) throw new Error('쿠키 모델의 크기를 읽지 못했습니다.');
  model.position.sub(center);
  const holder = new THREE.Group();
  holder.add(model);
  holder.scale.setScalar(height / size.y);
  return holder;
}
