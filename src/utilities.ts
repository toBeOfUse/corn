import { Object3D, Euler, Vector3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const loader = new GLTFLoader();

function loadGLTF(path: string): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      function (gltf) {
        resolve(gltf);
      },
      undefined,
      function (error) {
        console.error("could not load gltf model");
        console.error(error);
        reject(error);
      }
    );
  });
}

class CornControls {
  rotation: THREE.Euler;
  _active = false;
  _lastPointer = { x: -1, y: -1 };

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
    (window as any)._cornCancelClick = true;
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

  constructor(el: HTMLCanvasElement, startingRotation: THREE.Euler) {
    this.rotation = startingRotation;
    el.addEventListener("mousedown", (e) => this.pointerDown(e));
    el.addEventListener("mousemove", (e) => this.pointerMove(e));
    el.addEventListener("mouseup", () => this.pointerUp());
    el.addEventListener("touchstart", (e) => this.pointerDown(e));
    el.addEventListener("touchmove", (e) => this.pointerMove(e));
    el.addEventListener("touchend", () => this.pointerUp());
  }

  applyRotation(obj: Object3D) {
    // we want to rotate the corn around the global y and the local x (the local
    // x-axis goes lengthwise along the cob)
    obj.setRotationFromEuler(new Euler(this.rotation.x, 0, 0));
    obj.rotateOnWorldAxis(new Vector3(0, 1, 0), this.rotation.y);
  }
}

export { loadGLTF, CornControls };
