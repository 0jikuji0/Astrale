
import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js";

let scene, camera, renderer, composer, controls;
let planet_sun, planets = [];
let arcs = [];

const orbitData = [
  { name: 'Mercure', texture: 'img/mercury_hd.jpg', radius: 2, orbit: 100, speed: 2, color: 0x888888 },
  { name: 'Vénus',   texture: 'img/venus_hd.jpg', radius: 3, orbit: 150, speed: 1.5, color: 0xFFFF00 },
  { name: 'Terre',   texture: 'img/earth_hd.jpg', radius: 4, orbit: 200, speed: 1, color: 0x0000FF },
  { name: 'Mars',    texture: 'img/mars_hd.jpg', radius: 3.5, orbit: 250, speed: 0.8, color: 0xFF0000 },
  { name: 'Jupiter', texture: 'img/jupiter_hd.jpg', radius: 10, orbit: 350, speed: 0.7, color: 0xFFA500 },
  { name: 'Saturne', texture: 'img/saturn_hd.jpg', radius: 8, orbit: 450, speed: 0.6, color: 0xFFD700 },
  { name: 'Uranus',  texture: 'img/uranus_hd.jpg', radius: 6, orbit: 550, speed: 0.5, color: 0x00FFFF },
  { name: 'Neptune', texture: 'img/neptune_hd.jpg', radius: 5, orbit: 650, speed: 0.4, color: 0x00008B },
];

function init() {
  scene = new THREE.Scene();

  // --- Fond d'étoiles ---
  const starsGeom = new THREE.BufferGeometry();
  const starsVerts = [];
  const starDistance = 10000;
  for (let i = 0; i < 20000; i++) {
    starsVerts.push((Math.random()-0.5)*starDistance,
                    (Math.random()-0.5)*starDistance,
                    (Math.random()-0.5)*starDistance);
  }
  starsGeom.setAttribute('position', new THREE.Float32BufferAttribute(starsVerts,3));
  scene.add(new THREE.Points(starsGeom, new THREE.PointsMaterial({color:0xffffff, size:0.7})));

  // --- Caméra ---
  camera = new THREE.PerspectiveCamera(85, window.innerWidth/window.innerHeight, 0.1, 30000);
  camera.position.set(0,500,1000);

  // --- Soleil ---
  planet_sun = loadPlanetTexture("img/sun_hd.jpg",20,100,100,'basic');
  scene.add(planet_sun);

  const sunLight = new THREE.PointLight(0xffffff,2,3000);
  sunLight.position.copy(planet_sun.position);
  scene.add(sunLight);

  // --- Planètes ---
  orbitData.forEach(p => {
    const mesh = loadPlanetTexture(p.texture, p.radius,64,64,'standard');
    scene.add(mesh);
    planets.push({
      mesh,
      orbit: p.orbit,
      speed: p.speed,
      targetPos: new THREE.Vector3(),
      angle: Math.random()*Math.PI*2 // rotation aléatoire initiale
    });

    // Orbite
    const points = [];
    for (let i = 0; i <= 128; i++){
      const angle = (i/128)*Math.PI*2;
      points.push(new THREE.Vector3(Math.cos(angle)*p.orbit,0,Math.sin(angle)*p.orbit));
    }
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({color:p.color,transparent:true,opacity:0.6});
    scene.add(new THREE.LineLoop(orbitGeom, orbitMat));
  });

  // --- Particules et arcs du soleil ---
  createSolarParticles();
  createSolarArcs();

  // --- Renderer et postprocessing ---
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const renderScene = new RenderPass(scene,camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth,window.innerHeight),0.45,0.4,0.85);
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  // --- Controls ---
  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 2500;

  window.addEventListener("resize", onWindowResize);
}

function loadPlanetTexture(texture,radius,wSeg,hSeg,meshType){
  const geometry = new THREE.SphereGeometry(radius,wSeg,hSeg);
  const loader = new THREE.TextureLoader();
  const planetTexture = loader.load(texture);
  const material = meshType==='standard'
    ? new THREE.MeshStandardMaterial({map:planetTexture,roughness:1,metalness:0})
    : new THREE.MeshBasicMaterial({map:planetTexture});
  return new THREE.Mesh(geometry,material);
}

function createSolarParticles(){
  const particleCount = 700;
  const positions = [];
  for(let i=0;i<particleCount;i++){
    const theta=Math.random()*2*Math.PI;
    const phi=Math.acos(2*Math.random()-1);
    const radius=40.3+Math.random()*2.0;
    positions.push(radius*Math.sin(phi)*Math.cos(theta),
                   radius*Math.sin(phi)*Math.sin(theta),
                   radius*Math.cos(phi));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  const sprite = new THREE.TextureLoader().load("https://threejs.org/examples/textures/sprites/spark1.png");
  const material = new THREE.PointsMaterial({
    color:0xffaa33, size:1.1, transparent:true, opacity:0.5,
    blending:THREE.AdditiveBlending, map:sprite, depthWrite:false
  });
  const particles = new THREE.Points(geometry,material);
  planet_sun.add(particles);
}

function createSolarArcs(){
  for(let i=0;i<12;i++){
    const startAngle = Math.random()*Math.PI*2;
    const arcRadius = 42+Math.random()*2;
    const arcHeight = 1+Math.random()*2;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(arcRadius*Math.cos(startAngle),0,arcRadius*Math.sin(startAngle)),
      new THREE.Vector3(arcRadius*0.85*Math.cos(startAngle),arcHeight,arcRadius*0.85*Math.sin(startAngle)),
      new THREE.Vector3(arcRadius*Math.cos(startAngle+0.15),0,arcRadius*Math.sin(startAngle+0.15))
    );
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({color:0xffdd88, transparent:true, opacity:0.05, blending:THREE.AdditiveBlending});
    const arc = new THREE.Line(geometry,material);
    planet_sun.add(arc);
    arcs.push(arc);
  }
}

function planetRevolver(delta){
  const speedMultiplier = 0.5; // ajustable, plus petit = plus lent
  planets.forEach(p=>{
    p.angle += delta * speedMultiplier * p.speed;
    p.targetPos.set(p.orbit*Math.cos(p.angle),0,p.orbit*Math.sin(p.angle));
    p.mesh.position.lerp(p.targetPos,0.05);
  });
}

let lastTime = 0;
function animate(time){
  requestAnimationFrame(animate);

  const delta = (time - lastTime)/1000; // delta en secondes
  lastTime = time;

  planet_sun.rotation.y += 0.004;

  planetRevolver(delta);

  arcs.forEach((arc,i)=>{
    const scale = 1 + 0.02 * Math.sin(time*0.002 + i);
    arc.scale.set(scale,scale,scale);
  });

  composer.render();
  controls.update();
}

function onWindowResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

// --- Start ---
init();
animate(0);

document.getElementById('meteorBtn').addEventListener('click',()=>{
  window.location.href = "meteorite.html"; // bascule vers la page météorite
});
