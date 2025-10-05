import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js';

// --- Variables ---
let scene, camera, renderer, labelRenderer, controls;
let earth, asteroid;
let vitesse = 0.00002;
let asteroidScale = 0.5;
let paused = true;

fetch('https://api.nasa.gov/neo/rest/v1/neo/3542519?api_key=7I27sd5MFxsOg5QB5f8eEiOtxhzJOjiyh4jR8pIi')
  .then(response => response.json())
  .then(data => {
    console.log(data);
  })
  .catch(error => console.error('Erreur:', error));


// --- Positions ---
const startPos = new THREE.Vector3(200,50,600);
let endPos;
const cameraOffset = new THREE.Vector3(5,2,7);

// --- Init scène ---
scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Caméra
camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 20000);
camera.position.copy(startPos).add(cameraOffset);

// Renderer
renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Label Renderer
labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

// Controls
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lumières
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const light = new THREE.PointLight(0xffffff, 2, 5000);
light.position.set(20,20,20);
scene.add(light);

// --- Terre ---
const earthGeo = new THREE.SphereGeometry(20, 128, 128);
const earthTex = new THREE.TextureLoader().load('https://unpkg.com/three-globe@2.24.4/example/img/earth-blue-marble.jpg');
const earthMat = new THREE.MeshPhongMaterial({ map: earthTex, shininess: 10 });
earth = new THREE.Mesh(earthGeo, earthMat);
earth.position.set(0, -2, -10);
scene.add(earth);

// Rotation aléatoire Terre
earth.rotation.x = Math.random()*Math.PI*2;
earth.rotation.y = Math.random()*Math.PI*2;
earth.rotation.z = Math.random()*Math.PI*2;
earth.r = {
  x: 0.0004 + Math.random()*0.001,
  y: 0.0004 + Math.random()*0.001,
  z: 0.0004 + Math.random()*0.001
};

// --- Astéroïde ---
const geom = new THREE.SphereGeometry(1,64,64);
asteroidScale = 0.12;
const loader = new THREE.TextureLoader();
const meteorMaterial = new THREE.MeshStandardMaterial({
    map: loader.load('textures/Rock030_1K-JPG_Color.jpg'),
    roughnessMap: loader.load('textures/Rock030_1K-JPG_Roughness.jpg'),
    roughness: 0.8,
    metalness: 0.1,
    normalMap: loader.load('textures/Rock030_1K-JPG_NormalGL.jpg'),
    displacementMap: loader.load('textures/Rock030_1K-JPG_Displacement.jpg'),
    displacementScale: 0.3,   
    aoMap: loader.load('textures/Rock030_1K-JPG_AmbientOcclusion.jpg'),
    flatShading: false
});
asteroid = new THREE.Mesh(geom, meteorMaterial);
asteroid.scale.set(asteroidScale, asteroidScale, asteroidScale);
asteroid.r = {x:0.002, y:0.004, z:0.003};
asteroid.position.copy(startPos);
scene.add(asteroid);

// --- Trajectoire ---
endPos = earth.position.clone();
const steps = 100;
const trajectoryPoints = [];
for(let i=0;i<=steps;i++){
  trajectoryPoints.push(new THREE.Vector3().lerpVectors(startPos,endPos,i/steps));
}
const trajectoryGeom = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
const trajectoryMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
const trajectoryLine = new THREE.Line(trajectoryGeom, trajectoryMat);
scene.add(trajectoryLine);

// --- Etoiles ---
const starsGeom = new THREE.BufferGeometry();
const starsVerts = [];
const starDistance = 8000;
for(let i=0;i<20000;i++){
  starsVerts.push((Math.random()-0.5)*starDistance,
                  (Math.random()-0.5)*starDistance,
                  (Math.random()-0.5)*starDistance);
}
starsGeom.setAttribute('position', new THREE.Float32BufferAttribute(starsVerts,3));
scene.add(new THREE.Points(starsGeom,new THREE.PointsMaterial({color:0xffffff,size:0.5})));

// --- UI ---
document.getElementById('playPauseBtn').addEventListener('click', ()=>{ paused = !paused; });
document.getElementById('sizeRange').addEventListener('input', e=>{
  asteroidScale = parseFloat(e.target.value);
  asteroid.scale.set(asteroidScale, asteroidScale, asteroidScale);
});
document.getElementById('speedRange').value = vitesse;
document.getElementById('speedRange').min = 0.00001;
document.getElementById('speedRange').max = 0.001;
document.getElementById('speedRange').step = 0.00001;
document.getElementById('speedRange').addEventListener('input', e=>{
  vitesse = parseFloat(e.target.value);
});

// --- Reset simulation ---
document.getElementById('rewindBtn').addEventListener('click', ()=>{
  asteroid.position.copy(startPos);
  earth.material.color.set(0xffffff);
  paused = true;
  cleanupImpact();
});

function cleanupImpact(){
  if(impactFlash){ scene.remove(impactFlash); impactFlash.geometry.dispose(); impactFlash.material.dispose(); impactFlash = null; }
  if(shockwave){ scene.remove(shockwave); shockwave.geometry.dispose(); shockwave.material.dispose(); shockwave = null; }
  if(impactLabel){ document.body.removeChild(impactLabel); impactLabel = null; }
  if(oceanWave){ scene.remove(oceanWave); oceanWave.geometry.dispose(); oceanWave.material.dispose(); oceanWave = null; }
  impactStart = null;
  impactRecoil = false;
}

// --- Variables impact ---
let impactFlash = null, shockwave = null, impactLabel = null, oceanWave = null;
let impactStart = null;
let impactRecoil = false, recoilStart = 0;
const recoilDuration = 1000, recoilDistance = 20;
async function fetchNEOData(neo_id) {
  try {
    const response = await fetch(`https://api.nasa.gov/neo/rest/v1/neo/${neo_id}?api_key=DEMO_KEY`);
    const data = await response.json();

    // Estimation diamètre moyen en m
    const diameter = (data.estimated_diameter.meters.estimated_diameter_min +
                      data.estimated_diameter.meters.estimated_diameter_max)/2;

    // Masse approximative
    const density = 3000; // kg/m³ supposé
    const volume = (4/3)*Math.PI*Math.pow(diameter/2, 3);
    const mass = density * volume;

    // Vitesse moyenne de passage (converti km/h -> m/s)
    const velocity = parseFloat(data.close_approach_data[0].relative_velocity.kilometers_per_hour) * 1000 / 3600;

    // Energie en joules et tonnes TNT
    const energy = 0.5 * mass * velocity * velocity;
    const energyTNT = energy / 4.184e9;

    return { name: data.name, energyTNT, mass, velocity };
  } catch(e) {
    console.error("Erreur API NEO:", e);
    return null;
  }
}

async function compareWithNEOs(impactEnergyTNT) {
  // IDs NEO à comparer (exemple)
  const neoIDs = ['3542519','2023DW','2008TC3'];

  const neoData = [];
  for (const id of neoIDs) {
    const neo = await fetchNEOData(id);
    if (neo) neoData.push(neo);
  }

  if (neoData.length === 0) return null;

  const closest = neoData.reduce((prev, curr) =>
    Math.abs(curr.energyTNT - impactEnergyTNT) < Math.abs(prev.energyTNT - impactEnergyTNT) ? curr : prev
  );

  return closest;
}


/// --- Modifications dans createImpactEffects ---
async function createImpactEffects(position) {
  cleanupImpact();

  // Flash et shockwave comme avant
  const flashGeom = new THREE.SphereGeometry(5, 32, 32);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.8 });
  impactFlash = new THREE.Mesh(flashGeom, flashMat);
  impactFlash.position.copy(position);
  scene.add(impactFlash);

  const shockGeom = new THREE.RingGeometry(5, 6, 64);
  const shockMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  shockwave = new THREE.Mesh(shockGeom, shockMat);
  shockwave.position.copy(position);
  shockwave.rotation.x = -Math.PI/2;
  scene.add(shockwave);

  // Calcul énergie
  const density = 3000;
  const radius = asteroidScale * 100;
  const volume = (4/3) * Math.PI * Math.pow(radius,3);
  const mass = density * volume;
  const vImpact = 20000;
  const energy = 0.5 * mass * vImpact * vImpact;
  const energyTNT = energy / 4.184e9;

    const closestNEO = await compareWithNEOs(energyTNT);
  // Déterminer océan/terre par latitude approximative
  const lat = Math.asin(position.y/20)*180/Math.PI;
  const isOcean = lat < 60 && lat > -60; // simplification

  // Dégâts
  let damage = "";
  if(isOcean){
    if(energy < 1e18) damage = "Petit tsunami";
    else if(energy < 1e20) damage = "Tsunami majeur";
    else damage = "Mega-tsunami mondial";

    // Animation vague
    const waveGeom = new THREE.RingGeometry(5,6,64);
    const waveMat = new THREE.MeshBasicMaterial({ color: 0x0099ff, transparent:true, opacity:0.6, side:THREE.DoubleSide });
    oceanWave = new THREE.Mesh(waveGeom,waveMat);
    oceanWave.position.copy(position);
    oceanWave.rotation.x = -Math.PI/2;
    scene.add(oceanWave);
    oceanWave.userData = { start: performance.now() };
  } else {
    if(energy < 1e18) damage = "Secousse légère";
    else if(energy < 1e20) damage = "Séisme destructeur local";
    else damage = "Séisme global et cratère massif";
  }

  // Label résumé
  const infoDiv = document.createElement('div');
  infoDiv.className = 'label';
  infoDiv.style.color = 'yellow';
  infoDiv.style.fontSize = '16px';
  infoDiv.innerHTML = `
    💥 Impact sur Terre !<br>
    Énergie: ${energyTNT.toExponential(2)} tonnes TNT<br>
    Masse estimée: ${(mass/1e6).toFixed(2)} milliers de tonnes<br>
    Vitesse: ${vImpact/1000} km/s<br>
    Dégâts: ${damage}<br>
    ${closestNEO ? `NEO le plus proche : ${closestNEO.name} (${closestNEO.energyTNT.toExponential(2)} tonnes TNT)` : ""}
  `;
  infoDiv.style.position = 'absolute';
  infoDiv.style.top = '20px';
  infoDiv.style.left = '250px';
  infoDiv.style.background = 'rgba(0,0,0,0.5)';
  infoDiv.style.padding = '10px';
  infoDiv.style.borderRadius = '8px';
  infoDiv.style.maxWidth = '350px';
  document.body.appendChild(infoDiv);
  impactLabel = infoDiv;

  impactStart = performance.now();
  impactRecoil = true;
  recoilStart = performance.now();
}

// --- Mise à jour effets ---
function updateImpactEffects() {
  if(!impactStart) return;
  const elapsed = (performance.now()-impactStart)/1000;

  if(impactFlash){
    impactFlash.scale.setScalar(1 + elapsed*5);
    impactFlash.material.opacity = Math.max(0, 0.8 - elapsed*0.5);
    if(impactFlash.material.opacity <= 0){ scene.remove(impactFlash); impactFlash = null; }
  }
  if(shockwave){
    shockwave.scale.setScalar(1 + elapsed*10);
    shockwave.material.opacity = Math.max(0,0.6 - elapsed*0.3);
    if(shockwave.material.opacity <= 0){ scene.remove(shockwave); shockwave = null; }
  }
  if(oceanWave){
    const t = (performance.now() - oceanWave.userData.start)/1000;
    oceanWave.scale.setScalar(1 + t*10);
    oceanWave.material.opacity = Math.max(0,0.6 - t*0.3);
    if(oceanWave.material.opacity <= 0){ scene.remove(oceanWave); oceanWave.geometry.dispose(); oceanWave.material.dispose(); oceanWave=null; }
  }
}

// --- Animation ---
function animate(){
  requestAnimationFrame(animate);

  if(!paused){
    const toEarth = new THREE.Vector3().subVectors(endPos, asteroid.position);
    const distance = toEarth.length();
    if(distance > 20 + asteroidScale){
      asteroid.position.add(toEarth.normalize().multiplyScalar(vitesse*1000));
    } else if(!impactStart){
      earth.material.color.set(0xff0000);
      paused = true;
      createImpactEffects(earth.position);
    }

    asteroid.rotation.x += asteroid.r.x;
    asteroid.rotation.y += asteroid.r.y;
    asteroid.rotation.z += asteroid.r.z;

    earth.rotation.x += earth.r.x;
    earth.rotation.y += earth.r.y;
    earth.rotation.z += earth.r.z;
  }

  updateImpactEffects();

  // Caméra avec recul
  let desiredCamPos = new THREE.Vector3().copy(asteroid.position).add(cameraOffset);
  if(impactRecoil){
    const elapsed = performance.now() - recoilStart;
    if(elapsed < recoilDuration){
      const recoilVector = new THREE.Vector3().subVectors(desiredCamPos, earth.position)
                          .normalize()
                          .multiplyScalar(recoilDistance * (1 - elapsed / recoilDuration));
      desiredCamPos.add(recoilVector);
    } else impactRecoil = false;
  }

  camera.position.lerp(desiredCamPos,0.1);
  controls.target.copy(asteroid.position);
  controls.update();

  renderer.render(scene,camera);
  labelRenderer.render(scene,camera);
}
animate();

// --- Resize ---
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});