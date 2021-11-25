import * as THREE from "three";
import { loadGLTF, CornControls } from "./utilities";

function animate(renderFunction: () => void) {
  requestAnimationFrame(() => animate(renderFunction));
  renderFunction();
}

async function createScene() {
  // set up camera
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // set up renderer
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.backgroundImage = "url(fieldbg.jpg)";
  renderer.domElement.style.backgroundSize = "cover";

  // create scene and add objects and lights
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const kernels = (await loadGLTF("/kernels.glb")).scene;
  group.add(kernels);
  const cob = (await loadGLTF("/cob.glb")).scene;
  group.add(cob);
  scene.add(group);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(0, 0.5, 0.5);
  scene.add(directionalLight);
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  //   const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
  //   scene.add(helper);

  //   const light = new THREE.AmbientLight(0xffffff, 1); // soft white light
  //   scene.add(light);

  // set up controls
  const controls = new CornControls(
    renderer.domElement,
    new THREE.Euler(Math.PI / 2, Math.PI / 2, 0)
  );

  // create render function that utilizes the renderer, scene, camera, and controls
  // let count = 0;
  const renderFunction = () => {
    group.setRotationFromEuler(controls.rotation);
    // if (count % 100 == 0) {
    //   console.log(controls.rotation);
    // }
    // count++;
    renderer.render(scene, camera);
  };

  // add renderer to DOM and start the animation loop
  document.body.appendChild(renderer.domElement);
  animate(renderFunction);
}

createScene();
