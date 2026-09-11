/* 3D ФОН НА DODO — живо поле от меки ментови светлинки зад целия сайт.
   Два слоя за дълбочина (далечен прах + близки ореоли), мъгла на хоризонта,
   лек трепет и паралакс към мишката/скрола. Тих е: спира при скрит таб и при
   prefers-reduced-motion. Стои зад съдържанието (pointer-events:none). */
(function () {
    if (typeof THREE === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.id = "bgField";
    document.body.appendChild(canvas);

    const scene = new THREE.Scene();
    // Мъгла в цвета на фона — далечните светлинки се стопяват в тъмното → дълбочина.
    scene.fog = new THREE.FogExp2(0x04100a, 0.028);

    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 120);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    /* Мек кръгъл ореол (радиален градиент) вместо твърдо квадратче — това е
       разликата между „точки" и „светлинки". Рисува се веднъж в текстура. */
    function glowTexture() {
        const s = 64, c = document.createElement("canvas");
        c.width = c.height = s;
        const g = c.getContext("2d");
        const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        grad.addColorStop(0.0, "rgba(255,255,255,1)");
        grad.addColorStop(0.25, "rgba(214,255,233,0.9)");
        grad.addColorStop(0.55, "rgba(110,231,183,0.35)");
        grad.addColorStop(1.0, "rgba(110,231,183,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, s, s);
        const tex = new THREE.Texture(c);
        tex.needsUpdate = true;
        return tex;
    }
    const sprite = glowTexture();

    const inner = new THREE.Color(0xffffff), mid = new THREE.Color(0x6ee7b7), outer = new THREE.Color(0x146b3a);
    const SX = 40, SY = 26, SZ = 30;

    /* Прави един слой светлинки. `bright` дава дял ярки „герои" звезди. */
    function makeLayer(count, size, opacity, bright) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const orig = new Float32Array(count * 3);  // оригинален цвят (за трепкане)
        const spd = new Float32Array(count);       // скорост нагоре
        const phase = new Float32Array(count);     // фаза на трепкане
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * SX;
            const y = (Math.random() - 0.5) * SY;
            const z = (Math.random() - 0.5) * SZ;
            pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
            const isHero = Math.random() < bright;
            const tt = Math.random();
            const c = isHero ? inner.clone().lerp(mid, tt * 0.5)
                             : mid.clone().lerp(outer, 0.35 + tt * 0.6);
            const b = isHero ? 1 : 0.4 + Math.random() * 0.4;
            orig[i * 3] = c.r * b; orig[i * 3 + 1] = c.g * b; orig[i * 3 + 2] = c.b * b;
            col[i * 3] = orig[i * 3]; col[i * 3 + 1] = orig[i * 3 + 1]; col[i * 3 + 2] = orig[i * 3 + 2];
            spd[i] = 0.12 + Math.random() * 0.5;
            phase[i] = Math.random() * Math.PI * 2;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
            size, map: sprite, sizeAttenuation: true, vertexColors: true,
            transparent: true, opacity, depthWrite: false, depthTest: false,
            blending: THREE.AdditiveBlending, fog: true
        });
        const pts = new THREE.Points(geo, mat);
        scene.add(pts);
        return { pts, geo, orig, spd, phase, count };
    }

    // Гъстота според екрана (по-малко на телефон).
    const area = innerWidth * innerHeight;
    const far = makeLayer(Math.min(1500, Math.floor(area / 1300)), 0.72, 0.8, 0.06);
    const near = makeLayer(Math.min(360, Math.floor(area / 5200)), 2.0, 0.92, 0.22);
    const layers = [far, near];

    /* Мишка → лек паралакс. Скрол → бавно потъване в дълбочина. */
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

    let t = 0, raf = null;
    function loop() {
        if (!running) { raf = null; return; }
        raf = requestAnimationFrame(loop);
        t += 0.016;

        for (const L of layers) {
            const p = L.geo.attributes.position.array;
            const c = L.geo.attributes.color.array;
            const o = L.orig;
            for (let i = 0; i < L.count; i++) {
                // носене нагоре + увиване отдолу → безкраен поток
                p[i * 3 + 1] += L.spd[i] * 0.01;
                if (p[i * 3 + 1] > SY * 0.5) p[i * 3 + 1] = -SY * 0.5;
                // трепкане: оригиналният цвят диша леко (пази белите „герои")
                const tw = 0.72 + 0.28 * Math.sin(t * 1.6 + L.phase[i]);
                c[i * 3] = o[i * 3] * tw;
                c[i * 3 + 1] = o[i * 3 + 1] * tw;
                c[i * 3 + 2] = o[i * 3 + 2] * tw;
            }
            L.geo.attributes.position.needsUpdate = true;
            L.geo.attributes.color.needsUpdate = true;
            L.pts.rotation.y += 0.0004;
        }

        mx += (tmx - mx) * 0.045; my += (tmy - my) * 0.045;
        camera.position.x = mx * 5;
        camera.position.y = -my * 3.5 - scrollN * 3;
        camera.position.z = 15 - scrollN * 5;
        camera.lookAt(0, camera.position.y * 0.35, 0);

        renderer.render(scene, camera);
    }
    loop();
})();
