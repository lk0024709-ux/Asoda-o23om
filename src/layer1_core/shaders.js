/* ============================================================================
   Layer 1 — Core Engine: Custom GLSL Shaders
   - Indian Heritage Water Shader (Lake Pichola, Ganges, Betwa, Kochi Backwaters)
     with animated multi-wave ripples, Fresnel sky reflection & sunlit glints
   - Desert Highway Heat Haze Shimmer Shader
   - Aravalli Wind Dust & Golden Motes GPU Particle System
   ============================================================================ */

import * as THREE from "three";

export function createIndianWaterMaterial(options = {}) {
  const deepHex = options.deepColor ?? 0x0b4f6c;
  const shallowHex = options.shallowColor ?? 0x1ca3b8;
  const skyHex = options.skyColor ?? 0xf9d8a6;
  const sunHex = options.sunColor ?? 0xfff1c1;

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color(deepHex) },
      uShallowColor: { value: new THREE.Color(shallowHex) },
      uSkyColor: { value: new THREE.Color(skyHex) },
      uSunColor: { value: new THREE.Color(sunHex) },
      uSunDir: { value: new THREE.Vector3(0.45, 0.55, 0.4).normalize() },
      uNightFactor: { value: 0.0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        float w1 = sin(worldPos.x * 0.24 + uTime * 1.4) * 0.09;
        float w2 = cos(worldPos.z * 0.29 - uTime * 1.15) * 0.08;
        float w3 = sin((worldPos.x + worldPos.z) * 0.16 + uTime * 0.85) * 0.05;
        worldPos.y += w1 + w2 + w3;
        vWave = w1 + w2 + w3;
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSkyColor;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform float uNightFactor;

      varying vec3 vWorldPos;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        // Procedural multi-frequency ripple normal perturbation
        float rx = cos(vWorldPos.x * 0.55 + uTime * 1.8) * 0.12 +
                   sin(vWorldPos.z * 0.85 - uTime * 1.5) * 0.07;
        float rz = sin(vWorldPos.z * 0.62 + uTime * 1.6) * 0.12 +
                   cos(vWorldPos.x * 0.78 + uTime * 1.2) * 0.07;
        vec3 N = normalize(vec3(rx, 1.0, rz));
        vec3 V = normalize(cameraPosition - vWorldPos);

        // Fresnel sky/diya reflection blend
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        float edgeDist = length(vUv - vec2(0.5)) * 2.0;
        vec3 baseWater = mix(uDeepColor, uShallowColor, clamp(edgeDist * 0.75 + vWave * 1.2, 0.0, 1.0));
        vec3 reflectedSky = mix(uSkyColor, vec3(0.12, 0.16, 0.28), uNightFactor * 0.85);
        vec3 color = mix(baseWater, reflectedSky, clamp(fresnel * 0.68, 0.08, 0.75));

        // Sun / moon golden shimmer reflection
        vec3 H = normalize(normalize(uSunDir) + V);
        float spec = pow(max(dot(N, H), 0.0), 72.0);
        color += uSunColor * spec * (1.25 - uNightFactor * 0.55);

        // Subtle shoreline foam shimmer
        float foam = smoothstep(0.92, 1.0, edgeDist + sin(uTime * 2.2 + vWorldPos.x * 0.4) * 0.03);
        color = mix(color, vec3(0.95, 0.96, 0.92), foam * 0.35);

        gl_FragColor = vec4(color, 0.9);
      }
    `
  });
}

export function createHeatHazeMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.16 }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        float wave = sin(vUv.x * 26.0 + uTime * 4.2) * cos(vUv.y * 14.0 - uTime * 3.1);
        float fade = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.2, vUv.y);
        float alpha = clamp((wave * 0.5 + 0.5) * fade * uIntensity, 0.0, 0.22);
        gl_FragColor = vec4(1.0, 0.92, 0.76, alpha);
      }
    `
  });
}

export function createDustParticleSystem(count = 260, area = 160, hexColor = 0xf4d59d) {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * area;
    positions[i * 3 + 1] = 0.8 + Math.random() * 24;
    positions[i * 3 + 2] = (Math.random() - 0.5) * area;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(hexColor) },
      uSize: { value: 3.4 }
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      uniform float uTime;
      uniform float uSize;
      varying float vAlpha;

      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.45 + aPhase) * 2.2;
        p.y += sin(uTime * 0.7 + aPhase * 1.7) * 0.85;
        p.z += cos(uTime * 0.38 + aPhase) * 2.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(uSize * (120.0 / max(10.0, -mv.z)), 1.5, 7.0);
        vAlpha = 0.28 + 0.22 * sin(uTime * 1.5 + aPhase);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float soft = smoothstep(0.5, 0.08, d);
        gl_FragColor = vec4(uColor, soft * vAlpha);
      }
    `
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}
