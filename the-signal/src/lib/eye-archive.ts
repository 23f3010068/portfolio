/**
 * Photography archive — replace color/depth paths with your own assets.
 * Depth maps: grayscale PNG (white = near, black = far). KTX2 optional later.
 */

export interface EyeArchiveItem {
  id: string;
  node: string;
  label: string;
  sub: string;
  epigraph?: string;
  colorSrc: string;
  depthSrc: string;
}

export const EYE_ARCHIVE: EyeArchiveItem[] = [
  {
    id: 'sunsets',
    node: 'ARCHIVE NODE 00',
    label: 'RED SUNSETS',
    sub: 'TRACKING EMOTIONAL FINITUDE',
    epigraph: "Some endings don't feel like endings.",
    colorSrc: '/assets/eye/sunsets-color.jpg',
    depthSrc: '/assets/eye/sunsets-depth.jpg',
  },
  {
    id: 'rain',
    node: 'ARCHIVE NODE 01',
    label: 'MUMBAI RAIN',
    sub: 'STUDIES IN URBAN SOLITUDE',
    epigraph: 'The world as perceived through silence.',
    colorSrc: '/assets/eye/rain-color.jpg',
    depthSrc: '/assets/eye/rain-depth.jpg',
  },
  {
    id: 'velocity',
    node: 'ARCHIVE NODE 02',
    label: 'VELOCITY',
    sub: 'HIGH-PERFORMANCE MACHINES AND MECHANICAL ENERGY',
    colorSrc: '/assets/eye/velocity-color.jpg',
    depthSrc: '/assets/eye/velocity-depth.jpg',
  },
  {
    id: 'stillness',
    node: 'ARCHIVE NODE 03',
    label: 'STILLNESS',
    sub: 'REFLECTIONS OVER NIGHT LIGHTS',
    colorSrc: '/assets/eye/stillness-color.jpg',
    depthSrc: '/assets/eye/stillness-depth.jpg',
  },
];
