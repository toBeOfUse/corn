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
  const corn = (await loadGLTF("/corn.glb")).scene;
  scene.add(corn);
  // const directional = new THREE.DirectionalLight(0xffffff);
  // directional.position.set(0, 0.5, 0.5);
  // scene.add(directional);
  //   const helper = new THREE.directionalHelper(directional, 5);
  //   scene.add(helper);

  const ambient = new THREE.AmbientLight(0xffffff, 0.3); // soft white light
  scene.add(ambient);
  const point = new THREE.PointLight(0xffffff, 1, 100);
  point.position.set(0, -10, 0);
  scene.add(point);
  const point2 = new THREE.PointLight(0xffffff, 1, 100);
  point2.position.set(0, 5, 5);
  scene.add(point2);

  // set up controls
  const controls = new CornControls(
    renderer.domElement,
    new THREE.Euler(0, 0, 0)
  );

  // create render function that utilizes the renderer, scene, camera, and controls
  // let count = 0;
  const renderFunction = () => {
    corn.setRotationFromEuler(new THREE.Euler(controls.rotation.x, 0, 0));
    corn.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), controls.rotation.y);
    renderer.render(scene, camera);
  };

  // add renderer to DOM and start the animation loop
  document.body.appendChild(renderer.domElement);
  animate(renderFunction);
}

createScene();
