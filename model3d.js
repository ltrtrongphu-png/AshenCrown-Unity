import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const host = document.querySelector("#ash-crown-3d");
if (host) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", "Interactive Ashen Crown 3D model");
  host.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0a09, 0.055);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(3.6, 2.7, 5.4);

  scene.add(new THREE.HemisphereLight(0xb8a28e, 0x080604, 1.6));
  const key = new THREE.PointLight(0xff8a4d, 18, 9);
  key.position.set(1.5, 2.5, 2.5);
  scene.add(key);
  const rim = new THREE.PointLight(0x7f9cff, 9, 10);
  rim.position.set(-3, 2, -2);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  const metal = new THREE.MeshStandardMaterial({ color:0x25201b, metalness:.88, roughness:.24 });
  const ember = new THREE.MeshStandardMaterial({ color:0xff713c, emissive:0xff3b12, emissiveIntensity:4.2, metalness:.1, roughness:.2 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, .24, 48), metal);
  root.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, .12, 14, 64), metal);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .28;
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
  scene.add(floor);

  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;
  controls.enablePan=false;
  controls.minDistance=3.4;
  controls.maxDistance=8;
  controls.target.set(0,.45,0);
  controls.autoRotate=true;
  controls.autoRotateSpeed=.65;

  const loader=new GLTFLoader();
  const configuredModel=host.dataset.model;
  if (configuredModel) {
    loader.load(configuredModel, gltf => {
      root.clear();
      root.add(gltf.scene);
      gltf.scene.scale.setScalar(1.35);
    }, undefined, err => console.warn("Ashen Crown model fallback active:", err));
  }

  const resize=()=>{
    const w=host.clientWidth, h=Math.max(320,host.clientHeight);
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();

  const clock=new THREE.Clock();
  function frame(){
    requestAnimationFrame(frame);
    const t=clock.getElapsedTime();
    core.rotation.y=t*.8;
    aura.scale.setScalar(1+Math.sin(t*2)*.08);
    controls.update();
    renderer.render(scene,camera);
  }
  frame();
}
