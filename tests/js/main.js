import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js";

let scene, camera, renderer, composer, controls;
let planet_sun, particles, arcs = [];
let planets = [];

const orbitData = [
  { name: 'Mercure', texture: '/tests/img/mercury_hd.jpg', radius: 2, orbit: 100, speed: 2, color: 0x888888 }, // gris
  { name: 'Vénus', texture: '/tests/img/venus_hd.jpg', radius: 3, orbit: 150, speed: 1.5, color: 0xFFFF00 }, // jaune vif
  { name: 'Terre', texture: '/tests/img/earth_hd.jpg', radius: 4, orbit: 200, speed: 1, color: 0x0000FF }, // bleu
  { name: 'Mars', texture: '/tests/img/mars_hd.jpg', radius: 3.5, orbit: 250, speed: 0.8, color: 0xFF0000 }, // rouge
  { name: 'Jupiter', texture: '/tests/img/jupiter_hd.jpg', radius: 10, orbit: 350, speed: 0.7, color: 0xFFA500 }, // orange
  { name: 'Saturne', texture: '/tests/img/saturn_hd.jpg', radius: 8, orbit: 450, speed: 0.6, color: 0xFFD700 }, // doré
  { name: 'Uranus', texture: '/tests/img/uranus_hd.jpg', radius: 6, orbit: 550, speed: 0.5, color: 0x00FFFF }, // cyan
  { name: 'Neptune', texture: '/tests/img/neptune_hd.jpg', radius: 5, orbit: 650, speed: 0.4, color: 0x00008B }, // bleu foncé
];


function init() {
  scene = new THREE.Scene();

  createStarsBackground();

  camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 30000);
  camera.position.z = 1000;

  planet_sun = loadPlanetTexture("/tests/img/sun_hd.jpg", 20, 100, 100, 'basic');
  scene.add(planet_sun);

  const sunLight = new THREE.PointLight(0xffffff, 2, 3000);
  sunLight.position.copy(planet_sun.position);
  scene.add(sunLight);

  orbitData.forEach((p) => {
    // Créer la planète
    const mesh = loadPlanetTexture(p.texture, p.radius, 64, 64, 'standard');
    mesh.material.roughness = 1;
    mesh.material.metalness = 0;
    scene.add(mesh);
    planets.push({ mesh, orbit: p.orbit, speed: p.speed });

    // Créer l'orbite (en ligne fine et colorée)
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * p.orbit, 0, Math.sin(angle) * p.orbit));
    }
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({
      color: p.color,
      transparent: true,
      opacity: 0.6
    });
    const orbitLine = new THREE.LineLoop(orbitGeom, orbitMat);
    scene.add(orbitLine);
  });

  createSolarParticles();
  createSolarArcs();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.45, // bloom un peu plus fort pour les orbites colorées
    0.4,
    0.85
  );
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 2500;

  window.addEventListener("resize", onWindowResize);
}

function createStarsBackground() {
  const starsGeom = new THREE.BufferGeometry();
  const starsVerts = [];
  const starDistance = 10000;

  for (let i = 0; i < 20000; i++) {
    starsVerts.push(
      (Math.random() - 0.5) * starDistance,
      (Math.random() - 0.5) * starDistance,
      (Math.random() - 0.5) * starDistance
    );
  }

  starsGeom.setAttribute('position', new THREE.Float32BufferAttribute(starsVerts, 3));

  const stars = new THREE.Points(
    starsGeom,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      transparent: true
    })
  );

  scene.add(stars);
}

function loadPlanetTexture(texture, radius, widthSegments, heightSegments, meshType) {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const loader = new THREE.TextureLoader();
  const planetTexture = loader.load(texture);
  const material = meshType === 'standard'
    ? new THREE.MeshStandardMaterial({ map: planetTexture, roughness: 1, metalness: 0 })
    : new THREE.MeshBasicMaterial({ map: planetTexture });
  return new THREE.Mesh(geometry, material);
}

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
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    map: sprite,
    depthWrite: false
  });
  particles = new THREE.Points(geometry, material);
  planet_sun.add(particles);
}

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
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      linewidth: 1
    });
    const arc = new THREE.Line(geometry, material);
    planet_sun.add(arc);
    arcs.push(arc);
  }
}

function planetRevolver(time) {
  const speedMultiplier = 0.001;
  planets.forEach((p) => {
    const angle = time * speedMultiplier * p.speed;
    p.mesh.position.x = p.orbit * Math.cos(angle);
    p.mesh.position.z = p.orbit * Math.sin(angle);
  });
}

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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate(0);
