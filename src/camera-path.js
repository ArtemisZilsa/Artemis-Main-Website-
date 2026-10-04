import * as THREE from 'three';

// Satu baris per section di content/*.json (kunci = id section).
// at   = posisi objek 3D di dunia
// dist = jarak kamera ke objek
// side = sisi layar tempat objek tampil; teks otomatis di sisi sebaliknya.
// Section tanpa baris di sini tetap tampil (kamera berhenti di tengah, teks di tengah).
export const stops = {
  hero:       { at: [0, 0, 0],      dist: 14, side: 'right' },
  about:      { at: [0, 0, -60],    dist: 10, side: 'right' },
  website:    { at: [9, 1, -120],   dist: 11, side: 'right' },
  automation: { at: [-9, -1, -180], dist: 13, side: 'left' },
  video:      { at: [9, 0, -240],   dist: 11, side: 'right' },
  consultant: { at: [-9, 1, -300],  dist: 14, side: 'left' },
  process:    { at: [0, -1, -360],  dist: 14, side: 'right' },
  folio:      { at: [9, 1, -420],   dist: 10, side: 'left' },
  target:     { at: [0, 0, -480],   dist: 14, side: 'right' },
};

export function cameraFor(stop, mobile) {
  const [x, y, z] = stop.at;
  const shift = mobile ? 0 : stop.side === 'right' ? -2.6 : stop.side === 'left' ? 2.6 : 0;
  const dist = stop.dist * (mobile ? 1.5 : 1);
  return {
    pos: new THREE.Vector3(x + shift * 0.4, y + 0.4, z + dist),
    look: new THREE.Vector3(x + shift, y - (mobile ? 1.8 : 0), z),
  };
}
