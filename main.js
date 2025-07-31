import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 60);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xaaaaaa));
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(5,32,32),
  new THREE.MeshBasicMaterial({ color: 0xffaa00, emissive:0xff5500 })
);
scene.add(sun);

// Définition des planètes
const planetsData = [
  { name:'Research', color:0x00ffdd, radius:10, speed:0.02, url:'research.html' },
  { name:'Outreach', color:0xff00aa, radius:16, speed:0.015, url:'outreach.html' },
  { name:'Myself', color:0x00aaff, radius:22, speed:0.01, url:'myself.html' },
  { name:'Game', color:0xaaff00, radius:28, speed:0.008, url:'game.html' }
];
const planetGroups = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

planetsData.forEach(data => {
  const group = new THREE.Group();
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(2,16,16),
    new THREE.MeshPhongMaterial({ color: data.color })
  );
  planet.userData = { url: data.url };
  planet.position.x = data.radius;
  group.add(planet);
  scene.add(group);

  const div = document.createElement('div');
  div.className = 'label';
  div.textContent = data.name;
  div.style.color = 'white';
  const label = new CSS2DObject(div);
  label.position.set(0, 3, 0);
  planet.add(label);

  planetGroups.push({ group, speed: data.speed });
});

// gestion resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// clic souris
window.addEventListener('click', e => {
  mouse.x = (e.clientX/window.innerWidth)*2 -1;
  mouse.y = -(e.clientY/window.innerHeight)*2 +1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetGroups.map(pg=>pg.group.children[0]));
  if(intersects.length>0){
    window.location = intersects[0].object.userData.url;
  }
});

// boucle animation
function animate(){
  planetGroups.forEach(pg => {
    pg.group.rotation.y += pg.speed;
  });
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
