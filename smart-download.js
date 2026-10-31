/* ============================================================================
   DODO — Smart Download. Авто-засича компютъра на посетителя (OS + чип + ядра
   + RAM), подсвета правилния файл и казва какво ще е преживяването според
   специте. Забрана за телефон/таблет (DODO е само за компютър). Двуезично.
   Самостоятелен файл — не зависи от site.js.
   ========================================================================== */
(function () {
	"use strict";
	var V = "1.1.8", BASE = "https://github.com/gpsn0w/DODO/releases/download/v" + V + "/";
	var FILES = {
		mac: { href: BASE + "DODO-" + V + "-arm64.dmg", key: "mac", ico: "⌘", bg: "▼ Изтегли за Mac", en: "▼ Download for Mac" },
		win: { href: BASE + "DODO-Setup-" + V + ".exe", key: "win", ico: "⊞", bg: "▼ Изтегли за Windows", en: "▼ Download for Windows" },
		deb: { href: BASE + "DODO-" + V + "-amd64.deb", key: "deb", ico: "🐧", bg: "▼ Изтегли .deb", en: "▼ Download .deb" },
		rpm: { href: BASE + "DODO-" + V + "-x86_64.rpm", key: "rpm", ico: "🐧", bg: "▼ Изтегли .rpm", en: "▼ Download .rpm" }
	};
	var box = document.getElementById("smartDownload");
	if (!box) return;
	var ua = navigator.userAgent || "", plat = navigator.platform || "";
	function g(id) { return document.getElementById(id); }
	function isEN() { try { return document.documentElement.getAttribute("lang") === "en" || !!document.querySelector(".lang-toggle .lang-en.on"); } catch (e) { return false; } }
	function L(bg, en) { return isEN() ? en : bg; }

	function detectDevice() {   // 'phone' | 'tablet' | 'computer'
		if (/iPhone|iPod/i.test(ua)) return "phone";
		if (/iPad/i.test(ua)) return "tablet";
		if (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1) return "tablet"; // iPadOS се прави на Mac
		if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "phone" : "tablet";
		return "computer";
	}
	function detectOS() {
		if (/Windows|Win64|Win32/i.test(ua) || /Win/i.test(plat)) return "win";
		if (/Macintosh|Mac OS X/i.test(ua) || /Mac/i.test(plat)) return "mac";
		if (/Linux|X11/i.test(ua)) return "linux";
		return null;
	}
	function glRenderer() {
		try {
			var c = document.createElement("canvas");
			var gl = c.getContext("webgl") || c.getContext("experimental-webgl");
			if (!gl) return "";
			var e = gl.getExtension("WEBGL_debug_renderer_info");
			return e ? (gl.getParameter(e.UNMASKED_RENDERER_WEBGL) || "") : "";
		} catch (_) { return ""; }
	}
	function archFromGL() {
		var r = glRenderer();
		if (/apple/i.test(r) && !/intel/i.test(r)) return "arm";
		if (/intel|amd|radeon/i.test(r)) return "x86";
		return null;
	}
	function macArch(cb) {
		if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
			navigator.userAgentData.getHighEntropyValues(["architecture"]).then(function (h) {
				cb(h && h.architecture === "arm" ? "arm" : (h && h.architecture ? "x86" : null));
			}).catch(function () { cb(archFromGL()); });
			return;
		}
		cb(archFromGL());
	}

	var gpu = glRenderer();
	function coresStr() { return navigator.hardwareConcurrency ? (navigator.hardwareConcurrency + L(" ядра", " cores")) : ""; }
	function memStr() { return navigator.deviceMemory ? ("~" + navigator.deviceMemory + " GB RAM") : ""; }
	function lineOf(parts) { return parts.filter(Boolean).join(" · "); }

	function verdict() {
		var weak = /swiftshader|llvmpipe|microsoft basic|software|basic render/i.test(gpu);
		var c = navigator.hardwareConcurrency || 0, m = navigator.deviceMemory || 0;
		if (weak || (c && c <= 2) || (m && m < 4))
			return { cls: "v-low", txt: L("🟡 DODO ще върви, но машината е по-слабичка — пусни го на „лек режим“ (по-малко ефекти) за гладкост.",
				"🟡 DODO will run, but your machine is on the weaker side — use “light mode” (fewer effects) for smoothness.") };
		if (c >= 8 && (m === 0 || m >= 8))
			return { cls: "v-high", txt: L("🟢 DODO ще лети — всичко на макс, напълно плавно.", "🟢 DODO will fly — everything maxed, perfectly smooth.") };
		if (c >= 4)
			return { cls: "v-mid", txt: L("🟢 DODO ще върви добре — гладко и бързо.", "🟢 DODO will run well — smooth and fast.") };
		return { cls: "v-mid", txt: L("🟢 DODO ще върви нормално.", "🟢 DODO will run fine.") };
	}

	/* текущото състояние — за пре-рендер при смяна на език */
	var ST = null;

	function applyBlock(device) {
		ST = { kind: "block", device: device };
		g("sdIco").textContent = device === "phone" ? "📱" : "▭";
		var what = device === "phone" ? L("телефон", "a phone") : L("таблет", "a tablet");
		g("sdSpecs").textContent = L("DODO е програма за КОМПЮТЪР (Windows · Mac · Linux) — не работи на " + what + ". Отвори сайта от компютъра си, за да го свалиш.",
			"DODO is a program for COMPUTERS (Windows · Mac · Linux) — it doesn’t work on " + what + ". Open the site from your computer to download it.");
		var ve = g("sdVerdict"); if (ve) ve.textContent = "";
		g("sdBtn").style.display = "none"; g("sdAlt").textContent = "";
		var grid = document.querySelector(".download-grid"); if (grid) grid.style.display = "none";
		box.hidden = false;
	}

	function applyOS(pick, labelBG, labelEN) {
		ST = { kind: "os", pick: pick, bg: labelBG, en: labelEN };
		var f = FILES[pick];
		g("sdIco").textContent = f.ico;
		/* Показваме само това, което е ТОЧНО (OS + чип). Браузърите крият точния
		   RAM (таван 8GB) и ядрата (анти-fingerprinting), затова не ги пишем като
		   факт — оценката по-долу казва какво ще е преживяването. */
		g("sdSpecs").textContent = L(labelBG, labelEN);
		var vd = verdict(); var ve = g("sdVerdict"); if (ve) { ve.textContent = vd.txt; ve.className = "sd-verdict " + vd.cls; }
		var b = g("sdBtn"); b.style.display = ""; b.href = f.href; b.textContent = L(f.bg, f.en); b.setAttribute("download", "");
		var a = document.querySelector('[data-download="' + f.key + '"]');
		if (a) { var card = a.closest(".panel.dl"); if (card) card.classList.add("recommended"); }
		var alt = g("sdAlt");
		if (pick === "deb") alt.innerHTML = L('Fedora? → <a href="' + FILES.rpm.href + '" download>вземи .rpm</a> · или избери ръчно ↓', 'Fedora? → <a href="' + FILES.rpm.href + '" download>get .rpm</a> · or pick manually ↓');
		else alt.textContent = L("Или избери ръчно отдолу ↓", "Or pick manually below ↓");
		box.hidden = false;
	}

	function run() {
		var device = detectDevice();
		if (device === "phone" || device === "tablet") { applyBlock(device); return; }
		var os = detectOS();
		if (!os) return;   // непознат компютър → остава ръчната решетка
		if (os === "win") applyOS("win", "Windows · 64-bit", "Windows · 64-bit");
		else if (os === "linux") applyOS("deb", "Linux · Debian/Ubuntu (x64)", "Linux · Debian/Ubuntu (x64)");
		else if (os === "mac") macArch(function (arch) {
			if (arch === "x86") applyOS("mac", "macOS · Intel (върви през Rosetta)", "macOS · Intel (runs via Rosetta)");
			else applyOS("mac", arch === "arm" ? "macOS · Apple Silicon (M1–M4)" : "macOS", arch === "arm" ? "macOS · Apple Silicon (M1–M4)" : "macOS");
		});
	}

	run();

	/* при смяна на език → пре-рендерираме динамичния текст */
	var lt = document.getElementById("langToggle");
	if (lt) lt.addEventListener("click", function () {
		setTimeout(function () {
			if (!ST) return;
			if (ST.kind === "block") applyBlock(ST.device);
			else applyOS(ST.pick, ST.bg, ST.en);
		}, 70);
	});
})();
