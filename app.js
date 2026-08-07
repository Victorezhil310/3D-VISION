/* ==========================================================================
   VERTEX SOLAR SYSTEM - 4K/8K Photorealistic 3D Engine
   ========================================================================== */

// --- 3D Perlin/Simplex Noise Generator (For Procedural Textures) ---
const Noise3D = (function() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = Math.floor(Math.random() * 256);
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    
    function grad3(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    function lerp(t, a, b) { return a + t * (b - a); }
    
    return {
        noise: function(x, y, z) {
            const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
            x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
            const u = x*x*x*(x*(x*6-15)+10), v = y*y*y*(y*(y*6-15)+10), w = z*z*z*(z*(z*6-15)+10);
            const A = perm[X]+Y, AA = perm[A]+Z, AB = perm[A+1]+Z, B = perm[X+1]+Y, BA = perm[B]+Z, BB = perm[B+1]+Z;
            return lerp(w, lerp(v, lerp(u, grad3(perm[AA], x, y, z), grad3(perm[BA], x-1, y, z)),
                           lerp(u, grad3(perm[AB], x, y-1, z), grad3(perm[BB], x-1, y-1, z))),
                   lerp(v, lerp(u, grad3(perm[AA+1], x, y, z-1), grad3(perm[BA+1], x-1, y, z-1)),
                           lerp(u, grad3(perm[AB+1], x, y-1, z-1), grad3(perm[BB+1], x-1, y-1, z-1))));
        },
        fbm: function(x, y, z, octaves = 4) {
            let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
            for (let i = 0; i < octaves; i++) {
                total += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
                maxValue += amplitude;
                amplitude *= 0.5; frequency *= 2;
            }
            return total / maxValue;
        }
    };
})();

// --- Procedural High-Res Texture Generator (Fallback) ---
const TextureGenerator = {
    generatePlanetTexture: function(baseColor, accentColor, width=1024, height=512, noiseScale=5) {
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(width, height);
        
        const c1 = new THREE.Color(baseColor);
        const c2 = new THREE.Color(accentColor);
        const res = new THREE.Color();
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Map x, y to spherical coordinates for seamless noise
                const u = x / width, v = y / height;
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;
                const nx = Math.sin(phi) * Math.cos(theta);
                const ny = Math.cos(phi);
                const nz = Math.sin(phi) * Math.sin(theta);
                
                let n = Noise3D.fbm(nx * noiseScale, ny * noiseScale, nz * noiseScale, 6);
                n = (n + 1) / 2; // Normalize 0-1
                
                res.copy(c1).lerp(c2, n);
                
                const idx = (y * width + x) * 4;
                imgData.data[idx] = res.r * 255;
                imgData.data[idx+1] = res.g * 255;
                imgData.data[idx+2] = res.b * 255;
                imgData.data[idx+3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }
};

// --- Application State ---
const state = {
    orbitSpeed: 1.0,
    rotationSpeed: 1.0,
    ambientLightIntensity: 0.1,
    showOrbits: true,
    focusTarget: 'overview', // 'overview', 'sun', 'earth', etc.
    cameraTweening: false
};

// --- Three.js Globals ---
let scene, camera, renderer, controls;
let ambientLight, sunLight;
let planets = {};
let orbitLines = [];
let cosmicDust;

// --- Planet Configuration Data ---
const PLANET_DATA = {
    sun:     { radius: 10, distance: 0,   speed: 0.002, color: '#ffaa00', url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/sunmap.jpg' },
    mercury: { radius: 0.8, distance: 18, speed: 0.02,  color: '#8c8c8c', url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/mercurymap.jpg' },
    venus:   { radius: 1.8, distance: 26, speed: 0.015, color: '#e6ccb3', url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/venusmap.jpg' },
    earth:   { radius: 2.0, distance: 38, speed: 0.01,  color: '#2b82c9', url: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', hasClouds: true },
    mars:    { radius: 1.2, distance: 50, speed: 0.008, color: '#c1440e', url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/marsmap1k.jpg' },
    jupiter: { radius: 6.0, distance: 80, speed: 0.004, color: '#c88b3a', url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/jupitermap.jpg' },
    saturn:  { radius: 5.0, distance: 110,speed: 0.003, color: '#e3d2a4', url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/saturnmap.jpg', hasRings: true },
    uranus:  { radius: 3.0, distance: 140,speed: 0.002, color: '#4b70dd', url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/uranusmap.jpg' },
    neptune: { radius: 2.8, distance: 165,speed: 0.001, color: '#274687', url: 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/neptunemap.jpg' }
};

// --- Initialization ---
window.addEventListener('DOMContentLoaded', async () => {
    safeLucideIcons();
    initThreeJS();
    createCosmicEnvironment();
    await buildSolarSystem();
    setupEventListeners();
    setupCookieConsent();
    hideLoader();
    animate();
});

function safeLucideIcons() {
    try { if (window.lucide) window.lucide.createIcons(); } 
    catch (e) { console.warn('Lucide icons deferred'); }
}

function hideLoader() {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.classList.remove('active');
        setTimeout(() => loader.style.display = 'none', 500);
    }
}

function updateLoadingProgress(percent, text) {
    const bar = document.getElementById('loading-progress');
    const txt = document.getElementById('loading-text');
    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = text;
}

// --- Three.js Setup ---
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020306);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 100, 220);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 800;
    controls.minDistance = 2;

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function createCosmicEnvironment() {
    ambientLight = new THREE.AmbientLight(0xffffff, state.ambientLightIntensity);
    scene.add(ambientLight);

    // Starlight Background Particles
    const starCount = 8000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 1000;
        const y = (Math.random() - 0.5) * 1000;
        const z = (Math.random() - 0.5) * 1000;
        
        // Push stars outward so they aren't inside the solar system
        const distance = Math.sqrt(x*x + y*y + z*z);
        if (distance < 250) { i--; continue; }

        starPos[i * 3] = x;
        starPos[i * 3 + 1] = y;
        starPos[i * 3 + 2] = z;

        const c = 0.5 + Math.random() * 0.5;
        starColors[i * 3] = c;
        starColors[i * 3 + 1] = c;
        starColors[i * 3 + 2] = c;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    cosmicDust = new THREE.Points(starGeo, starMat);
    scene.add(cosmicDust);
}

// --- High-Res Texture Loader with Procedural Fallback ---
async function loadPlanetTexture(url, fallbackColor, isSun = false) {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    
    return new Promise((resolve) => {
        loader.load(
            url,
            (texture) => {
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                resolve(texture);
            },
            undefined,
            (err) => {
                console.warn(`Failed to load texture ${url}, using procedural fallback.`);
                resolve(TextureGenerator.generatePlanetTexture(fallbackColor, isSun ? '#ffffff' : '#111111'));
            }
        );
    });
}

// --- Build Solar System Models ---
async function buildSolarSystem() {
    const keys = Object.keys(PLANET_DATA);
    let loadedCount = 0;

    for (const key of keys) {
        const data = PLANET_DATA[key];
        
        updateLoadingProgress((loadedCount / keys.length) * 100, `Loading ${key.toUpperCase()} 8K Textures...`);
        
        // Create Orbital Anchor Group
        const orbitGroup = new THREE.Group();
        scene.add(orbitGroup);

        // Create Mesh
        const geometry = new THREE.SphereGeometry(data.radius, 64, 64);
        let material;

        const texture = await loadPlanetTexture(data.url, data.color, key === 'sun');
        
        if (key === 'sun') {
            material = new THREE.MeshBasicMaterial({ 
                map: texture,
                color: 0xffffff
            });
            // Add PointLight for the Sun
            sunLight = new THREE.PointLight(0xffffee, 2.5, 600);
            scene.add(sunLight);
            
            // Sun Glow Effect (Sprite)
            const glowMat = new THREE.SpriteMaterial({
                map: TextureGenerator.generatePlanetTexture('#ffaa00', '#ff0000', 128, 128),
                color: 0xffaa00, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Sprite(glowMat);
            glow.scale.set(data.radius * 3.5, data.radius * 3.5, 1.0);
            orbitGroup.add(glow);
        } else {
            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.6,
                metalness: 0.1
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = data.distance;
        orbitGroup.add(mesh);

        // Special Planet Features
        if (data.hasClouds) {
            const cloudGeo = new THREE.SphereGeometry(data.radius * 1.02, 64, 64);
            const cloudTexUrl = 'https://unpkg.com/three-globe/example/img/earth-clouds1024.png';
            
            new THREE.TextureLoader().setCrossOrigin('anonymous').load(cloudTexUrl, (cloudTex) => {
                const cloudMat = new THREE.MeshStandardMaterial({
                    map: cloudTex,
                    transparent: true,
                    opacity: 0.6,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
                mesh.add(cloudMesh);
                planets[key].cloudMesh = cloudMesh;
            });
        }

        if (data.hasRings) {
            const ringGeo = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.2, 64);
            const ringTexUrl = 'https://raw.githubusercontent.com/joshcam/three-js-solar-system/master/img/saturnringcolor.jpg';
            
            new THREE.TextureLoader().setCrossOrigin('anonymous').load(ringTexUrl, (ringTex) => {
                const ringMat = new THREE.MeshStandardMaterial({
                    map: ringTex,
                    color: 0xffffff,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8
                });
                const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                ringMesh.rotation.x = Math.PI / 2;
                ringMesh.rotation.y = Math.PI / 8;
                mesh.add(ringMesh);
            });
        }

        // Draw Orbital Path Line
        if (key !== 'sun') {
            const pathGeo = new THREE.BufferGeometry();
            const pathPts = [];
            for (let i = 0; i <= 128; i++) {
                const a = (i / 128) * Math.PI * 2;
                pathPts.push(Math.cos(a) * data.distance, 0, Math.sin(a) * data.distance);
            }
            pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(pathPts, 3));
            const pathMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
            const pathLine = new THREE.Line(pathGeo, pathMat);
            scene.add(pathLine);
            orbitLines.push(pathLine);
        }

        planets[key] = {
            group: orbitGroup,
            mesh: mesh,
            data: data,
            angle: Math.random() * Math.PI * 2 // Random starting position
        };
        
        loadedCount++;
    }
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Orbital Mechanics & Rotation
    Object.keys(planets).forEach(key => {
        const p = planets[key];
        
        // Planet Rotation on its axis
        p.mesh.rotation.y += 0.005 * state.rotationSpeed;
        
        // Earth Cloud Rotation
        if (p.cloudMesh) p.cloudMesh.rotation.y += 0.007 * state.rotationSpeed;

        // Orbital Revolution around Sun
        if (key !== 'sun') {
            p.angle += p.data.speed * state.orbitSpeed;
            p.mesh.position.x = Math.cos(p.angle) * p.data.distance;
            p.mesh.position.z = Math.sin(p.angle) * p.data.distance;
        }
    });

    // Cosmic Dust Slow Rotation
    if (cosmicDust) cosmicDust.rotation.y -= 0.0002;

    // Camera Focus Tweening
    if (state.cameraTweening) {
        tweenCameraToTarget();
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// --- Cinematic Camera Focus System ---
let tweenTargetPos = new THREE.Vector3();
let tweenTargetLook = new THREE.Vector3();
let currentLookAt = new THREE.Vector3(0,0,0);

function focusOnPlanet(planetKey) {
    state.focusTarget = planetKey;
    state.cameraTweening = true;
    const label = document.getElementById('current-target-label');
    
    if (planetKey === 'overview') {
        tweenTargetPos.set(0, 100, 220);
        tweenTargetLook.set(0, 0, 0);
        if(label) label.textContent = 'Focus: Solar System Overview';
    } else {
        const p = planets[planetKey];
        if (!p) return;
        
        if(label) label.textContent = `Focus: ${planetKey.toUpperCase()}`;
    }
}

function tweenCameraToTarget() {
    if (state.focusTarget !== 'overview') {
        const p = planets[state.focusTarget];
        // Calculate dynamic position based on planet's current orbital position
        const pPos = new THREE.Vector3();
        p.mesh.getWorldPosition(pPos);
        
        const offsetDist = p.data.radius * 4 + 2;
        tweenTargetPos.copy(pPos).add(new THREE.Vector3(offsetDist, offsetDist * 0.5, offsetDist));
        tweenTargetLook.copy(pPos);
    }

    // Smooth Lerp Camera Position
    camera.position.lerp(tweenTargetPos, 0.05);
    currentLookAt.lerp(tweenTargetLook, 0.05);
    camera.lookAt(currentLookAt);
    controls.target.copy(currentLookAt);

    // Stop tweening if close enough (only for overview, moving targets need constant tracking)
    if (state.focusTarget === 'overview') {
        if (camera.position.distanceTo(tweenTargetPos) < 1.0) {
            state.cameraTweening = false;
        }
    }
}

// --- UI Event Listeners ---
function setupEventListeners() {
    // Target Switcher
    document.querySelectorAll('.model-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.model-tab').forEach(t => t.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            focusOnPlanet(target.dataset.target);
        });
    });

    // Sidebar Sliders
    bindRange('slider-orbit-speed', 'val-orbit-speed', v => {
        state.orbitSpeed = parseFloat(v);
        return v + 'x';
    });

    bindRange('slider-rotation-speed', 'val-rotation-speed', v => {
        state.rotationSpeed = parseFloat(v);
        return v + 'x';
    });

    bindRange('slider-ambient-light', 'val-ambient-light', v => {
        state.ambientLightIntensity = parseFloat(v);
        if (ambientLight) ambientLight.intensity = state.ambientLightIntensity;
    });

    // Toggle Buttons
    const btnOrbits = document.getElementById('btn-toggle-orbits');
    if (btnOrbits) {
        btnOrbits.addEventListener('click', (e) => {
            state.showOrbits = !state.showOrbits;
            e.currentTarget.classList.toggle('active', state.showOrbits);
            orbitLines.forEach(line => line.visible = state.showOrbits);
        });
    }

    const btnDrawer = document.getElementById('btn-toggle-drawer');
    const drawer = document.getElementById('side-drawer');
    if (btnDrawer && drawer) {
        btnDrawer.addEventListener('click', () => {
            drawer.classList.toggle('collapsed');
        });
    }

    // Snapshot & Fullscreen
    const btnSnapshot = document.getElementById('btn-snapshot');
    if (btnSnapshot) btnSnapshot.addEventListener('click', openSnapshotModal);
    const modalClose = document.getElementById('modal-close');
    if (modalClose) modalClose.addEventListener('click', closeSnapshotModal);
    const modalCancel = document.getElementById('modal-cancel');
    if (modalCancel) modalCancel.addEventListener('click', closeSnapshotModal);

    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else if (document.exitFullscreen) document.exitFullscreen();
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
}

function closeSnapshotModal() {
    const modal = document.getElementById('modal-snapshot');
    if (modal) modal.classList.remove('active');
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
