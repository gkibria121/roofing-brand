import {
  ACESFilmicToneMapping,
  DirectionalLight,
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
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { AssetLibrary, buildHouse, disposeGroup, type House, type SceneConfig } from "./house";

type Listeners = { onAutoRotateChange?: (on: boolean) => void };

/**
 * Owns the WebGL renderer, camera, controls and the current house model.
 *
 * Performance practices used:
 *  - render-on-demand (no loop while idle), paused when off-screen / tab hidden
 *  - pixel ratio capped at 2, shared cached textures/materials, instanced solar panels
 *  - geometries disposed on every rebuild; everything disposed on unmount
 */
export class RoofScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(40, 1, 0.1, 400);
  private controls: OrbitControls;
  private lib: AssetLibrary;
  private sun: DirectionalLight;
  private house?: House;
  private raf = 0;
  private last = 0;
  private visible = true;
  private disposed = false;
  private pop = 1;
  private camGoal?: { target: Vector3; position: Vector3 };
  private defaultDir = new Vector3(0.62, 0.42, 0.95).normalize();
  private reducedMotion: boolean;
  private resizeObserver: ResizeObserver;
  private io?: IntersectionObserver;
  private skipped = false;
  private contextLost = false;

  constructor(
    private container: HTMLElement,
    private canvas: HTMLCanvasElement,
    private listeners: Listeners = {},
  ) {
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.renderer.setClearColor(0x000000, 0); // CSS gradient shows through

    this.lib = new AssetLibrary(Math.min(8, this.renderer.capabilities.getMaxAnisotropy()));

    // Image-based lighting for believable metal and glass.
    const pmrem = new PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmrem.fromScene(roomEnv, 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.45;
    roomEnv.dispose();
    pmrem.dispose();

    this.scene.add(new HemisphereLight(0xffffff, 0xcfd8c4, 0.9));
    this.sun = new DirectionalLight(0xfff4e0, 2.3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.05;
    this.scene.add(this.sun, this.sun.target);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.controls.minPolarAngle = 0.25;
    this.controls.autoRotate = !this.reducedMotion;
    this.controls.autoRotateSpeed = 0.7;
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

  /** Rebuild the model for a new configuration. */
  setConfig(cfg: SceneConfig): House {
    if (this.house) {
      this.scene.remove(this.house.group);
      disposeGroup(this.house.group);
    }
    const first = !this.house;
    this.house = buildHouse(cfg, this.lib);
    this.scene.add(this.house.group);

    const r = this.house.radius;
    this.sun.position.set(r * 1.1, r * 1.6, r * 1.0);
    this.sun.target.position.set(0, 0, 0);
    const b = r * 1.9;
    const sc = this.sun.shadow.camera;
    sc.left = -b;
    sc.right = b;
    sc.top = b;
    sc.bottom = -b;
    sc.near = 0.5;
    sc.far = r * 6;
    sc.updateProjectionMatrix();

    this.controls.minDistance = r * 1.1;
    this.controls.maxDistance = r * 4.2;

    const dir = first
      ? this.defaultDir.clone()
      : new Vector3().subVectors(this.camera.position, this.controls.target).normalize();
    const goal = { target: this.house.target.clone(), position: this.house.target.clone().addScaledVector(dir, r * 2.35) };
    if (first || this.reducedMotion) {
      this.camera.position.copy(goal.position);
      this.controls.target.copy(goal.target);
      this.camGoal = undefined;
    } else {
      this.camGoal = goal;
      this.pop = 0;
    }
    this.controls.update();
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
    this.invalidate();
  }

  resetView() {
    if (!this.house) return;
    const r = this.house.radius;
    const goal = { target: this.house.target.clone(), position: this.house.target.clone().addScaledVector(this.defaultDir, r * 2.35) };
    if (this.reducedMotion) {
      this.camera.position.copy(goal.position);
      this.controls.target.copy(goal.target);
      this.controls.update();
    } else {
      this.camGoal = goal;
    }
    this.invalidate();
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
      this.pop = Math.min(1, this.pop + dt / 0.4);
      const e = 1 - Math.pow(1 - this.pop, 3);
      this.house.group.scale.setScalar(0.94 + 0.06 * e);
      busy = true;
    }
    if (this.camGoal) {
      const k = 1 - Math.exp(-dt * 6);
      this.controls.target.lerp(this.camGoal.target, k);
      this.camera.position.lerp(this.camGoal.position, k);
      if (this.camera.position.distanceTo(this.camGoal.position) < 0.02) this.camGoal = undefined;
      busy = true;
    }
    this.controls.update(dt);
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
