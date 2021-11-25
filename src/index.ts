import * as THREE from "three";
import { Mesh, MeshStandardMaterial, Raycaster } from "three";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
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

  // set up renderer and composer
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.backgroundImage = "url(fieldbg.jpg)";
  renderer.domElement.style.backgroundSize = "cover";
  renderer.domElement.style.backgroundPosition = "center";
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();

  const fxaaPass = new ShaderPass(FXAAShader);
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  composer.addPass(fxaaPass);
  composer.setPixelRatio(window.devicePixelRatio);

  function initializeDimensions() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms["resolution"].value.x =
      1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms["resolution"].value.y =
      1 / (window.innerHeight * pixelRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
    const aspectRatio = window.innerWidth / window.innerHeight;
    camera.position.z = 4;
    if (aspectRatio < 4 / 3) {
      camera.position.z *= 1.5 * (1 / aspectRatio);
    }
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
  }

  initializeDimensions();
  window.addEventListener("resize", initializeDimensions);

  // initialize scene and add objects and lights
  const corn = (await loadGLTF("/corn.glb")).scene;
  (
    (corn.children.find((c) => c.name == "Cob") as Mesh)
      .material as MeshStandardMaterial
  ).roughness = 1;
  scene.add(corn);

  function getKernelCount() {
    return corn.children.length - 1;
  }
  const initialKernelCount = getKernelCount();

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const point = new THREE.PointLight(0xffffff, 1.1, 100);
  point.position.set(0, 20, 20);
  scene.add(point);

  // set up controls
  const controls = new CornControls(
    renderer.domElement,
    new THREE.Euler(0, 0, 0)
  );

  const raycaster = new Raycaster();
  renderer.domElement.addEventListener("click", (event) => {
    if ((window as any)._cornCancelClick) {
      // clicks that immediately follow drags are actually part of the drag. hence
      // the kludge semaphore
      (window as any)._cornCancelClick = false;
      return;
    }
    const ndc = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };
    raycaster.setFromCamera(ndc, camera);
    const intersects = raycaster.intersectObjects(
      corn.children.filter((c) => c.name.includes("Kernel")),
      false
    );
    if (intersects.length > 0) {
      intersects[0].object.removeFromParent();
    }
  });

  // create render function that utilizes the renderer, scene, camera, and controls
  const renderFunction = () => {
    controls.applyRotation(corn);
    composer.render();
    document.querySelector("#info").innerHTML = `${(
      ((initialKernelCount - getKernelCount()) / initialKernelCount) *
      100
    ).toFixed(2)} % Eaten`;
  };

  // add renderer to DOM and start the animation loop
  document.body.appendChild(renderer.domElement);
  animate(renderFunction);
}

createScene();
