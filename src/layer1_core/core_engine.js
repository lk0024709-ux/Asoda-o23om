/* ============================================================================
   Layer 1 — Core Engine: Three.js Renderer, Post-Processing, Device-Tier Auto
   Detection, ACESFilmic Tone Mapping & Dynamic 24-Hour Indian Celestial Lighting
   ============================================================================ */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { createDustParticleSystem } from "./shaders.js";

export function detectDeviceTier() {
  if (typeof navigator === "undefined") return "high";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (isMobile && (cores <= 4 || mem <= 3)) return "low";
  if (isMobile) return "medium";
  if (cores <= 4) return "medium";
  return "high";
}

export class CoreEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.tier = options.tier || detectDeviceTier();
    this.headless = !!options.headless;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9ecbe8);
    this.scene.fog = new THREE.FogExp2(0xe8cba0, 0.0042);

    const aspect =
      canvas && canvas.clientWidth && canvas.clientHeight
        ? canvas.clientWidth / canvas.clientHeight
        : 16 / 9;

    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.3, this.tier === "low" ? 260 : 480);
    this.camera.position.set(0, 6, 14);

    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;
    this.fxaaPass = null;
    this.usePostFX = this.tier !== "low";

    // Dynamic lighting rig
    this.hemiLight = null;
    this.sunLight = null;
    this.moonLight = null;
    this.sunMesh = null;
    this.moonMesh = null;
    this.dustSystem = null;
    this.starField = null;

    if (!this.headless) {
      this._initRenderer();
      this._initPostProcessing();
    }
    this._initLightingAndSky();
  }

  _initRenderer() {
    const pixelRatioCap = this.tier === "low" ? 1.0 : this.tier === "medium" ? 1.5 : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.tier === "low",
      powerPreference: "high-performance",
      preserveDrawingBuffer: true // Enables real Photo Mode PNG screenshots!
    });
    this.renderer.setPixelRatio(pixelRatioCap);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type =
      this.tier === "low" ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
  }

  _initPostProcessing() {
    if (!this.renderer || !this.usePostFX) return;
    try {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      // Subtle UnrealBloom for temple diyas, Diwali lights, Ganga Aarti & Mysore night illumination
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(w, h),
        this.tier === "high" ? 0.38 : 0.26,
        0.55,
        0.82
      );
      this.composer.addPass(this.bloomPass);

      this.fxaaPass = new ShaderPass(FXAAShader);
      const pr = this.renderer.getPixelRatio();
      this.fxaaPass.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
      this.composer.addPass(this.fxaaPass);

      this.composer.addPass(new OutputPass());
    } catch (err) {
      console.warn("[CoreEngine] Falling back to direct renderer:", err);
      this.composer = null;
      this.usePostFX = false;
    }
  }

  _initLightingAndSky() {
    this.hemiLight = new THREE.HemisphereLight(0xffe9c4, 0x6b4f35, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1cf, 2.2);
    this.sunLight.position.set(60, 75, 45);
    this.sunLight.castShadow = true;
    const shadowSize = this.tier === "low" ? 512 : this.tier === "medium" ? 1024 : 2048;
    this.sunLight.shadow.mapSize.set(shadowSize, shadowSize);
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 260;
    const d = 88;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.moonLight = new THREE.DirectionalLight(0x7aa2f7, 0.0);
    this.moonLight.position.set(-50, 60, -40);
    this.scene.add(this.moonLight);

    // Sun & Moon celestial spheres
    this.sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(8.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffefad })
    );
    this.scene.add(this.sunMesh);

    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xdbeafe })
    );
    this.scene.add(this.moonMesh);

    // Night Starfield Dome
    const starCount = this.tier === "low" ? 140 : 320;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(0.15 + Math.random() * 0.85);
      const r = 210;
      starPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    this.starField = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xfff8dc, size: 1.8, transparent: true, opacity: 0 })
    );
    this.scene.add(this.starField);

    // Aravalli golden dust motes
    this.dustSystem = createDustParticleSystem(this.tier === "low" ? 110 : 260, 170, 0xf7d89c);
    this.scene.add(this.dustSystem);
  }

  setQualityTier(tier) {
    this.tier = tier;
    this.camera.far = tier === "low" ? 260 : 480;
    this.camera.updateProjectionMatrix();

    if (this.renderer) {
      const pr = tier === "low" ? 1.0 : tier === "medium" ? 1.5 : Math.min(window.devicePixelRatio || 1, 2);
      this.renderer.setPixelRatio(pr);
      this.renderer.shadowMap.enabled = tier !== "low";
      this.usePostFX = tier !== "low";
      if (this.usePostFX && !this.composer) {
        this._initPostProcessing();
      }
      if (this.bloomPass) {
        this.bloomPass.strength = tier === "high" ? 0.38 : 0.24;
      }
      this.resize();
    }
  }

  // Updates celestial sky, fog, sun/moon lighting & night factor (hour in [0..24))
  updateAtmosphere(hourOfDay, elapsedSec, hubTheme, playerPos) {
    // 6:00 sunrise (0), 12:00 zenith (PI/2), 18:00 sunset (PI), 24:00 nadir (3PI/2)
    const sunAngle = ((hourOfDay - 6) / 24) * Math.PI * 2;
    const sunY = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle);
    const sunZ = 0.38;

    const px = playerPos ? playerPos.x : 0;
    const pz = playerPos ? playerPos.z : 0;

    this.sunLight.position.set(px + sunX * 95, Math.max(8, sunY * 105), pz + sunZ * 80);
    this.sunLight.target.position.set(px, 0, pz);
    this.sunMesh.position.set(px + sunX * 195, sunY * 175, pz + sunZ * 140);
    this.moonMesh.position.set(px - sunX * 195, -sunY * 175, pz - sunZ * 140);

    // Day / Golden Hour / Night smooth color interpolation
    const dayFactor = THREE.MathUtils.clamp((sunY + 0.08) / 0.45, 0, 1);
    const goldenFactor = THREE.MathUtils.clamp(1 - Math.abs(sunY - 0.14) / 0.28, 0, 1);
    const nightFactor = 1 - dayFactor;

    const daySky = new THREE.Color(hubTheme?.daySky ?? 0x7cb8e4);
    const goldenSky = new THREE.Color(0xf29f67);
    const nightSky = new THREE.Color(0x0d152c);

    const skyCol = nightSky.clone().lerp(daySky, dayFactor).lerp(goldenSky, goldenFactor * 0.72);
    const fogCol = skyCol.clone().lerp(new THREE.Color(hubTheme?.fogTint ?? 0xe8caa0), 0.26 * dayFactor);

    this.scene.background.copy(skyCol);
    this.scene.fog.color.copy(fogCol);
    this.scene.fog.density = THREE.MathUtils.lerp(0.0052, hubTheme?.fogDensity ?? 0.0038, dayFactor);

    this.sunLight.intensity = THREE.MathUtils.lerp(0.05, 2.35, dayFactor);
    this.sunLight.color.setHex(0xfff3d4).lerp(new THREE.Color(0xff924c), goldenFactor * 0.75);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.32, 0.92, dayFactor);
    this.hemiLight.color.copy(skyCol).lerp(new THREE.Color(0xffffff), 0.35);
    this.moonLight.intensity = nightFactor * 0.75;

    if (this.starField) {
      this.starField.material.opacity = THREE.MathUtils.clamp((nightFactor - 0.35) * 1.4, 0, 0.92);
      this.starField.position.set(px, 0, pz);
    }

    if (this.bloomPass) {
      // Boost bloom gently during Golden Hour & Night festivals (Diwali, Ganga Aarti, Mysore lights!)
      const baseBloom = this.tier === "high" ? 0.34 : 0.22;
      this.bloomPass.strength = baseBloom + nightFactor * 0.38 + goldenFactor * 0.12;
    }

    if (this.dustSystem) {
      this.dustSystem.material.uniforms.uTime.value = elapsedSec;
      this.dustSystem.position.set(px, 0, pz);
    }

    return {
      dayFactor,
      goldenFactor,
      nightFactor,
      sunDir: new THREE.Vector3(sunX, Math.max(0.1, sunY), sunZ).normalize(),
      skyCol
    };
  }

  resize() {
    if (this.headless || !this.renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);

    if (this.composer) {
      this.composer.setSize(w, h);
      if (this.fxaaPass) {
        const pr = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
      }
    }
  }

  render() {
    if (this.headless || !this.renderer) return;
    if (this.composer && this.usePostFX) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  captureScreenshotDataURL() {
    if (!this.renderer) return null;
    this.render();
    return this.renderer.domElement.toDataURL("image/png");
  }
}
