import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(container, planetName = 'Moon') {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d18);

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(4, 0, 0);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', `Interactive 3D ${planetName}`);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(5, 3, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x899bc9, 0.6);
  fillLight.position.set(-5, 0, -5);
  scene.add(fillLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.2;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.minDistance = 1.2;
  controls.maxDistance = 8;

  return { scene, camera, renderer, controls };
}
