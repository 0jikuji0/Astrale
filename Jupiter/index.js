import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, controls;
let jupiter;

/* -----------------------------------------------------
   Initialisation
------------------------------------------------------ */
function init() {
  // === Scène ===
  scene = new THREE.Scene();

  // === Caméra ===
  camera = new THREE.PerspectiveCamera(
    750,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 60  );
  camera.lookAt(100, 100, 100);

  // === Rendu ===
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // === Éclairage ===
  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.5);
  directional.position.set(10, 5, 5);
  scene.add(directional);

  // === Fond d’étoiles ===
  createStarsBackground();

  // === Jupiter ===
  const textureLoader = new THREE.TextureLoader();
  const jupiterTexture = textureLoader.load("/Space/img/jupiter_hd.jpg"); // ⚠️ mets ici le bon chemin vers ton image
  const jupiterGeometry = new THREE.SphereGeometry(5, 64, 64);
  const jupiterMaterial = new THREE.MeshStandardMaterial({
    map: jupiterTexture,
    roughness: 1,
    metalness: 0,
  });
  jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
  scene.add(jupiter);

  // === Contrôles ===
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 6;
  controls.maxDistance = 100;

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
  const starDistance = 1000;
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

  // Rotation lente de Jupiter
  jupiter.rotation.y += 0.002;

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
