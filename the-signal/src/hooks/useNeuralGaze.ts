'use client';

import { useEffect, useRef } from 'react';
import { useSignal } from '@/context/SignalContext';
import { getRendererBridge } from '@/lib/renderer-bridge';

const NEURAL_FPS = 12;

export function useNeuralGaze() {
  const { neural } = useSignal();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!neural.active || neural.mode !== 'neural') return;

    let cancelled = false;
    let faceMesh: { close: () => void; send: (input: { image: HTMLVideoElement }) => void } | null = null;

    const start = async () => {
      try {
        // Load MediaPipe from CDN dynamically to avoid Next.js bundling issues
        if (!(window as any).FaceMesh) {
          await new Promise<void>((resolve, reject) => {
            const script1 = document.createElement('script');
            script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
            document.head.appendChild(script1);
            
            const script2 = document.createElement('script');
            script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
            script2.onload = () => resolve();
            script2.onerror = reject;
            document.head.appendChild(script2);
          });
        }

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.width = 320;
        video.height = 240;
        videoRef.current = video;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240, frameRate: 15 },
        });
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;

        const mesh = new ((window as any).FaceMesh as any)({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        mesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        mesh.onResults((results: any) => {
          const lm = results.multiFaceLandmarks?.[0]?.[473];
          if (!lm) return;
          getRendererBridge().updateGaze(
            (lm.x - 0.5) * 240,
            -(lm.y - 0.5) * 240,
            0,
            0.65
          );
        });
        faceMesh = mesh;

        timerRef.current = setInterval(() => {
          if (!cancelled && video.readyState >= 2) mesh.send({ image: video });
        }, 1000 / NEURAL_FPS);
      } catch (err) {
        console.warn('[Neural] unavailable:', err);
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      faceMesh?.close();
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      videoRef.current = null;
    };
  }, [neural.active, neural.mode]);
}
