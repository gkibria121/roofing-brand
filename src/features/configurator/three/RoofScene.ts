import {
  ACESFilmicToneMapping,
  DirectionalLight,
  Fog,
  HemisphereLight,
  MathUtils,
  PCFShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Spherical,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { AssetLibrary, disposeGroup } from "./assets";
import { keepCameraOutside } from "./collision";
import { buildHouse } from "./house";
import { createOutdoorEnvironmentTexture } from "./textures";
import type { House, SceneConfig } from "./types";

type Listeners = { onAutoRotateChange?: (on: boolean) => void };

/**
 * Owns the WebGL renderer, outdoor lighting, camera, controls and architectural model.
 *
 * Performance & quality practices:
 *  - render-on-demand (idle = 0 FPS), paused via contentvisibilityautostatechange / IO / tab visibility
 *  - outdoor sky+sun PMREM environment for realistic glass, metal & solar reflections
 *  - 34° architectural lens, deep close-up zoom, clamped pan, and full GPU disposal
 */
export class RoofScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(34, 1, 0.35, 240);
  private controls: OrbitControls;
  private lib: AssetLibrary;
  private sun: DirectionalLight;
  private fill: DirectionalLight;
  private house?: House;
  private raf = 0;
  private last = 0;
  private visible = true;
  private disposed = false;
  private pop = 1;
  private camGoal?: { target: Vector3; position: Vector3 };
  private defaultDir = new Vector3(0.58, 0.34, 0.96).normalize();
  private closeDir = new Vector3(0.32, 0.48, 0.82).normalize();
  private reducedMotion: boolean;
  private resizeObserver: ResizeObserver;
  private io?: IntersectionObserver;
  private skipped = false;
  private contextLost = false;
  private panLimit = 14;
  private maxTargetY = 12;
  private prevRadius = 0;
  private lastSafeCamPos: Vector3 | null = null;

  constructor(
    private container: HTMLElement,
    private canvas: HTMLCanvasElement,
    private listeners: Listeners = {},
  ) {
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.renderer.setClearColor(0x000000, 0); // Natural sky CSS gradient shows through

    this.scene.fog = new Fog("#dce9f5", 34, 96);

    this.lib = new AssetLibrary(Math.min(12, this.renderer.capabilities.getMaxAnisotropy()));

    // Outdoor daylight sky/sun/lawn environment map for realistic window, metal & solar reflections.
    const pmrem = new PMREMGenerator(this.renderer);
    const skySrc = createOutdoorEnvironmentTexture();
    const envTex = pmrem.fromEquirectangular(skySrc).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.72;
    skySrc.dispose();
    pmrem.dispose();

    // 3-point outdoor architectural daylight rig
    this.scene.add(new HemisphereLight(0xd9ecff, 0x73845e, 0.95));

    this.sun = new DirectionalLight(0xfff4e0, 2.55);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.00035;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun, this.sun.target);

    this.fill = new DirectionalLight(0xc8e0ff, 0.45);
    this.scene.add(this.fill, this.fill.target);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = false;
    this.controls.panSpeed = 0.85;
    this.controls.zoomSpeed = 1.3;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.controls.minPolarAngle = 0.12;
    this.controls.autoRotate = !this.reducedMotion;
    this.controls.autoRotateSpeed = 0.45;
    this.controls.addEventListener("change", this.invalidate);
    this.controls.addEventListener("start", this.onInteract);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    // Pause WebGL rendering when off-screen using contentvisibilityautostatechange,
    // with IntersectionObserver fallback for older browsers lacking content-visibility.
    const supportsCV = "contentVisibility" in document.documentElement.style;
    if (supportsCV) {
      container.addEventListener("contentvisibilityautostatechange", this.onContentVisibility);
    } else {
      this.io = new IntersectionObserver(
        ([e]) => {
          this.skipped = !e.isIntersecting;
          this.syncVisibility();
        },
        { rootMargin: "200px" },
      );
      this.io.observe(container);
    }

    document.addEventListener("visibilitychange", this.onVisibility);
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    this.resize();
  }

  /** Rebuild the architectural model for a new configuration. */
  setConfig(cfg: SceneConfig): House {
    if (this.house) {
      this.scene.remove(this.house.group);
      disposeGroup(this.house.group);
    }
    const first = !this.house;
    this.house = buildHouse(cfg, this.lib);
    this.scene.add(this.house.group);

    const r = this.house.radius;
    this.panLimit = r * 1.05;
    this.maxTargetY = Math.max(8, this.house.roofFocus.y + 4.5);

    // Position afternoon sun & soft sky fill relative to building scale
    this.sun.position.set(r * 1.25, r * 1.65, r * 1.15);
    this.sun.target.position.set(0, 0, 0);
    this.fill.position.set(-r * 1.1, r * 0.9, -r * 0.95);
    this.fill.target.position.set(0, 0, 0);

    const b = r * 1.65;
    const sc = this.sun.shadow.camera;
    sc.left = -b;
    sc.right = b;
    sc.top = b;
    sc.bottom = -b;
    sc.near = 0.5;
    sc.far = r * 6.5;
    sc.updateProjectionMatrix();

    // Allow close exterior zoom while keepCameraOutside prevents ever entering the building
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = r * 4.6;

    const dir = first
      ? this.defaultDir.clone()
      : new Vector3().subVectors(this.camera.position, this.controls.target).normalize();
    const scaleChanged = !first && Math.abs(r - this.prevRadius) > 1.4;
    const dist =
      first || scaleChanged
        ? r * 2.65
        : MathUtils.clamp(this.camera.position.distanceTo(this.controls.target), this.controls.minDistance, this.controls.maxDistance);
    this.prevRadius = r;
    const goal = {
      target: this.house.target.clone(),
      position: this.house.target.clone().addScaledVector(dir, dist),
    };
    keepCameraOutside(goal.position, null, goal.target, this.house.keepOut);

    if (first || this.reducedMotion) {
      this.camera.position.copy(goal.position);
      this.controls.target.copy(goal.target);
      this.camGoal = undefined;
    } else {
      keepCameraOutside(this.camera.position, null, this.controls.target, this.house.keepOut);
      this.camGoal = goal;
      this.pop = 0;
    }
    this.controls.update();
    this.enforceExterior(true);
    this.invalidate();
    return this.house;
  }

  getAutoRotate() {
    return this.controls.autoRotate;
  }

  setAutoRotate(on: boolean) {
    this.controls.autoRotate = on;
    this.listeners.onAutoRotateChange?.(on);
    this.invalidate();
  }

  /** Rotate / tilt / zoom relative to the current view — used by buttons and the keyboard. */
  orbitBy(dAzimuth: number, dPolar: number, zoom = 1) {
    const off = new Vector3().subVectors(this.camera.position, this.controls.target);
    const sph = new Spherical().setFromVector3(off);
    sph.theta += dAzimuth;
    sph.phi = MathUtils.clamp(sph.phi + dPolar, this.controls.minPolarAngle, this.controls.maxPolarAngle);
    sph.radius = MathUtils.clamp(sph.radius * zoom, this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(off.setFromSpherical(sph));
    this.camGoal = undefined;
    this.controls.update();
    this.enforceExterior();
    this.invalidate();
  }

  /** Smoothly zoom right up close to inspect roof material, seams, flashing & solar details. */
  focusRoof() {
    if (!this.house) return;
    this.setAutoRotate(false);
    const dist = Math.max(4.2, this.house.radius * 0.62);
    const goal = {
      target: this.house.roofFocus.clone(),
      position: this.house.roofFocus.clone().addScaledVector(this.closeDir, dist),
    };
    keepCameraOutside(goal.position, null, goal.target, this.house.keepOut);
    if (this.reducedMotion) {
      this.camera.position.copy(goal.position);
      this.controls.target.copy(goal.target);
      this.controls.update();
      this.enforceExterior(true);
    } else {
      this.camGoal = goal;
    }
    this.invalidate();
  }

  resetView() {
    if (!this.house) return;
    const r = this.house.radius;
    const goal = {
      target: this.house.target.clone(),
      position: this.house.target.clone().addScaledVector(this.defaultDir, r * 2.65),
    };
    keepCameraOutside(goal.position, null, goal.target, this.house.keepOut);
    if (this.reducedMotion) {
      this.camera.position.copy(goal.position);
      this.controls.target.copy(goal.target);
      this.controls.update();
      this.enforceExterior(true);
    } else {
      this.camGoal = goal;
    }
    this.invalidate();
  }

  private enforceExterior(resetPrev = false) {
    if (!this.house) return;
    const clamped = keepCameraOutside(
      this.camera.position,
      resetPrev ? null : this.lastSafeCamPos,
      this.controls.target,
      this.house.keepOut,
    );
    if (clamped) this.camera.lookAt(this.controls.target);
    if (!this.lastSafeCamPos) this.lastSafeCamPos = this.camera.position.clone();
    else this.lastSafeCamPos.copy(this.camera.position);
  }

  private clampTarget() {
    const t = this.controls.target;
    t.x = MathUtils.clamp(t.x, -this.panLimit, this.panLimit);
    t.z = MathUtils.clamp(t.z, -this.panLimit, this.panLimit);
    t.y = MathUtils.clamp(t.y, 0.5, this.maxTargetY);
  }

  private onInteract = () => {
    this.camGoal = undefined;
    if (this.controls.autoRotate) this.setAutoRotate(false);
  };

  private onContentVisibility = (e: Event) => {
    this.skipped = Boolean((e as Event & { skipped?: boolean }).skipped);
    this.syncVisibility();
  };

  private onVisibility = () => this.syncVisibility();

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    this.syncVisibility();
  };

  private onContextRestored = () => {
    this.contextLost = false;
    this.syncVisibility();
  };

  private syncVisibility() {
    this.visible = !this.skipped && !this.contextLost && document.visibilityState === "visible";
    if (this.visible) {
      this.invalidate();
    } else if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.last = 0;
    }
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  private invalidate = () => {
    if (this.raf || this.disposed || !this.visible) return;
    this.raf = requestAnimationFrame(this.frame);
  };

  private frame = (t: number) => {
    this.raf = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, this.last ? (t - this.last) / 1000 : 0.016);
    this.last = t;
    let busy = false;

    if (this.pop < 1 && this.house) {
      this.pop = Math.min(1, this.pop + dt / 0.35);
      const e = 1 - Math.pow(1 - this.pop, 3);
      this.house.group.scale.setScalar(0.96 + 0.04 * e);
      busy = true;
    }
    if (this.camGoal) {
      const k = 1 - Math.exp(-dt * 6.5);
      this.controls.target.lerp(this.camGoal.target, k);
      this.camera.position.lerp(this.camGoal.position, k);
      if (
        this.camera.position.distanceTo(this.camGoal.position) < 0.025 &&
        this.controls.target.distanceTo(this.camGoal.target) < 0.025
      ) {
        this.camGoal = undefined;
      }
      busy = true;
    }
    this.clampTarget();
    this.controls.update(dt);
    this.enforceExterior();
    this.renderer.render(this.scene, this.camera);

    if (busy || this.controls.autoRotate) this.invalidate();
    else this.last = 0;
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.io?.disconnect();
    this.container.removeEventListener("contentvisibilityautostatechange", this.onContentVisibility);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.controls.removeEventListener("change", this.invalidate);
    this.controls.removeEventListener("start", this.onInteract);
    this.controls.dispose();
    if (this.house) disposeGroup(this.house.group);
    this.scene.environment?.dispose();
    this.lib.dispose();
    this.renderer.dispose();
  }
}
