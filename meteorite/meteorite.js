import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS2DObject } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js';

// --- Scene ---
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// --- Camera ---
let camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 20000);
let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Lumières ---
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const light = new THREE.PointLight(0xffffff, 3, 10000);
light.position.set(200,200,600);
scene.add(light);

// --- Terre ---
const earthGeo = new THREE.SphereGeometry(50, 128, 128);
const earthTex = new THREE.TextureLoader().load('https://unpkg.com/three-globe@2.24.4/example/img/earth-blue-marble.jpg');
const earthMat = new THREE.MeshPhongMaterial({map:earthTex, shininess:10});
let earth = new THREE.Mesh(earthGeo, earthMat);
earth.position.set(0,-2,-10);
scene.add(earth);
earth.r = {x:0.0005, y:0.0005, z:0.0005};

// --- Astéroïde ---
const geom = new THREE.SphereGeometry(1,64,64);
const loader = new THREE.TextureLoader();
let asteroid = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
    map: loader.load('textures/Rock030_1K-JPG_Color.jpg'),
    roughnessMap: loader.load('textures/Rock030_1K-JPG_Roughness.jpg'),
    roughness:0.8,
    metalness:0.1,
    normalMap: loader.load('textures/Rock030_1K-JPG_NormalGL.jpg'),
    displacementMap: loader.load('textures/Rock030_1K-JPG_Displacement.jpg'),
    displacementScale:0.3,
    aoMap: loader.load('textures/Rock030_1K-JPG_AmbientOcclusion.jpg'),
}));
let asteroidScale = 40/10;
asteroid.scale.set(asteroidScale, asteroidScale, asteroidScale);
asteroid.position.set(200,50,600);
asteroid.r = {x:0.002, y:0.004, z:0.003};
scene.add(asteroid);

// --- Label Astéroïde ---
const asteroidDiv = document.createElement('div');
asteroidDiv.className = 'asteroid-label';
asteroidDiv.textContent = 'Astéroïde';
asteroidDiv.style.color = 'white';
asteroidDiv.style.fontFamily = '"Orbitron", sans-serif';
asteroidDiv.style.fontSize = '16px';
asteroidDiv.style.fontWeight = 'bold';
asteroidDiv.style.textShadow = '0 0 5px black';

const asteroidLabel = new CSS2DObject(asteroidDiv);
asteroidLabel.position.set(0, asteroidScale + 2, 0); 
asteroid.add(asteroidLabel);

// --- Trajectoire calculée (courbe de Bézier) ---
let startPos = asteroid.position.clone();
let endPos = earth.position.clone();
const steps = 200;

// --- Trajectoire calculée (hors animate) ---
const controlPoint1 = startPos.clone().add(new THREE.Vector3(-100, 150, -200));
const controlPoint2 = endPos.clone().add(new THREE.Vector3(50, 50, 100));
const curve = new THREE.CubicBezierCurve3(startPos, controlPoint1, controlPoint2, endPos);
const curvePoints = curve.getPoints(steps);
const trajGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
const trajMat = new THREE.LineBasicMaterial({color:0xff0000});
let trajectoryLine = new THREE.Line(trajGeom, trajMat);
scene.add(trajectoryLine);
let progress = 0;


// --- Etoiles ---
const starsGeom = new THREE.BufferGeometry();
const starsVerts = [];
for(let i=0;i<20000;i++) starsVerts.push((Math.random()-0.5)*8000,(Math.random()-0.5)*8000,(Math.random()-0.5)*8000);
starsGeom.setAttribute('position', new THREE.Float32BufferAttribute(starsVerts,3));
scene.add(new THREE.Points(starsGeom,new THREE.PointsMaterial({color:0xffffff,size:1})));

// --- Contrôle UI ---
let vitesse = 0.0001;
let paused = true;

document.getElementById('playPauseBtn').addEventListener('click', ()=> paused = !paused);
document.getElementById('rewindBtn').addEventListener('click', ()=> {
    asteroid.position.copy(startPos);
    paused = true;
    cleanupImpact();
    earth.r = {x:0.0005, y:0.0005, z:0.0005};
    earth.material.color.set(0xffffff);
});
document.getElementById('sizeRange').addEventListener('input', e=>{
    asteroidScale = parseFloat(e.target.value)/10;
    asteroid.scale.set(asteroidScale, asteroidScale, asteroidScale);
    document.getElementById('sizeValue').textContent = e.target.value + ' m';
});
document.getElementById('speedRange').addEventListener('input', e=>{
    vitesse = parseFloat(e.target.value)/10000;
    document.getElementById('speedValue').textContent = e.target.value + ' km/s';
});

// --- Caméras ---
let cameraOffsetGeneral = new THREE.Vector3(80,30,100);
let cameraOffsetPOV = new THREE.Vector3(5,2,7);
let modeCamera = 'general';
document.getElementById('btnGeneral')?.addEventListener('click', ()=> modeCamera='general');
document.getElementById('btnPOV')?.addEventListener('click', ()=> modeCamera='pov');

// --- Explosion ---
let impactFlash=null, shockwave=null, impactParticles=null, impactLabel=null;
let impactStart=null, impactRecoil=false, recoilStart=0;
const recoilDuration = 1000, recoilDistance=20;

function createImpactEffects(position){
    cleanupImpact();

    // Flash
    const flashGeom = new THREE.SphereGeometry(5,32,32);
    const flashMat = new THREE.MeshBasicMaterial({color:0xffff33, transparent:true, opacity:0.9});
    impactFlash = new THREE.Mesh(flashGeom, flashMat);
    impactFlash.position.copy(position);
    scene.add(impactFlash);

    // Onde de choc
    const shockGeom = new THREE.RingGeometry(5,6,64);
    const shockMat = new THREE.MeshBasicMaterial({color:0xff6600, transparent:true, opacity:0.8, side:THREE.DoubleSide});
    shockwave = new THREE.Mesh(shockGeom, shockMat);
    shockwave.position.copy(position);
    shockwave.rotation.x = -Math.PI/2;
    scene.add(shockwave);

    // Particules
    const particleGeom = new THREE.BufferGeometry();
    const particleCount = 200;
    const particleVerts = [];
    for(let i=0;i<particleCount;i++) particleVerts.push(0,0,0);
    particleGeom.setAttribute('position', new THREE.Float32BufferAttribute(particleVerts,3));
    const particleMat = new THREE.PointsMaterial({color:0xffaa00,size:2});
    impactParticles = new THREE.Points(particleGeom, particleMat);
    impactParticles.userData.velocities = [];
    for(let i=0;i<particleCount;i++){
        impactParticles.userData.velocities.push(new THREE.Vector3(
            (Math.random()-0.5)*50,
            (Math.random()-0.5)*50,
            (Math.random()-0.5)*50
        ));
    }
    impactParticles.position.copy(position);
    scene.add(impactParticles);


    const density = 3000;
    const radius = asteroidScale*100;
    const volume = (4/3)*Math.PI*Math.pow(radius,3);
    const mass = density*volume;
    const vImpact = 20000;
    const energy = 0.5 * mass * vImpact * vImpact;
    const energyTNT = energy / 4.184e9;
    let damage = energy<1e18?"Petit séisme":(energy<1e20?"Séisme destructeur local":"Séisme global et cratère massif");



impactLabel = document.createElement('div');
impactLabel.className = 'impact-label';
impactLabel.style.position = 'absolute';
impactLabel.style.top = '50%';
impactLabel.style.left = '50%';
impactLabel.style.transform = 'translate(-50%, -50%)';
impactLabel.style.padding = '30px 40px';
impactLabel.style.borderRadius = '16px';
impactLabel.style.background = 'linear-gradient(135deg, rgba(255,69,0,0.85), rgba(255,140,0,0.85))';
impactLabel.style.boxShadow = '0 0 30px rgba(255,140,0,0.7)';
impactLabel.style.color = 'white';
impactLabel.style.fontSize = '26px';
impactLabel.style.fontFamily = '"Orbitron", sans-serif';
impactLabel.style.textAlign = 'center';
impactLabel.style.lineHeight = '1.5';
impactLabel.style.zIndex = '1000';
impactLabel.style.transition = 'all 0.3s ease-in-out';
impactLabel.innerHTML = `
  IMPACT SUR TERRE <br>
  <strong>Énergie:</strong> ${energyTNT.toExponential(2)} tonnes TNT<br>
  <strong>Masse:</strong> ${(mass/1e6).toFixed(2)} milliers de tonnes<br>
  <strong>Vitesse:</strong> ${(vImpact/1000).toFixed(1)} km/s<br>
  <strong>Dégâts:</strong> ${damage}
`;
document.body.appendChild(impactLabel);


impactLabel.style.transform = 'translate(-50%, -60%) scale(0.5)';
setTimeout(() => {
    impactLabel.style.transform = 'translate(-50%, -50%) scale(1)';
}, 50);

    impactStart = performance.now();
    impactRecoil = true;
    recoilStart = performance.now();
}




function updateImpactEffects(){
    if(!impactStart) return;
    const elapsed = (performance.now()-impactStart)/1000;

    if(impactFlash){
        impactFlash.scale.setScalar(1+elapsed*10);
        impactFlash.material.opacity = Math.max(0,0.9 - elapsed*0.8);
        if(impactFlash.material.opacity<=0){ scene.remove(impactFlash); impactFlash=null; }
    }

    if(shockwave){
        shockwave.scale.setScalar(1+elapsed*20);
        shockwave.material.opacity = Math.max(0,0.8 - elapsed*0.5);
        if(shockwave.material.opacity<=0){ scene.remove(shockwave); shockwave=null; }
    }

    if(impactParticles){
        const positions = impactParticles.geometry.attributes.position.array;
        for(let i=0;i<impactParticles.userData.velocities.length;i++){
            positions[3*i] += impactParticles.userData.velocities[i].x * 0.1;
            positions[3*i+1] += impactParticles.userData.velocities[i].y * 0.1;
            positions[3*i+2] += impactParticles.userData.velocities[i].z * 0.1;
            impactParticles.userData.velocities[i].multiplyScalar(0.95);
        }
        impactParticles.geometry.attributes.position.needsUpdate = true;
        if(elapsed>2){
            scene.remove(impactParticles);
            impactParticles.geometry.dispose();
            impactParticles.material.dispose();
            impactParticles = null;
        }
    }
}

function cleanupImpact(){
    if(impactFlash){ scene.remove(impactFlash); impactFlash.geometry.dispose(); impactFlash.material.dispose(); impactFlash=null;}
    if(shockwave){ scene.remove(shockwave); shockwave.geometry.dispose(); shockwave.material.dispose(); shockwave=null;}
    if(impactParticles){ scene.remove(impactParticles); impactParticles.geometry.dispose(); impactParticles.material.dispose(); impactParticles=null;}
    if(impactLabel){ document.body.removeChild(impactLabel); impactLabel=null;}
    impactStart=null;
    impactRecoil=false;
}

function animate() {
    requestAnimationFrame(animate);

    if (!paused) {
        const distanceToEarth = asteroid.position.distanceTo(endPos);
        document.getElementById('distanceValue').textContent = distanceToEarth.toFixed(1) + ' km';

        const asteroidRadius = asteroidScale; // approximatif
        const earthRadius = 50;

        if (distanceToEarth <= earthRadius + asteroidRadius && !impactStart) {

            earth.material.color.set(0xff0000);
            paused = true;
            createImpactEffects(earth.position);
        } else if (progress < 1) {
            progress += vitesse;
            const point = curve.getPoint(progress);
            asteroid.position.copy(point);
        }
        const trajPoints = [];
        const remainingSteps = Math.floor((1 - progress) * steps);
        for (let i = 0; i <= remainingSteps; i++) {
            const t = progress + i / steps;
            if (t > 1) break;
            trajPoints.push(curve.getPoint(t));
        }
        trajectoryLine.geometry.setFromPoints(trajPoints);
        asteroid.rotation.x += asteroid.r.x;
        asteroid.rotation.y += asteroid.r.y;
        asteroid.rotation.z += asteroid.r.z;

        earth.rotation.x += earth.r.x;
        earth.rotation.y += earth.r.y;
        earth.rotation.z += earth.r.z;
    }
    updateImpactEffects();


    let camOffset = modeCamera === 'general' ? cameraOffsetGeneral : cameraOffsetPOV;
    let desiredCamPos = new THREE.Vector3().copy(asteroid.position).add(camOffset);
    if (impactRecoil) {
        const elapsed = performance.now() - recoilStart;
        if (elapsed < recoilDuration) {
            const recoilVector = new THREE.Vector3()
                .subVectors(desiredCamPos, earth.position)
                .normalize()
                .multiplyScalar(recoilDistance * (1 - elapsed / recoilDuration));
            desiredCamPos.add(recoilVector);
        } else impactRecoil = false;
    }
    camera.position.lerp(desiredCamPos, 0.1);
    controls.target.copy(asteroid.position);
    controls.update();

 
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

animate();

window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
