import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getStarfield from "./src/getStarfield.js";

// === Paramètres de base ===
const w = window.innerWidth;
const h = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 4;

// === Renderer ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);

// === Contrôles ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// === Terre ===
const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180; // inclinaison terrestre
scene.add(earthGroup);

const loader = new THREE.TextureLoader();
const geometry = new THREE.IcosahedronGeometry(1, 12);

const earthMaterial = new THREE.MeshPhongMaterial({
  map: loader.load("https://unpkg.com/three-globe@2.24.4/example/img/earth-blue-marble.jpg"),
  bumpScale: 0.04,
});
const earthMesh = new THREE.Mesh(geometry, earthMaterial);
earthGroup.add(earthMesh);

// === Étoiles de fond ===
const stars = getStarfield({ numStars: 2000 });
scene.add(stars);

// === Lumière (Soleil) ===
const sunLight = new THREE.DirectionalLight(0xffffff, 3);
sunLight.position.set(-3, 1, 2);
scene.add(sunLight);

// === Lune ===
const moonGeometry = new THREE.IcosahedronGeometry(1, 10);
const moonMaterial = new THREE.MeshStandardMaterial({
  map: loader.load("https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg"),
});
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.scale.setScalar(0.27);
scene.add(moonMesh);

// === Paramètres orbitaux ===
const moonOrbitRadius = 2; // distance relative Terre–Lune
const moonOrbitSpeed = 0.2; // vitesse orbitale (augmentée pour qu’on voie le mouvement)
const moonInclination = THREE.MathUtils.degToRad(5.145); // inclinaison orbitale
const moonEccentricity = 0.0549; // orbite elliptique légère

// === Animation ===
function animate(time) {
  requestAnimationFrame(animate);
  time *= 0.001; // convertir ms → secondes

  // Rotation de la Terre
  earthMesh.rotation.y += 0.002;

  // Légère rotation du fond d’étoiles
  stars.rotation.y -= 0.0001;

  // === Calcul position de la Lune ===
  const a = moonOrbitRadius;
  const b = a * Math.sqrt(1 - moonEccentricity ** 2);
  const angle = time * moonOrbitSpeed;

  const x = a * Math.cos(angle) - a * moonEccentricity;
  const z = b * Math.sin(angle);

  // Inclinaison de l’orbite
  const pos = new THREE.Vector3(x, 0, z);
  const q = new THREE.Quaternion();
  q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), moonInclination);
  pos.applyQuaternion(q);

  // Position relative à la Terre
  moonMesh.position.copy(earthMesh.position.clone().add(pos));

  // Rotation de la Lune sur elle-même
  moonMesh.rotation.y += 0.005;

  controls.update();
  renderer.render(scene, camera);
}

animate();

// === Ajustement à la taille de la fenêtre ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
