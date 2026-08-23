/* Дребната логика на сайта: меню на телефон, HUD часовник, разкриване при
   скрол и подсветяване на активния раздел. Без чужди библиотеки. */
(function () {
	"use strict";

	/* --- Меню на телефон --- */
	var toggle = document.getElementById("navToggle");
	var nav = document.getElementById("nav");
	if (toggle && nav) {
		toggle.addEventListener("click", function () {
			var open = nav.classList.toggle("open");
			toggle.setAttribute("aria-expanded", open ? "true" : "false");
		});
		// Клик по връзка затваря менюто.
		nav.addEventListener("click", function (e) {
			if (e.target.tagName === "A") {
				nav.classList.remove("open");
				toggle.setAttribute("aria-expanded", "false");
			}
		});
	}

	/* --- Часовникът в лентата --- */
	var clock = document.getElementById("barClock");
	if (clock) {
		var tick = function () {
			var d = new Date();
			var p = function (n) { return (n < 10 ? "0" : "") + n; };
			clock.textContent = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
		};
		tick();
		setInterval(tick, 1000);
	}

	/* --- Разкриване при скрол --- */
	var reveals = document.querySelectorAll(".reveal");
	if (reveals.length && "IntersectionObserver" in window) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (en.isIntersecting) {
					en.target.classList.add("in");
					io.unobserve(en.target);
				}
			});
		}, { threshold: 0.15 });
		reveals.forEach(function (el) { io.observe(el); });
	} else {
		reveals.forEach(function (el) { el.classList.add("in"); });
	}

	/* --- Активен раздел в менюто --- */
	var sections = document.querySelectorAll("section[id]");
	var links = {};
	document.querySelectorAll(".nav a").forEach(function (a) {
		var href = a.getAttribute("href") || "";
		var i = href.indexOf("#");
		if (i !== -1) { links["#" + href.slice(i + 1)] = a; }
	});
	if (sections.length && "IntersectionObserver" in window) {
		var so = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				var link = links["#" + en.target.id];
				if (!link) return;
				if (en.isIntersecting) {
					Object.keys(links).forEach(function (k) { links[k].classList.remove("current"); });
					link.classList.add("current");
				}
			});
		}, { threshold: 0.5 });
		sections.forEach(function (s) { so.observe(s); });
	}

	/* --- Ядрото спи, когато hero-то не се вижда (пести ток) --- */
	var hero = document.getElementById("top");
	if (hero && "IntersectionObserver" in window) {
		var ho = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (!window.dodoHeroCore) return;
				en.isIntersecting ? window.dodoHeroCore.wake() : window.dodoHeroCore.sleep();
			});
		}, { threshold: 0.05 });
		ho.observe(hero);
	}

	/* --- Бутоните за изтегляне още нямат файл --- */
	document.querySelectorAll("[data-download]").forEach(function (btn) {
		btn.addEventListener("click", function (e) {
			if (btn.getAttribute("href") === "#") {
				e.preventDefault();
				alert("Връзката за изтегляне още не е сложена. Смени href=\"#\" на бутона с адреса на файла.");
			}
		});
	});

	var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	/* --- Живо демо: терминалът се изписва като на пишеща машина --- */
	var term = document.getElementById("termBody");
	if (term && !reduce) {
		var lines = Array.prototype.map.call(term.querySelectorAll(".line"), function (el) {
			return { cls: el.className, text: el.textContent };
		});
		var started = false;
		var startType = function () {
			if (started || !lines.length) return;
			started = true;
			term.innerHTML = "";
			var li = 0;
			function typeLine() {
				if (li >= lines.length) return;
				var data = lines[li];
				var el = document.createElement("div");
				el.className = data.cls;
				term.appendChild(el);
				var cursor = document.createElement("span");
				cursor.className = "term-cursor";
				var ci = 0, txt = data.text;
				(function typeChar() {
					el.textContent = txt.slice(0, ci);
					el.appendChild(cursor);
					if (ci < txt.length) { ci++; setTimeout(typeChar, 24 + Math.random() * 42); }
					else {
						if (cursor.parentNode) { cursor.parentNode.removeChild(cursor); }
						li++;
						setTimeout(typeLine, data.cls.indexOf("you") !== -1 ? 320 : 640);
					}
				})();
			}
			typeLine();
		};
		if ("IntersectionObserver" in window) {
			var to = new IntersectionObserver(function (es) {
				es.forEach(function (e) { if (e.isIntersecting) { startType(); to.disconnect(); } });
			}, { threshold: 0.3 });
			to.observe(term);
		} else { startType(); }
	}

	/* --- Броячите се навиват при показване --- */
	var counters = document.querySelectorAll("[data-count]");
	var spaced = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
	var runCount = function (el) {
		var target = parseInt(el.getAttribute("data-count"), 10) || 0;
		if (reduce) { el.textContent = spaced(target); return; }
		var dur = 1200, start = null;
		function step(now) {
			if (start === null) { start = now; }
			var p = Math.min(1, (now - start) / dur);
			var val = Math.floor(target * (1 - Math.pow(1 - p, 3)));
			el.textContent = spaced(val);
			if (p < 1) { requestAnimationFrame(step); } else { el.textContent = spaced(target); }
		}
		requestAnimationFrame(step);
	};
	if (counters.length) {
		if ("IntersectionObserver" in window) {
			var co = new IntersectionObserver(function (es) {
				es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
			}, { threshold: 0.6 });
			counters.forEach(function (el) { co.observe(el); });
		} else {
			counters.forEach(runCount);
		}
	}

	/* --- Лента за прогрес най-горе --- */
	var progress = document.getElementById("scrollProgress");
	if (progress) {
		var updateProgress = function () {
			var h = document.documentElement;
			var max = (h.scrollHeight - h.clientHeight) || 1;
			var p = (h.scrollTop || document.body.scrollTop || 0) / max;
			progress.style.width = (Math.min(1, Math.max(0, p)) * 100) + "%";
		};
		window.addEventListener("scroll", updateProgress, { passive: true });
		window.addEventListener("resize", updateProgress);
		updateProgress();
	}

	/* --- Лек 3D наклон на картите след мишката (само с истинска мишка) --- */
	var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	if (!reduce && finePointer) {
		document.querySelectorAll(".tilt").forEach(function (card) {
			var raf = null;
			card.addEventListener("pointermove", function (e) {
				var r = card.getBoundingClientRect();
				var px = (e.clientX - r.left) / r.width - 0.5;
				var py = (e.clientY - r.top) / r.height - 0.5;
				if (raf) { cancelAnimationFrame(raf); }
				raf = requestAnimationFrame(function () {
					card.style.transform = "perspective(760px) rotateX(" + (-py * 7).toFixed(2) + "deg) rotateY(" + (px * 9).toFixed(2) + "deg) translateY(-4px)";
				});
			});
			card.addEventListener("pointerleave", function () {
				if (raf) { cancelAnimationFrame(raf); }
				card.style.transform = "";
			});
		});
	}
})();
