/* 3D ФОН НА DODO — плаващо поле от ментови частици зад целия сайт.
   Дълбочина + лек паралакс към мишката и скрола, за да „диша" екранът.
   Тих е: спира при скрит таб и при prefers-reduced-motion. Стои зад
   съдържанието (pointer-events:none), не пипа четенето. */
(function () {
    if (typeof THREE === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.id = "bgField";
    document.body.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    /* Дълбоко поле от точки в кутия. Цветът минава от ярка мента в средата
       към тъмнозелено навън — като праха около ядрото. */
    const COUNT = Math.min(1400, Math.floor((innerWidth * innerHeight) / 1300));
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const inner = new THREE.Color(0xd6ffe9), outer = new THREE.Color(0x146b3a);
    const SPREAD_X = 34, SPREAD_Y = 22, SPREAD_Z = 26;

    for (let i = 0; i < COUNT; i++) {
        const x = (Math.random() - 0.5) * SPREAD_X;
        const y = (Math.random() - 0.5) * SPREAD_Y;
        const z = (Math.random() - 0.5) * SPREAD_Z;
        positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
        const t = Math.min(1, Math.hypot(x, y) / (SPREAD_X * 0.5));
        const c = inner.clone().lerp(outer, t * 0.85 + Math.random() * 0.15);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        speeds[i] = 0.15 + Math.random() * 0.5;   // бавно нагоре
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.09, sizeAttenuation: true, vertexColors: true,
        transparent: true, opacity: 0.85, depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    /* Мишка → лек паралакс на камерата. Скрол → бавно потъване в дълбочина. */
    let mx = 0, my = 0, tmx = 0, tmy = 0, scrollN = 0;
    addEventListener("mousemove", e => {
        tmx = (e.clientX / innerWidth - 0.5);
        tmy = (e.clientY / innerHeight - 0.5);
    }, { passive: true });
    addEventListener("scroll", () => {
        const h = document.body.scrollHeight - innerHeight;
        scrollN = h > 0 ? (scrollY / h) : 0;
    }, { passive: true });

    addEventListener("resize", () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    let running = true;
    document.addEventListener("visibilitychange", () => {
        running = !document.hidden;
        if (running) loop();
    });

    const pos = geometry.attributes.position.array;
    let raf = null;
    function loop() {
        if (!running) { raf = null; return; }
        raf = requestAnimationFrame(loop);

        // Частиците се носят бавно нагоре и се увиват отдолу — безкраен поток.
        for (let i = 0; i < COUNT; i++) {
            pos[i * 3 + 1] += speeds[i] * 0.012;
            if (pos[i * 3 + 1] > SPREAD_Y * 0.5) pos[i * 3 + 1] = -SPREAD_Y * 0.5;
        }
        geometry.attributes.position.needsUpdate = true;

        points.rotation.y += 0.0006;                     // едва доловимо въртене

        mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
        camera.position.x = mx * 4;
        camera.position.y = -my * 3 - scrollN * 3;        // скролът потапя надолу
        camera.position.z = 14 - scrollN * 4;             // и леко навътре
        camera.lookAt(0, camera.position.y * 0.4, 0);

        renderer.render(scene, camera);
    }
    loop();
})();
