/* ==========================================================================
   VERTEX 3D VISION - Cyber Hero Sentinel & J.A.R.V.I.S. Engine (v7.0)
   ========================================================================== */

// --- 3D Perlin/Simplex Noise Generator ---
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
    modelType: 'hero_sentinel',   // hero_sentinel, android_bot, jarvis_arc, bat_symbol, bionic_hand, ai_chip, nano_grid
    baseColor: '#00f2fe',
    emissiveColor: '#ff007f',
    emissivePower: 1.5,
    metalness: 0.90,
    roughness: 0.15,
    deform: 0.0,
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
let mainMeshGroup;
let keyLight, fillLight, rimLight, ambientLight;
let gridHelper, particleSystem;
let jarvisRings = [];
let supernovaParticles = [];

// --- Safe Lucide Helper ---
function safeLucideIcons() {
    try {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    } catch (e) {
        console.warn('Lucide icons deferred:', e);
    }
}

// --- Initialize App ---
window.addEventListener('DOMContentLoaded', () => {
    safeLucideIcons();
    initThreeJS();
    createEnvironment();
    build3DModel();
    setupEventListeners();
    setupCookieConsent();
    animate();
    showToast('🦸‍♂️ Cyber Hero Sentinel & J.A.R.V.I.S. Studio Online');
});

// --- Three.js Engine Setup ---
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3.2, 6.8);

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

// --- Environment & Dynamic Studio Lighting ---
function createEnvironment() {
    scene.background = new THREE.Color(0x04060a);
    scene.fog = new THREE.FogExp2(0x04060a, 0.025);

    gridHelper = new THREE.GridHelper(26, 52, 0x00f2fe, 0x121b2d);
    gridHelper.position.y = -2.0;
    scene.add(gridHelper);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    fillLight = new THREE.PointLight(0x00f2fe, 1.4, 25);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    rimLight = new THREE.PointLight(0xff007f, 2.0, 25);
    rimLight.position.set(0, 6, -6);
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
        positions[i * 3] = (Math.random() - 0.5) * 32;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 32;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 32;

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

// --- Main 3D Model Switcher ---
function build3DModel() {
    jarvisRings = [];
    
    while (mainMeshGroup.children.length > 0) {
        const obj = mainMeshGroup.children[0];
        disposeObjectTree(obj);
        mainMeshGroup.remove(obj);
    }

    switch (state.modelType) {
        case 'hero_sentinel':
            buildCyberHeroSentinel();
            break;
        case 'android_bot':
            buildAndroidRobot();
            break;
        case 'jarvis_arc':
            buildJarvisArcReactor();
            break;
        case 'bat_symbol':
            buildBatTechArmorEmblem();
            break;
        case 'bionic_hand':
            buildBionicCyberArm();
            break;
        case 'ai_chip':
            buildAIQuantumProcessor();
            break;
        case 'nano_grid':
            buildCarbonNanotechGrid();
            break;
        default:
            buildCyberHeroSentinel();
    }

    updateHUDStats();
}

function disposeObjectTree(obj) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
    }
    if (obj.children) {
        obj.children.forEach(child => disposeObjectTree(child));
    }
}

// --- High-Realism 3D Characters & Models ---

// 1. Cyber Hero Sentinel Character
function buildCyberHeroSentinel() {
    const armorMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        metalness: state.metalness,
        roughness: state.roughness,
        wireframe: state.wireframe
    });

    const darkAlloyMat = new THREE.MeshStandardMaterial({
        color: 0x111622,
        metalness: 0.95,
        roughness: 0.2,
        wireframe: state.wireframe
    });

    const visorGlowMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.emissiveColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: state.emissivePower,
        wireframe: state.wireframe
    });

    // Helmet Head Chassis
    const helmet = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 2), armorMat);
    helmet.position.y = 1.1;
    helmet.castShadow = true;
    mainMeshGroup.add(helmet);

    // Glowing Holographic Visor Eyes
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.5), visorGlowMat);
    visor.position.set(0, 1.2, 0.45);
    mainMeshGroup.add(visor);

    // Armored Torso Chassis
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.8), darkAlloyMat);
    torso.position.y = -0.2;
    torso.castShadow = true;
    mainMeshGroup.add(torso);

    // Chest Arc Emblem Core
    const chestCore = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 16, 32), visorGlowMat);
    chestCore.position.set(0, 0.1, 0.42);
    mainMeshGroup.add(chestCore);

    // Left & Right Shoulder Pauldrons
    const shoulderL = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), armorMat);
    shoulderL.position.set(-1.1, 0.4, 0);
    mainMeshGroup.add(shoulderL);

    const shoulderR = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), armorMat);
    shoulderR.position.set(1.1, 0.4, 0);
    mainMeshGroup.add(shoulderR);

    // Plasma Sword Blade
    const swordBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 3.2, 8), visorGlowMat);
    swordBlade.position.set(1.5, 0.3, 0);
    mainMeshGroup.add(swordBlade);
}

// 2. Android Robot Character
function buildAndroidRobot() {
    const chromeMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.1,
        wireframe: state.wireframe
    });

    const carbonMat = new THREE.MeshStandardMaterial({
        color: 0x181e29,
        metalness: 0.85,
        roughness: 0.3,
        wireframe: state.wireframe
    });

    const eyeGlowMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: state.emissivePower,
        wireframe: state.wireframe
    });

    // Robot Cranium
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 32), chromeMat);
    head.position.y = 1.0;
    head.castShadow = true;
    mainMeshGroup.add(head);

    // Dual Glowing Neural Optics
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeGlowMat);
    eyeL.position.set(-0.3, 1.15, 0.75);
    mainMeshGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeGlowMat);
    eyeR.position.set(0.3, 1.15, 0.75);
    mainMeshGroup.add(eyeR);

    // Jaw Assembly
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), carbonMat);
    jaw.position.set(0, 0.5, 0.1);
    mainMeshGroup.add(jaw);

    // Neck Cylinder Joints
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 16), carbonMat);
    neck.position.y = 0.1;
    mainMeshGroup.add(neck);

    // Robot Torso Frame
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.6, 1.6, 24), chromeMat);
    torso.position.y = -1.0;
    torso.castShadow = true;
    mainMeshGroup.add(torso);
}

// 3. J.A.R.V.I.S. Holographic Arc Reactor
function buildJarvisArcReactor() {
    const chromeMat = new THREE.MeshStandardMaterial({
        color: 0xddeeff,
        metalness: 0.95,
        roughness: 0.1,
        wireframe: state.wireframe
    });

    const copperMat = new THREE.MeshStandardMaterial({
        color: 0xb87333,
        metalness: 0.9,
        roughness: 0.25,
        wireframe: state.wireframe
    });

    const emissiveMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: state.emissivePower,
        wireframe: state.wireframe
    });

    const glassMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.baseColor),
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.45,
        wireframe: state.wireframe
    });

    const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 4), emissiveMat);
    coreMesh.castShadow = true;
    mainMeshGroup.add(coreMesh);

    const glassSphere = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 32), glassMat);
    mainMeshGroup.add(glassSphere);

    const outerChassis = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.12, 24, 64), chromeMat);
    outerChassis.castShadow = true;
    mainMeshGroup.add(outerChassis);

    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 16, 32), copperMat);
        coil.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
        coil.rotation.y = Math.PI / 2;
        coil.rotation.x = angle;
        mainMeshGroup.add(coil);
    }

    for (let r = 1; r <= 3; r++) {
        const ringGeo = new THREE.TorusGeometry(r * 0.75, 0.03, 16, 64);
        const ringMesh = new THREE.Mesh(ringGeo, emissiveMat);
        ringMesh.rotation.x = (r * Math.PI) / 4;
        mainMeshGroup.add(ringMesh);
        jarvisRings.push({ mesh: ringMesh, speed: 0.8 + r * 0.5 });
    }
}

// 4. Dark Knight Bat-Armor Emblem
function buildBatTechArmorEmblem() {
    const titaniumMat = new THREE.MeshStandardMaterial({
        color: 0x111318,
        metalness: 0.95,
        roughness: 0.2,
        wireframe: state.wireframe
    });

    const goldAccentMat = new THREE.MeshStandardMaterial({
        color: 0xffb703,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0x332200,
        wireframe: state.wireframe
    });

    const glowCoreMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: state.emissivePower,
        wireframe: state.wireframe
    });

    const chestCore = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.4), titaniumMat);
    chestCore.castShadow = true;
    mainMeshGroup.add(chestCore);

    const emblemCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 3), glowCoreMat);
    emblemCore.position.z = 0.25;
    mainMeshGroup.add(emblemCore);

    const wingL1 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.4, 4), titaniumMat);
    wingL1.rotateZ(Math.PI / 3);
    wingL1.position.set(-1.3, 0.4, 0);
    mainMeshGroup.add(wingL1);

    const wingL2 = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.0, 4), goldAccentMat);
    wingL2.rotateZ(Math.PI / 2.2);
    wingL2.position.set(-2.3, -0.2, 0);
    mainMeshGroup.add(wingL2);

    const wingR1 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.4, 4), titaniumMat);
    wingR1.rotateZ(-Math.PI / 3);
    wingR1.position.set(1.3, 0.4, 0);
    mainMeshGroup.add(wingR1);

    const wingR2 = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.0, 4), goldAccentMat);
    wingR2.rotateZ(-Math.PI / 2.2);
    wingR2.position.set(2.3, -0.2, 0);
    mainMeshGroup.add(wingR2);

    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 4), titaniumMat);
    earL.position.set(-0.4, 1.0, 0);
    mainMeshGroup.add(earL);

    const earR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 4), titaniumMat);
    earR.position.set(0.4, 1.0, 0);
    mainMeshGroup.add(earR);
}

// 5. Cyber Bionic Arm
function buildBionicCyberArm() {
    const darkAlloyMat = new THREE.MeshStandardMaterial({
        color: 0x1e2430,
        metalness: 0.9,
        roughness: 0.2,
        wireframe: state.wireframe
    });

    const chromeJointMat = new THREE.MeshStandardMaterial({
        color: 0xe0e6ed,
        metalness: 0.95,
        roughness: 0.1,
        wireframe: state.wireframe
    });

    const glowNodeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: state.emissivePower,
        wireframe: state.wireframe
    });

    const palm = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.5), darkAlloyMat);
    palm.castShadow = true;
    mainMeshGroup.add(palm);

    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.2, 16), darkAlloyMat);
    wrist.position.y = -1.35;
    mainMeshGroup.add(wrist);

    const wristRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 16, 32), glowNodeMat);
    wristRing.rotateX(Math.PI / 2);
    wristRing.position.y = -1.0;
    mainMeshGroup.add(wristRing);

    for (let f = 0; f < 4; f++) {
        const xPos = -0.45 + f * 0.3;
        for (let seg = 0; seg < 3; seg++) {
            const joint = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 12), chromeJointMat);
            joint.position.set(xPos, 1.0 + seg * 0.45, 0);
            mainMeshGroup.add(joint);

            const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), glowNodeMat);
            node.position.set(xPos, 0.8 + seg * 0.45, 0);
            mainMeshGroup.add(node);
        }
    }

    const thumbSegment = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 12), chromeJointMat);
    thumbSegment.rotateZ(Math.PI / 3.5);
    thumbSegment.position.set(-0.85, 0.15, 0.2);
    mainMeshGroup.add(thumbSegment);
}

// 6. AI Quantum Processor
function buildAIQuantumProcessor() {
    const siliconMat = new THREE.MeshStandardMaterial({
        color: 0x0a0f18,
        metalness: 0.85,
        roughness: 0.3,
        wireframe: state.wireframe
    });

    const goldPinMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.98,
        roughness: 0.1,
        wireframe: state.wireframe
    });

    const aiCoreMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: state.emissivePower,
        wireframe: state.wireframe
    });

    const substrate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 2.6), siliconMat);
    substrate.castShadow = true;
    mainMeshGroup.add(substrate);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 1.8), siliconMat);
    cap.position.y = 0.25;
    mainMeshGroup.add(cap);

    const aiCore = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 1.0), aiCoreMat);
    aiCore.position.y = 0.35;
    mainMeshGroup.add(aiCore);

    for (let i = -1.1; i <= 1.1; i += 0.22) {
        const pin1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.35), goldPinMat);
        pin1.position.set(i, -0.1, 1.4);
        mainMeshGroup.add(pin1);

        const pin2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.35), goldPinMat);
        pin2.position.set(i, -0.1, -1.4);
        mainMeshGroup.add(pin2);

        const pin3 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.08), goldPinMat);
        pin3.position.set(1.4, -0.1, i);
        mainMeshGroup.add(pin3);

        const pin4 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.08), goldPinMat);
        pin4.position.set(-1.4, -0.1, i);
        mainMeshGroup.add(pin4);
    }
}

// 7. Carbon Nanotechnology Grid
function buildCarbonNanotechGrid() {
    const nanotubeMat = new THREE.MeshStandardMaterial({
        color: 0x151c28,
        metalness: 0.92,
        roughness: 0.25,
        wireframe: true
    });

    const nodeGlowMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.baseColor),
        emissive: new THREE.Color(state.emissiveColor),
        emissiveIntensity: state.emissivePower,
        wireframe: state.wireframe
    });

    const radius = 1.3;
    const height = 3.8;

    for (let r = 0; r <= 8; r++) {
        const y = (r / 8 - 0.5) * height;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.06, 8, 32), nanotubeMat);
        ring.rotateX(Math.PI / 2);
        ring.position.y = y;
        mainMeshGroup.add(ring);

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), nodeGlowMat);
            node.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
            mainMeshGroup.add(node);
        }
    }

    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, height, 8), nanotubeMat);
        strut.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        mainMeshGroup.add(strut);
    }
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
            showToast(`Character Loaded: ${target.textContent.trim()}`);
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
            build3DModel();
        });
    }

    const pickerEmissive = document.getElementById('picker-emissive');
    if (pickerEmissive) {
        pickerEmissive.addEventListener('input', (e) => {
            state.emissiveColor = e.target.value;
            build3DModel();
        });
    }

    bindRange('slider-emissive', 'val-emissive-power', v => {
        state.emissivePower = parseFloat(v);
        build3DModel();
    });

    bindRange('slider-metal', 'val-metal', v => {
        state.metalness = parseFloat(v);
        build3DModel();
    });

    bindRange('slider-rough', 'val-rough', v => {
        state.roughness = parseFloat(v);
        build3DModel();
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
            showToast(state.isExploded ? '⚙️ Character Armor Disassembled' : 'Armor Reassembled');
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
            build3DModel();
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
            state.deform = 0.0;
            state.twist = Math.floor(Math.random() * 360 - 180);

            document.getElementById('picker-color').value = randomColor;
            document.getElementById('picker-emissive').value = randomEmissive;

            JarvisAudio.playJarvisBeep(800);
            build3DModel();
            showToast('🎲 Random Character Paint Loaded');
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

    if (state.rainbowMode) {
        const hue = (state.animTime * 0.25) % 1;
        const rainbowColor = new THREE.Color().setHSL(hue, 1.0, 0.5);
        mainMeshGroup.traverse(child => {
            if (child.isMesh && child.material && child.material.color) {
                child.material.color.copy(rainbowColor);
            }
        });
    }

    if (mainMeshGroup) {
        const targetScale = state.isExploded ? 1.4 : 1.0;
        mainMeshGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
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

function updateHUDStats() {
    let polyCount = 0;
    mainMeshGroup.traverse(child => {
        if (child.isMesh && child.geometry) {
            if (child.geometry.index) polyCount += child.geometry.index.count / 3;
            else if (child.geometry.attributes.position) polyCount += child.geometry.attributes.position.count / 3;
        }
    });

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

        showToast('🤖 3D Character Exported (.OBJ)');
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
