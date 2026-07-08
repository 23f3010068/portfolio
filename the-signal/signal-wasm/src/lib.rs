/*!
 * signal-wasm — THE SIGNAL Portfolio Physics & Spatial Engine
 *
 * This Rust/WASM module handles:
 * - Particle physics simulation (attractor forces, velocity integration)
 * - Mouse/pointer velocity tracking with rolling average
 * - 3D Octree spatial partitioning for O(log n) neighbor queries
 * - Timeline logic for route transitions
 * - Head pose / gaze vector processing for Neural Interface Mode
 */

use wasm_bindgen::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const VELOCITY_WINDOW: usize = 8;
const OCTREE_MAX_DEPTH: u32 = 8;
const OCTREE_MAX_ITEMS: usize = 8;

// ─────────────────────────────────────────────────────────────────────────────
// VECTOR3 — Minimal 3D vector type
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Clone, Copy, Debug, Default)]
struct Vec3 {
    x: f32,
    y: f32,
    z: f32,
}

impl Vec3 {
    fn new(x: f32, y: f32, z: f32) -> Self {
        Self { x, y, z }
    }

    fn length_sq(&self) -> f32 {
        self.x * self.x + self.y * self.y + self.z * self.z
    }

    fn length(&self) -> f32 {
        self.length_sq().sqrt()
    }

    fn normalize(&self) -> Self {
        let len = self.length();
        if len < 1e-6 {
            return *self;
        }
        Self::new(self.x / len, self.y / len, self.z / len)
    }

    fn scale(&self, s: f32) -> Self {
        Self::new(self.x * s, self.y * s, self.z * s)
    }

    fn add(&self, other: &Vec3) -> Self {
        Self::new(self.x + other.x, self.y + other.y, self.z + other.z)
    }

    fn sub(&self, other: &Vec3) -> Self {
        Self::new(self.x - other.x, self.y - other.y, self.z - other.z)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AABB — Axis-Aligned Bounding Box for Octree
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Clone, Copy, Debug)]
struct Aabb {
    min: Vec3,
    max: Vec3,
}

impl Aabb {
    fn new(min: Vec3, max: Vec3) -> Self {
        Self { min, max }
    }

    fn center(&self) -> Vec3 {
        Vec3::new(
            (self.min.x + self.max.x) * 0.5,
            (self.min.y + self.max.y) * 0.5,
            (self.min.z + self.max.z) * 0.5,
        )
    }

    fn contains(&self, p: &Vec3) -> bool {
        p.x >= self.min.x
            && p.x <= self.max.x
            && p.y >= self.min.y
            && p.y <= self.max.y
            && p.z >= self.min.z
            && p.z <= self.max.z
    }

    fn intersects_sphere(&self, center: &Vec3, radius: f32) -> bool {
        let dx = (center.x - self.min.x.max(center.x.min(self.max.x))).abs();
        let dy = (center.y - self.min.y.max(center.y.min(self.max.y))).abs();
        let dz = (center.z - self.min.z.max(center.z.min(self.max.z))).abs();
        dx * dx + dy * dy + dz * dz <= radius * radius
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// OCTREE — Spatial partitioning for O(log n) neighbor queries
// ─────────────────────────────────────────────────────────────────────────────

struct OctreeNode {
    bounds: Aabb,
    items: Vec<(usize, Vec3)>, // (particle_index, position)
    children: Option<Box<[OctreeNode; 8]>>,
    depth: u32,
}

impl OctreeNode {
    fn new(bounds: Aabb, depth: u32) -> Self {
        Self {
            bounds,
            items: Vec::new(),
            children: None,
            depth,
        }
    }

    fn insert(&mut self, index: usize, pos: Vec3) {
        if !self.bounds.contains(&pos) {
            return;
        }

        if self.children.is_none() {
            if self.items.len() < OCTREE_MAX_ITEMS || self.depth >= OCTREE_MAX_DEPTH {
                self.items.push((index, pos));
                return;
            }
            self.subdivide();
        }

        if let Some(ref mut children) = self.children {
            for child in children.iter_mut() {
                if child.bounds.contains(&pos) {
                    child.insert(index, pos);
                    return;
                }
            }
        }
        // Fallback: store at this node if no child contains it
        self.items.push((index, pos));
    }

    fn subdivide(&mut self) {
        let c = self.bounds.center();
        let min = self.bounds.min;
        let max = self.bounds.max;
        let d = self.depth + 1;

        let children = Box::new([
            OctreeNode::new(Aabb::new(min, c), d),
            OctreeNode::new(Aabb::new(Vec3::new(c.x, min.y, min.z), Vec3::new(max.x, c.y, c.z)), d),
            OctreeNode::new(Aabb::new(Vec3::new(min.x, c.y, min.z), Vec3::new(c.x, max.y, c.z)), d),
            OctreeNode::new(Aabb::new(Vec3::new(c.x, c.y, min.z), Vec3::new(max.x, max.y, c.z)), d),
            OctreeNode::new(Aabb::new(Vec3::new(min.x, min.y, c.z), Vec3::new(c.x, c.y, max.z)), d),
            OctreeNode::new(Aabb::new(Vec3::new(c.x, min.y, c.z), Vec3::new(max.x, c.y, max.z)), d),
            OctreeNode::new(Aabb::new(Vec3::new(min.x, c.y, c.z), Vec3::new(c.x, max.y, max.z)), d),
            OctreeNode::new(Aabb::new(c, max), d),
        ]);

        self.children = Some(children);

        // Re-insert existing items into children
        let items = std::mem::take(&mut self.items);
        for (idx, pos) in items {
            self.insert(idx, pos);
        }
    }

    fn query_sphere(&self, center: &Vec3, radius: f32, results: &mut Vec<usize>) {
        if !self.bounds.intersects_sphere(center, radius) {
            return;
        }

        for (idx, pos) in &self.items {
            let d = pos.sub(center);
            if d.length_sq() <= radius * radius {
                results.push(*idx);
            }
        }

        if let Some(ref children) = self.children {
            for child in children.iter() {
                child.query_sphere(center, radius, results);
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POINTER VELOCITY TRACKER
// ─────────────────────────────────────────────────────────────────────────────

struct PointerTracker {
    positions: [(f32, f32); VELOCITY_WINDOW],
    head: usize,
    count: usize,
}

impl PointerTracker {
    fn new() -> Self {
        Self {
            positions: [(0.0, 0.0); VELOCITY_WINDOW],
            head: 0,
            count: 0,
        }
    }

    fn push(&mut self, x: f32, y: f32) {
        self.positions[self.head] = (x, y);
        self.head = (self.head + 1) % VELOCITY_WINDOW;
        if self.count < VELOCITY_WINDOW {
            self.count += 1;
        }
    }

    /// Returns normalized velocity magnitude in [0.0, 1.0]
    fn velocity_magnitude(&self) -> f32 {
        if self.count < 2 {
            return 0.0;
        }

        let mut total_dist = 0.0f32;
        let n = self.count;
        for i in 1..n {
            let a = self.positions[(self.head + VELOCITY_WINDOW - i - 1) % VELOCITY_WINDOW];
            let b = self.positions[(self.head + VELOCITY_WINDOW - i) % VELOCITY_WINDOW];
            let dx = b.0 - a.0;
            let dy = b.1 - a.1;
            total_dist += (dx * dx + dy * dy).sqrt();
        }

        let avg = total_dist / (n - 1) as f32;
        // Normalize: assume max meaningful velocity is ~50px/frame
        (avg / 50.0).min(1.0)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE PHYSICS ENGINE
// ─────────────────────────────────────────────────────────────────────────────

struct Particle {
    pos: Vec3,
    vel: Vec3,
    mass: f32,
    life: f32, // 0.0 = dead, 1.0 = fully alive
}

impl Particle {
    fn new(pos: Vec3, vel: Vec3) -> Self {
        Self {
            pos,
            vel,
            mass: 1.0,
            life: 1.0,
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL ENGINE — Main WASM-exported struct
// ─────────────────────────────────────────────────────────────────────────────

#[wasm_bindgen]
pub struct SignalEngine {
    particles: Vec<Particle>,
    pointer: PointerTracker,
    attractor_pos: Vec3,
    attractor_strength: f32,
    damping: f32,
    dt: f32,
    // Output buffer: flat [x, y, z, life, x, y, z, life, ...]
    output_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl SignalEngine {
    /// Create a new SignalEngine with `count` particles
    #[wasm_bindgen(constructor)]
    pub fn new(count: u32) -> Self {
        let count = count as usize;
        let mut particles = Vec::with_capacity(count);

        // Initialize particles in a sphere
        for i in 0..count {
            let t = i as f32 / count as f32;
            let phi = t * std::f32::consts::PI * 2.0 * 137.508; // golden angle
            let r = (t * 2.0 - 1.0).acos();
            let pos = Vec3::new(
                r.sin() * phi.cos() * 100.0,
                r.sin() * phi.sin() * 100.0,
                r.cos() * 100.0,
            );
            let vel = Vec3::new(
                (i as f32 * 0.1).sin() * 0.5,
                (i as f32 * 0.13).cos() * 0.5,
                (i as f32 * 0.07).sin() * 0.5,
            );
            particles.push(Particle::new(pos, vel));
        }

        let output_buffer = vec![0.0f32; count * 4];

        Self {
            particles,
            pointer: PointerTracker::new(),
            attractor_pos: Vec3::default(),
            attractor_strength: 0.5,
            damping: 0.98,
            dt: 1.0 / 60.0,
            output_buffer,
        }
    }

    /// Update pointer position (called from main thread each frame)
    pub fn update_pointer(&mut self, x: f32, y: f32, z: f32) {
        self.pointer.push(x, y);
        self.attractor_pos = Vec3::new(x, y, z);
        self.attractor_strength = self.pointer.velocity_magnitude();
    }

    /// Update gaze attractor from Neural Interface Mode
    pub fn update_gaze(&mut self, x: f32, y: f32, z: f32, strength: f32) {
        self.attractor_pos = Vec3::new(x, y, z);
        self.attractor_strength = strength.clamp(0.0, 1.0);
    }

    /// Step the physics simulation by one frame
    pub fn step(&mut self) {
        let attractor = self.attractor_pos;
        let strength = self.attractor_strength;
        let damping = self.damping;
        let dt = self.dt;

        for (i, p) in self.particles.iter_mut().enumerate() {
            // Attractor force
            let to_attractor = attractor.sub(&p.pos);
            let dist_sq = to_attractor.length_sq().max(1.0);
            let force = to_attractor.normalize().scale(strength * 500.0 / dist_sq);

            // Integrate velocity
            p.vel = p.vel.add(&force.scale(dt)).scale(damping);

            // Integrate position
            p.pos = p.pos.add(&p.vel.scale(dt));

            // Write to output buffer
            let base = i * 4;
            self.output_buffer[base] = p.pos.x;
            self.output_buffer[base + 1] = p.pos.y;
            self.output_buffer[base + 2] = p.pos.z;
            self.output_buffer[base + 3] = p.life;
        }
    }

    /// Zero-copy view of particle buffer [x,y,z,life,...] for GPU upload
    pub fn output_slice(&self) -> &[f32] {
        &self.output_buffer
    }

    /// Get the length of the output buffer (float count)
    pub fn output_len(&self) -> u32 {
        self.output_buffer.len() as u32
    }

    /// Get the current attractor force magnitude (0.0–1.0)
    pub fn attractor_magnitude(&self) -> f32 {
        self.attractor_strength
    }

    /// Query neighbors within radius around a point (returns JSON array of indices)
    pub fn query_neighbors(&self, x: f32, y: f32, z: f32, radius: f32) -> Vec<u32> {
        let center = Vec3::new(x, y, z);
        let mut results = Vec::new();

        // Build a temporary octree for this query
        let bounds = Aabb::new(
            Vec3::new(-200.0, -200.0, -200.0),
            Vec3::new(200.0, 200.0, 200.0),
        );
        let mut root = OctreeNode::new(bounds, 0);
        for (i, p) in self.particles.iter().enumerate() {
            root.insert(i, p.pos);
        }

        let mut indices = Vec::new();
        root.query_sphere(&center, radius, &mut indices);
        results.extend(indices.iter().map(|&i| i as u32));
        results
    }

    /// Set damping coefficient (0.0–1.0)
    pub fn set_damping(&mut self, d: f32) {
        self.damping = d.clamp(0.0, 1.0);
    }

    /// Set simulation timestep
    pub fn set_dt(&mut self, dt: f32) {
        self.dt = dt.clamp(0.001, 0.1);
    }

    /// Get particle count
    pub fn particle_count(&self) -> u32 {
        self.particles.len() as u32
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vec3_normalize() {
        let v = Vec3::new(3.0, 4.0, 0.0);
        let n = v.normalize();
        let len = n.length();
        assert!((len - 1.0).abs() < 1e-5, "normalized length should be 1.0");
    }

    #[test]
    fn test_pointer_tracker_velocity() {
        let mut tracker = PointerTracker::new();
        // Push 8 frames of 10px/frame movement
        for i in 0..8 {
            tracker.push(i as f32 * 10.0, 0.0);
        }
        let mag = tracker.velocity_magnitude();
        assert!(mag > 0.0 && mag <= 1.0, "velocity magnitude should be in [0, 1]");
    }

    #[test]
    fn test_octree_query() {
        let bounds = Aabb::new(
            Vec3::new(-100.0, -100.0, -100.0),
            Vec3::new(100.0, 100.0, 100.0),
        );
        let mut root = OctreeNode::new(bounds, 0);
        root.insert(0, Vec3::new(0.0, 0.0, 0.0));
        root.insert(1, Vec3::new(5.0, 0.0, 0.0));
        root.insert(2, Vec3::new(50.0, 50.0, 50.0));

        let mut results = Vec::new();
        root.query_sphere(&Vec3::new(0.0, 0.0, 0.0), 10.0, &mut results);
        assert!(results.contains(&0), "origin particle should be found");
        assert!(results.contains(&1), "nearby particle should be found");
        assert!(!results.contains(&2), "distant particle should not be found");
    }

    #[test]
    fn test_engine_step() {
        let mut engine = SignalEngine::new(100);
        engine.update_pointer(10.0, 10.0, 0.0);
        engine.step();
        assert_eq!(engine.output_len(), 400); // 100 particles * 4 floats
    }
}
