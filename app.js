/* ==========================================================================
   VERTEX 3D VISION - J.A.R.V.I.S. AI, Mech & Dark Knight Bat-Tech Engine (v5.0)
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

// --- J.A.R.V.I.S. Audio Synthesizer ---
const JarvisAudio = (function() {
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
        playJarvisBeep: function(freq = 880) {
            if (!enabled) return;
            init();
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.8, audioCtx.currentTime + 0.06);

            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.06);
        },
        playOverdrive: function() {
            if (!enabled) return;
            init();
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.5);

            gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        }
    };
})();

// --- Application State ---
const state = {
    modelType: 'jarvis_arc',     // jarvis_arc, bat_symbol, bionic_hand, nano_grid, ai_chip, mech_drone
    baseColor: '#00f2fe',
    emissiveColor: '#7928ca',
    emissivePower: 1.2,
    metalness: 0.90,
    roughness: 0.15,
    deform: 0.20,
    twist: 0,
    particleCount: 2500,

    // Modes
    wireframe: false,
    rainbowMode: false,
    isExploded: false,
    overdriveMode: false,

    // Animation
    animActive: true,
    animSpeed: 0.8,
    animTime: 0
};

// --- Three.js Globals ---
let scene, camera, renderer, controls;
let mainMeshGroup, mainMesh;
let keyLight, fillLight, rimLight, ambientLight;
let gridHelper, particleSystem;
let jarvisRings = [];
let supernovaParticles = [];

// --- Performance Tracker ---
let lastFrameTime = performance.now();
let frameCount = 0;

// --- Initialize Application ---
window.addEventListener('DOMContentLoaded', () => {
    safeLucideIcons();
    initThreeJS();
    createEnvironment();
    build3DModel();
    setupEventListeners();
    setupCookieConsent();
    animate();
    showToast('🤖 J.A.R.V.I.S. AI & Bat-Tech Systems Online 100%');
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

// --- Three.js Setup ---
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3.2, 6.5);

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
    renderer.toneMappingExposure = 1.3;

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

// --- Environment & Dynamic Lighting ---
function createEnvironment() {
    scene.background = new THREE.Color(0x04060a);
    scene.fog = new THREE.FogExp2(0x04060a, 0.03);

    gridHelper = new THREE.GridHelper(26, 52, 0x00f2fe, 0x121b2d);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    fillLight = new THREE.PointLight(0x00f2fe, 1.4, 25);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    rimLight = new THREE.PointLight(0x7928ca, 1.8, 25);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    createNanotechParticles();
}

function createNanotechParticles() {
    if (particleSystem) scene.remove(particleSystem);

    const count = state.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const baseColor = new THREE.Color(state.baseColor);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

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
        opacity: 0.65,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// --- Bulletproof Non-Indexed Geometry Merger ---
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
    jarvisRings = [];
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
            case 'jarvis_arc':
                geometry = createJarvisArcGeometry();
                break;
            case 'bat_symbol':
                geometry = createBatSymbolGeometry();
                break;
            case 'bionic_hand':
                geometry = createBionicHandGeometry();
                break;
            case 'nano_grid':
                geometry = createNanotubeGeometry();
                break;
            case 'ai_chip':
                geometry = createAIChipGeometry();
                break;
            case 'mech_drone':
                geometry = createMechDroneGeometry();
                break;
            default:
                geometry = createJarvisArcGeometry();
        }
    } catch (e) {
        console.error('Geometry build fallback:', e);
        geometry = new THREE.IcosahedronGeometry(1.5, 2);
    }

    applySculptDeformation(geometry);
    geometry.computeVertexNormals();

    const material = createMaterial();
    mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    mainMeshGroup.add(mainMesh);

    if (state.modelType === 'jarvis_arc') {
        buildJarvisHolographicRings();
    }

    updateHUDStats(geometry);
}

// --- J.A.R.V.I.S. & Bat-Tech 3D Geometries ---
function createJarvisArcGeometry() {
    const list = [];

    // Central Core Sphere
    const core = new THREE.IcosahedronGeometry(0.85, 4);
    list.push(core);

    // Inner Containment Ring
    const innerRing = new THREE.TorusGeometry(1.3, 0.12, 16, 64);
    list.push(innerRing);

    // Outer Armor Ring
    const outerRing = new THREE.TorusGeometry(1.8, 0.18, 16, 64);
    list.push(outerRing);

    // Radiating Plasma Pillars
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const pillar = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
        pillar.rotation.z = Math.PI / 2;
        pillar.rotation.y = -angle;
        pillar.translate(Math.cos(angle) * 1.3, 0, Math.sin(angle) * 1.3);
        list.push(pillar);
    }

    return mergeGeometries(list);
}

function createBatSymbolGeometry() {
    const list = [];

    // Central Bat Emblem Body
    const chest = new THREE.BoxGeometry(0.8, 1.2, 0.4, 4, 4, 4);
    list.push(chest);

    // Left Wing
    const wingL1 = new THREE.ConeGeometry(0.6, 2.2, 4);
    wingL1.rotation.z = Math.PI / 3;
    wingL1.translate(-1.1, 0.3, 0);
    list.push(wingL1);

    const wingL2 = new THREE.ConeGeometry(0.4, 1.8, 4);
    wingL2.rotation.z = Math.PI / 2.2;
    wingL2.translate(-2.0, -0.2, 0);
    list.push(wingL2);

    // Right Wing
    const wingR1 = new THREE.ConeGeometry(0.6, 2.2, 4);
    wingR1.rotation.z = -Math.PI / 3;
    wingR1.translate(1.1, 0.3, 0);
    list.push(wingR1);

    const wingR2 = new THREE.ConeGeometry(0.4, 1.8, 4);
    wingR2.rotation.z = -Math.PI / 2.2;
    wingR2.translate(2.0, -0.2, 0);
    list.push(wingR2);

    // Ears
    const earL = new THREE.ConeGeometry(0.15, 0.6, 4);
    earL.translate(-0.35, 0.9, 0);
    list.push(earL);

    const earR = new THREE.ConeGeometry(0.15, 0.6, 4);
    earR.translate(0.35, 0.9, 0);
    list.push(earR);

    return mergeGeometries(list);
}

function createBionicHandGeometry() {
    const list = [];

    // Metallic Palm Chassis
    const palm = new THREE.BoxGeometry(1.2, 1.4, 0.5, 6, 6, 6);
    palm.translate(0, 0, 0);
    list.push(palm);

    // Wrist Connector
    const wrist = new THREE.CylinderGeometry(0.4, 0.5, 1.0, 16);
    wrist.translate(0, -1.2, 0);
    list.push(wrist);

    // 4 Segmented Fingers
    for (let f = 0; f < 4; f++) {
        const xPos = -0.45 + f * 0.3;
        for (let seg = 0; seg < 3; seg++) {
            const joint = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8);
            joint.translate(xPos, 0.9 + seg * 0.45, 0);
            list.push(joint);

            const knuckle = new THREE.SphereGeometry(0.1, 8, 8);
            knuckle.translate(xPos, 0.7 + seg * 0.45, 0);
            list.push(knuckle);
        }
    }

    // Thumb Joint
    const thumb1 = new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8);
    thumb1.rotation.z = Math.PI / 4;
    thumb1.translate(-0.8, 0.1, 0.2);
    list.push(thumb1);

    return mergeGeometries(list);
}

function createNanotubeGeometry() {
    const list = [];
    const radius = 1.2;
    const height = 3.6;

    for (let r = 0; r < 8; r++) {
        const y = (r / 8 - 0.5) * height;
        const ring = new THREE.TorusGeometry(radius, 0.06, 8, 32);
        ring.rotation.x = Math.PI / 2;
        ring.translate(0, y, 0);
        list.push(ring);
    }

    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const strut = new THREE.CylinderGeometry(0.04, 0.04, height, 8);
        strut.translate(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        list.push(strut);
    }

    return mergeGeometries(list);
}

function createAIChipGeometry() {
    const list = [];

    // Main Silicon Substrate
    const substrate = new THREE.BoxGeometry(2.4, 0.2, 2.4, 8, 2, 8);
    list.push(substrate);

    // Heat Spreader Cap
    const cap = new THREE.BoxGeometry(1.6, 0.3, 1.6, 6, 2, 6);
    cap.translate(0, 0.2, 0);
    list.push(cap);

    // Gold Connector Pins Array
    for (let i = -1.0; i <= 1.0; i += 0.2) {
        const pin1 = new THREE.BoxGeometry(0.06, 0.08, 0.3);
        pin1.translate(i, -0.12, 1.3);
        list.push(pin1);

        const pin2 = new THREE.BoxGeometry(0.06, 0.08, 0.3);
        pin2.translate(i, -0.12, -1.3);
        list.push(pin2);

        const pin3 = new THREE.BoxGeometry(0.3, 0.08, 0.06);
        pin3.translate(1.3, -0.12, i);
        list.push(pin3);

        const pin4 = new THREE.BoxGeometry(0.3, 0.08, 0.06);
        pin4.translate(-1.3, -0.12, i);
        list.push(pin4);
    }

    return mergeGeometries(list);
}

function createMechDroneGeometry() {
    const list = [];

    // Central Stealth Chassis
    const body = new THREE.ConeGeometry(0.8, 2.6, 4);
    body.rotation.x = Math.PI / 2;
    list.push(body);

    // Swept Delta Wings
    const wingL = new THREE.BoxGeometry(2.2, 0.08, 1.2);
    wingL.rotation.y = Math.PI / 6;
    wingL.translate(-1.1, 0, 0.2);
    list.push(wingL);

    const wingR = new THREE.BoxGeometry(2.2, 0.08, 1.2);
    wingR.rotation.y = -Math.PI / 6;
    wingR.translate(1.1, 0, 0.2);
    list.push(wingR);

    // Dual Thrusters
    const engine1 = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16);
    engine1.rotation.x = Math.PI / 2;
    engine1.translate(-0.6, 0.1, -1.1);
    list.push(engine1);

    const engine2 = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16);
    engine2.rotation.x = Math.PI / 2;
    engine2.translate(0.6, 0.1, -1.1);
    list.push(engine2);

    return mergeGeometries(list);
}

function buildJarvisHolographicRings() {
    const ringMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: 2.0,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });

    for (let r = 1; r <= 3; r++) {
        const ringGeo = new THREE.TorusGeometry(r * 0.9, 0.02, 16, 64);
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = (r * Math.PI) / 4;
        mainMeshGroup.add(ringMesh);
        jarvisRings.push({ mesh: ringMesh, speed: 0.8 + r * 0.4 });
    }
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
            const noiseVal = Noise3D.fbm(v.x * 2.5, v.y * 2.5, v.z * 2.5, 3);
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
    document.querySelectorAll('.model-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.model-tab').forEach(t => t.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.modelType = target.dataset.model;
            JarvisAudio.playJarvisBeep(640);
            build3DModel();
            showToast(`J.A.R.V.I.S. System Loaded: ${target.textContent.trim()}`);
        });
    });

    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
        btnSound.addEventListener('click', () => {
            const enabled = JarvisAudio.toggle();
            const icon = document.getElementById('sound-icon');
            if (icon) icon.setAttribute('data-lucide', enabled ? 'volume-2' : 'volume-x');
            safeLucideIcons();
            showToast(enabled ? 'J.A.R.V.I.S. Audio Enabled 🔊' : 'Audio Muted 🔇');
        });
    }

    const btnToggleDrawer = document.getElementById('btn-toggle-drawer');
    const drawer = document.getElementById('side-drawer');
    if (btnToggleDrawer && drawer) {
        btnToggleDrawer.addEventListener('click', () => {
            drawer.classList.toggle('collapsed');
            JarvisAudio.playJarvisBeep(450);
        });
    }

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
        createNanotechParticles();
    });

    const btnOverdrive = document.getElementById('btn-jarvis-overdrive');
    if (btnOverdrive) {
        btnOverdrive.addEventListener('click', (e) => {
            state.overdriveMode = !state.overdriveMode;
            e.currentTarget.classList.toggle('active', state.overdriveMode);
            JarvisAudio.playOverdrive();
            showToast(state.overdriveMode ? '⚡ J.A.R.V.I.S. OVERDRIVE 200% ACTIVATED' : 'Overdrive Disengaged');
        });
    }

    const btnRainbow = document.getElementById('btn-rainbow');
    if (btnRainbow) {
        btnRainbow.addEventListener('click', (e) => {
            state.rainbowMode = !state.rainbowMode;
            e.currentTarget.classList.toggle('active', state.rainbowMode);
            JarvisAudio.playJarvisBeep(700);
            showToast(state.rainbowMode ? '🌈 Holographic Prism Shift ON' : 'Prism Shift OFF');
        });
    }

    const btnExplode = document.getElementById('fun-btn-explode');
    if (btnExplode) {
        btnExplode.addEventListener('click', () => {
            state.isExploded = !state.isExploded;
            JarvisAudio.playOverdrive();
            showToast(state.isExploded ? '⚙️ Mech Components Disassembled' : 'Mech Reassembled');
        });
    }

    const btnSupernova = document.getElementById('btn-supernova');
    if (btnSupernova) {
        btnSupernova.addEventListener('click', () => {
            triggerQuantumBurst();
            JarvisAudio.playOverdrive();
            showToast('✨ Quantum Energy Explosion!');
        });
    }

    const btnWireframe = document.getElementById('btn-wireframe');
    if (btnWireframe) {
        btnWireframe.addEventListener('click', (e) => {
            state.wireframe = !state.wireframe;
            e.currentTarget.classList.toggle('active', state.wireframe);
            if (mainMesh && mainMesh.material) mainMesh.material.wireframe = state.wireframe;
            JarvisAudio.playJarvisBeep(520);
            showToast(state.wireframe ? 'Blueprint Wireframe ON' : 'Wireframe OFF');
        });
    }

    const btnRandomAll = document.getElementById('btn-random-all');
    if (btnRandomAll) {
        btnRandomAll.addEventListener('click', () => {
            const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
            const randomEmissive = '#' + Math.floor(Math.random()*16777215).toString(16);
            state.baseColor = randomColor;
            state.emissiveColor = randomEmissive;
            state.deform = parseFloat((Math.random() * 1.0).toFixed(2));
            state.twist = Math.floor(Math.random() * 360 - 180);

            document.getElementById('picker-color').value = randomColor;
            document.getElementById('picker-emissive').value = randomEmissive;
            document.getElementById('slider-deform').value = state.deform;
            document.getElementById('val-deform').textContent = state.deform;
            document.getElementById('slider-twist').value = state.twist;
            document.getElementById('val-twist').textContent = state.twist + '°';

            JarvisAudio.playJarvisBeep(800);
            build3DModel();
            showToast('🎲 Random Mech Specification Loaded');
        });
    }

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

function triggerQuantumBurst() {
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;

        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
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

    frameCount++;
    if (frameCount % 30 === 0) {
        const fpsEl = document.getElementById('hud-fps');
        if (fpsEl) fpsEl.textContent = Math.round(1 / delta);
    }

    if (controls) controls.update();

    const currentSpeed = state.overdriveMode ? state.animSpeed * 2.5 : state.animSpeed;

    if (state.animActive) {
        state.animTime += delta * currentSpeed;
        mainMeshGroup.rotation.y += delta * 0.7 * currentSpeed;
    }

    if (state.rainbowMode && mainMesh && mainMesh.material) {
        const hue = (state.animTime * 0.25) % 1;
        mainMesh.material.color.setHSL(hue, 1.0, 0.5);
    }

    if (mainMesh) {
        const targetScale = state.isExploded ? 1.5 : 1.0;
        mainMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (jarvisRings.length > 0) {
        jarvisRings.forEach(ring => {
            ring.mesh.rotation.z += delta * ring.speed * currentSpeed;
            ring.mesh.rotation.y += delta * ring.speed * 0.5 * currentSpeed;
        });
    }

    if (particleSystem) {
        particleSystem.rotation.y += delta * 0.03 * currentSpeed;
    }

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
    JarvisAudio.playJarvisBeep(750);
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
        link.download = `nexus_3d_${state.modelType}_${Date.now()}.obj`;
        link.click();

        showToast('🤖 J.A.R.V.I.S. 3D Model Exported (.OBJ)');
        JarvisAudio.playJarvisBeep(850);
    } catch (e) {
        console.error('Export OBJ Error:', e);
        showToast('Export failed, try simple model');
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
