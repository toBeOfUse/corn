import * as THREE from "three";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import {
  ProgressGLTFLoader,
  combineClips,
  makeAnimationAwaitable,
  AwaitableAnimationAction,
  makeRainingAnimation,
} from "./utilities";
import { ToneShader } from "./shaders";
import { Corn } from "./corn";

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

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const fxaaPass = new ShaderPass(FXAAShader);
  const tonePass = new ShaderPass(ToneShader);
  composer.addPass(renderPass);
  composer.addPass(fxaaPass);
  composer.addPass(tonePass);
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
  const loadingTweet = await new ProgressGLTFLoader("/owned.glb", undefined)
    .model;
  const loadingTweetScene = loadingTweet.scene;
  scene.add(loadingTweetScene);
  const tweetAnimater = new THREE.AnimationMixer(loadingTweetScene);
  const clips = loadingTweet.animations;
  console.log("loaded", clips.length, "animations");
  const tweetAnimation = makeAnimationAwaitable(
    tweetAnimater.clipAction(combineClips(clips))
  );
  tweetAnimation.clampWhenFinished = true;
  tweetAnimation.loop = THREE.LoopOnce;

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const point = new THREE.PointLight(0xffffff, 1.1, 100);
  point.position.set(0, 20, 20);
  scene.add(point);

  const corn = new Corn("/corn.glb", document.querySelector("#info"));
  const cornGroup = new THREE.Group();
  scene.add(cornGroup);
  let activeAnimation: AwaitableAnimationAction;
  let loadStartTime = Date.now();
  corn.loaded.then(async () => {
    // wait until at least 3 seconds have passed for tweet reading purposes
    await new Promise((r) =>
      setTimeout(r, Math.max(0, 3000 - (Date.now() - loadStartTime)))
    );
    document.querySelector("#loading")?.remove();
    cornGroup.add(corn.cob);
    activeAnimation = corn.cobFadeIn;
    await activeAnimation.playThrough();
    activeAnimation = tweetAnimation;
    await activeAnimation.playThrough();
    cornGroup.add(corn.kernels);
    activeAnimation = corn.kernelsFadeIn;
    await activeAnimation.playThrough();
    loadingTweetScene.removeFromParent();
    (
      (cornGroup.getObjectByName("Cob") as THREE.Mesh)
        .material as THREE.Material
    ).transparent = false;
    (
      (cornGroup.getObjectByName("Kernel") as THREE.Mesh)
        .material as THREE.Material
    ).transparent = false;
    corn.createControls(renderer.domElement, cornGroup, camera);
  });

  // make raining kernels possible
  const baseKernel = (
    await new ProgressGLTFLoader("/kernel.glb", undefined).model
  ).scene.children[0] as THREE.Mesh;
  baseKernel.name = "FallingBase";
  const fallingKernelMixer = new THREE.AnimationMixer(null);
  const fallingKernelGroup = new THREE.Group();
  scene.add(fallingKernelGroup);

  async function createFallingKernel() {
    const kernel = baseKernel.clone();
    const fallingBoxes = fallingKernelGroup.children.map((k) =>
      new THREE.Box3().setFromObject(k)
    );
    let kbb: THREE.Box3;
    kernel.position.z = 2.5;
    do {
      kernel.position.x = Math.random() * 2 - 1;
      kernel.rotation.x = Math.PI * 2 * Math.random();
      kernel.rotation.y = Math.PI * 2 * Math.random();
      kernel.rotation.z = Math.PI * 2 * Math.random();
      kbb = new THREE.Box3().setFromObject(kernel);
    } while (fallingBoxes.some((b) => b.intersectsBox(kbb)));
    fallingKernelGroup.add(kernel);
    const animation = makeRainingAnimation(kernel, 3, fallingKernelMixer);
    animation.play();
    await animation.doneAnimating;
    kernel.removeFromParent();
  }

  async function loopFallingKernels() {
    while (true) {
      await new Promise((r) => setTimeout(r, 250));
      createFallingKernel();
    }
  }

  // create render function that utilizes the corn and composed render passes
  let lastRenderTime = Date.now() / 1000;
  let kernelsAreFalling = false;
  const renderFunction = () => {
    const currentTime = Date.now() / 1000;
    if (activeAnimation) {
      activeAnimation.getMixer().update(currentTime - lastRenderTime);
    }
    fallingKernelMixer.update(currentTime - lastRenderTime);
    corn.update();
    if (corn.completelyEaten() && !kernelsAreFalling) {
      kernelsAreFalling = true;
      loopFallingKernels();
      (document.querySelector("#congrats") as HTMLElement).style.display =
        "unset";
    }
    lastRenderTime = currentTime;
    composer.render();
  };

  // add renderer to DOM and start the animation loop
  document.body.appendChild(renderer.domElement);
  animate(renderFunction);
}

createScene();
