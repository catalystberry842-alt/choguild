import { useEffect, useRef } from "react";

/**
 * Landing hero scene: a slowly drifting tunnel of dots that arches over the
 * top and sides of the viewport. Distance fog leaves the vanishing point (the
 * centre, where the headline sits) dark, so the copy stays readable.
 *
 * Plain WebGL 1, no 3D library. The parent `.landing-hero-bg` keeps a CSS dot
 * pattern as the fallback and hides it once this scene draws its first frame.
 *
 * Behaviour:
 * - pauses while scrolled out of view or while the tab is hidden
 * - `prefers-reduced-motion`: one still frame, no drift, no pointer parallax
 * - recovers from WebGL context loss
 */

const VERTEX = `
attribute vec2 a_grid;
uniform mat4 u_proj;
uniform float u_time;
uniform float u_length;
uniform float u_radius;
uniform float u_arc;
uniform vec2 u_cam;
uniform float u_pointScale;
uniform float u_dpr;
varying float v_alpha;
varying float v_tint;

void main() {
  float a = a_grid.x;
  float z = -u_length * (1.0 - fract(a_grid.y + u_time * 0.012));
  float ripple = sin(z * 0.5 + u_time * 0.6 + a * 3.0) * 0.26
               + sin(z * 0.19 - u_time * 0.4 + a * 5.0) * 0.14;
  float r = u_radius + ripple;
  vec3 p = vec3(sin(a) * r * 1.25, cos(a) * r * 0.7, z);
  p.xy -= u_cam;
  gl_Position = u_proj * vec4(p, 1.0);

  float depth = -p.z;
  gl_PointSize = clamp(u_pointScale * 0.022 / depth, 1.4 * u_dpr, 4.2 * u_dpr);

  float nearFade = smoothstep(0.6, 2.4, depth);
  float farFade = 1.0 - smoothstep(u_length * 0.16, u_length * 0.6, depth);
  float arcFade = 1.0 - smoothstep(u_arc - 0.8, u_arc, abs(a));
  float crest = 0.35 + 0.65 * smoothstep(-0.25, 0.3, ripple);
  v_alpha = nearFade * farFade * arcFade * crest * 0.9;
  v_tint = clamp(abs(sin(a)) * 0.85 + depth / u_length * 0.6, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
varying float v_alpha;
varying float v_tint;
uniform vec3 u_near;
uniform vec3 u_far;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = v_alpha * smoothstep(0.5, 0.12, d);
  if (a < 0.01) discard;
  gl_FragColor = vec4(mix(u_near, u_far, v_tint) * a, a);
}
`;

const TUNNEL = { length: 34, radius: 3.1, arc: 2.35, fov: (58 * Math.PI) / 180 };

/** Lavender-white on the crest of the arch, Choguild violet toward the sides and the distance. */
const NEAR_COLOR: [number, number, number] = [0.93, 0.9, 1.0];
const FAR_COLOR: [number, number, number] = [0.55, 0.36, 0.96];

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Deterministic jitter so the grid never forms a visible moiré. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildGrid(angles: number, rings: number) {
  const random = seeded(143);
  const data = new Float32Array(angles * rings * 2);
  let i = 0;
  for (let ring = 0; ring < rings; ring++) {
    for (let step = 0; step < angles; step++) {
      const t = (step + (random() - 0.5) * 0.18) / (angles - 1);
      data[i++] = -TUNNEL.arc + t * TUNNEL.arc * 2;
      data[i++] = (ring + (random() - 0.5) * 0.12) / rings;
    }
  }
  return data;
}

function perspective(fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  // Column-major, as WebGL expects.
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let pointCount = 0;
    let uniforms: Record<string, WebGLUniformLocation | null> = {};
    let frame = 0;
    let running = false;
    let visible = true;
    let last = 0;
    let time = 0;
    const cam = { x: 0, y: 0, tx: 0, ty: 0 };

    function setup() {
      gl = canvas!.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
      if (!gl) return false;
      const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
      program = gl.createProgram();
      if (!vs || !fs || !program) return false;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);

      const small = window.innerWidth < 640;
      const grid = buildGrid(small ? 120 : 220, small ? 150 : 240);
      pointCount = grid.length / 2;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
      const location = gl.getAttribLocation(program, "a_grid");
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

      uniforms = Object.fromEntries(
        ["u_proj", "u_time", "u_length", "u_radius", "u_arc", "u_cam", "u_pointScale", "u_dpr", "u_near", "u_far"].map((name) => [
          name,
          gl!.getUniformLocation(program!, name),
        ]),
      );
      gl.uniform1f(uniforms.u_length, TUNNEL.length);
      gl.uniform1f(uniforms.u_radius, TUNNEL.radius);
      gl.uniform1f(uniforms.u_arc, TUNNEL.arc);
      gl.uniform3fv(uniforms.u_near, NEAR_COLOR);
      gl.uniform3fv(uniforms.u_far, FAR_COLOR);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE); // additive: dense areas glow
      gl.clearColor(0, 0, 0, 0);
      resize();
      return true;
    }

    function resize() {
      if (!gl || !program) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(1, Math.round(canvas!.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas!.clientHeight * dpr));
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniformMatrix4fv(uniforms.u_proj, false, perspective(TUNNEL.fov, width / height, 0.1, 60));
      gl.uniform1f(uniforms.u_pointScale, height / 2 / Math.tan(TUNNEL.fov / 2));
      gl.uniform1f(uniforms.u_dpr, dpr);
      if (!running) draw();
    }

    function draw() {
      if (!gl) return;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.u_time, time);
      gl.uniform2f(uniforms.u_cam, cam.x, cam.y);
      gl.drawArrays(gl.POINTS, 0, pointCount);
    }

    function tick(now: number) {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      time += dt;
      // Frame-rate independent ease toward the pointer target (critically damped feel).
      const k = 1 - Math.exp(-dt * 3);
      cam.x += (cam.tx - cam.x) * k;
      cam.y += (cam.ty - cam.y) * k;
      draw();
      frame = requestAnimationFrame(tick);
    }

    function start() {
      if (running || reduceMotion.matches || !visible || document.hidden || !gl) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    function onPointer(event: PointerEvent) {
      if (reduceMotion.matches) return;
      cam.tx = (event.clientX / window.innerWidth - 0.5) * 0.7;
      cam.ty = -(event.clientY / window.innerHeight - 0.5) * 0.35;
    }

    function onMotionPreference() {
      if (reduceMotion.matches) {
        stop();
        cam.x = cam.y = cam.tx = cam.ty = 0;
        draw();
      } else start();
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    function onContextLost(event: Event) {
      event.preventDefault();
      stop();
      gl = null;
    }

    function onContextRestored() {
      if (setup()) start();
    }

    // Start mid-drift so the very first (or only, under reduced motion) frame is composed.
    time = 18;
    if (!setup()) return; // no WebGL: the CSS dots stay
    draw();
    host.dataset.webgl = "on";

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    intersection.observe(canvas);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reduceMotion.addEventListener("change", onMotionPreference);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMotion.removeEventListener("change", onMotionPreference);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      delete host.dataset.webgl;
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-dot-field" aria-hidden="true" />;
}
