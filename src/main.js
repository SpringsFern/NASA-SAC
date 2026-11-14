
import './style.css';

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050711);

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 4);

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.querySelector('#app').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

// Soft fill light
const fillLight = new THREE.DirectionalLight(0x899bc9, 0.6);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.dampingFactor = 0.05;
controls.minDistance = 1.8;
controls.maxDistance = 8;

// Load NASA Moon model
const loader = new GLTFLoader();

const loading = document.querySelector('#loading');

loader.load(
  '/models/moon_topo_small.glb',

  (gltf) => {
    const moon = gltf.scene;

    // Centre the model and fit it to our scene
    const box = new THREE.Box3().setFromObject(moon);
    const centre = box.getCenter(new THREE.Vector3());

    moon.position.sub(centre);

    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    moon.scale.setScalar(2 / maxDimension);

    scene.add(moon);

    loading.textContent = 'Drag to explore the Moon • Scroll to zoom';
    loading.classList.add('loaded');

    window.moon = moon;
  },

  (progress) => {
    if (progress.total > 0) {
      const percent = Math.round(
        (progress.loaded / progress.total) * 100
      );
      loading.textContent = `Loading Moon... ${percent}%`;
    }
  },

  (error) => {
    console.error('Moon loading error:', error);
    loading.textContent = 'Could not load Moon. Check the console.';
  }
);

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation
function animate() {
  requestAnimationFrame(animate);

  if (window.moon && !controls.enabled) {
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
