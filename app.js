/* ==========================================================================
   VERTEX 3D VISION - Omni 3D Studio & World Sculptor Engine (v4.0 Omni)
   ========================================================================== */

// --- Simple 3D Perlin/Simplex Noise Implementation ---
const Noise3D = (function() {
    function grad3(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    const p = [];
    for (let i = 0; i < 256; i++) p[i] = Math.floor(Math.random() * 256);
    const perm = new Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    return {
        noise: function(x, y, z) {
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            const Z = Math.floor(z) & 255;

            x -= Math.floor(x);
            y -= Math.floor(y);
            z -= Math.floor(z);

            const u = x * x * x * (x * (x * 6 - 15) + 10);
            const v = y * y * y * (y * (y * 6 - 15) + 10);
            const w = z * z * z * (z * (z * 6 - 15) + 10);

            const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
            const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;

            return lerp(w, lerp(v, lerp(u, grad3(perm[AA], x, y, z),
                                           grad3(perm[BA], x - 1, y, z)),
                                   lerp(u, grad3(perm[AB], x, y - 1, z),
                                           grad3(perm[BB], x - 1, y - 1, z))),
                           lerp(v, lerp(u, grad3(perm[AA + 1], x, y, z - 1),
                                           grad3(perm[BA + 1], x - 1, y, z - 1)),
                                   lerp(u, grad3(perm[AB + 1], x, y - 1, z - 1),
                                           grad3(perm[BB + 1], x - 1, y - 1, z - 1))));
        },
        fbm: function(x, y, z, octaves = 3) {
            let total = 0;
            let frequency = 1;
            let amplitude = 1;
            let maxValue = 0;
            for (let i = 0; i < octaves; i++) {
                total += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
                maxValue += amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }
            return total / maxValue;
        }
    };
    function lerp(t, a, b) { return a + t * (b - a); }
})();

// --- Application State ---
const state = {
    modelType: 'sand_grain',      // atom_core, dna_helix, tree_life, fruit_mesh, animal_mesh, tech_engine, cyber_citadel, sand_grain, rock_peak, planet_world
    scaleCategory: 'sand',        // nano, nature, tech, sand, planet
    subdivision: 64,
    modelScale: 1.0,
    
    // Sculpt Parameters
    noiseAmp: 0.45,
    noiseFreq: 2.2,
    noiseOctaves: 3,
    twist: 0,
    explode: 0,

    // Material Parameters
    baseColor: '#00f2fe',
    roughness: 0.25,
    metalness: 0.80,
    emissiveColor: '#7928ca',
    emissiveIntensity: 0.60,
    opacity: 1.0,
    texturePattern: 'none',

    // Viewport Mode
    shadingMode: 'pbr',          // pbr, clay, wireframe, hologram, normals
    showGrid: true,
    showShadows: true,

    // Environment & Lighting
    envPreset: 'cyberpunk',      // cyberpunk, desert_sun, deep_space, studio_clean, volcanic
    keyLightColor: '#ffffff',
    keyLightIntensity: 1.8,
    sunAngle: 45,
    showParticles: true,
    particleCount: 1500,
    showFog: true,

    // Animation
    animActive: true,
    animType: 'turntable',       // turntable, pulse_glow, vertex_wave, camera_fly
    animSpeed: 0.8,
    animTime: 0
};

// --- Presets Library Config ---
const PRESETS_LIBRARY = {
    quantum_atom: {
        modelType: 'atom_core', scaleCategory: 'nano', baseColor: '#00f2fe', emissiveColor: '#ff007f',
        noiseAmp: 0.2, noiseFreq: 3.0, roughness: 0.1, metalness: 0.95, envPreset: 'deep_space'
    },
    quantum_sand: {
        modelType: 'sand_grain', scaleCategory: 'sand', baseColor: '#00f2fe', emissiveColor: '#7928ca',
        noiseAmp: 0.6, noiseFreq: 3.5, roughness: 0.15, metalness: 0.9, envPreset: 'cyberpunk'
    },
    obsidian_peak: {
        modelType: 'rock_peak', scaleCategory: 'macro', baseColor: '#1a1d24', emissiveColor: '#ff0055',
        noiseAmp: 0.85, noiseFreq: 1.8, roughness: 0.45, metalness: 0.7, envPreset: 'volcanic'
    },
    neon_nexus: {
        modelType: 'cyber_citadel', scaleCategory: 'tech', baseColor: '#0b1021', emissiveColor: '#00f2fe',
        noiseAmp: 0.2, noiseFreq: 5.0, roughness: 0.2, metalness: 0.85, envPreset: 'cyberpunk'
    },
    terra_globe: {
        modelType: 'planet_world', scaleCategory: 'macro', baseColor: '#1b4965', emissiveColor: '#62b6cb',
        noiseAmp: 0.35, noiseFreq: 2.0, roughness: 0.6, metalness: 0.3, envPreset: 'deep_space'
    },
    gold_dunes: {
        modelType: 'rock_peak', scaleCategory: 'macro', baseColor: '#e0a96d', emissiveColor: '#ffb703',
        noiseAmp: 0.5, noiseFreq: 2.5, roughness: 0.3, metalness: 0.4, envPreset: 'desert_sun'
    }
};

// --- Three.js Globals ---
let scene, camera, renderer, controls;
let mainMeshGroup, mainMesh;
let keyLight, fillLight, rimLight, ambientLight;
let gridHelper, particleSystem;
let electronOrbits = [];
let proceduralTextures = {};

// --- Performance Tracker ---
let lastFrameTime = performance.now();
let frameCount = 0;
let currentFPS = 60;

// --- Initialize App ---
window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initThreeJS();
    generateProceduralTextures();
    createEnvironment();
    build3DModel();
    setupEventListeners();
    setupSearchFilter();
    setupCookieConsent();
    animate();
    showToast('VERTEX 3D VISION v4.0 Omni Initialized');
});

// --- Three.js Setup ---
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    const container = canvas.parentElement;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 3, 6);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 50;
    controls.minDistance = 1;

    mainMeshGroup = new THREE.Group();
    scene.add(mainMeshGroup);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const canvas = document.getElementById('three-canvas');
    const container = canvas.parentElement;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- Procedural Canvas Texture Generators ---
function generateProceduralTextures() {
    proceduralTextures.none = null;
    proceduralTextures.sand_ripples = createBumpTexture('sand');
    proceduralTextures.rock_veins = createBumpTexture('rock');
    proceduralTextures.cyber_lattice = createBumpTexture('cyber');
    proceduralTextures.hex_mesh = createBumpTexture('hex');
}

function createBumpTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    if (type === 'sand') {
        for (let y = 0; y < 512; y += 8) {
            ctx.fillStyle = y % 16 === 0 ? '#ffffff' : '#333333';
            ctx.fillRect(0, y + Math.sin(y * 0.05) * 6, 512, 4);
        }
    } else if (type === 'rock') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 512, Math.random() * 512);
            ctx.lineTo(Math.random() * 512, Math.random() * 512);
            ctx.stroke();
        }
    } else if (type === 'cyber') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        for (let i = 0; i <= 512; i += 32) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
        }
    } else if (type === 'hex') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        const r = 24;
        for (let y = 0; y < 512 + r; y += r * 1.5) {
            for (let x = 0; x < 512 + r; x += r * Math.sqrt(3)) {
                drawHexagon(ctx, x + (Math.floor(y / (r * 1.5)) % 2) * (r * Math.sqrt(3) / 2), y, r);
            }
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

function drawHexagon(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
}

// --- Environment & Lighting Engine ---
function createEnvironment() {
    gridHelper = new THREE.GridHelper(20, 40, 0x00f2fe, 0x1f293d);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    keyLight = new THREE.DirectionalLight(0xffffff, state.keyLightIntensity);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    fillLight = new THREE.PointLight(0x00f2fe, 1.0, 20);
    fillLight.position.set(-6, 2, -4);
    scene.add(fillLight);

    rimLight = new THREE.PointLight(0x7928ca, 1.5, 20);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    createParticleAtmosphere();
    updateEnvironmentPreset();
}

function createParticleAtmosphere() {
    if (particleSystem) scene.remove(particleSystem);

    const count = state.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const baseColor = new THREE.Color(state.baseColor);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 24;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 24;

        colors[i * 3] = baseColor.r + (Math.random() - 0.5) * 0.2;
        colors[i * 3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.2;
        colors[i * 3 + 2] = baseColor.b + (Math.random() - 0.5) * 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geometry, material);
    particleSystem.visible = state.showParticles;
    scene.add(particleSystem);
}

function updateEnvironmentPreset() {
    const p = state.envPreset;
    if (p === 'cyberpunk') {
        scene.background = new THREE.Color(0x07080c);
        scene.fog = state.showFog ? new THREE.FogExp2(0x07080c, 0.04) : null;
        keyLight.color.setHex(0xffffff);
        fillLight.color.setHex(0x00f2fe);
        rimLight.color.setHex(0xff007f);
    } else if (p === 'desert_sun') {
        scene.background = new THREE.Color(0x1a120b);
        scene.fog = state.showFog ? new THREE.FogExp2(0x1a120b, 0.03) : null;
        keyLight.color.setHex(0xffb703);
        fillLight.color.setHex(0xfb8500);
        rimLight.color.setHex(0x023e8a);
    } else if (p === 'deep_space') {
        scene.background = new THREE.Color(0x020208);
        scene.fog = state.showFog ? new THREE.FogExp2(0x020208, 0.02) : null;
        keyLight.color.setHex(0x9d4edd);
        fillLight.color.setHex(0x3a0ca3);
        rimLight.color.setHex(0x4cc9f0);
    } else if (p === 'studio_clean') {
        scene.background = new THREE.Color(0x1e222d);
        scene.fog = null;
        keyLight.color.setHex(0xffffff);
        fillLight.color.setHex(0xcccccc);
        rimLight.color.setHex(0xffffff);
    } else if (p === 'volcanic') {
        scene.background = new THREE.Color(0x0f0404);
        scene.fog = state.showFog ? new THREE.FogExp2(0x0f0404, 0.05) : null;
        keyLight.color.setHex(0xff3300);
        fillLight.color.setHex(0xff9900);
        rimLight.color.setHex(0x660000);
    }
}

// --- Procedural 3D Mesh Generator ---
function build3DModel() {
    electronOrbits = [];
    while (mainMeshGroup.children.length > 0) {
        const obj = mainMeshGroup.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        }
        mainMeshGroup.remove(obj);
    }

    let geometry;
    const sub = state.subdivision;

    switch (state.modelType) {
        case 'atom_core':
            geometry = new THREE.IcosahedronGeometry(0.9, Math.floor(sub / 12));
            break;
        case 'dna_helix':
            geometry = createDNAHelixGeometry();
            break;
        case 'tree_life':
            geometry = createTreeLifeGeometry();
            break;
        case 'fruit_mesh':
            geometry = createFruitGeometry();
            break;
        case 'animal_mesh':
            geometry = createAnimalGeometry();
            break;
        case 'tech_engine':
            geometry = createTechEngineGeometry(sub);
            break;
        case 'sand_grain':
            geometry = new THREE.IcosahedronGeometry(1.4, Math.floor(sub / 16));
            break;
        case 'rock_peak':
            geometry = new THREE.ConeGeometry(2.0, 2.5, sub, sub);
            break;
        case 'cyber_citadel':
            geometry = createCyberCitadelGeometry(sub);
            break;
        case 'planet_world':
            geometry = new THREE.SphereGeometry(1.6, sub, sub);
            break;
        default:
            geometry = new THREE.IcosahedronGeometry(1.4, 4);
    }

    applySculptDeformation(geometry);
    geometry.computeVertexNormals();

    const material = createMaterial();
    mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.castShadow = state.showShadows;
    mainMesh.receiveShadow = state.showShadows;
    mainMeshGroup.add(mainMesh);

    if (state.modelType === 'atom_core') {
        createAtomOrbitRings();
    }

    if (state.modelType === 'planet_world') {
        const ringGeo = new THREE.RingGeometry(2.0, 3.2, 64);
        const ringMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(state.emissiveColor),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            wireframe: state.shadingMode === 'wireframe'
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 3;
        mainMeshGroup.add(ringMesh);
    }

    updateHUDStats(geometry);
}

// --- Specialized Procedural Geometry Generators ---
function createDNAHelixGeometry() {
    const list = [];
    const height = 4.0;
    const radius = 1.0;
    const turns = 2.5;

    for (let i = 0; i < 40; i++) {
        const t = i / 40;
        const angle = t * Math.PI * 2 * turns;
        const y = (t - 0.5) * height;

        // Strand 1
        const s1 = new THREE.SphereGeometry(0.1, 8, 8);
        s1.translate(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        list.push(s1);

        // Strand 2 (180 deg opposite)
        const s2 = new THREE.SphereGeometry(0.1, 8, 8);
        s2.translate(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);
        list.push(s2);

        // Connector rung every 2 steps
        if (i % 2 === 0) {
            const bar = new THREE.CylinderGeometry(0.03, 0.03, radius * 2, 8);
            bar.rotation.z = Math.PI / 2;
            bar.rotation.y = -angle;
            bar.translate(0, y, 0);
            list.push(bar);
        }
    }
    return mergeGeometries(list);
}

function createTreeLifeGeometry() {
    const list = [];
    // Trunk
    const trunk = new THREE.CylinderGeometry(0.3, 0.5, 2.5, 12);
    trunk.translate(0, -0.25, 0);
    list.push(trunk);

    // Branches & Foliage Canopies
    const branch1 = new THREE.CylinderGeometry(0.15, 0.25, 1.5, 8);
    branch1.rotation.z = Math.PI / 4;
    branch1.translate(0.5, 0.8, 0);
    list.push(branch1);

    const branch2 = new THREE.CylinderGeometry(0.15, 0.25, 1.5, 8);
    branch2.rotation.z = -Math.PI / 4;
    branch2.translate(-0.5, 0.8, 0);
    list.push(branch2);

    // Canopy spheres
    const canopy1 = new THREE.IcosahedronGeometry(0.9, 2);
    canopy1.translate(0, 1.8, 0);
    list.push(canopy1);

    const canopy2 = new THREE.IcosahedronGeometry(0.7, 2);
    canopy2.translate(0.9, 1.4, 0.4);
    list.push(canopy2);

    const canopy3 = new THREE.IcosahedronGeometry(0.7, 2);
    canopy3.translate(-0.9, 1.4, -0.4);
    list.push(canopy3);

    return mergeGeometries(list);
}

function createFruitGeometry() {
    // Organic apple/pear mesh
    const fruitGeo = new THREE.SphereGeometry(1.3, 32, 32);
    const pos = fruitGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // Dimple top and bottom
        if (y > 0.8) pos.setY(i, y - (y - 0.8) * 0.5);
        if (y < -0.8) pos.setY(i, y + (-0.8 - y) * 0.4);
    }

    // Stem
    const stem = new THREE.CylinderGeometry(0.04, 0.03, 0.6, 8);
    stem.rotation.z = 0.2;
    stem.translate(0.05, 1.3, 0);

    return mergeGeometries([fruitGeo, stem]);
}

function createAnimalGeometry() {
    // Faceted geometric panther/creature head
    const list = [];
    const cranium = new THREE.IcosahedronGeometry(1.1, 1);
    list.push(cranium);

    const snout = new THREE.BoxGeometry(0.8, 0.6, 1.0, 4, 4, 4);
    snout.translate(0, -0.2, 0.9);
    list.push(snout);

    const earL = new THREE.ConeGeometry(0.3, 0.7, 4);
    earL.rotation.x = -0.3;
    earL.translate(-0.6, 1.1, -0.2);
    list.push(earL);

    const earR = new THREE.ConeGeometry(0.3, 0.7, 4);
    earR.rotation.x = -0.3;
    earR.translate(0.6, 1.1, -0.2);
    list.push(earR);

    return mergeGeometries(list);
}

function createTechEngineGeometry(sub) {
    const list = [];
    // Central reactor tube
    const core = new THREE.CylinderGeometry(0.7, 0.7, 2.5, sub / 2);
    list.push(core);

    // Gear Ring 1
    const ring1 = new THREE.TorusGeometry(1.4, 0.2, 16, 24);
    list.push(ring1);

    // Gear Ring 2 (vertical)
    const ring2 = new THREE.TorusGeometry(1.6, 0.15, 16, 24);
    ring2.rotation.x = Math.PI / 2;
    list.push(ring2);

    return mergeGeometries(list);
}

function createCyberCitadelGeometry(sub) {
    const baseBox = new THREE.BoxGeometry(0.8, 2.8, 0.8, sub / 2, sub / 2, sub / 2);
    const towerGeo1 = new THREE.BoxGeometry(0.5, 3.4, 0.5, 16, 16, 16);
    towerGeo1.translate(0.6, 0.3, 0.6);
    const towerGeo2 = new THREE.BoxGeometry(0.6, 2.2, 0.6, 16, 16, 16);
    towerGeo2.translate(-0.6, -0.2, -0.5);
    const spireGeo = new THREE.CylinderGeometry(0.05, 0.3, 4.0, 16);
    spireGeo.translate(0, 0.5, 0);

    return mergeGeometries([baseBox, towerGeo1, towerGeo2, spireGeo]);
}

function mergeGeometries(geometries) {
    let totalVerts = 0;
    geometries.forEach(g => totalVerts += g.attributes.position.count);

    const pos = new Float32Array(totalVerts * 3);
    const norm = new Float32Array(totalVerts * 3);
    let offset = 0;

    geometries.forEach(g => {
        const p = g.attributes.position.array;
        const n = g.attributes.normal ? g.attributes.normal.array : new Float32Array(p.length);
        pos.set(p, offset * 3);
        norm.set(n, offset * 3);
        offset += g.attributes.position.count;
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
    return merged;
}

function applySculptDeformation(geometry) {
    const pos = geometry.attributes.position;
    const v = new THREE.Vector3();
    const amp = state.noiseAmp;
    const freq = state.noiseFreq;
    const octaves = state.noiseOctaves;
    const twist = (state.twist * Math.PI) / 180;
    const explode = state.explode;

    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);

        if (twist !== 0) {
            const angle = v.y * twist * 0.5;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const x = v.x * cosA - v.z * sinA;
            const z = v.x * sinA + v.z * cosA;
            v.x = x;
            v.z = z;
        }

        const noiseVal = Noise3D.fbm(v.x * freq, v.y * freq, v.z * freq, octaves);
        const norm = v.clone().normalize();

        if (state.modelType === 'rock_peak') {
            v.y += noiseVal * amp * 1.5;
        } else {
            v.addScaledVector(norm, noiseVal * amp);
        }

        if (explode > 0) {
            v.addScaledVector(norm, explode * 0.5);
        }

        pos.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();
}

function createMaterial() {
    const mode = state.shadingMode;

    if (mode === 'clay') {
        return new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9, metalness: 0.05 });
    }
    if (mode === 'wireframe') {
        return new THREE.MeshBasicMaterial({ color: new THREE.Color(state.baseColor), wireframe: true });
    }
    if (mode === 'hologram') {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(state.baseColor),
            emissive: new THREE.Color(state.emissiveColor),
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
    }
    if (mode === 'normals') {
        return new THREE.MeshNormalMaterial();
    }

    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        roughness: state.roughness,
        metalness: state.metalness,
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: state.emissiveIntensity,
        transparent: state.opacity < 1.0,
        opacity: state.opacity
    });

    if (state.texturePattern !== 'none' && proceduralTextures[state.texturePattern]) {
        mat.bumpMap = proceduralTextures[state.texturePattern];
        mat.bumpScale = 0.15;
    }

    return mat;
}

function createAtomOrbitRings() {
    const ringRadius = 2.4;
    const ringMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: 1.2,
        wireframe: true,
        transparent: true,
        opacity: 0.7
    });

    const angles = [
        { rx: Math.PI / 4, ry: 0, rz: Math.PI / 6 },
        { rx: -Math.PI / 4, ry: Math.PI / 3, rz: 0 },
        { rx: 0, ry: -Math.PI / 4, rz: Math.PI / 3 }
    ];

    angles.forEach((rot, i) => {
        const ringGeo = new THREE.TorusGeometry(ringRadius, 0.03, 16, 100);
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.set(rot.rx, rot.ry, rot.rz);
        mainMeshGroup.add(ringMesh);

        const electronGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const electronMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#ffffff'),
            emissive: new THREE.Color(state.baseColor),
            emissiveIntensity: 2.0
        });
        const electronMesh = new THREE.Mesh(electronGeo, electronMat);
        mainMeshGroup.add(electronMesh);

        electronOrbits.push({
            mesh: electronMesh,
            radius: ringRadius,
            rot: rot,
            speed: 1.5 + i * 0.5,
            offset: i * Math.PI * 0.6
        });
    });
}

// --- Live Search & Filter Bar Logic ---
function setupSearchFilter() {
    const searchInput = document.getElementById('global-3d-search');
    const clearBtn = document.getElementById('btn-clear-search');
    const cards = document.querySelectorAll('.model-card');
    const catChips = document.querySelectorAll('.cat-chip');

    // Live search input handler
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        clearBtn.style.display = query.length > 0 ? 'block' : 'none';

        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const desc = card.querySelector('.card-desc').textContent.toLowerCase();
            const tags = card.dataset.tags || '';

            if (query === '' || title.includes(query) || desc.includes(query) || tags.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        cards.forEach(card => card.style.display = 'flex');
    });

    // Category filter chips
    catChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            catChips.forEach(c => c.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            const cat = target.dataset.cat;

            cards.forEach(card => {
                if (cat === 'all' || card.dataset.cat === cat) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    document.querySelectorAll('#scale-selector .pill-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#scale-selector .pill-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.scaleCategory = target.dataset.scale;

            if (state.scaleCategory === 'nano') state.modelType = 'dna_helix';
            else if (state.scaleCategory === 'nature') state.modelType = 'tree_life';
            else if (state.scaleCategory === 'tech') state.modelType = 'tech_engine';
            else if (state.scaleCategory === 'sand') state.modelType = 'sand_grain';
            else if (state.scaleCategory === 'planet') state.modelType = 'planet_world';

            syncModelCardUI();
            build3DModel();
            showToast(`Category Switched: ${target.textContent.trim()}`);
        });
    });

    document.getElementById('preset-select').addEventListener('change', (e) => {
        const val = e.target.value;
        if (PRESETS_LIBRARY[val]) {
            applyPreset(PRESETS_LIBRARY[val]);
            showToast(`Preset Loaded: ${e.target.options[e.target.selectedIndex].text}`);
        }
    });

    document.querySelectorAll('.model-card').forEach(card => {
        card.addEventListener('click', (e) => {
            document.querySelectorAll('.model-card').forEach(c => c.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.modelType = target.dataset.model;
            build3DModel();
        });
    });

    document.querySelectorAll('.panel-tabs').forEach(tabGroup => {
        tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const panel = target.closest('.panel');
                panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                panel.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                target.classList.add('active');
                panel.querySelector(`#${target.dataset.tab}`).classList.add('active');
            });
        });
    });

    document.querySelectorAll('.btn-collapse').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            const panel = document.getElementById(targetId);
            if (targetId === 'panel-left') panel.classList.toggle('collapsed-left');
            else if (targetId === 'panel-right') panel.classList.toggle('collapsed-right');
        });
    });

    bindRangeInput('input-subdivision', 'val-subdivision', v => { state.subdivision = parseInt(v); build3DModel(); });
    bindRangeInput('input-scale', 'val-scale', v => {
        state.modelScale = parseFloat(v);
        mainMeshGroup.scale.setScalar(state.modelScale);
        return v + 'x';
    });
    bindRangeInput('input-noise-amp', 'val-noise-amp', v => { state.noiseAmp = parseFloat(v); build3DModel(); });
    bindRangeInput('input-noise-freq', 'val-noise-freq', v => { state.noiseFreq = parseFloat(v); build3DModel(); });
    bindRangeInput('input-noise-octaves', 'val-noise-octaves', v => { state.noiseOctaves = parseInt(v); build3DModel(); });
    bindRangeInput('input-twist', 'val-twist', v => { state.twist = parseInt(v); build3DModel(); return v + '°'; });
    bindRangeInput('input-explode', 'val-explode', v => { state.explode = parseFloat(v); build3DModel(); });

    document.getElementById('input-base-color').addEventListener('input', (e) => {
        state.baseColor = e.target.value;
        if (mainMesh && mainMesh.material && mainMesh.material.color) mainMesh.material.color.set(state.baseColor);
    });

    bindRangeInput('input-roughness', 'val-roughness', v => {
        state.roughness = parseFloat(v);
        if (mainMesh && mainMesh.material.roughness !== undefined) mainMesh.material.roughness = state.roughness;
    });

    bindRangeInput('input-metalness', 'val-metalness', v => {
        state.metalness = parseFloat(v);
        if (mainMesh && mainMesh.material.metalness !== undefined) mainMesh.material.metalness = state.metalness;
    });

    document.getElementById('input-emissive-color').addEventListener('input', (e) => {
        state.emissiveColor = e.target.value;
        if (mainMesh && mainMesh.material && mainMesh.material.emissive) mainMesh.material.emissive.set(state.emissiveColor);
    });

    bindRangeInput('input-emissive-intensity', 'val-emissive-intensity', v => {
        state.emissiveIntensity = parseFloat(v);
        if (mainMesh && mainMesh.material && mainMesh.material.emissiveIntensity !== undefined) {
            mainMesh.material.emissiveIntensity = state.emissiveIntensity;
        }
    });

    bindRangeInput('input-opacity', 'val-opacity', v => {
        state.opacity = parseFloat(v);
        if (mainMesh && mainMesh.material) {
            mainMesh.material.transparent = state.opacity < 1.0;
            mainMesh.material.opacity = state.opacity;
        }
    });

    document.querySelectorAll('.texture-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.texture-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.texturePattern = target.dataset.pattern;
            build3DModel();
        });
    });

    document.getElementById('btn-random-sculpt').addEventListener('click', () => {
        state.noiseAmp = parseFloat((Math.random() * 1.2 + 0.1).toFixed(2));
        state.noiseFreq = parseFloat((Math.random() * 6.0 + 1.0).toFixed(1));
        state.twist = Math.floor(Math.random() * 360 - 180);
        
        document.getElementById('input-noise-amp').value = state.noiseAmp;
        document.getElementById('val-noise-amp').textContent = state.noiseAmp;
        document.getElementById('input-noise-freq').value = state.noiseFreq;
        document.getElementById('val-noise-freq').textContent = state.noiseFreq;
        document.getElementById('input-twist').value = state.twist;
        document.getElementById('val-twist').textContent = state.twist + '°';

        build3DModel();
        showToast('Randomized Procedural Sculpt');
    });

    document.getElementById('btn-reset-sculpt').addEventListener('click', () => {
        state.noiseAmp = 0.45;
        state.noiseFreq = 2.2;
        state.twist = 0;
        state.explode = 0;

        document.getElementById('input-noise-amp').value = 0.45;
        document.getElementById('val-noise-amp').textContent = '0.45';
        document.getElementById('input-noise-freq').value = 2.2;
        document.getElementById('val-noise-freq').textContent = '2.2';
        document.getElementById('input-twist').value = 0;
        document.getElementById('val-twist').textContent = '0°';
        document.getElementById('input-explode').value = 0;
        document.getElementById('val-explode').textContent = '0.0';

        build3DModel();
        showToast('Sculpt Reset to Defaults');
    });

    document.querySelectorAll('.viewport-toolbar [data-mode]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.viewport-toolbar [data-mode]').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.shadingMode = target.dataset.mode;
            build3DModel();
        });
    });

    document.querySelectorAll('.env-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.env-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.envPreset = target.dataset.env;
            updateEnvironmentPreset();
        });
    });

    document.getElementById('input-key-light-color').addEventListener('input', (e) => {
        keyLight.color.set(e.target.value);
    });

    bindRangeInput('input-light-intensity', 'val-light-intensity', v => {
        state.keyLightIntensity = parseFloat(v);
        keyLight.intensity = state.keyLightIntensity;
    });

    bindRangeInput('input-sun-angle', 'val-sun-angle', v => {
        const rad = (parseInt(v) * Math.PI) / 180;
        keyLight.position.x = Math.cos(rad) * 8;
        keyLight.position.z = Math.sin(rad) * 8;
        return v + '°';
    });

    document.getElementById('btn-toggle-grid').addEventListener('click', (e) => {
        state.showGrid = !state.showGrid;
        gridHelper.visible = state.showGrid;
        e.currentTarget.classList.toggle('active', state.showGrid);
    });

    document.getElementById('btn-toggle-shadows').addEventListener('click', (e) => {
        state.showShadows = !state.showShadows;
        renderer.shadowMap.enabled = state.showShadows;
        e.currentTarget.classList.toggle('active', state.showShadows);
        build3DModel();
    });

    document.getElementById('chk-particles').addEventListener('change', (e) => {
        state.showParticles = e.target.checked;
        if (particleSystem) particleSystem.visible = state.showParticles;
    });

    bindRangeInput('input-particle-count', 'val-particle-count', v => {
        state.particleCount = parseInt(v);
        createParticleAtmosphere();
    });

    document.getElementById('chk-fog').addEventListener('change', (e) => {
        state.showFog = e.target.checked;
        updateEnvironmentPreset();
    });

    document.getElementById('cam-front').addEventListener('click', () => animateCameraPosition(0, 0, 7));
    document.getElementById('cam-top').addEventListener('click', () => animateCameraPosition(0, 8, 0.1));
    document.getElementById('cam-iso').addEventListener('click', () => animateCameraPosition(5, 5, 5));
    document.getElementById('btn-reset-cam').addEventListener('click', () => animateCameraPosition(0, 3, 6));

    document.getElementById('btn-play-anim').addEventListener('click', () => {
        state.animActive = !state.animActive;
        const icon = document.getElementById('icon-play');
        if (state.animActive) {
            icon.setAttribute('data-lucide', 'pause');
            document.getElementById('anim-state-text').textContent = `Active (${state.animSpeed} RPM)`;
        } else {
            icon.setAttribute('data-lucide', 'play');
            document.getElementById('anim-state-text').textContent = 'Paused';
        }
        lucide.createIcons();
    });

    document.querySelectorAll('.anim-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.anim-chip').forEach(c => c.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.animType = target.dataset.anim;
            document.querySelector('.anim-title').textContent = target.textContent;
        });
    });

    bindRangeInput('input-anim-speed', 'val-anim-speed', v => {
        state.animSpeed = parseFloat(v);
        if (state.animActive) {
            document.getElementById('anim-state-text').textContent = `Active (${state.animSpeed} RPM)`;
        }
        return v + 'x';
    });

    document.getElementById('btn-fullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else if (document.exitFullscreen) document.exitFullscreen();
    });

    document.getElementById('btn-snapshot').addEventListener('click', openSnapshotModal);
    document.getElementById('modal-snapshot-close').addEventListener('click', closeSnapshotModal);
    document.getElementById('modal-snapshot-cancel').addEventListener('click', closeSnapshotModal);

    document.getElementById('btn-export-obj').addEventListener('click', exportOBJModel);
}

function setupCookieConsent() {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('btn-cookie-accept');
    const declineBtn = document.getElementById('btn-cookie-decline');
    const prefBtn = document.getElementById('btn-cookie-pref');

    if (!localStorage.getItem('vertex_cookie_consent')) {
        banner.classList.add('active');
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('vertex_cookie_consent', 'accepted');
        banner.classList.remove('active');
        showToast('Cookie Preferences Saved (Accepted)');
    });

    declineBtn.addEventListener('click', () => {
        localStorage.setItem('vertex_cookie_consent', 'declined');
        banner.classList.remove('active');
        showToast('Non-Essential Cookies Disabled');
    });

    if (prefBtn) {
        prefBtn.addEventListener('click', () => {
            banner.classList.add('active');
        });
    }
}

function bindRangeInput(inputId, valId, callback) {
    const input = document.getElementById(inputId);
    const valDisplay = document.getElementById(valId);
    input.addEventListener('input', (e) => {
        const res = callback(e.target.value);
        valDisplay.textContent = res !== undefined ? res : e.target.value;
    });
}

function syncModelCardUI() {
    document.querySelectorAll('.model-card').forEach(card => {
        card.classList.toggle('active', card.dataset.model === state.modelType);
    });
}

function applyPreset(preset) {
    Object.assign(state, preset);

    document.getElementById('input-base-color').value = state.baseColor;
    document.getElementById('input-emissive-color').value = state.emissiveColor;
    document.getElementById('input-roughness').value = state.roughness;
    document.getElementById('val-roughness').textContent = state.roughness;
    document.getElementById('input-metalness').value = state.metalness;
    document.getElementById('val-metalness').textContent = state.metalness;

    document.getElementById('input-noise-amp').value = state.noiseAmp;
    document.getElementById('val-noise-amp').textContent = state.noiseAmp;
    document.getElementById('input-noise-freq').value = state.noiseFreq;
    document.getElementById('val-noise-freq').textContent = state.noiseFreq;

    syncModelCardUI();
    updateEnvironmentPreset();
    build3DModel();
}

function animateCameraPosition(x, y, z) {
    const start = camera.position.clone();
    const end = new THREE.Vector3(x, y, z);
    let progress = 0;

    function step() {
        progress += 0.05;
        camera.position.lerpVectors(start, end, progress);
        camera.lookAt(0, 0, 0);
        if (progress < 1) requestAnimationFrame(step);
    }
    step();
}

// --- Main Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    frameCount++;
    if (frameCount % 30 === 0) {
        currentFPS = Math.round(1 / delta);
        document.getElementById('hud-fps').textContent = currentFPS;
    }

    controls.update();

    if (state.animActive) {
        state.animTime += delta * state.animSpeed;

        if (state.animType === 'turntable') {
            mainMeshGroup.rotation.y += delta * 0.5 * state.animSpeed;
        } else if (state.animType === 'pulse_glow') {
            if (mainMesh && mainMesh.material && mainMesh.material.emissiveIntensity !== undefined) {
                mainMesh.material.emissiveIntensity = state.emissiveIntensity + Math.sin(state.animTime * 3) * 0.4;
            }
        } else if (state.animType === 'vertex_wave') {
            mainMeshGroup.rotation.y += delta * 0.2 * state.animSpeed;
            mainMeshGroup.position.y = Math.sin(state.animTime * 2) * 0.2;
        } else if (state.animType === 'camera_fly') {
            const radius = 6;
            camera.position.x = Math.sin(state.animTime * 0.5) * radius;
            camera.position.z = Math.cos(state.animTime * 0.5) * radius;
            camera.lookAt(0, 0, 0);
        }
    }

    if (electronOrbits.length > 0) {
        electronOrbits.forEach((orb) => {
            const angle = state.animTime * orb.speed + orb.offset;
            const x = Math.cos(angle) * orb.radius;
            const y = Math.sin(angle) * orb.radius;

            const pos = new THREE.Vector3(x, y, 0);
            pos.applyEuler(new THREE.Euler(orb.rot.rx, orb.rot.ry, orb.rot.rz));
            orb.mesh.position.copy(pos);
        });
    }

    if (particleSystem && state.showParticles) {
        particleSystem.rotation.y += delta * 0.02;
    }

    renderer.render(scene, camera);
}

function updateHUDStats(geometry) {
    let polyCount = 0;
    let vertCount = geometry.attributes.position.count;

    if (geometry.index) polyCount = geometry.index.count / 3;
    else polyCount = vertCount / 3;

    document.getElementById('hud-polys').textContent = polyCount > 1000 ? (polyCount / 1000).toFixed(1) + 'k' : polyCount;
    document.getElementById('hud-verts').textContent = vertCount > 1000 ? (vertCount / 1000).toFixed(1) + 'k' : vertCount;
    document.getElementById('hud-draws').textContent = renderer.info.render.calls;
}

function openSnapshotModal() {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');

    const modal = document.getElementById('modal-snapshot');
    const previewImg = document.getElementById('snapshot-img-preview');
    const downloadLink = document.getElementById('link-download-snapshot');

    previewImg.src = dataURL;
    downloadLink.href = dataURL;
    modal.classList.add('active');
}

function closeSnapshotModal() {
    document.getElementById('modal-snapshot').classList.remove('active');
}

function exportOBJModel() {
    if (typeof THREE.OBJExporter === 'undefined') {
        showToast('Exporter loading... try again in a moment');
        return;
    }

    const exporter = new THREE.OBJExporter();
    const result = exporter.parse(mainMeshGroup);

    const blob = new Blob([result], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vertex_3d_${state.modelType}_${Date.now()}.obj`;
    link.click();

    showToast('3D Model Exported (.OBJ)');
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
