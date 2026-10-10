import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js";

const host = document.querySelector("#ash-crown-3d");
if (host) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", "Interactive Ashen Crown 3D model");
  host.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0a09, 0.055);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(3.6, 2.7, 5.4);

  scene.add(new THREE.HemisphereLight(0xc7d7e5, 0x16100d, 1.35));
  const key = new THREE.DirectionalLight(0xffd1a1, 2.15);
  key.position.set(4, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.bias = -.00025;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7f9cff, 1.0);
  rim.position.set(-3, 4, -5);
  scene.add(rim);

  const envCanvas = document.createElement('canvas');
  envCanvas.width = 256; envCanvas.height = 128;
  const envContext = envCanvas.getContext('2d');
  const envGradient = envContext.createLinearGradient(0, 0, 0, 128);
  envGradient.addColorStop(0, '#1a2c46');
  envGradient.addColorStop(.42, '#8799a9');
  envGradient.addColorStop(.56, '#d9b58e');
  envGradient.addColorStop(1, '#17120f');
  envContext.fillStyle = envGradient;
  envContext.fillRect(0, 0, 256, 128);
  envContext.fillStyle = 'rgba(255,224,181,.95)';
  envContext.fillRect(48, 22, 28, 5);
  envContext.fillRect(172, 33, 38, 6);
  const envTexture = new THREE.CanvasTexture(envCanvas);
  envTexture.colorSpace = THREE.SRGBColorSpace;
  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = envTexture;
  scene.environmentIntensity = .45;

  const root = new THREE.Group();
  scene.add(root);

  const metal = new THREE.MeshStandardMaterial({ color:0x25201b, metalness:.88, roughness:.24 });
  const ember = new THREE.MeshStandardMaterial({ color:0xff713c, emissive:0xff3b12, emissiveIntensity:4.2, metalness:.1, roughness:.2 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, .24, 48), metal);
  base.castShadow = true; base.receiveShadow = true;
  root.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, .12, 14, 64), metal);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .28;
  ring.castShadow = true; ring.receiveShadow = true;
  root.add(ring);

  for (let i=0;i<8;i++) {
    const a=i*Math.PI*2/8;
    const spike=new THREE.Mesh(new THREE.ConeGeometry(.16,.95,5),metal);
    spike.position.set(Math.cos(a)*.82,.72,Math.sin(a)*.82);
    spike.rotation.z=-Math.cos(a)*.35;
    spike.rotation.x=Math.sin(a)*.35;
    root.add(spike);
  }

  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.36,2),ember);
  core.position.y=.72;
  root.add(core);

  const aura=new THREE.Mesh(
    new THREE.SphereGeometry(.75,32,32),
    new THREE.MeshBasicMaterial({color:0xff4f21,transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false})
  );
  aura.position.copy(core.position);
  root.add(aura);

  const floor=new THREE.Mesh(
    new THREE.CircleGeometry(3.2,64),
    new THREE.MeshStandardMaterial({color:0x120f0c,roughness:.95,metalness:.05})
  );
  floor.rotation.x=-Math.PI/2;
  floor.position.y=-.14;
  floor.receiveShadow = true;
  scene.add(floor);

  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;
  controls.enablePan=false;
  controls.minDistance=3.4;
  controls.maxDistance=8;
  controls.target.set(0,.45,0);
  controls.autoRotate=true;
  controls.autoRotateSpeed=.65;

  function normalizeModelToHeight(model, targetHeight) {
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);
    const sourceBounds = new THREE.Box3().setFromObject(model);
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    if (sourceSize.y > 1e-4) model.scale.multiplyScalar(targetHeight / sourceSize.y);

    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    model.position.x -= (bounds.min.x + bounds.max.x) * .5;
    model.position.y -= bounds.min.y;
    model.position.z -= (bounds.min.z + bounds.max.z) * .5;
    model.updateMatrixWorld(true);
  }

  function prepareModelMaterials(model) {
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);
    model.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material) continue;
        if (material.map) {
          material.map.colorSpace = THREE.SRGBColorSpace;
          material.map.anisotropy = anisotropy;
        }
        if (material.emissiveMap) {
          material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
          material.emissiveMap.anisotropy = anisotropy;
        }
        for (const texture of [material.normalMap, material.metalnessMap, material.roughnessMap, material.aoMap]) {
          if (texture) texture.anisotropy = anisotropy;
        }
        if ('roughness' in material) material.roughness = THREE.MathUtils.clamp(material.roughness, .18, .96);
        material.needsUpdate = true;
      }
    });
  }

  const loader=new GLTFLoader();
  const configuredModel=host.dataset.model;
  let modelRequested=false;
  function loadConfiguredModel(){
    if(modelRequested||!configuredModel)return;
    modelRequested=true;
    loader.load(configuredModel, gltf => {
      const retainedMaterials = new Set();
      for (const retained of [base, ring]) {
        const materials = Array.isArray(retained.material) ? retained.material : [retained.material];
        materials.filter(Boolean).forEach(material => retainedMaterials.add(material));
      }
      const disposedMaterials = new Set();
      for(const child of [...root.children]){
        if (child === base || child === ring) continue;
        root.remove(child);
        child.traverse?.(object=>{
          object.geometry?.dispose();
          const materials=Array.isArray(object.material)?object.material:[object.material];
          materials.filter(Boolean).forEach(material=>{
            if (!retainedMaterials.has(material) && !disposedMaterials.has(material)) {
              material.dispose();
              disposedMaterials.add(material);
            }
          });
        });
      }
      normalizeModelToHeight(gltf.scene, 2.08);
      prepareModelMaterials(gltf.scene);
      gltf.scene.position.y = .14;
      gltf.scene.name = 'AshenSentinel_Showcase';
      root.add(gltf.scene);
    }, undefined, err => console.warn("Ashen Crown production model fallback active:", err));
  }

  const resize=()=>{
    const w=host.clientWidth, h=Math.max(320,host.clientHeight);
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  };
  let inView=false,rafId=0;
  const resizeObserver=new ResizeObserver(()=>{resize();if(inView)renderFrame()});
  resizeObserver.observe(host);
  resize();

  const clock=new THREE.Clock();
  function renderFrame(){
    if(!inView||document.hidden||rafId)return;
    rafId=requestAnimationFrame(frame);
  }
  function frame(){
    rafId=0;
    if(!inView||document.hidden)return;
    const t=clock.getElapsedTime();
    core.rotation.y=t*.8;
    aura.scale.setScalar(1+Math.sin(t*2)*.08);
    controls.update();
    renderer.render(scene,camera);
    renderFrame();
  }
  const visibilityObserver=new IntersectionObserver(entries=>{
    inView=entries.some(entry=>entry.isIntersecting);
    if(inView){loadConfiguredModel();renderFrame()}
    else if(rafId){cancelAnimationFrame(rafId);rafId=0}
  },{rootMargin:"120px"});
  visibilityObserver.observe(host);
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden&&rafId){cancelAnimationFrame(rafId);rafId=0}
    else renderFrame();
  });
}
