import * as THREE from "three";
import { MeshPhongMaterial } from "three";
import { loadGLTF, CornControls } from "./utilities";

function animate(renderFunction: () => void) {
  requestAnimationFrame(() => animate(renderFunction));
  renderFunction();
}

async function createScene() {
  // set up camera
  const vFOV = 50;
  const aspectRatio = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(vFOV, aspectRatio, 0.1, 1000);

  // set up renderer
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.backgroundImage = "url(fieldbg.jpg)";
  renderer.domElement.style.backgroundSize = "cover";
  renderer.domElement.style.backgroundPosition = "center";

  function initializeDimensions() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    const aspectRatio = window.innerWidth / window.innerHeight;
    camera.position.z = 4;
    if (aspectRatio < 1) {
      camera.position.z *= 1.5 * (1 / aspectRatio);
    }
  }

  initializeDimensions();
  window.addEventListener("resize", initializeDimensions);

  // create scene and add objects and lights
  const scene = new THREE.Scene();
  const corn = (await loadGLTF("/corn.glb")).scene;
  const kernelMaterial = new MeshPhongMaterial({
    color: 0xfff159,
    shininess: 1,
  });
  for (const child of corn.children) {
    if (child.name.includes("Kernel") && child instanceof THREE.Mesh) {
      child.material = kernelMaterial;
    }
  }
  scene.add(corn);

  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);
  const point = new THREE.PointLight(0xffffff, 0.5, 100);
  point.position.set(0, -10, 0);
  scene.add(point);
  const point2 = new THREE.PointLight(0xffffff, 0.8, 100);
  point2.position.set(0, 5, 5);
  scene.add(point2);

  // set up controls
  const controls = new CornControls(
    renderer.domElement,
    new THREE.Euler(0, 0, 0)
  );

  // create render function that utilizes the renderer, scene, camera, and controls
  const renderFunction = () => {
    controls.applyRotation(corn);
    renderer.render(scene, camera);
  };

  // add renderer to DOM and start the animation loop
  document.body.appendChild(renderer.domElement);
  animate(renderFunction);
}

createScene();
