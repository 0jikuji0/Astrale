import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js";

let scene, camera, renderer, composer, controls;
let planet_sun, particles, arcs = [];
let planets = [];

// 🌌 Données des planètes avec plus d'espace
const orbitData = [
  { name: 'Mercure', texture: '/tests/img/mercury_hd.jpg', radius: 2, orbit: 100, speed: 2 },
  { name: 'Vénus', texture: '/tests/img/venus_hd.jpg', radius: 3, orbit: 150, speed: 1.5 },
  { name: 'Terre', texture: '/tests/img/earth_hd.jpg', radius: 4, orbit: 200, speed: 1 },
  { name: 'Mars', texture: '/tests/img/mars_hd.jpg', radius: 3.5, orbit: 250, speed: 0.8 },
  { name: 'Jupiter', texture: '/tests/img/jupiter_hd.jpg', radius: 10, orbit: 350, speed: 0.7 },
  { name: 'Saturne', texture: '/tests/img/saturn_hd.jpg', radius: 8, orbit: 450, speed: 0.6 },
  { name: 'Uranus', texture: '/tests/img/uranus_hd.jpg', radius: 6, orbit: 550, speed: 0.5 },
  { name: 'Neptune', texture: '/tests/img/neptune_hd.jpg', radius: 5, orbit: 650, speed: 0.4 },
];

function init() {
  scene = new THREE.Scene();

  // 📷 Caméra adaptée
  camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.z = 1000;

  // 🌞 Soleil
  planet_sun = loadPlanetTexture("/tests/img/sun_hd.jpg", 40, 100, 100, 'basic');
  scene.add(planet_sun);

  // 💡 Lumière du Soleil
  const sunLight = new THREE.PointLight(0xffffff, 2, 0);
  sunLight.position.copy(planet_sun.position);
  scene.add(sunLight);

  // 🪐 Planètes
  orbitData.forEach((p) => {
    const mesh = loadPlanetTexture(p.texture, p.radius, 64, 64, 'standard');
    scene.add(mesh);
    planets.push({ mesh, orbit: p.orbit, speed: p.speed });

    // Anneaux d'orbite
    const ring = new THREE.RingGeometry(p.orbit, p.orbit + 0.5, 128);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, opacity: 0.05, transparent: true });
    const orbit = new THREE.Mesh(ring, mat);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
  });

  // 🌌 Particules et arcs autour du Soleil
  createSolarParticles();
  createSolarArcs();

  // 🖥 Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // ✨ Post-processing : glow léger
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.9,
    0.6,
    0.85
  );
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  // 🕹 Contrôles
  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 2500;

  window.addEventListener("resize", onWindowResize);
}

function loadPlanetTexture(texture, radius, widthSegments, heightSegments, meshType) {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const loader = new THREE.TextureLoader();
  const planetTexture = loader.load(texture);
  const material = meshType === 'standard'
    ? new THREE.MeshStandardMaterial({ map: planetTexture })
    : new THREE.MeshBasicMaterial({ map: planetTexture });
  return new THREE.Mesh(geometry, material);
}

// 🌞 Particules floues autour du Soleil
function createSolarParticles() {
  const particleCount = 700;
  const positions = [];

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 40.3 + Math.random() * 2.0;
    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const sprite = new THREE.TextureLoader().load("https://threejs.org/examples/textures/sprites/spark1.png");
  const material = new THREE.PointsMaterial({
    color: 0xffaa33,
    size: 1.1,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    map: sprite,
    depthWrite: false
  });

  particles = new THREE.Points(geometry, material);
  planet_sun.add(particles);
}

// 🌞 Arcs doux autour du Soleil
function createSolarArcs() {
  const arcCount = 12;
  for (let i = 0; i < arcCount; i++) {
    const startAngle = Math.random() * Math.PI * 2;
    const arcRadius = 42 + Math.random() * 2;
    const arcHeight = 1 + Math.random() * 2;

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(arcRadius * Math.cos(startAngle), 0, arcRadius * Math.sin(startAngle)),
      new THREE.Vector3(arcRadius * 0.85 * Math.cos(startAngle), arcHeight, arcRadius * 0.85 * Math.sin(startAngle)),
      new THREE.Vector3(arcRadius * Math.cos(startAngle + 0.15), 0, arcRadius * Math.sin(startAngle + 0.15))
    );

    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      linewidth: 1
    });

    const arc = new THREE.Line(geometry, material);
    planet_sun.add(arc);
    arcs.push(arc);
  }
}

// 🔄 Mouvement des planètes
function planetRevolver(time) {
  const speedMultiplier = 0.001;
  planets.forEach((p) => {
    const angle = time * speedMultiplier * p.speed;
    p.mesh.position.x = p.orbit * Math.cos(angle);
    p.mesh.position.z = p.orbit * Math.sin(angle);
  });
}

// 🎬 Animation principale
function animate(time) {
  requestAnimationFrame(animate);

  planet_sun.rotation.y += 0.004;
  planetRevolver(time);

  arcs.forEach((arc, i) => {
    const scale = 1 + 0.02 * Math.sin(time * 0.002 + i);
    arc.scale.set(scale, scale, scale);
  });

  composer.render();
  controls.update();
}

// 🔧 Resize adaptatif
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate(0);
