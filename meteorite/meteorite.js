import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js';

// --- Variables globales ---
let scene, camera, renderer, labelRenderer, controls;
let earth, asteroid, trajectoryLine;
let paused = true;
const metersToScene = 0.02;
let asteroidDiameterMeters = 40;
let userImpactSpeed = 10000; // m/s
let points = [], t = 0;
const clock = new THREE.Clock();

// --- INIT scène ---
scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 20000);
camera.position.set(200, 50, 700);

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lumières
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const light = new THREE.PointLight(0xffffff, 2, 5000);
light.position.set(20, 20, 20);
scene.add(light);

// --- Terre ---
const earthGeo = new THREE.SphereGeometry(20, 128, 128);
const earthTex = new THREE.TextureLoader().load('https://unpkg.com/three-globe@2.24.4/example/img/earth-blue-marble.jpg');
const earthMat = new THREE.MeshPhongMaterial({ map: earthTex, shininess: 10 });
earth = new THREE.Mesh(earthGeo, earthMat);
earth.position.set(0, -2, -10);
scene.add(earth);

// --- Astéroïde ---
const geom = new THREE.SphereGeometry(1, 64, 64);
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
});
asteroid = new THREE.Mesh(geom, meteorMaterial);
setAsteroidScaleFromDiameter(asteroidDiameterMeters);
scene.add(asteroid);

// --- Label de l'astéroïde ---
const asteroidLabelDiv = document.createElement('div');
asteroidLabelDiv.className = 'label';
asteroidLabelDiv.textContent = 'Astéroïde';
asteroidLabelDiv.style.marginTop = '-1em';
const asteroidLabel = new CSS2DObject(asteroidLabelDiv);
asteroid.add(asteroidLabel);

// --- Fonctions ---
function setAsteroidScaleFromDiameter(d){
    const radiusScene = (d/2)*metersToScene;
    asteroid.scale.set(radiusScene*5, radiusScene*5, radiusScene*5); // *5 pour visibilité
    asteroid.userData = { diameterMeters: d };
}

// --- Trajectoire par défaut ---
function createDefaultTrajectory(){
    const defaultStart = new THREE.Vector3(200,50,600);
    const defaultEnd = new THREE.Vector3(0,-2,-10);
    const steps = 100;
    points = [];
    for(let i=0;i<=steps;i++){
        points.push(new THREE.Vector3().lerpVectors(defaultStart, defaultEnd, i/steps));
    }
    if(trajectoryLine) scene.remove(trajectoryLine);
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    trajectoryLine = new THREE.Line(geom, mat);
    scene.add(trajectoryLine);
    asteroid.position.copy(points[0]);
}
createDefaultTrajectory();

// --- WebSocket ---
const ws = new WebSocket("ws://localhost:8765");
ws.onopen = () => console.log("WebSocket connected");
ws.onmessage = (event)=>{
    const data = JSON.parse(event.data);
    points = data.frames.map(f=>new THREE.Vector3(f.pos_km[0]*1000*metersToScene,f.pos_km[1]*1000*metersToScene,f.pos_km[2]*1000*metersToScene));
    if(trajectoryLine) scene.remove(trajectoryLine);
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    trajectoryLine = new THREE.Line(geom, mat);
    scene.add(trajectoryLine);
    asteroid.position.copy(points[0]);
    t=0;
    paused=true;
};

// --- UI Events ---
document.getElementById('sizeRange').addEventListener('input', e=>{
    asteroidDiameterMeters=parseFloat(e.target.value);
    setAsteroidScaleFromDiameter(asteroidDiameterMeters);
    document.getElementById('sizeValue').textContent=asteroidDiameterMeters+" m";
});
document.getElementById('speedRange').addEventListener('input', e=>{
    const kmPerSec=parseFloat(e.target.value);
    userImpactSpeed=kmPerSec*1000;
    document.getElementById('speedValue').textContent=kmPerSec+" km/s";
});
document.getElementById('playPauseBtn').addEventListener('click',()=>paused=!paused);
document.getElementById('rewindBtn').addEventListener('click',()=>{
    t=0;
    if(points.length>0) asteroid.position.copy(points[0]);
    paused=true;
});
document.getElementById('computeBtn').addEventListener('click',()=>{
    const r_km=[parseFloat(document.getElementById('posX').value),parseFloat(document.getElementById('posY').value),parseFloat(document.getElementById('posZ').value)];
    const v_km_s=[parseFloat(document.getElementById('velX').value),parseFloat(document.getElementById('velY').value),parseFloat(document.getElementById('velZ').value)];
    ws.send(JSON.stringify({ r_km, v_km_s, diameter_m: asteroidDiameterMeters }));
});

// --- Animation ---
function animate(){
    requestAnimationFrame(animate);

    if(points.length>0 && !paused){
        if(t<points.length-1){
            t+=1;
            asteroid.position.lerp(points[t],0.2);
        }
    }

    // Caméra suit l'astéroïde
    const offset=new THREE.Vector3(0,50,200);
    camera.position.copy(asteroid.position.clone().add(offset));
    camera.lookAt(asteroid.position);

    controls.update();
    renderer.render(scene,camera);
    labelRenderer.render(scene,camera);
}
animate();

// --- Resize ---
window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
    labelRenderer.setSize(window.innerWidth,window.innerHeight);
});
