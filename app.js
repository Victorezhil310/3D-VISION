/* ==========================================================================
   3D VISION - JARVIS AI, Bat-Tech & Nano Mech Engine (v5.0 Ultra)
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

// --- Tactical JARVIS Sci-Fi Audio Synthesizer ---
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
        playBeep: function(freq = 880) {
            if (!enabled) return;
            init();
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.2, audioCtx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        },
        playArcPulse: function() {
            if (!enabled) return;
            init();
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.25);

            gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        }
    };
})();

// --- Application State ---
const state = {
    modelType: 'jarvis_core',    // jarvis_core, bat_mech, nano_tech, intelligent_bot, mechanic_engine
    baseColor: '#00f2fe',
    emissiveColor: '#00a8ff',
    emissivePower: 1.2,
    metalness: 0.90,
    roughness: 0.15,
    deform: 0.20,
    rpmSpeed: 1.5,

    // Tactical Modes
    arcOverdrive: true,
    stealthMode: false,
    nanobotSwarm: false,
    holoWireframe: false,
    disassembled: false,

    // Animation Loop
    animActive: true,
    animTime: 0
};

// --- Three.js Globals ---
let scene, camera, renderer, controls;
let mainMeshGroup, mainMesh;
let keyLight, fillLight, rimLight, ambientLight;
let gridHelper, particleSystem;
let orbitRings = [];
let nanobotParticles = [];

// --- Performance Tracking ---
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
    showToast('⚡ 3D VISION: JARVIS ARC Protocol Online');
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

// --- Environment & Lighting Engine ---
function createEnvironment() {
    scene.background = new THREE.Color(0x04060a);
    scene.fog = new THREE.FogExp2(0x04060a, 0.03);

    gridHelper = new THREE.GridHelper(24, 48, 0x00f2fe, 0x121a2c);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    fillLight = new THREE.PointLight(0x00f2fe, 1.5, 20);
    fillLight.position.set(-6, 2, -4);
    scene.add(fillLight);

    rimLight = new THREE.PointLight(0x00a8ff, 1.8, 20);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    createParticleDust();
}

function createParticleDust() {
    if (particleSystem) scene.remove(particleSystem);

    const count = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const baseColor = new THREE.Color(state.baseColor);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 26;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 26;

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

// --- Procedural Mechanical & AI Models ---
function build3DModel() {
    orbitRings = [];
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
            case 'jarvis_core':
                geometry = createJarvisArcGeometry();
                break;
            case 'bat_mech':
                geometry = createBatMechGeometry();
                break;
            case 'nano_tech':
                geometry = createNanoMatrixGeometry();
                break;
            case 'intelligent_bot':
                geometry = createAIBotGeometry();
                break;
            case 'mechanic_engine':
                geometry = createKineticEngineGeometry();
                break;
            default:
                geometry = createJarvisArcGeometry();
        }
    } catch (e) {
        console.error('Model build fallback:', e);
        geometry = new THREE.IcosahedronGeometry(1.4, 3);
    }

    applySculptDeformation(geometry);
    geometry.computeVertexNormals();

    const material = createMaterial();
    mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    mainMeshGroup.add(mainMesh);

    // Additional Magnetic Containment Rings & Glow Halos
    if (state.modelType === 'jarvis_core') {
        createJarvisHoloRings();
    } else if (state.modelType === 'bat_mech') {
        createBatMechEyes();
    }

    updateHUDStats(geometry);
}

function createJarvisArcGeometry() {
    const list = [];

    // Central Plasma Core
    const core = new THREE.IcosahedronGeometry(0.8, 3);
    list.push(core);

    // Magnet Coils Segmented Ring
    const ring1 = new THREE.TorusGeometry(1.4, 0.12, 16, 40);
    list.push(ring1);

    const ring2 = new THREE.TorusGeometry(1.8, 0.08, 16, 40);
    list.push(ring2);

    // Segmented Outer Housing Blocks
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const block = new THREE.BoxGeometry(0.25, 0.25, 0.4);
        block.position.set(Math.cos(angle) * 1.4, Math.sin(angle) * 1.4, 0);
        block.rotation.z = angle;
        list.push(block);
    }

    return mergeGeometries(list);
}

function createJarvisHoloRings() {
    const ringMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: 1.8,
        wireframe: true,
        transparent: true,
        opacity: 0.75
    });

    const angles = [
        { rx: Math.PI / 4, ry: 0, rz: Math.PI / 6 },
        { rx: -Math.PI / 4, ry: Math.PI / 3, rz: 0 },
        { rx: 0, ry: -Math.PI / 4, rz: Math.PI / 3 }
    ];

    angles.forEach((rot, i) => {
        const ringGeo = new THREE.TorusGeometry(2.2, 0.02, 16, 80);
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.set(rot.rx, rot.ry, rot.rz);
        mainMeshGroup.add(ringMesh);

        // Orbiting energy node
        const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const nodeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(state.emissiveColor),
            emissiveIntensity: 2.5
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        mainMeshGroup.add(nodeMesh);

        orbitRings.push({ mesh: nodeMesh, radius: 2.2, rot: rot, speed: 1.8 + i * 0.4, offset: i * Math.PI * 0.6 });
    });
}

function createBatMechGeometry() {
    const list = [];

    // Stealth Cowl Monolith
    const cowl = new THREE.IcosahedronGeometry(1.1, 1);
    list.push(cowl);

    // Angled Swept-back Carbon Wings
    const wingL = new THREE.ConeGeometry(0.5, 2.2, 4);
    wingL.rotation.z = -Math.PI / 3;
    wingL.rotation.x = -0.4;
    wingL.translate(-1.2, 0.2, -0.4);
    list.push(wingL);

    const wingR = new THREE.ConeGeometry(0.5, 2.2, 4);
    wingR.rotation.z = Math.PI / 3;
    wingR.rotation.x = -0.4;
    wingR.translate(1.2, 0.2, -0.4);
    list.push(wingR);

    // Front Stealth Armor Shield
    const shield = new THREE.BoxGeometry(1.0, 0.8, 1.2, 4, 4, 4);
    shield.translate(0, -0.3, 0.8);
    list.push(shield);

    return mergeGeometries(list);
}

function createBatMechEyes() {
    const eyeMat = new THREE.MeshStandardMaterial({
        color: 0xff003c,
        emissive: 0xff003c,
        emissiveIntensity: 3.0
    });

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.2), eyeMat);
    eyeL.position.set(-0.35, 0.2, 1.1);
    eyeL.rotation.z = -0.2;
    mainMeshGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.2), eyeMat);
    eyeR.position.set(0.35, 0.2, 1.1);
    eyeR.rotation.z = 0.2;
    mainMeshGroup.add(eyeR);
}

function createNanoMatrixGeometry() {
    const list = [];
    const radius = 1.4;
    const count = 30;

    for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);

        const node = new THREE.SphereGeometry(0.12, 8, 8);
        node.translate(x, y, z);
        list.push(node);

        if (i > 0) {
            const bar = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6);
            bar.position.set(x * 0.8, y * 0.8, z * 0.8);
            bar.rotation.x = x;
            bar.rotation.y = y;
            list.push(bar);
        }
    }
    return mergeGeometries(list);
}

function createAIBotGeometry() {
    const list = [];
    // Cranium Core
    const head = new THREE.IcosahedronGeometry(1.0, 2);
    list.push(head);

    // Quad Optical Lenses
    const visor = new THREE.BoxGeometry(1.2, 0.4, 0.6);
    visor.translate(0, 0.1, 0.8);
    list.push(visor);

    // Neck Actuator Rods
    const neck = new THREE.CylinderGeometry(0.4, 0.4, 1.0, 12);
    neck.translate(0, -1.0, 0);
    list.push(neck);

    return mergeGeometries(list);
}

function createKineticEngineGeometry() {
    const list = [];

    // Central Turbine Core
    const core = new THREE.CylinderGeometry(0.8, 0.8, 2.6, 24);
    list.push(core);

    // Outer Gear Rings
    const ring1 = new THREE.TorusGeometry(1.5, 0.18, 16, 32);
    list.push(ring1);

    const ring2 = new THREE.TorusGeometry(1.8, 0.12, 16, 32);
    ring2.rotation.x = Math.PI / 2;
    list.push(ring2);

    return mergeGeometries(list);
}

function applySculptDeformation(geometry) {
    const pos = geometry.attributes.position;
    const v = new THREE.Vector3();
    const amp = state.deform;

    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);

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
    const colorHex = state.stealthMode ? '#0d0d12' : state.baseColor;
    const emissiveHex = state.stealthMode ? '#ff003c' : state.emissiveColor;

    return new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: state.stealthMode ? 0.45 : state.roughness,
        metalness: state.stealthMode ? 0.95 : state.metalness,
        emissive: new THREE.Color(emissiveHex),
        emissiveIntensity: state.arcOverdrive ? state.emissivePower * 1.5 : state.emissivePower,
        wireframe: state.holoWireframe
    });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Model Tabs
    document.querySelectorAll('.tech-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tech-tab').forEach(t => t.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.modelType = target.dataset.model;
            JarvisAudio.playBeep(920);

            // Auto-switch colors for Bat-Tech
            if (state.modelType === 'bat_mech') {
                state.stealthMode = true;
                document.getElementById('hud-protocol').textContent = 'BAT-TECH STEALTH OVERDRIVE';
            } else {
                state.stealthMode = false;
                document.getElementById('hud-protocol').textContent = 'JARVIS ARC ONLINE';
            }

            build3DModel();
            showToast(`Engaged Protocol: ${target.textContent.trim()}`);
        });
    });

    // SFX Toggle
    const btnSfx = document.getElementById('btn-toggle-sfx');
    if (btnSfx) {
        btnSfx.addEventListener('click', () => {
            const enabled = JarvisAudio.toggle();
            const icon = document.getElementById('sfx-icon');
            if (icon) icon.setAttribute('data-lucide', enabled ? 'volume-2' : 'volume-x');
            safeLucideIcons();
            showToast(enabled ? 'JARVIS Audio Synthesizer ON 🔊' : 'Audio SFX Muted 🔇');
        });
    }

    // Left Panel Toggle
    const btnTogglePanel = document.getElementById('btn-toggle-panel');
    const panel = document.getElementById('tactical-panel');
    if (btnTogglePanel && panel) {
        btnTogglePanel.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
            JarvisAudio.playBeep(450);
        });
    }

    // Color Pickers
    const pickerBase = document.getElementById('picker-base-color');
    if (pickerBase) {
        pickerBase.addEventListener('input', (e) => {
            state.baseColor = e.target.value;
            if (mainMesh && mainMesh.material && mainMesh.material.color) {
                mainMesh.material.color.set(state.baseColor);
            }
        });
    }

    const pickerEmissive = document.getElementById('picker-emissive-color');
    if (pickerEmissive) {
        pickerEmissive.addEventListener('input', (e) => {
            state.emissiveColor = e.target.value;
            if (mainMesh && mainMesh.material && mainMesh.material.emissive) {
                mainMesh.material.emissive.set(state.emissiveColor);
            }
        });
    }

    // Range Sliders
    bindRange('slider-emissive-power', 'val-emissive-power', v => {
        state.emissivePower = parseFloat(v);
        if (mainMesh && mainMesh.material) mainMesh.material.emissiveIntensity = state.emissivePower;
    });

    bindRange('slider-metalness', 'val-metalness', v => {
        state.metalness = parseFloat(v);
        if (mainMesh && mainMesh.material) mainMesh.material.metalness = state.metalness;
    });

    bindRange('slider-roughness', 'val-roughness', v => {
        state.roughness = parseFloat(v);
        if (mainMesh && mainMesh.material) mainMesh.material.roughness = state.roughness;
    });

    bindRange('slider-deform', 'val-deform', v => {
        state.deform = parseFloat(v);
        build3DModel();
    });

    bindRange('slider-rpm', 'val-rpm', v => {
        state.rpmSpeed = parseFloat(v);
        document.getElementById('footer-rpm-text').textContent = `Kinetic Rotation Active (${state.rpmSpeed} RPM)`;
        return v + 'x';
    });

    // Tactical Actions
    const btnArc = document.getElementById('btn-jarvis-overdrive');
    if (btnArc) {
        btnArc.addEventListener('click', (e) => {
            state.arcOverdrive = !state.arcOverdrive;
            e.currentTarget.classList.toggle('active', state.arcOverdrive);
            JarvisAudio.playArcPulse();
            build3DModel();
            showToast(state.arcOverdrive ? '⚡ JARVIS Arc Overdrive Plasma ACTIVE' : 'Plasma Overdrive Standby');
        });
    }

    const btnStealth = document.getElementById('btn-stealth-mode');
    if (btnStealth) {
        btnStealth.addEventListener('click', (e) => {
            state.stealthMode = !state.stealthMode;
            e.currentTarget.classList.toggle('active', state.stealthMode);
            JarvisAudio.playArcPulse();
            build3DModel();
            showToast(state.stealthMode ? '🦇 Bat-Tech Carbon Stealth ENGAGED' : 'Stealth Deactivated');
        });
    }

    const btnNanobot = document.getElementById('btn-nanobot-assembly');
    if (btnNanobot) {
        btnNanobot.addEventListener('click', () => {
            triggerNanobotSwarm();
            JarvisAudio.playArcPulse();
            showToast('✨ Nanobot Reconstitution Swarm!');
        });
    }

    const btnHoloWire = document.getElementById('btn-holo-wireframe');
    if (btnHoloWire) {
        btnHoloWire.addEventListener('click', (e) => {
            state.holoWireframe = !state.holoWireframe;
            e.currentTarget.classList.toggle('active', state.holoWireframe);
            if (mainMesh && mainMesh.material) mainMesh.material.wireframe = state.holoWireframe;
            JarvisAudio.playBeep(650);
            showToast(state.holoWireframe ? 'Holographic HUD Wireframe ON' : 'Wireframe OFF');
        });
    }

    const btnDisassemble = document.getElementById('btn-disassemble-mech');
    if (btnDisassemble) {
        btnDisassemble.addEventListener('click', () => {
            state.disassembled = !state.disassembled;
            JarvisAudio.playArcPulse();
            showToast(state.disassembled ? '⚙️ Mechanical Explode Matrix Engaged' : 'Reassembled Mechanical Module');
        });
    }

    // Play Pause Button
    const btnPlayPause = document.getElementById('btn-play-pause');
    if (btnPlayPause) {
        btnPlayPause.addEventListener('click', () => {
            state.animActive = !state.animActive;
            const icon = document.getElementById('play-icon');
            if (icon) icon.setAttribute('data-lucide', state.animActive ? 'pause' : 'play');
            safeLucideIcons();
            document.getElementById('footer-rpm-text').textContent = state.animActive ? `Kinetic Rotation Active (${state.rpmSpeed} RPM)` : 'Kinetic Rotation Paused';
        });
    }

    // Header Actions
    const btnSnapshot = document.getElementById('btn-snapshot');
    if (btnSnapshot) btnSnapshot.addEventListener('click', openSnapshotModal);
    const modalClose = document.getElementById('modal-close');
    if (modalClose) modalClose.addEventListener('click', closeSnapshotModal);
    const modalCancel = document.getElementById('modal-cancel');
    if (modalCancel) modalCancel.addEventListener('click', closeSnapshotModal);

    const btnExportObj = document.getElementById('btn-export-obj');
    if (btnExportObj) btnExportObj.addEventListener('click', exportOBJModel);

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

function triggerNanobotSwarm() {
    const count = 250;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;

        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
        ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        size: 0.1,
        color: new THREE.Color(state.stealthMode ? '#ff003c' : state.baseColor),
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });

    const pSystem = new THREE.Points(geometry, mat);
    scene.add(pSystem);

    nanobotParticles.push({ system: pSystem, velocities: velocities, life: 1.0 });
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

    if (state.animActive) {
        state.animTime += delta * state.rpmSpeed;
        mainMeshGroup.rotation.y += delta * 0.6 * state.rpmSpeed;
    }

    // Explode Disassemble Mode
    if (mainMesh) {
        const targetScale = state.disassembled ? 1.45 : 1.0;
        mainMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    // Orbiting Hologram / Moon Nodes
    if (orbitRings.length > 0) {
        orbitRings.forEach(orb => {
            const angle = state.animTime * orb.speed + orb.offset;
            const x = Math.cos(angle) * orb.radius;
            const y = Math.sin(angle) * orb.radius;

            const pos = new THREE.Vector3(x, y, 0);
            pos.applyEuler(new THREE.Euler(orb.rot.rx, orb.rot.ry, orb.rot.rz));
            orb.mesh.position.copy(pos);
        });
    }

    // Particle Dust Drift
    if (particleSystem) {
        particleSystem.rotation.y += delta * 0.03;
    }

    // Animate Nanobot Swarms
    for (let i = nanobotParticles.length - 1; i >= 0; i--) {
        const swarm = nanobotParticles[i];
        swarm.life -= delta * 1.5;
        const pos = swarm.system.geometry.attributes.position;

        for (let j = 0; j < swarm.velocities.length; j++) {
            const v = swarm.velocities[j];
            pos.setXYZ(j, pos.getX(j) + v.x * delta, pos.getY(j) + v.y * delta, pos.getZ(j) + v.z * delta);
        }
        pos.needsUpdate = true;
        swarm.system.material.opacity = swarm.life;

        if (swarm.life <= 0) {
            scene.remove(swarm.system);
            swarm.system.geometry.dispose();
            swarm.system.material.dispose();
            nanobotParticles.splice(i, 1);
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
    JarvisAudio.playBeep(750);
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
        link.download = `3d_vision_${state.modelType}_${Date.now()}.obj`;
        link.click();

        showToast('⚡ 3D Mech Exported (.OBJ)');
        JarvisAudio.playBeep(850);
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
