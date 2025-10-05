import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, controls;
let neptune, neptuneRings;

/* -----------------------------------------------------
   Initialisation
------------------------------------------------------ */
function init() {
  // === Scène ===
  scene = new THREE.Scene();

  // === Caméra ===
  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 20, 60);
  camera.lookAt(0, 0, 0);

  // === Rendu ===
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // === Éclairage ===
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.9);
  directional.position.set(30, 20, 10);
  scene.add(directional);

  // === Fond d’étoiles ===
  createStarsBackground();

  // === Neptune ===
  const textureLoader = new THREE.TextureLoader();
  const neptuneTexture = textureLoader.load("/Saturn/img/saturn_hd.jpg");
  const neptuneGeometry = new THREE.SphereGeometry(5, 64, 64);
  const neptuneMaterial = new THREE.MeshStandardMaterial({
    map: neptuneTexture,
    roughness: 1,
    metalness: 0,
  });
  neptune = new THREE.Mesh(neptuneGeometry, neptuneMaterial);
  scene.add(neptune);

  // === Anneaux de Neptune ===
  const ringTexture = textureLoader.load("/Saturn/img/saturn_ring.jpg"); // ⚠️ ton image d’anneaux
  const ringGeometry = new THREE.RingGeometry(6, 10, 128);
  const ringMaterial = new THREE.MeshBasicMaterial({
    map: ringTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });

  // Création du mesh
  neptuneRings = new THREE.Mesh(ringGeometry, ringMaterial);
  neptuneRings.rotation.x = THREE.MathUtils.degToRad(90); // Inclinaison initiale
  neptuneRings.rotation.z = THREE.MathUtils.degToRad(20); // Légère rotation pour effet réaliste
  scene.add(neptuneRings);

  // === Contrôles ===
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 200;

  // === Resize ===
  window.addEventListener("resize", onWindowResize);

  animate();
}

/* -----------------------------------------------------
   Fond d’étoiles
------------------------------------------------------ */
function createStarsBackground() {
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 10000;
  const starDistance = 2000;
  const positions = [];

  for (let i = 0; i < starCount; i++) {
    positions.push(
      (Math.random() - 0.5) * starDistance,
      (Math.random() - 0.5) * starDistance,
      (Math.random() - 0.5) * starDistance
    );
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    transparent: true,
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}

/* -----------------------------------------------------
   Animation
------------------------------------------------------ */
function animate() {
  requestAnimationFrame(animate);

  // Rotation lente de Neptune et de ses anneaux
  neptune.rotation.y += 0.002;
  neptuneRings.rotation.z += 0.0005; // rotation très lente des anneaux

  controls.update();
  renderer.render(scene, camera);
}

/* -----------------------------------------------------
   Resize
------------------------------------------------------ */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* -----------------------------------------------------
   Lancement
------------------------------------------------------ */
init();
