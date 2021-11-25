import { Euler } from "three";
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
    const currentPointer = this.getPointerPos(event);
    const pixelsToDegrees = 1;
    const pixelsToRadians = (pixelsToDegrees / 360) * (2 * Math.PI);
    this.rotation.y +=
      (currentPointer.x - this._lastPointer.x) * pixelsToRadians;
    this.rotation.x +=
      (currentPointer.y - this._lastPointer.y) * pixelsToRadians;
    this._lastPointer = currentPointer;
  }
  constructor(el: HTMLCanvasElement, startingRotation: THREE.Euler) {
    this.rotation = startingRotation;
    el.addEventListener("mousedown", (e) => this.pointerDown(e));
    el.addEventListener("mousemove", (e) => this.pointerMove(e));
    el.addEventListener("mouseup", () => this.pointerUp());
    // add touch events
  }
}

export { loadGLTF, CornControls };
