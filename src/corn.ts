import { Object3D, Euler, Vector3 } from "three";
import * as THREE from "three";
import {
  ProgressGLTFLoader,
  makeFadeInAnimation,
  AwaitableAnimationAction,
} from "./utilities";

class CornControls {
  rotation: THREE.Euler;
  _active = false;
  _lastPointer = { x: -1, y: -1 };
  _raycaster = new THREE.Raycaster();
  _justDragged = false;
  _kernels: THREE.Group;
  _cob: THREE.Object3D;
  _camera: THREE.Camera;

  getPointerPos(event: MouseEvent | TouchEvent) {
    if (event instanceof MouseEvent) {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    } else {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  }

  pointerDown(event: MouseEvent | TouchEvent) {
    this._active = true;
    this._lastPointer = this.getPointerPos(event);
  }

  pointerUp() {
    this._active = false;
  }

  pointerMove(event: MouseEvent | TouchEvent) {
    if (!this._active) {
      return;
    }
    // cancel next click event as it is actually part of this drag
    this._justDragged = true;
    event.preventDefault();
    // if the model has been rotated around the y axis more than 90 degrees and less
    // than 270 degrees either positively or negatively, it has been "turned around"
    // and the x-rotation needs to be flipped
    const testY = Math.abs(this.rotation.y) % (Math.PI * 2);
    const turnedAround = testY > Math.PI / 2 && testY < (3 * Math.PI) / 2;
    const currentPointer = this.getPointerPos(event);
    const pixelsToDegrees = 1;
    const pixelsToRadians = (pixelsToDegrees / 360) * (2 * Math.PI);
    this.rotation.y +=
      (currentPointer.x - this._lastPointer.x) * pixelsToRadians;
    this.rotation.x +=
      (turnedAround ? -1 : 1) *
      (currentPointer.y - this._lastPointer.y) *
      pixelsToRadians;
    this._lastPointer = currentPointer;
  }

  click(event: MouseEvent) {
    if (this._justDragged) {
      // clicks that immediately follow drags are actually part of the drag. hence
      // the kludge semaphore
      this._justDragged = false;
      return;
    }
    const ndc = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };
    this._raycaster.setFromCamera(ndc, this._camera);
    if (this._kernels.children.length == 1 && this._cob.parent) {
      if (this._raycaster.intersectObject(this._cob)) {
        this._cob.removeFromParent();
      }
    } else {
      const intersects = this._raycaster.intersectObjects(
        this._kernels.children
      );
      if (intersects.length) {
        intersects[0].object.removeFromParent();
      }
    }
  }

  constructor(
    el: HTMLCanvasElement,
    startingRotation: THREE.Euler,
    kernels: THREE.Group,
    cob: THREE.Object3D,
    camera: THREE.Camera
  ) {
    this.rotation = startingRotation;
    this._kernels = kernels;
    this._cob = cob;
    this._camera = camera;
    el.addEventListener("mousedown", (e) => this.pointerDown(e));
    el.addEventListener("mousemove", (e) => this.pointerMove(e));
    el.addEventListener("mouseup", () => this.pointerUp());
    el.addEventListener("touchstart", (e) => this.pointerDown(e));
    el.addEventListener("touchmove", (e) => this.pointerMove(e));
    el.addEventListener("touchend", () => this.pointerUp());
    el.addEventListener("click", (e) => this.click(e));
  }

  applyRotation(obj: Object3D) {
    // we want to rotate the corn around the global y and the local x (the local
    // x-axis goes lengthwise along the cob)
    obj.setRotationFromEuler(new Euler(this.rotation.x, 0, 0));
    obj.rotateOnWorldAxis(new Vector3(0, 1, 0), this.rotation.y);
  }
}

class Corn {
  cob?: Object3D;
  kernels?: THREE.Group;
  cobFadeIn?: AwaitableAnimationAction;
  kernelsFadeIn?: AwaitableAnimationAction;
  loaded: Promise<void>;
  renderGroup?: THREE.Group;
  _controls: CornControls;
  _initialObjectCount: number;
  _statusElement: HTMLElement;
  constructor(cornURL: string, statusElement: HTMLElement) {
    this._statusElement = statusElement;
    this.loaded = new ProgressGLTFLoader(cornURL, undefined).model.then(
      (cornScene) => {
        this.cob = cornScene.scene.getObjectByName("Cob");
        this._initialObjectCount = cornScene.scene.children.length;
        const encounteredMaterials = new Set();
        for (const k of cornScene.scene.children) {
          if (k instanceof THREE.Mesh) {
            const mat = k.material as THREE.MeshStandardMaterial;
            if (!encounteredMaterials.has(mat)) {
              mat.transparent = true;
              mat.format = THREE.RGBAFormat;
              mat.opacity = 0;
              encounteredMaterials.add(mat);
            }
          }
        }
        this.kernels = new THREE.Group();
        for (let i = 0; i < cornScene.scene.children.length; ) {
          const child = cornScene.scene.children[i];
          if (child.name != "Cob") {
            this.kernels.add(child);
          } else {
            i++;
          }
        }
        this.cobFadeIn = makeFadeInAnimation(this.cob, 0.5);
        this.kernelsFadeIn = makeFadeInAnimation(
          (this.kernels.children[0] as THREE.Mesh).material as THREE.Material,
          0.5
        );
        this._statusElement.style.display = "unset";
      }
    );
  }
  createControls(
    el: HTMLCanvasElement,
    renderGroup: THREE.Group,
    camera: THREE.Camera
  ) {
    this.renderGroup = renderGroup;
    this._controls = new CornControls(
      el,
      new THREE.Euler(0, 0, 0),
      this.kernels,
      this.cob,
      camera
    );
  }
  update() {
    if (this._controls && this.renderGroup) {
      this._controls.applyRotation(this.renderGroup);
    }
    if (this.kernels && this.cob) {
      const statusText = `${(
        100 -
        ((this.kernels.children.length + (this.cob.parent ? 1 : 0)) /
          this._initialObjectCount) *
          100
      ).toFixed(2)} % Eaten`;
      if (this._statusElement.innerHTML != statusText) {
        this._statusElement.innerHTML = statusText;
      }
    }
  }
}

export { CornControls, Corn };
