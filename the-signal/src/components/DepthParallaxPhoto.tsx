'use client';

/**
 * Depth-map parallax viewer — renders only while pointer moves (saves GPU).
 */

import { useEffect, useRef, useCallback } from 'react';

const FS = `#version 300 es
precision mediump float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_color;
uniform sampler2D u_depth;
uniform vec2 u_mouse;
uniform float u_strength;
void main() {
  float d = texture(u_depth, v_uv).r;
  vec2 offset = (u_mouse - 0.5) * (d - 0.5) * u_strength;
  fragColor = vec4(texture(u_color, v_uv + offset).rgb, 1.0);
}`;

const VS = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

interface Props {
  colorSrc: string;
  depthSrc: string;
  alt: string;
}

export function DepthParallaxPhoto({ colorSrc, depthSrc, alt }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const glRef = useRef<{
    gl: WebGL2RenderingContext;
    prog: WebGLProgram;
    colorTex: WebGLTexture;
    depthTex: WebGLTexture;
    draw: () => void;
  } | null>(null);

  const drawOnce = useCallback(() => {
    glRef.current?.draw();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { antialias: false, powerPreference: 'low-power' });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const loadTex = (url: string) =>
      new Promise<WebGLTexture>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const tex = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          resolve(tex);
        };
        img.onerror = reject;
        img.src = url;
      });

    let cancelled = false;

    void Promise.all([loadTex(colorSrc), loadTex(depthSrc)]).then(([colorTex, depthTex]) => {
      if (cancelled) return;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio, 1.5);
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      resize();

      const uColor = gl.getUniformLocation(prog, 'u_color');
      const uDepth = gl.getUniformLocation(prog, 'u_depth');
      const uMouse = gl.getUniformLocation(prog, 'u_mouse');
      const uStrength = gl.getUniformLocation(prog, 'u_strength');

      const draw = () => {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, colorTex);
        gl.uniform1i(uColor, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, depthTex);
        gl.uniform1i(uDepth, 1);
        gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
        gl.uniform1f(uStrength, 0.08);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };

      glRef.current = { gl, prog, colorTex, depthTex, draw };
      draw();

      const onResize = () => resize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    });

    return () => {
      cancelled = true;
      glRef.current = null;
    };
  }, [colorSrc, depthSrc]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-video"
      style={{ display: 'block', maxHeight: '70vh' }}
      role="img"
      aria-label={alt}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: 1 - (e.clientY - rect.top) / rect.height,
        };
        drawOnce();
      }}
    />
  );
}
