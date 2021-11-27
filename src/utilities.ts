import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

class ProgressGLTFLoader {
  loader = new GLTFLoader();
  model: Promise<GLTF>;
  constructor(gltfPath: string, progressBar?: HTMLProgressElement) {
    if (progressBar) {
      progressBar.max = 1;
      progressBar.value = 0;
    }
    this.model = this.loader.loadAsync(gltfPath, (xhr) => {
      if (progressBar && xhr.total > 0) {
        progressBar.value = xhr.loaded / xhr.total;
      }
    });
  }
}

interface AwaitableAnimationAction extends THREE.AnimationAction {
  doneAnimating: Promise<void>;
  playThrough: () => Promise<void>;
}

function makeAnimationAwaitable(
  action: THREE.AnimationAction
): AwaitableAnimationAction {
  const doneAnimating = new Promise<void>((resolve) => {
    action.getMixer().addEventListener("finished", () => resolve());
  });
  return Object.assign(action, {
    doneAnimating,
    playThrough: async () => {
      action.play();
      await doneAnimating;
    },
  });
}

function makeFadeInAnimation(
  target: THREE.Object3D | THREE.Material,
  lengthInSeconds: number
): AwaitableAnimationAction {
  const property =
    target instanceof THREE.Object3D ? ".material.opacity" : ".opacity";
  const fadeInTrack = new THREE.NumberKeyframeTrack(
    property,
    [0, lengthInSeconds],
    [0, 1]
  );
  const fadeInAnimation = new THREE.AnimationClip("fadeIn", -1, [fadeInTrack]);
  const mixer = new THREE.AnimationMixer(target as any);
  const action = mixer.clipAction(fadeInAnimation);
  action.loop = THREE.LoopOnce;
  action.clampWhenFinished = true;
  return makeAnimationAwaitable(action);
}

function combineClips(clips: THREE.AnimationClip[]): THREE.AnimationClip {
  const mainClip = clips[0];
  for (const animation of clips.slice(1)) {
    for (const track of animation.tracks) {
      mainClip.tracks.push(track);
    }
  }
  return mainClip;
}

export {
  ProgressGLTFLoader,
  makeFadeInAnimation,
  makeAnimationAwaitable,
  AwaitableAnimationAction,
  combineClips,
};
