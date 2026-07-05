/* ============================================================
   NET ZONE — Interactions & 3D Scroll Engine (vanilla JS)
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(pointer: coarse)").matches;

  /* ---------- sticky nav ---------- */
  var nav = document.querySelector(".nav");
  var progress = document.querySelector(".scroll-progress");
  function onScrollNav() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector(".burger");
  var links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  /* ---------- scroll-reveal (3D) ---------- */
  var fxEls = [].slice.call(document.querySelectorAll("[data-fx]"));
  // auto-stagger children of .fx-stagger
  [].slice.call(document.querySelectorAll(".fx-stagger")).forEach(function (parent) {
    var kids = [].slice.call(parent.children).filter(function (k) { return k.hasAttribute("data-fx"); });
    kids.forEach(function (k, i) { k.style.setProperty("--fx-delay", (i * 0.09).toFixed(2) + "s"); });
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    fxEls.forEach(function (el) { io.observe(el); });
  } else {
    fxEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- parallax depth layers ---------- */
  var depthEls = [].slice.call(document.querySelectorAll("[data-depth]"));
  if (depthEls.length && !reduceMotion) {
    var ticking = false;
    function parallax() {
      var vh = window.innerHeight;
      depthEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var mid = r.top + r.height / 2 - vh / 2;
        var d = parseFloat(el.getAttribute("data-depth")) || 0.2;
        el.style.transform = "translate3d(0," + (-mid * d * 0.18).toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
    }, { passive: true });
    parallax();
  }

  /* ---------- 3D tilt cards ---------- */
  if (!isTouch && !reduceMotion) {
    [].slice.call(document.querySelectorAll(".tilt")).forEach(function (card) {
      var raf = null;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform = "perspective(900px) rotateY(" + (x * 9).toFixed(2) + "deg) rotateX(" + (-y * 9).toFixed(2) + "deg) translateY(-4px)";
        });
      });
      card.addEventListener("pointerleave", function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      });
    });
  }

  /* ---------- hero slider ---------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var slides = [].slice.call(hero.querySelectorAll(".slide"));
    var dots = [].slice.call(hero.querySelectorAll(".hero-dots button"));
    var idx = 0, timer = null, DUR = 6500;

    function go(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("active", i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle("active", i === idx); });
      restart();
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (!reduceMotion) timer = setInterval(function () { go(idx + 1); }, DUR);
    }
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });
    var prev = hero.querySelector(".hero-arrows .prev");
    var next = hero.querySelector(".hero-arrows .next");
    if (prev) prev.addEventListener("click", function () { go(idx - 1); });
    if (next) next.addEventListener("click", function () { go(idx + 1); });

    // swipe
    var sx = null;
    hero.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 46) go(idx + (dx < 0 ? 1 : -1));
      sx = null;
    }, { passive: true });

    // pause when hidden
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (timer) clearInterval(timer); } else restart();
    });
    go(0);

    // gauge needle animation on the speed slide
    var needle = hero.querySelector(".needle");
    if (needle && !reduceMotion) {
      var swing = function () {
        needle.style.transform = "rotate(96deg)";
        setTimeout(function () { needle.style.transform = "rotate(78deg)"; }, 1800);
        setTimeout(function () { needle.style.transform = "rotate(102deg)"; }, 3400);
      };
      setTimeout(swing, 600);
      setInterval(swing, 6400);
    }
  }

  /* ---------- animated counters ---------- */
  var counters = [].slice.call(document.querySelectorAll("[data-count]"));
  if (counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        cio.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1600, t0 = null;
        function tick(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        if (reduceMotion) { el.textContent = target + suffix; }
        else requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- tabs ---------- */
  [].slice.call(document.querySelectorAll("[data-tabs]")).forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll(".tab"));
    var panes = [].slice.call(root.querySelectorAll(".tab-pane"));
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        panes.forEach(function (p) { p.classList.remove("active"); });
        tab.classList.add("active");
        if (panes[i]) {
          panes[i].classList.add("active");
          // retrigger stagger animation
          [].slice.call(panes[i].querySelectorAll("[data-fx]")).forEach(function (el) {
            el.classList.remove("in");
            void el.offsetWidth;
            el.classList.add("in");
          });
        }
      });
    });
  });

  /* ---------- coverage checker ---------- */
  var chkBtn = document.getElementById("nz-check-btn");
  if (chkBtn) {
    var chkInput = document.getElementById("nz-area-input");
    var chkOut = document.getElementById("nz-check-result");
    // covered now (english + bangla spellings)
    var covered = [
      "hasara", "হাসাড়া", "hashara",
      "sreenagar", "srinagar", "শ্রীনগর", "sreenagar sadar", "sreenagar bazar",
      "munshiganj", "মুন্সিগঞ্জ", "মুন্সীগঞ্জ"
    ];
    // expansion zone (nearby unions of Sreenagar Upazila)
    var expanding = [
      "kolapara", "কোলাপাড়া", "baraikhali", "বাড়ৈখালী", "bhaggyakul", "ভাগ্যকুল",
      "rarikhal", "রাঢ়িখাল", "sholaghar", "ষোলঘর", "atpara", "আটপাড়া",
      "kukutia", "কুকুটিয়া", "tantar", "তন্তর", "patabhog", "পাটাভোগ", "birtara", "বীরতারা"
    ];
    function normalize(s) { return s.trim().toLowerCase(); }
    function match(list, q) {
      return list.some(function (a) { return q.indexOf(a) !== -1 || a.indexOf(q) !== -1; });
    }
    function checkCoverage() {
      var q = normalize(chkInput.value);
      chkOut.className = "chk-result";
      if (!q) {
        chkOut.classList.add("warn");
        chkOut.textContent = "অনুগ্রহ করে আপনার এলাকার নাম লিখুন।";
        return;
      }
      if (match(covered, q)) {
        var NZP = (window.NZ && window.NZ.generalPhone) || "+8801797570256";
        var NZPD = (window.NZ && window.NZ.generalPhoneDisplay) || "+880 1797-570256";
        chkOut.classList.add("ok");
        chkOut.innerHTML = "🎉 সুখবর! আপনার এলাকায় নেট জোন সার্ভিস চালু আছে। ফ্রি ইনস্টলেশনের জন্য এখনই কল করুন: <a href='tel:" + NZP + "' style='color:#fff;text-decoration:underline'>" + NZPD + "</a>";
      } else if (match(expanding, q)) {
        chkOut.classList.add("maybe");
        chkOut.textContent = "আপনার এলাকায় নেটওয়ার্ক সম্প্রসারণের কাজ চলছে! সঠিক সময় জানতে আমাদের সাথে যোগাযোগ করুন — খুব শীঘ্রই আসছি।";
      } else {
        chkOut.classList.add("maybe");
        chkOut.textContent = "এই এলাকা এখনো আমাদের তালিকায় নেই — তবে আমরা দ্রুত সম্প্রসারণ করছি। আপনার ঠিকানা/ল্যান্ডমার্কসহ আমাদের কল করুন, আমরা সরাসরি জানিয়ে দেব।";
      }
    }
    chkBtn.addEventListener("click", checkCoverage);
    chkInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); checkCoverage(); } });
  }

  /* ---------- copy to clipboard (bKash number) ---------- */
  [].slice.call(document.querySelectorAll("[data-copy]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var txt = btn.getAttribute("data-copy");
      function done() {
        var old = btn.textContent;
        btn.textContent = "✓ কপি হয়েছে";
        setTimeout(function () { btn.textContent = old; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = txt; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  });

  /* ---------- single-open accordions ---------- */
  [].slice.call(document.querySelectorAll(".acc")).forEach(function (acc) {
    var items = [].slice.call(acc.querySelectorAll("details"));
    items.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });

  /* ---------- contact form (static preview fallback) ---------- */
  var staticForm = document.getElementById("nz-contact-form");
  if (staticForm && staticForm.hasAttribute("data-static")) {
    staticForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(staticForm);
      if (f.get("website")) return; // honeypot
      var body = "নাম: " + f.get("name") + "\nফোন: " + f.get("phone") +
        "\nইমেইল: " + (f.get("email") || "-") + "\nবিষয়: " + (f.get("subject") || "-") +
        "\n\n" + f.get("message");
      window.location.href = "mailto:Iftakhyrul@bdnetzone.com?subject=" +
        encodeURIComponent("ওয়েবসাইট থেকে বার্তা — " + f.get("name")) +
        "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- current year ---------- */
  [].slice.call(document.querySelectorAll("[data-year]")).forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
