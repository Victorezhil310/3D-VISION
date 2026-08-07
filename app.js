/* ==========================================================================
   VERTEX 3D VISION - Ultimate 3D World & Quantum Playground Engine
   ========================================================================== */

// --- 3D Perlin/Simplex Noise Implementation ---
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

// --- Web Audio FX Synthesizer ---
const SoundFX = (function() {
    let audioCtx = null;
    let enabled = true;

    function init() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
    }

    return {
        toggle: function() {
            enabled = !enabled;
            return enabled;
        },
        playPop: function(freq = 440) {
            if (!enabled) return;
            init();
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        },
        playSupernova: function() {
            if (!enabled) return;
            init();
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.4);

            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        }
    };
})();

// --- Application State ---
const state = {
    modelType: 'planet',         // planet, atom, tree, fruit, dragon, prism, mech
    baseColor: '#00f2fe',
    emissiveColor: '#7928ca',
    emissivePower: 0.8,
    metalness: 0.85,
    roughness: 0.20,
    deform: 0.30,
    twist: 0,
    particleCount: 2000,

    // Fun FX Modes
    wireframe: false,
    rainbowMode: false,
    discoMode: false,
    isExploded: false,

    // Animation Controls
    animActive: true,
    animSpeed: 0.8,
    animTime: 0
};

// --- Three.js Globals ---
let scene, camera, renderer, controls;
let mainMeshGroup, mainMesh;
let keyLight, fillLight, rimLight, ambientLight;
let discoLight1, discoLight2;
let gridHelper, particleSystem;
let electronOrbits = [];
let supernovaParticles = [];

// --- Performance HUD ---
let lastFrameTime = performance.now();
let frameCount = 0;

// --- Initialize App ---
window.addEventListener('DOMContentLoaded', () => {
    safeLucideIcons();
    initThreeJS();
    createEnvironment();
    build3DModel();
    setupEventListeners();
    setupCookieConsent();
    animate();
    showToast('✨ 3D Playground Loaded! Click tabs to switch models.');
});

function safeLucideIcons() {
    try {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    } catch (e) {
        console.warn('Lucide icons deferred:', e);
    }
}

// --- Three.js Engine Setup ---
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 6.5);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Environment & Lighting Engine ---
function createEnvironment() {
    scene.background = new THREE.Color(0x05060a);
    scene.fog = new THREE.FogExp2(0x05060a, 0.035);

    gridHelper = new THREE.GridHelper(24, 48, 0x00f2fe, 0x1f293d);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    fillLight = new THREE.PointLight(0x00f2fe, 1.2, 20);
    fillLight.position.set(-6, 2, -4);
    scene.add(fillLight);

    rimLight = new THREE.PointLight(0xff007f, 1.5, 20);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // Disco Strobe Lights
    discoLight1 = new THREE.PointLight(0x00f2fe, 0, 15);
    discoLight1.position.set(3, 4, 3);
    scene.add(discoLight1);

    discoLight2 = new THREE.PointLight(0xff007f, 0, 15);
    discoLight2.position.set(-3, -2, -3);
    scene.add(discoLight2);

    createCosmicParticles();
}

function createCosmicParticles() {
    if (particleSystem) scene.remove(particleSystem);

    const count = state.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const baseColor = new THREE.Color(state.baseColor);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 28;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 28;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 28;

        colors[i * 3] = baseColor.r + (Math.random() - 0.5) * 0.2;
        colors[i * 3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.2;
        colors[i * 3 + 2] = baseColor.b + (Math.random() - 0.5) * 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// --- Bulletproof Geometry Merger ---
function mergeGeometries(geometries) {
    const list = geometries.map(g => g.index ? g.toNonIndexed() : g);
    let totalVerts = 0;
    list.forEach(g => totalVerts += g.attributes.position.count);

    const pos = new Float32Array(totalVerts * 3);
    let offset = 0;

    list.forEach(g => {
        const p = g.attributes.position.array;
        pos.set(p, offset * 3);
        offset += g.attributes.position.count;
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.computeVertexNormals();
    return merged;
}

// --- Procedural 3D Model Generators ---
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

    try {
        switch (state.modelType) {
            case 'planet':
                geometry = new THREE.SphereGeometry(1.6, 48, 48);
                break;
            case 'atom':
                geometry = new THREE.IcosahedronGeometry(0.9, 4);
                break;
            case 'tree':
                geometry = createTreeGeometry();
                break;
            case 'fruit':
                geometry = createFruitGeometry();
                break;
            case 'dragon':
                geometry = createDragonHeadGeometry();
                break;
            case 'prism':
                geometry = new THREE.IcosahedronGeometry(1.5, 0);
                break;
            case 'mech':
                geometry = createMechGeometry();
                break;
            default:
                geometry = new THREE.SphereGeometry(1.6, 48, 48);
        }
    } catch (e) {
        console.error('Model build fallback:', e);
        geometry = new THREE.IcosahedronGeometry(1.5, 2);
    }

    applySculptDeformation(geometry);
    geometry.computeVertexNormals();

    const material = createMaterial();
    mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    mainMeshGroup.add(mainMesh);

    // Additional Model Specific Accessories
    if (state.modelType === 'planet') {
        // Planetary Ring
        const ringGeo = new THREE.RingGeometry(2.0, 3.2, 64);
        const ringMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(state.emissiveColor),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            wireframe: state.wireframe
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 3;
        mainMeshGroup.add(ringMesh);

        // Orbiting Moon
        const moonGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(3.5, 0, 0);
        mainMeshGroup.add(moonMesh);
        electronOrbits.push({ mesh: moonMesh, radius: 3.5, speed: 0.8, rot: { rx: 0.2, ry: 0, rz: 0 }, offset: 0 });
    }

    if (state.modelType === 'atom') {
        createAtomOrbitRings();
    }

    updateHUDStats(geometry);
}

function createTreeGeometry() {
    const list = [];
    const trunk = new THREE.CylinderGeometry(0.3, 0.5, 2.5, 12);
    trunk.translate(0, -0.25, 0);
    list.push(trunk);

    const b1 = new THREE.CylinderGeometry(0.15, 0.25, 1.5, 8);
    b1.rotation.z = Math.PI / 4;
    b1.translate(0.5, 0.8, 0);
    list.push(b1);

    const b2 = new THREE.CylinderGeometry(0.15, 0.25, 1.5, 8);
    b2.rotation.z = -Math.PI / 4;
    b2.translate(-0.5, 0.8, 0);
    list.push(b2);

    const c1 = new THREE.IcosahedronGeometry(0.9, 2);
    c1.translate(0, 1.8, 0);
    list.push(c1);

    const c2 = new THREE.IcosahedronGeometry(0.7, 2);
    c2.translate(0.9, 1.4, 0.4);
    list.push(c2);

    const c3 = new THREE.IcosahedronGeometry(0.7, 2);
    c3.translate(-0.9, 1.4, -0.4);
    list.push(c3);

    return mergeGeometries(list);
}

function createFruitGeometry() {
    const fruitGeo = new THREE.SphereGeometry(1.3, 32, 32);
    const pos = fruitGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y > 0.8) pos.setY(i, y - (y - 0.8) * 0.5);
        if (y < -0.8) pos.setY(i, y + (-0.8 - y) * 0.4);
    }

    const stem = new THREE.CylinderGeometry(0.04, 0.03, 0.6, 8);
    stem.rotation.z = 0.2;
    stem.translate(0.05, 1.3, 0);

    return mergeGeometries([fruitGeo, stem]);
}

function createDragonHeadGeometry() {
    const list = [];
    const cranium = new THREE.IcosahedronGeometry(1.1, 1);
    list.push(cranium);

    const snout = new THREE.BoxGeometry(0.8, 0.6, 1.2, 4, 4, 4);
    snout.translate(0, -0.2, 0.9);
    list.push(snout);

    const hornL = new THREE.ConeGeometry(0.25, 1.2, 4);
    hornL.rotation.x = -0.6;
    hornL.translate(-0.5, 1.2, -0.4);
    list.push(hornL);

    const hornR = new THREE.ConeGeometry(0.25, 1.2, 4);
    hornR.rotation.x = -0.6;
    hornR.translate(0.5, 1.2, -0.4);
    list.push(hornR);

    return mergeGeometries(list);
}

function createMechGeometry() {
    const list = [];
    const core = new THREE.CylinderGeometry(0.7, 0.7, 2.5, 16);
    list.push(core);

    const ring1 = new THREE.TorusGeometry(1.4, 0.2, 16, 24);
    list.push(ring1);

    const ring2 = new THREE.TorusGeometry(1.6, 0.15, 16, 24);
    ring2.rotation.x = Math.PI / 2;
    list.push(ring2);

    return mergeGeometries(list);
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

function applySculptDeformation(geometry) {
    const pos = geometry.attributes.position;
    const v = new THREE.Vector3();
    const amp = state.deform;
    const twist = (state.twist * Math.PI) / 180;

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

        if (amp > 0) {
            const noiseVal = Noise3D.fbm(v.x * 2.2, v.y * 2.2, v.z * 2.2, 3);
            const norm = v.clone().normalize();
            v.addScaledVector(norm, noiseVal * amp);
        }

        pos.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();
}

function createMaterial() {
    return new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        roughness: state.roughness,
        metalness: state.metalness,
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: state.emissivePower,
        wireframe: state.wireframe
    });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Model Tabs Switcher
    document.querySelectorAll('.model-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.model-tab').forEach(t => t.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.modelType = target.dataset.model;
            SoundFX.playPop(520);
            build3DModel();
            showToast(`Loaded: ${target.textContent.trim()}`);
        });
    });

    // Sound FX Toggle
    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
        btnSound.addEventListener('click', () => {
            const enabled = SoundFX.toggle();
            const icon = document.getElementById('sound-icon');
            if (icon) icon.setAttribute('data-lucide', enabled ? 'volume-2' : 'volume-x');
            safeLucideIcons();
            showToast(enabled ? 'Sound FX Enabled 🔊' : 'Sound FX Muted 🔇');
        });
    }

    // Side Drawer Collapse Toggle
    const btnToggleDrawer = document.getElementById('btn-toggle-drawer');
    const drawer = document.getElementById('side-drawer');
    if (btnToggleDrawer && drawer) {
        btnToggleDrawer.addEventListener('click', () => {
            drawer.classList.toggle('collapsed');
            SoundFX.playPop(350);
        });
    }

    // Color Pickers
    const pickerColor = document.getElementById('picker-color');
    if (pickerColor) {
        pickerColor.addEventListener('input', (e) => {
            state.baseColor = e.target.value;
            if (mainMesh && mainMesh.material && mainMesh.material.color) {
                mainMesh.material.color.set(state.baseColor);
            }
        });
    }

    const pickerEmissive = document.getElementById('picker-emissive');
    if (pickerEmissive) {
        pickerEmissive.addEventListener('input', (e) => {
            state.emissiveColor = e.target.value;
            if (mainMesh && mainMesh.material && mainMesh.material.emissive) {
                mainMesh.material.emissive.set(state.emissiveColor);
            }
        });
    }

    // Range Sliders
    bindRange('slider-emissive', 'val-emissive-power', v => {
        state.emissivePower = parseFloat(v);
        if (mainMesh && mainMesh.material) mainMesh.material.emissiveIntensity = state.emissivePower;
    });

    bindRange('slider-metal', 'val-metal', v => {
        state.metalness = parseFloat(v);
        if (mainMesh && mainMesh.material) mainMesh.material.metalness = state.metalness;
    });

    bindRange('slider-rough', 'val-rough', v => {
        state.roughness = parseFloat(v);
        if (mainMesh && mainMesh.material) mainMesh.material.roughness = state.roughness;
    });

    bindRange('slider-deform', 'val-deform', v => {
        state.deform = parseFloat(v);
        build3DModel();
    });

    bindRange('slider-twist', 'val-twist', v => {
        state.twist = parseInt(v);
        build3DModel();
        return v + '°';
    });

    bindRange('slider-particles', 'val-particles', v => {
        state.particleCount = parseInt(v);
        createCosmicParticles();
    });

    // Fun Wheel Action Buttons
    const btnRainbow = document.getElementById('btn-rainbow');
    if (btnRainbow) {
        btnRainbow.addEventListener('click', (e) => {
            state.rainbowMode = !state.rainbowMode;
            e.currentTarget.classList.toggle('active', state.rainbowMode);
            SoundFX.playPop(600);
            showToast(state.rainbowMode ? '🌈 Rainbow Neon Shifter ON' : 'Rainbow Mode OFF');
        });
    }

    const btnExplode = document.getElementById('fun-btn-explode');
    if (btnExplode) {
        btnExplode.addEventListener('click', () => {
            state.isExploded = !state.isExploded;
            SoundFX.playSupernova();
            showToast(state.isExploded ? '💥 Mesh Exploded!' : 'Reconstructed 3D Mesh');
        });
    }

    const btnSupernova = document.getElementById('btn-supernova');
    if (btnSupernova) {
        btnSupernova.addEventListener('click', () => {
            triggerSupernovaBurst();
            SoundFX.playSupernova();
            showToast('✨ Supernova Particle Burst!');
        });
    }

    const btnWireframe = document.getElementById('btn-wireframe');
    if (btnWireframe) {
        btnWireframe.addEventListener('click', (e) => {
            state.wireframe = !state.wireframe;
            e.currentTarget.classList.toggle('active', state.wireframe);
            if (mainMesh && mainMesh.material) mainMesh.material.wireframe = state.wireframe;
            SoundFX.playPop(450);
            showToast(state.wireframe ? 'Neon Grid Wireframe ON' : 'Wireframe OFF');
        });
    }

    const btnDisco = document.getElementById('btn-disco-lights');
    if (btnDisco) {
        btnDisco.addEventListener('click', (e) => {
            state.discoMode = !state.discoMode;
            e.currentTarget.classList.toggle('active', state.discoMode);
            discoLight1.intensity = state.discoMode ? 2.5 : 0;
            discoLight2.intensity = state.discoMode ? 2.5 : 0;
            SoundFX.playPop(700);
            showToast(state.discoMode ? '⚡ Disco Cyber Strobes ON' : 'Disco Lights OFF');
        });
    }

    const btnRandomAll = document.getElementById('btn-random-all');
    if (btnRandomAll) {
        btnRandomAll.addEventListener('click', () => {
            const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
            const randomEmissive = '#' + Math.floor(Math.random()*16777215).toString(16);
            state.baseColor = randomColor;
            state.emissiveColor = randomEmissive;
            state.deform = parseFloat((Math.random() * 1.2).toFixed(2));
            state.twist = Math.floor(Math.random() * 360 - 180);

            document.getElementById('picker-color').value = randomColor;
            document.getElementById('picker-emissive').value = randomEmissive;
            document.getElementById('slider-deform').value = state.deform;
            document.getElementById('val-deform').textContent = state.deform;
            document.getElementById('slider-twist').value = state.twist;
            document.getElementById('val-twist').textContent = state.twist + '°';

            SoundFX.playPop(650);
            build3DModel();
            showToast('🎲 Randomized 3D Universe');
        });
    }

    // Animation Speed & Play Pause
    const btnPlayPause = document.getElementById('btn-play-pause');
    if (btnPlayPause) {
        btnPlayPause.addEventListener('click', () => {
            state.animActive = !state.animActive;
            const icon = document.getElementById('play-icon');
            if (icon) icon.setAttribute('data-lucide', state.animActive ? 'pause' : 'play');
            safeLucideIcons();
            document.getElementById('anim-status-text').textContent = state.animActive ? `Active (${state.animSpeed} RPM)` : 'Paused';
        });
    }

    bindRange('slider-speed', 'val-speed', v => {
        state.animSpeed = parseFloat(v);
        document.getElementById('anim-status-text').textContent = state.animActive ? `Active (${state.animSpeed} RPM)` : 'Paused';
        return v + 'x';
    });

    // Header Action Modals
    const btnSnapshot = document.getElementById('btn-snapshot');
    if (btnSnapshot) btnSnapshot.addEventListener('click', openSnapshotModal);
    const modalClose = document.getElementById('modal-close');
    if (modalClose) modalClose.addEventListener('click', closeSnapshotModal);
    const modalCancel = document.getElementById('modal-cancel');
    if (modalCancel) modalCancel.addEventListener('click', closeSnapshotModal);

    const btnExport3D = document.getElementById('btn-export-3d');
    if (btnExport3D) btnExport3D.addEventListener('click', exportOBJModel);

    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else if (document.exitFullscreen) document.exitFullscreen();
        });
    }
}

function setupCookieConsent() {
    const banner = document.getElementById('cookie-banner');
    const btn = document.getElementById('btn-accept-cookie');
    if (banner && !localStorage.getItem('vertex_cookie_consent')) {
        banner.classList.add('active');
    }
    if (btn) {
        btn.addEventListener('click', () => {
            localStorage.setItem('vertex_cookie_consent', 'accepted');
            banner.classList.remove('active');
        });
    }
}

function bindRange(sliderId, valId, callback) {
    const input = document.getElementById(sliderId);
    const valDisplay = document.getElementById(valId);
    if (!input || !valDisplay) return;

    input.addEventListener('input', (e) => {
        const res = callback(e.target.value);
        valDisplay.textContent = res !== undefined ? res : e.target.value;
    });
}

function triggerSupernovaBurst() {
    const count = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;

        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
        ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        size: 0.12,
        color: new THREE.Color(state.baseColor),
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });

    const pSystem = new THREE.Points(geometry, mat);
    scene.add(pSystem);

    supernovaParticles.push({ system: pSystem, velocities: velocities, life: 1.0 });
}

// --- Main Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    // Track FPS
    frameCount++;
    if (frameCount % 30 === 0) {
        const fpsEl = document.getElementById('hud-fps');
        if (fpsEl) fpsEl.textContent = Math.round(1 / delta);
    }

    if (controls) controls.update();

    // Auto Spin & Animations
    if (state.animActive) {
        state.animTime += delta * state.animSpeed;
        mainMeshGroup.rotation.y += delta * 0.6 * state.animSpeed;
    }

    // Rainbow Color Shift Mode
    if (state.rainbowMode && mainMesh && mainMesh.material) {
        const hue = (state.animTime * 0.2) % 1;
        mainMesh.material.color.setHSL(hue, 1.0, 0.5);
    }

    // Disco Strobe Lights Mode
    if (state.discoMode) {
        const time = performance.now() * 0.003;
        discoLight1.position.x = Math.sin(time) * 5;
        discoLight1.position.z = Math.cos(time) * 5;
        discoLight2.position.x = Math.cos(time * 0.8) * 5;
        discoLight2.position.z = Math.sin(time * 0.8) * 5;
    }

    // Explode Mesh Effect
    if (mainMesh) {
        const targetScale = state.isExploded ? 1.4 : 1.0;
        mainMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    // Animate Electron / Moon Orbits
    if (electronOrbits.length > 0) {
        electronOrbits.forEach(orb => {
            const angle = state.animTime * orb.speed + orb.offset;
            const x = Math.cos(angle) * orb.radius;
            const y = Math.sin(angle) * orb.radius;

            const pos = new THREE.Vector3(x, y, 0);
            pos.applyEuler(new THREE.Euler(orb.rot.rx, orb.rot.ry, orb.rot.rz));
            orb.mesh.position.copy(pos);
        });
    }

    // Animate Cosmic Particle Atmosphere
    if (particleSystem) {
        particleSystem.rotation.y += delta * 0.03;
    }

    // Animate Supernova Bursts
    for (let i = supernovaParticles.length - 1; i >= 0; i--) {
        const burst = supernovaParticles[i];
        burst.life -= delta * 1.5;
        const pos = burst.system.geometry.attributes.position;

        for (let j = 0; j < burst.velocities.length; j++) {
            const v = burst.velocities[j];
            pos.setXYZ(j, pos.getX(j) + v.x * delta, pos.getY(j) + v.y * delta, pos.getZ(j) + v.z * delta);
        }
        pos.needsUpdate = true;
        burst.system.material.opacity = burst.life;

        if (burst.life <= 0) {
            scene.remove(burst.system);
            burst.system.geometry.dispose();
            burst.system.material.dispose();
            supernovaParticles.splice(i, 1);
        }
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function updateHUDStats(geometry) {
    let polyCount = 0;
    if (geometry.index) polyCount = geometry.index.count / 3;
    else if (geometry.attributes.position) polyCount = geometry.attributes.position.count / 3;

    const polysEl = document.getElementById('hud-polys');
    if (polysEl) polysEl.textContent = polyCount > 1000 ? (polyCount / 1000).toFixed(1) + 'k' : Math.round(polyCount);
}

function openSnapshotModal() {
    if (!renderer) return;
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');

    const modal = document.getElementById('modal-snapshot');
    const previewImg = document.getElementById('snapshot-preview-img');
    const downloadLink = document.getElementById('link-download-img');

    if (previewImg) previewImg.src = dataURL;
    if (downloadLink) downloadLink.href = dataURL;
    if (modal) modal.classList.add('active');
    SoundFX.playPop(600);
}

function closeSnapshotModal() {
    const modal = document.getElementById('modal-snapshot');
    if (modal) modal.classList.remove('active');
}

function exportOBJModel() {
    if (typeof THREE.OBJExporter === 'undefined') {
        showToast('OBJ Exporter loading... try again');
        return;
    }

    try {
        const exporter = new THREE.OBJExporter();
        const result = exporter.parse(mainMeshGroup);

        const blob = new Blob([result], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vertex_3d_${state.modelType}_${Date.now()}.obj`;
        link.click();

        showToast('🎉 3D Model Exported (.OBJ)');
        SoundFX.playPop(700);
    } catch (e) {
        console.error('Export OBJ Error:', e);
        showToast('Export failed, try again');
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}
