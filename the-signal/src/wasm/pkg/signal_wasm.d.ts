/* eslint-disable */
export default function init(): Promise<void>;

export class SignalEngine {
  constructor(count: number);
  update_pointer(x: number, y: number, z: number): void;
  update_gaze(x: number, y: number, z: number, strength: number): void;
  step(): void;
  output_slice(): Float32Array;
  free(): void;
}
