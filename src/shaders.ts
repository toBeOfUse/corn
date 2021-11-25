import { Vector2 } from "three";

const map = [
  new Vector2(0, 0),
  new Vector2(0.2, 0.3),
  new Vector2(0.47, 0.6),
  new Vector2(0.82, 0.85),
  new Vector2(1, 1),
];

const ToneShader = {
  uniforms: {
    tDiffuse: { value: null },
    toneMap: { value: map },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 toneMap[${map.length}];
    varying vec2 vUv;
    void main() {
        vec4 texel = texture2D( tDiffuse, vUv );
        float luma =  dot(texel.xyz, vec3(0.299, 0.587, 0.114));
        float desiredLuma;
        for (int i=0; i < ${map.length}-1; i++){
            if (luma >= toneMap[i].x && luma <= toneMap[i+1].x){
                float mixFactor = (luma - toneMap[i].x) / (toneMap[i+1].x - toneMap[i].x);
                desiredLuma = mix(toneMap[i].y, toneMap[i+1].y, mixFactor);
                break;
            }
        }
        float moreBrightness = desiredLuma - luma;
        gl_FragColor = clamp(vec4(texel.xyz+moreBrightness, texel.w), vec4(0,0,0,0), vec4(1,1,1,1));
    }`,
};

export { ToneShader };
