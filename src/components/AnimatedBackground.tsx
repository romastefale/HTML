import React, { useEffect, useRef } from "react";
import { softwareGL } from "../lib/device";
import { useThemeName } from "../lib/theme";
import { useReducedMotion } from "../lib/useMedia";

/**
 * The animated page background of fundo-animado.html: the recipe of
 * romastefale/aurora alt-version.html (itself the romastefale/gradients
 * render). Seven translucent ellipses, each blurred by an analytic Gaussian
 * (erf of the signed distance to its edge) and composited in linear light over
 * a base colour, then a 4×4 Bayer dither. The top and bottom 14% blend into
 * --page-edge, the colour the browser bars use (theme-color and the Safari
 * sampler stay as on every other page).
 *
 * It is a fixed, one-large-viewport-tall canvas above html::before (the static
 * SVG): without WebGL, or before the first frame, the SVG is what shows.
 * The loop is requestAnimationFrame, which browsers pause in hidden tabs.
 * Reduced motion and WebGL drawn on the CPU (docs/DESEMPENHO.md P5) get one
 * still frame instead of a loop.
 */

const COUNT = 7;
const SIGMA = 0.049;
/** Drawn at half the CSS size: the image is all blur, so upscaling is invisible. */
const SCALE = 0.5;

const COLORS = {
  light: { base: "#f1eef8", edge: "#8b82e6", s: 0.72, l: 0.58, alpha: 0.85 },
  dark: { base: "#141228", edge: "#1b1646", s: 0.58, l: 0.42, alpha: 0.75 },
};

const VERTEX = `
attribute vec2 p;
void main() {
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
uniform vec2 u_res;
uniform vec4 u_ellipse[${COUNT}];
uniform vec4 u_ink[${COUNT}];
uniform float u_sigma;
uniform vec3 u_base;
uniform vec3 u_edge;

float erf(float x) {
  float s = sign(x);
  x = abs(x);
  float t = 1.0 + x * (0.278393 + x * (0.230389 + x * (0.000972 + x * 0.078108)));
  t *= t;
  return s * (1.0 - 1.0 / (t * t));
}

vec3 toSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / max(u_res.x, u_res.y);
  vec4 acc = vec4(0.0);
  for (int k = 0; k < ${COUNT}; k++) {
    vec4 e = u_ellipse[k];
    float d = (length((p - e.xy) / e.zw) - 1.0) * sqrt(e.z * e.w);
    float a = u_ink[k].a * 0.5 * (1.0 - erf(d / (u_sigma * 1.41421356)));
    acc = vec4(u_ink[k].rgb * a, a) + acc * (1.0 - a);
  }
  vec3 lin = acc.a > 0.00001 ? acc.rgb / acc.a : vec3(0.0);
  vec3 color = toSrgb(clamp(lin, 0.0, 1.0)) * acc.a + u_base * (1.0 - acc.a);
  float y = gl_FragCoord.y / u_res.y;
  color = mix(u_edge, color, smoothstep(0.0, 0.14, min(y, 1.0 - y)));
  color += (bayer4(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(color, 1.0);
}`;

const random = (min: number, max: number) => min + Math.random() * (max - min);
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

const hsl = (h: number, s: number, l: number) => {
  h = ((h % 360) + 360) % 360;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
};

const BLOOMS = Array.from({ length: COUNT }, () => ({
  hue: random(0, 360),
  spin: random(3, 8) * (Math.random() < 0.5 ? -1 : 1),
  ways: Array.from({ length: 4 }, () => [random(0.08, 0.2), random(0, Math.PI * 2)]),
  rx: random(0.22, 0.49),
  ry: random(0.17, 0.39),
}));

export const AnimatedBackground: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useThemeName();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false });
    if (!canvas || !gl) return;
    const colors = COLORS[theme];
    const still = reduced || softwareGL();
    const start = performance.now() - random(0, 60000);
    let raf = 0;
    let uRes: WebGLUniformLocation | null = null;
    let uEllipse: WebGLUniformLocation | null = null;
    let uInk: WebGLUniformLocation | null = null;
    let ready = false;

    const setup = () => {
      const program = gl.createProgram()!;
      for (const [type, source] of [
        [gl.VERTEX_SHADER, VERTEX],
        [gl.FRAGMENT_SHADER, FRAGMENT],
      ] as const) {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, source);
        gl.compileShader(s);
        gl.attachShader(program, s);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "p");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uRes = gl.getUniformLocation(program, "u_res");
      uEllipse = gl.getUniformLocation(program, "u_ellipse");
      uInk = gl.getUniformLocation(program, "u_ink");
      gl.uniform1f(gl.getUniformLocation(program, "u_sigma"), SIGMA);
      gl.uniform3fv(gl.getUniformLocation(program, "u_base"), hex(colors.base));
      gl.uniform3fv(gl.getUniformLocation(program, "u_edge"), hex(colors.edge));
      return true;
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const m = Math.max(canvas.width, canvas.height);
      const wide = canvas.width / m;
      const tall = canvas.height / m;
      const ellipse: number[] = [];
      const ink: number[] = [];
      for (const b of BLOOMS) {
        const wave = (i: number) => Math.sin(t * b.ways[i][0] + b.ways[i][1]);
        const breathe = 1 + 0.15 * wave(2);
        ellipse.push(wide * (0.5 + 0.55 * wave(0)), tall * (0.5 + 0.55 * wave(1)), b.rx * breathe, b.ry * (2 - breathe) * (1 + 0.1 * wave(3)));
        ink.push(...hsl(b.hue + b.spin * t, colors.s, colors.l).map(toLinear), colors.alpha);
      }
      gl.uniform4fv(uEllipse, ellipse);
      gl.uniform4fv(uInk, ink);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      if (!ready) return;
      draw(now);
      raf = requestAnimationFrame(frame);
    };

    const run = () => {
      cancelAnimationFrame(raf);
      if (!ready) return;
      if (still) draw(start + 20000);
      else raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * SCALE));
      const h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      if (still && ready) draw(start + 20000);
    };

    const lost = (e: Event) => {
      e.preventDefault();
      ready = false;
      cancelAnimationFrame(raf);
    };
    const restored = () => {
      ready = setup();
      resize();
      run();
    };

    ready = setup();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    run();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [theme, reduced]);

  return <canvas ref={ref} className="fundo-animado" aria-hidden="true" />;
};
