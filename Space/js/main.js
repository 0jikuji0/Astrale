import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js";

let scene, camera, renderer, composer, controls;
let planet_sun, particles, arcs = [];
let planets = [];

/* -----------------------------------------------------
   Échelle réaliste (Neptune ~650 unités)
------------------------------------------------------ */
const scale = 650 / 30.069;

/* -----------------------------------------------------
   Facteur d'exagération pour inclinaisons
------------------------------------------------------ */
const exaggeration = 3;

/* -----------------------------------------------------
   Données planètes avec excentricité et inclinaison
------------------------------------------------------ */
const orbitData = [
  { name: 'Mercure', texture: '/Space/img/mercury_hd.jpg', radius: 1.5, a: 0.387 * scale, e: 0.2056, speed: 4.15, color: 0x888888, tilt: 7.0 },
  { name: 'Vénus',   texture: '/Space/img/venus_hd.jpg',   radius: 2.5, a: 0.723 * scale, e: 0.0068, speed: 1.62, color: 0xffff00, tilt: 3.4 },
  { name: 'Terre',   texture: '/Space/img/earth_hd.jpg',   radius: 3,   a: 1.000 * scale, e: 0.0167, speed: 1.00, color: 0x0000ff, tilt: 0.0 },
  { name: 'Mars',    texture: '/Space/img/mars_hd.jpg',    radius: 2,   a: 1.524 * scale, e: 0.0934, speed: 0.53, color: 0xff0000, tilt: 1.85 },
  { name: 'Jupiter', texture: '/Space/img/jupiter_hd.jpg', radius: 8,   a: 5.203 * scale, e: 0.0484, speed: 0.08, color: 0xffa500, tilt: 1.3 },
  { name: 'Saturne', texture: '/Space/img/saturn_hd.jpg',  radius: 7,   a: 9.537 * scale, e: 0.0541, speed: 0.03, color: 0xffd700, tilt: 2.49 },
  { name: 'Uranus',  texture: '/Space/img/uranus_hd.jpg',  radius: 7,   a: 19.191 * scale, e: 0.0472, speed: 0.011, color: 0x00ffff, tilt: 0.77 },
  { name: 'Neptune', texture: '/Space/img/neptune_hd.jpg', radius: 8,   a: 30.069 * scale, e: 0.0086, speed: 0.006, color: 0x00008b, tilt: 1.77 },
];

/* -----------------------------------------------------
   Initialisation
------------------------------------------------------ */
function init() {
  scene = new THREE.Scene();
  createStarsBackground();

  // Soleil
  planet_sun = loadPlanetTexture("/Space/img/sun_hd.jpg", 3.5, 100, 100, 'basic');
  scene.add(planet_sun);

  const sunLight = new THREE.PointLight(0xffffff, 0.7, 3000);
  sunLight.position.copy(planet_sun.position);
  scene.add(sunLight);

  // Planètes et orbites
  orbitData.forEach((p) => {
    const mesh = loadPlanetTexture(p.texture, p.radius, 64, 64, 'standard');
    mesh.material.roughness = 1;
    mesh.material.metalness = 0;
    mesh.userData.name = p.name;
    scene.add(mesh);

    const planet = { mesh, a: p.a, e: p.e, speed: p.speed, tilt: p.tilt };

    // 🔹 Ajout des anneaux uniquement pour Saturne
    if (p.name === "Saturne") {
      const ring = createSaturnRings(p.radius);
      mesh.add(ring);
      ring.rotation.x = THREE.MathUtils.degToRad(90 - p.tilt); // légère inclinaison
      planet.rings = ring;
    }

    planets.push(planet);

    // 🔹 Dessin de l’orbite elliptique
    const points = [];
    const b = p.a * Math.sqrt(1 - p.e * p.e);
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * 2 * Math.PI;
      const x = p.a * Math.cos(theta) - p.a * p.e;
      const z = b * Math.sin(theta);
      points.push(new THREE.Vector3(x, 0, z));
    }
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.6 });
    const orbitLine = new THREE.LineLoop(orbitGeom, orbitMat);
    orbitLine.rotation.x = THREE.MathUtils.degToRad(p.tilt * exaggeration);
    scene.add(orbitLine);
  });

  createSolarParticles();
  createSolarArcs();

  camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 1.5, 50000);
  const jupiterOrbit = 5.203 * scale;
  camera.position.set(jupiterOrbit * 1.1, 50, jupiterOrbit * 0.5);
  camera.lookAt(planet_sun.position);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.4, 0.85);
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(planet_sun.position);
  controls.minDistance = 5;
  controls.maxDistance = 15000;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("click", onClick);
}

/* -----------------------------------------------------
   Anneaux de Saturne
------------------------------------------------------ */
function createSaturnRings(planetRadius) {
  const innerRadius = planetRadius * 1.4;
  const outerRadius = planetRadius * 2.8;

  // Géométrie de l’anneau
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);

  // Chargement de la texture
  const loader = new THREE.TextureLoader();
  const texture = loader.load(
    "/Space/img/saturn_ring.png",
    () => console.log("✅ Texture des anneaux chargée !"),
    undefined,
    (err) => console.error("❌ Erreur de chargement texture :", err)
  );

  texture.encoding = THREE.sRGBEncoding;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

  // ✅ Matériau idéal pour les anneaux (toujours visibles)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.05,     // ignore les pixels totalement transparents
    side: THREE.DoubleSide,
  });

  // Création du mesh
  const ring = new THREE.Mesh(geometry, material);

  // Inclinaison réaliste
  ring.rotation.x = THREE.MathUtils.degToRad(70);

  // Position : juste au-dessus de Saturne
  ring.position.set(0, 0.1, 0);

  return ring;
}



/* -----------------------------------------------------
   Fond d’étoiles
------------------------------------------------------ */
function createStarsBackground() {
  const starsGeom = new THREE.BufferGeometry();
  const starsVerts = [];
  const starDistance = 20000;
  for (let i = 0; i < 15000; i++) {
    starsVerts.push(
      (Math.random() - 0.5) * starDistance,
      (Math.random() - 0.5) * starDistance,
      (Math.random() - 0.5) * starDistance
    );
  }
  starsGeom.setAttribute('position', new THREE.Float32BufferAttribute(starsVerts, 3));
  const stars = new THREE.Points(
    starsGeom,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true })
  );
  scene.add(stars);
}

/* -----------------------------------------------------
   Texture planète
------------------------------------------------------ */
function loadPlanetTexture(texture, radius, widthSegments, heightSegments, meshType) {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const loader = new THREE.TextureLoader();
  const planetTexture = loader.load(texture);
  const material = meshType === 'standard'
    ? new THREE.MeshStandardMaterial({ map: planetTexture, roughness: 1, metalness: 0 })
    : new THREE.MeshBasicMaterial({ map: planetTexture });
  return new THREE.Mesh(geometry, material);
}

/* -----------------------------------------------------
   Particules solaires
------------------------------------------------------ */
function createSolarParticles() {
  const particleCount = 500;
  const positions = [];
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 3 + Math.random() * 0.8;
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
    color: 0xffcc55,
    size: 0.8,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    map: sprite,
    depthWrite: false
  });
  particles = new THREE.Points(geometry, material);
  planet_sun.add(particles);
}

/* -----------------------------------------------------
   Arcs solaires
------------------------------------------------------ */
function createSolarArcs() {
  const arcCount = 12;
  for (let i = 0; i < arcCount; i++) {
    const startAngle = Math.random() * Math.PI * 2;
    const arcRadius = 4.0 + Math.random() * 0.8;
    const arcHeight = 0.5 + Math.random() * 1.5;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(arcRadius * Math.cos(startAngle), 0, arcRadius * Math.sin(startAngle)),
      new THREE.Vector3(arcRadius * 0.9 * Math.cos(startAngle), arcHeight, arcRadius * 0.9 * Math.sin(startAngle)),
      new THREE.Vector3(arcRadius * Math.cos(startAngle + 0.15), 0, arcRadius * Math.sin(startAngle + 0.15))
    );
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
    });
    const arc = new THREE.Line(geometry, material);
    planet_sun.add(arc);
    arcs.push(arc);
  }
}

/* -----------------------------------------------------
   Mouvement des planètes
------------------------------------------------------ */
function planetRevolver(time) {
  const speedMultiplier = 0.2;
  planets.forEach((p) => {
    const angle = (time * speedMultiplier * p.speed) % (2 * Math.PI);
    const b = p.a * Math.sqrt(1 - p.e * p.e);
    const x = p.a * Math.cos(angle) - p.a * p.e;
    const z = b * Math.sin(angle);

    const pos = new THREE.Vector3(x, 0, z);

    const tiltRad = THREE.MathUtils.degToRad(p.tilt * exaggeration);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), tiltRad);
    pos.applyQuaternion(quaternion);

    p.mesh.position.copy(pos);
    p.mesh.rotation.y += 0.01 * p.speed;
  });
}

/* -----------------------------------------------------
   🎯 Clic sur une planète (redirige)
------------------------------------------------------ */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    const planetName = clicked.userData.name;

    console.log(`🌍 Vous avez cliqué sur ${planetName}`);

    switch (planetName) {
      case "Mercure": window.location.href = "/Mercury"; break;
      case "Vénus":   window.location.href = "/Venus"; break;
      case "Terre":   window.location.href = "/Earth"; break;
      case "Mars":    window.location.href = "/Mars"; break;
      case "Jupiter": window.location.href = "/Jupiter"; break;
      case "Saturne": window.location.href = "/Saturn"; break;
      case "Uranus":  window.location.href = "/Uranus"; break;
      case "Neptune": window.location.href = "/Neptune"; break;
      default: console.log("Planète non reconnue :", planetName);
    }
  }
}

/* -----------------------------------------------------
   Animation
------------------------------------------------------ */
function animate() {
  requestAnimationFrame(animate);
  const now = Date.now() / 1000;

  planet_sun.rotation.y = (now * 0.002) % (2 * Math.PI);
  planetRevolver(now);

  arcs.forEach((arc, i) => {
    const scale = 1 + 0.02 * Math.sin(now * 2 + i);
    arc.scale.set(scale, scale, scale);
  });

  composer.render();
  controls.update();
}

/* -----------------------------------------------------
   Resize
------------------------------------------------------ */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();
