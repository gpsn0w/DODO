/* ЯДРОТО НА DODO за сайта — 1:1 с плаващия помощник и главния прозорец.
   Същите 24 000 частици, телената сфера, пръстените, сиянието, ядрото,
   ореолът, сканиращият лъч, искрите, шоквейвът и мълниите. Рисува се в
   #dodo-hero-core и спира, когато разделът не се вижда — за да пести ток. */
(function () {
    const container = document.getElementById("dodo-hero-core");
    if (!container || typeof THREE === "undefined") return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    /* 1. ЕНЕРГИЙНА СФЕРА ОТ ЧАСТИЦИ */
    const particleCount = 24000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const original = [];

    const colorInner = new THREE.Color(0xd6ffe9);
    const colorOuter = new THREE.Color(0x146b3a);

    for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 1.3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        original.push(x, y, z);

        const t = radius / 1.3;
        const c = colorInner.clone().lerp(colorOuter, t);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff, vertexColors: true, size: 0.017,
        transparent: true, opacity: 0.92,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    const particles = new THREE.Points(geometry, material);
    coreGroup.add(particles);

    /* 2. WIREFRAME ГЛОБУС */
    const wireGeo = new THREE.IcosahedronGeometry(1.55, 2);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.12 });
    const wireGlobe = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireGlobe);

    /* 3. АРК РЕАКТОР ПРЪСТЕНИ */
    function createRing(radius, tube, rotX, rotY, opacity) {
        const geo = new THREE.TorusGeometry(radius, tube, 16, 120);
        const mat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity, blending: THREE.AdditiveBlending });
        const ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = rotX;
        ring.rotation.y = rotY;
        coreGroup.add(ring);
        return ring;
    }
    const ring1 = createRing(1.75, 0.006, 1.15, 0.35, 0.55);
    const ring2 = createRing(1.95, 0.004, 0.45, 1.05, 0.35);
    const ring3 = createRing(2.15, 0.003, 1.65, 0.75, 0.22);

    /* 4. МЕКО СИЯНИЕ ЗАД ЯДРОТО */
    function createGlowTexture() {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, "rgba(214,255,233,0.95)");
        gradient.addColorStop(0.35, "rgba(34,197,94,0.4)");
        gradient.addColorStop(1, "rgba(34,197,94,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(canvas);
    }
    const glowMat = new THREE.SpriteMaterial({ map: createGlowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(2.4, 2.4, 1);
    coreGroup.add(glowSprite);

    /* 5. СВЕТЕЩО ЯДРО + ОРЕОЛ */
    const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }));
    coreGroup.add(core);

    const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending }));
    coreGroup.add(halo);

    /* 6. СКАНИРАЩ ЛАЗЕР */
    const scanLine = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x9dffcf, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    coreGroup.add(scanLine);

    /* 7. ОРБИТИРАЩИ ИСКРИ */
    const sparkCount = 90;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkParams = [];
    for (let i = 0; i < sparkCount; i++) {
        sparkParams.push({
            radius: 0.7 + Math.random() * 0.55,
            speed: 0.2 + Math.random() * 0.55,
            phase: Math.random() * Math.PI * 2,
            incline: Math.random() * Math.PI,
            tilt: Math.random() * Math.PI * 2
        });
    }
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({ color: 0x9dffcf, size: 0.042, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    coreGroup.add(sparks);

    /* 8. ШОКВЕЙВ ПРЪСТЕН */
    const shockwave = new THREE.Mesh(
        new THREE.RingGeometry(1, 1.03, 64),
        new THREE.MeshBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    coreGroup.add(shockwave);

    /* 9. ЕНЕРГИЙНИ МЪЛНИИ */
    const activeBolts = [];
    function spawnBolt() {
        const segments = 5;
        const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        const endRadius = 1.25 + Math.random() * 0.35;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const p = dir.clone().multiplyScalar(endRadius * t);
            if (i > 0 && i < segments) {
                p.x += (Math.random() - 0.5) * 0.18;
                p.y += (Math.random() - 0.5) * 0.18;
                p.z += (Math.random() - 0.5) * 0.18;
            }
            points.push(p);
        }
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0x9dffcf, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        const bolt = new THREE.Line(geo, mat);
        bolt.userData.life = 1;
        coreGroup.add(bolt);
        activeBolts.push(bolt);
    }

    /* --------------------------- АНИМАЦИЯ В ПОКОЙ --------------------------- */
    let heartbeat = 0, pulse = 0, pulseStrength = 0.08, shockCycle = 0, running = true;

    function scanMatSet(value) { scanLine.material.opacity = value; }

    function frame() {
        if (!running) return;
        requestAnimationFrame(frame);

        heartbeat += 0.04;
        pulseStrength += (0.08 - pulseStrength) * 0.05;
        pulse += 0.015;

        const pos = geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const p = i * 3;
            const ox = original[p], oy = original[p + 1], oz = original[p + 2];
            const wave = Math.sin(pulse * 3 + i * 0.02);
            pos[p]     = ox + ox * wave * pulseStrength;
            pos[p + 1] = oy + oy * wave * pulseStrength;
            pos[p + 2] = oz + oz * wave * pulseStrength;
        }
        geometry.attributes.position.needsUpdate = true;

        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0004;
        wireGlobe.rotation.y -= 0.0006;
        wireGlobe.rotation.x += 0.00025;

        ring1.rotation.z += 0.002;
        ring2.rotation.z -= 0.003;
        ring3.rotation.z += 0.0015;

        const coreScale = 1 + Math.sin(heartbeat) * 0.08;
        core.scale.setScalar(coreScale);
        halo.scale.setScalar(coreScale * 1.15);
        glowSprite.scale.setScalar(2.4 * coreScale);
        glowMat.opacity = 0.65;

        const scanRange = 1.6;
        const scanY = Math.sin(pulse * 0.3) * scanRange;
        scanLine.position.y = scanY;
        const scanFade = 1 - Math.min(1, Math.abs(scanY) / scanRange);
        scanMatSet(0.12 + scanFade * 0.45);

        const sparkPos = sparkGeo.attributes.position.array;
        for (let i = 0; i < sparkCount; i++) {
            const s = sparkParams[i];
            const t = pulse * s.speed + s.phase;
            const x = Math.cos(t) * s.radius;
            const z = Math.sin(t) * s.radius;
            const y = Math.sin(t * 0.7 + s.tilt) * s.radius * 0.4;
            const cosI = Math.cos(s.incline), sinI = Math.sin(s.incline);
            sparkPos[i * 3]     = x;
            sparkPos[i * 3 + 1] = y * cosI - z * sinI;
            sparkPos[i * 3 + 2] = y * sinI + z * cosI;
        }
        sparkGeo.attributes.position.needsUpdate = true;

        shockCycle += 0.016;
        const st = (shockCycle % 2.4) / 2.4;
        shockwave.scale.setScalar(0.3 + st * 3.2);
        shockwave.material.opacity = (1 - st) * 0.35;

        if (Math.random() < 0.015) spawnBolt();
        for (let i = activeBolts.length - 1; i >= 0; i--) {
            const b = activeBolts[i];
            b.userData.life -= 0.07;
            b.material.opacity = Math.max(0, b.userData.life) * 0.9;
            if (b.userData.life <= 0) {
                coreGroup.remove(b);
                b.geometry.dispose();
                b.material.dispose();
                activeBolts.splice(i, 1);
            }
        }

        camera.position.x = Math.sin(pulse * 0.07) * 0.35;
        camera.position.y = Math.cos(pulse * 0.05) * 0.2;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }

    window.dodoHeroCore = {
        wake() { if (!running) { running = true; frame(); } },
        sleep() { running = false; }
    };
    document.addEventListener("visibilitychange", () => {
        document.hidden ? window.dodoHeroCore.sleep() : window.dodoHeroCore.wake();
    });
    window.addEventListener("resize", () => {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    frame();
})();
