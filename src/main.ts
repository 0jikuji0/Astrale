import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02040a);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(600, 30, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 10;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
sunLight.position.set(5, 3, 5);
sunLight.castShadow = true;
scene.add(sunLight);

let earth: THREE.Object3D | null = null;

const loader = new GLTFLoader();
loader.load(
  '/Earth.gltf',
  (gltf) => {
    earth = gltf.scene;
    earth.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    earth.scale.setScalar(1.5);
    earth.rotation.z = THREE.MathUtils.degToRad(23.5);
    scene.add(earth);
  },
  undefined,
  (error) => {
    console.error('Failed to load Earth model:', error);
  }
);

const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  controls.update();

  if (earth) {
    earth.rotation.y += delta * 0.25;
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

window.addEventListener('resize', onWindowResize);