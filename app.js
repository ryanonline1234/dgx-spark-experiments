/* =============================================================================
   app.js — all rendering. Nothing here invents a fact; everything comes from
   data.js. Must run from file:// with zero console errors, so every mount
   point is guarded before use.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function tag(conf) { return conf ? '<span class="tag t-' + esc(conf) + '">' + esc(conf) + "</span>" : ""; }

  function fmtMin(m) {
    if (!isFinite(m)) return "∞";
    m = Math.round(m);
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60), r = m % 60;
    return r ? h + " h " + r + " m" : h + " h";
  }
  function fmtRange(a, b) { return a === b ? fmtMin(a) : fmtMin(a) + "–" + fmtMin(b); }

  function srcById(id) {
    for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === id) return SOURCES[i];
    return null;
  }
  function srcLink(id) {
    var s = srcById(id);
    if (!s) return "";
    return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.label) + "</a>";
  }
  function pbById(id) {
    for (var i = 0; i < PLAYBOOKS.length; i++) if (PLAYBOOKS[i].id === id) return PLAYBOOKS[i];
    return null;
  }
  function pbUrl(p) {
    return SNAPSHOT.repoUrl + "/tree/main/nvidia/" + p.id;
  }

  var VERDICTS = {
    NATIVE: { label: "Spark-native", desc: "Needs the memory. A 24–32 GB consumer card either can’t do this at all, or only in a crippled form." },
    FINE:   { label: "Spark-fine",   desc: "Runs well and is worth doing — but a 5090 or a decent laptop would do it just as well. No memory moat." },
    SETUP:  { label: "Setup",        desc: "Plumbing, not an experiment. Listed because other playbooks depend on it." },
  };
  var CONFS = {
    HARD:    "Measured, or read verbatim from the primary source.",
    DECENT:  "Third-party field notes, or our own editorial call with a harder anchor beneath it.",
    SOFT:    "Self-reported, predicted, or resting on a single forum post.",
    VENDOR:  "A manufacturer claim. Best-case by construction — read the configuration, not the multiple.",
    DERIVED: "Arithmetic from harder inputs. The formula is shown so you can check it.",
  };

  /* ------------------------------------------------------------------ nav */
  function buildNav() {
    var nav = $("#topnav");
    if (!nav) return;
    $$("main .sec").forEach(function (s) {
      var h = $(".sec-h", s);
      if (!h || !s.id) return;
      var txt = h.textContent.replace(/^\s*\d+\s*/, "").replace(/#\s*$/, "").trim();
      var a = el("a", null, esc(txt));
      a.href = "#" + s.id;
      nav.appendChild(a);
    });

    var links = $$("a", nav), secs = $$("main .sec");
    var bar = $("#progress i");
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        if (bar) bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
        var active = -1;
        for (var i = 0; i < secs.length; i++) {
          if (secs[i].getBoundingClientRect().top <= 120) active = i;
        }
        links.forEach(function (l, i) { l.classList.toggle("on", i === active); });
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* -------------------------------------------------------------- hero/hw */
  function renderHero() {
    var d = $("#snap-date"); if (d) d.textContent = SNAPSHOT.date;
    var c = $("#hero-count");
    if (c) c.textContent = PLAYBOOKS.length + " ";
    var strip = $("#hwstrip");
    if (strip) {
      HW.forEach(function (h) {
        var box = el("div");
        box.innerHTML =
          "<dt>" + esc(h.k) + "</dt>" +
          "<dd>" + esc(h.v) + tag(h.conf) +
          '<span class="hw-note">' + esc(h.note) + "</span></dd>";
        strip.appendChild(box);
      });
    }
    var fs = $("#foot-snap");
    if (fs) {
      fs.innerHTML = "Snapshot " + esc(SNAPSHOT.date) + " · " +
        '<a href="' + esc(SNAPSHOT.repoUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(SNAPSHOT.repo) + "</a> · " +
        esc(SNAPSHOT.commitNote) + " · " + esc(SNAPSHOT.license) +
        " · repo last pushed " + esc(SNAPSHOT.lastPush);
    }
  }

  /* -------------------------------------------------------------- legends */
  function renderLegends() {
    var v = $("#legend-verdicts");
    if (v) {
      Object.keys(VERDICTS).forEach(function (k) {
        var li = el("li");
        li.innerHTML = '<span class="badge b-' + k + '">' + esc(VERDICTS[k].label) + "</span>" +
          "<span>" + esc(VERDICTS[k].desc) + "</span>";
        v.appendChild(li);
      });
      [
        ["b-two", "Multi-Spark", "Uses or requires more than one Spark. Any verdict can also carry this."],
        ["b-wall", "Bandwidth trap", "Runs, but the obvious way to use it runs into the 273 GB/s wall. The card names the mitigation."],
        ["b-hw", "Extra hardware", "Needs something beyond the Spark itself."],
      ].forEach(function (r) {
        var li = el("li");
        li.innerHTML = '<span class="badge ' + r[0] + '">' + esc(r[1]) + "</span><span>" + esc(r[2]) + "</span>";
        v.appendChild(li);
      });
    }
    var c = $("#legend-conf");
    if (c) {
      Object.keys(CONFS).forEach(function (k) {
        var li = el("li");
        li.innerHTML = '<span class="tag t-' + k + '" style="margin:0">' + k + "</span><span>" + esc(CONFS[k]) + "</span>";
        c.appendChild(li);
      });
    }
  }

  /* -------------------------------------------------------- perf anchors */
  function renderAnchors() {
    var m = $("#anchors");
    if (!m) return;
    PERF.forEach(function (p) {
      var card = el("div", "acard");
      card.innerHTML =
        '<div class="acard-top"><span class="acard-v">' + esc(p.value) + "</span>" +
        '<span class="acard-u">' + esc(p.unit) + "</span></div>" +
        '<div class="acard-l">' + esc(p.label) + tag(p.conf) + "</div>" +
        '<p class="acard-d">' + esc(p.detail) + "</p>" +
        '<p class="note acard-src">' + srcLink(p.src) + "</p>";
      m.appendChild(card);
    });
  }

  /* ----------------------------------------------------------- calculator */
  function renderCalc() {
    var root = $("#calc");
    if (!root) return;
    var elTotal = $("#calc-total"), elActive = $("#calc-active"),
        outTotal = $("#out-total"), outActive = $("#out-active"),
        elPreset = $("#calc-preset"), elPrec = $("#calc-prec"),
        oW = $("#calc-weights"), oC = $("#calc-ceiling"),
        oVT = $("#calc-verdict-t"), oVS = $("#calc-verdict-s"),
        bars = $("#fitbars"), calib = $("#calib");
    if (!elTotal || !elActive || !elPrec) return;

    var prec = "fp8";

    // precision radios
    CALC.precisions.forEach(function (p) {
      var lab = el("label", p.id === prec ? "on" : null, esc(p.label));
      var inp = el("input");
      inp.type = "radio"; inp.name = "prec"; inp.value = p.id;
      inp.checked = p.id === prec;
      lab.insertBefore(inp, lab.firstChild);
      inp.addEventListener("change", function () {
        prec = p.id;
        $$("label", elPrec).forEach(function (l) { l.classList.remove("on"); });
        lab.classList.add("on");
        if (elPreset) elPreset.value = "";
        update();
      });
      elPrec.appendChild(lab);
    });

    // presets
    if (elPreset) {
      elPreset.appendChild(new Option("— custom —", ""));
      CALC.presets.forEach(function (p, i) { elPreset.appendChild(new Option(p.name, String(i))); });
      elPreset.addEventListener("change", function () {
        var p = CALC.presets[parseInt(elPreset.value, 10)];
        if (!p) return;
        elTotal.value = p.total;
        elActive.value = p.active;
        prec = p.prec;
        $$("label", elPrec).forEach(function (l) {
          var inp = $("input", l);
          var on = inp && inp.value === prec;
          l.classList.toggle("on", !!on);
          if (inp) inp.checked = !!on;
        });
        update();
      });
    }

    function activePreset() {
      if (!elPreset || elPreset.value === "") return null;
      return CALC.presets[parseInt(elPreset.value, 10)] || null;
    }

    function update() {
      var total = parseFloat(elTotal.value);
      var active = Math.min(parseFloat(elActive.value), total);
      elActive.value = active;
      var bytes = 2;
      CALC.precisions.forEach(function (p) { if (p.id === prec) bytes = p.bytes; });

      var weights = total * bytes;
      var activeGB = active * bytes;
      var ceiling = activeGB > 0 ? CALC.bandwidth / activeGB : 0;
      var isMoE = active < total;

      if (outTotal) outTotal.textContent = total + " B";
      if (outActive) outActive.textContent = active + " B" + (isMoE ? " (MoE)" : "");
      if (oW) oW.textContent = weights >= 100 ? Math.round(weights) : weights.toFixed(1);
      if (oC) oC.textContent = ceiling >= 100 ? Math.round(ceiling) : ceiling.toFixed(1);

      // verdict
      var vt, vs, vc;
      if (weights > 256) { vt = "Too big even for two Sparks"; vs = "at this precision"; vc = "v-bad"; }
      else if (weights > 128) { vt = "Needs two linked Sparks"; vs = "over a single box"; vc = "v-warn"; }
      else if (weights > 115) { vt = "Fits, but barely"; vs = "KV cache will not fit alongside"; vc = "v-warn"; }
      else if (weights > 32) { vt = "This is why you own the box"; vs = "over any consumer card"; vc = "v-good"; }
      else { vt = "A consumer card does this too"; vs = "no memory moat here"; vc = ""; }
      if (oVT) { oVT.textContent = vt; oVT.className = "calc-verdict " + vc; }
      if (oVS) oVS.textContent = vs;

      // fit bars
      if (bars) {
        bars.innerHTML = "";
        CALC.capacities.forEach(function (c) {
          var pct = Math.min(100, (weights / c.gb) * 100);
          var over = weights > c.gb;
          var tight = !over && pct > 90;
          var row = el("div", "fitrow" + (c.hero ? " hero-row" : ""));
          row.innerHTML =
            '<span class="fr-n">' + esc(c.name) + "</span>" +
            '<span class="fr-track"><i class="fr-fill ' +
              (over ? "fill-over" : tight ? "fill-tight" : "fill-ok") +
              '" style="width:' + (over ? 100 : pct).toFixed(1) + '%"></i></span>' +
            '<span class="fr-v ' + (over ? "over" : "ok") + '">' +
              (over ? "over by " + Math.round(weights - c.gb) : Math.round(c.gb - weights) + " free") +
            " GB</span>";
          bars.appendChild(row);
        });
      }

      // calibration
      if (calib) {
        var cal = CALC.calibration[isMoE ? 1 : 0];
        var expected = ceiling * cal.ratio;
        var html = "Roofline says <b>" + (ceiling >= 100 ? Math.round(ceiling) : ceiling.toFixed(1)) +
          " tok/s</b>. Real " + esc(cal.kind.toLowerCase()) + " models land near <b>" +
          (expected >= 100 ? Math.round(expected) : expected.toFixed(1)) + " tok/s</b> — about " +
          Math.round(cal.ratio * 100) + "% of the ceiling. " + tag("DERIVED") +
          " Calibrated against: " + esc(cal.note) + " " + tag(cal.conf) + ".";
        var p = activePreset();
        if (p && p.check) {
          html += "<br>This preset has a published measurement: <b>" + p.check.measured +
            " tok/s</b> — " + srcLink(p.check.src) + " " + tag("HARD") + ".";
        }
        calib.innerHTML = html;
      }
    }

    elTotal.addEventListener("input", function () {
      if (parseFloat(elActive.value) > parseFloat(elTotal.value)) elActive.value = elTotal.value;
      if (elPreset) elPreset.value = "";
      update();
    });
    elActive.addEventListener("input", function () {
      if (elPreset) elPreset.value = "";
      update();
    });

    if (elPreset) { elPreset.value = "0"; elPreset.dispatchEvent(new Event("change")); }
    else update();
  }

  /* ---------------------------------------------------------------- cards */
  function cardHTML(p) {
    var badges = '<span class="badge b-' + p.verdict + '">' + esc(VERDICTS[p.verdict].label) + "</span>";
    if (p.twoSpark) badges += '<span class="badge b-two">Multi-Spark</span>';
    if (p.wall) badges += '<span class="badge b-wall">Bandwidth trap</span>';
    if (p.extraHw) badges += '<span class="badge b-hw">Needs ' + esc(p.extraHw) + "</span>";

    var meta = "<span><b>Time</b> " + esc(fmtRange(p.timeMin, p.timeMax)) + tag(p.conf) + "</span>";
    if (p.timeNote) meta += "<span>" + esc(p.timeNote) + "</span>";

    var models = "";
    if (p.models && p.models.length) {
      models = '<div class="card-models">' + p.models.map(function (m) {
        return '<span class="model">' + esc(m) + "</span>";
      }).join("") + "</div>";
    }

    var req = "";
    if (p.requires && p.requires.length) {
      req = '<span class="card-req">after ' + p.requires.map(function (r) {
        var d = pbById(r);
        return esc(d ? d.title : r);
      }).join(" + ") + "</span>";
    }

    return (
      '<div class="card-top">' + badges + "</div>" +
      "<h3><a href=\"" + esc(pbUrl(p)) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(p.title) + "</a></h3>" +
      '<div class="card-meta">' + meta + "</div>" +
      '<p class="card-blurb">' + esc(p.blurb) + "</p>" +
      '<p class="card-why">' + esc(p.why) + "</p>" +
      (p.wall && p.wallNote ? '<p class="card-wall">' + esc(p.wallNote) + "</p>" : "") +
      (p.correction ? '<p class="card-corr">' + esc(p.correction) + "</p>" : "") +
      (p.deepDive ? '<a class="card-dive" href="' + esc(p.deepDive.href) + '.html">' + esc(p.deepDive.label) + " →</a>" : "") +
      models +
      '<div class="card-foot">' + (req || "<span></span>") +
      '<a href="' + esc(pbUrl(p)) + '" target="_blank" rel="noopener noreferrer">playbook ↗</a></div>'
    );
  }

  var filterState = { verdict: null, track: null, setup: false, two: false, sort: "verdict" };

  function renderCards() {
    var mount = $("#cards");
    if (!mount) return;
    var order = { NATIVE: 0, FINE: 1, SETUP: 2 };
    var list = PLAYBOOKS.filter(function (p) {
      if (filterState.two) {
        // Asking for multi-Spark means the connection playbooks too — they are
        // the multi-Spark content, even though they're graded SETUP.
        if (!p.twoSpark) return false;
      } else {
        if (p.cat === "cluster") return false;                      // annex has its own section
        if (!filterState.setup && p.verdict === "SETUP") return false;
      }
      if (filterState.verdict && p.verdict !== filterState.verdict) return false;
      if (filterState.track && p.tracks.indexOf(filterState.track) < 0) return false;
      return true;
    });

    list.sort(function (a, b) {
      switch (filterState.sort) {
        case "time": return (a.timeMin - b.timeMin) || a.title.localeCompare(b.title);
        case "timeDesc": return (b.timeMax - a.timeMax) || a.title.localeCompare(b.title);
        case "name": return a.title.localeCompare(b.title);
        default:
          return (order[a.verdict] - order[b.verdict]) || (a.timeMin - b.timeMin) || a.title.localeCompare(b.title);
      }
    });

    mount.innerHTML = "";
    if (!list.length) {
      mount.appendChild(el("div", "empty", "Nothing matches that combination. <button class=\"btn btn-ghost\" data-reset>Reset filters</button>"));
    } else {
      list.forEach(function (p) {
        var c = el("div", "card" + (p.verdict === "NATIVE" ? " is-native" : p.verdict === "SETUP" ? " is-setup" : ""), cardHTML(p));
        c.id = "pb-" + p.id;
        mount.appendChild(c);
      });
    }
    var cnt = $("#f-count");
    if (cnt) {
      var n = { NATIVE: 0, FINE: 0, SETUP: 0 };
      list.forEach(function (p) { n[p.verdict]++; });
      cnt.textContent = "Showing " + list.length + " of " + PLAYBOOKS.length +
        "  ·  " + n.NATIVE + " Spark-native  ·  " + n.FINE + " Spark-fine" +
        (n.SETUP ? "  ·  " + n.SETUP + " setup" : "");
    }
  }

  function renderFilters() {
    var fv = $("#f-verdict"), ft = $("#f-track");
    if (fv) {
      [["NATIVE", "Spark-native"], ["FINE", "Spark-fine"]].forEach(function (v) {
        var b = el("button", "chip", esc(v[1]));
        b.type = "button";
        b.addEventListener("click", function () {
          filterState.verdict = filterState.verdict === v[0] ? null : v[0];
          syncChips(); renderCards();
        });
        b.setAttribute("data-v", v[0]);
        fv.appendChild(b);
      });
    }
    if (ft) {
      TRACKS.forEach(function (t) {
        if (t.id === "cluster") return;
        var b = el("button", "chip", esc(t.name));
        b.type = "button";
        b.setAttribute("data-t", t.id);
        b.addEventListener("click", function () {
          filterState.track = filterState.track === t.id ? null : t.id;
          syncChips(); renderCards();
        });
        ft.appendChild(b);
      });
    }
    function syncChips() {
      $$("#f-verdict .chip").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === filterState.verdict); });
      $$("#f-track .chip").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-t") === filterState.track); });
    }
    var fs = $("#f-setup"), f2 = $("#f-two"), so = $("#f-sort"), rs = $("#f-reset");
    if (fs) fs.addEventListener("change", function () { filterState.setup = fs.checked; renderCards(); });
    if (f2) f2.addEventListener("change", function () { filterState.two = f2.checked; renderCards(); });
    if (so) so.addEventListener("change", function () { filterState.sort = so.value; renderCards(); });

    function reset() {
      filterState = { verdict: null, track: null, setup: false, two: false, sort: "verdict" };
      if (fs) fs.checked = false;
      if (f2) f2.checked = false;
      if (so) so.value = "verdict";
      syncChips(); renderCards();
    }
    if (rs) rs.addEventListener("click", reset);
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.hasAttribute && t.hasAttribute("data-reset")) reset();
    });
    window.__resetFilters = reset;
  }

  /* ----------------------------------------------------------- annex list */
  function renderAnnex() {
    var mount = $("#annex-cards");
    if (!mount) return;
    var list = PLAYBOOKS.filter(function (p) { return p.twoSpark; }).sort(function (a, b) {
      return (a.cat === "cluster" ? 0 : 1) - (b.cat === "cluster" ? 0 : 1) || a.timeMin - b.timeMin;
    });
    list.forEach(function (p) {
      var c = el("div", "card" + (p.verdict === "NATIVE" ? " is-native" : p.verdict === "SETUP" ? " is-setup" : ""), cardHTML(p));
      mount.appendChild(c);
    });
  }

  /* ---------------------------------------------------------- path builder */
  var BUDGETS = [
    { id: "eve", label: "An evening", mins: 180 },
    { id: "wknd", label: "A weekend", mins: 960 },
    { id: "none", label: "No limit", mins: Infinity },
  ];
  var pathState = { tracks: {}, budget: "none", two: false };

  function renderPicker() {
    var tm = $("#picker-tracks"), bm = $("#picker-budget"), tw = $("#picker-two");
    if (tm) {
      TRACKS.forEach(function (t) {
        if (t.id === "cluster") return;
        var b = el("button", "tsel");
        b.type = "button";
        b.innerHTML = '<span class="tsel-n">TRACK ' + (t.n < 10 ? "0" + t.n : t.n) + "</span>" +
          '<span class="tsel-t">' + esc(t.name) + "</span>" +
          '<span class="tsel-b">' + esc(t.blurb) + "</span>";
        b.addEventListener("click", function () {
          pathState.tracks[t.id] = !pathState.tracks[t.id];
          b.classList.toggle("on", !!pathState.tracks[t.id]);
          renderPlan();
        });
        tm.appendChild(b);
      });
    }
    if (bm) {
      BUDGETS.forEach(function (bd) {
        var b = el("button", "chip" + (bd.id === pathState.budget ? " on" : ""), esc(bd.label));
        b.type = "button";
        b.addEventListener("click", function () {
          pathState.budget = bd.id;
          $$(".chip", bm).forEach(function (c) { c.classList.remove("on"); });
          b.classList.add("on");
          renderPlan();
        });
        bm.appendChild(b);
      });
    }
    if (tw) tw.addEventListener("change", function () { pathState.two = tw.checked; renderPlan(); });
    renderPlan();
  }

  function collectPath() {
    var picked = Object.keys(pathState.tracks).filter(function (k) { return pathState.tracks[k]; });
    if (!picked.length) return [];

    var chosen = {};
    function add(p) {
      if (!p || chosen[p.id]) return;
      if (p.twoSpark && !pathState.two) return;
      chosen[p.id] = p;
      (p.requires || []).forEach(function (r) { add(pbById(r)); });
    }
    PLAYBOOKS.forEach(function (p) {
      for (var i = 0; i < picked.length; i++) {
        if (p.tracks.indexOf(picked[i]) >= 0) { add(p); return; }
      }
    });

    var list = Object.keys(chosen).map(function (k) { return chosen[k]; });
    // shortest-first, setup ahead of experiments
    list.sort(function (a, b) {
      var sa = a.verdict === "SETUP" ? 0 : 1, sb = b.verdict === "SETUP" ? 0 : 1;
      return (sa - sb) || (a.timeMin - b.timeMin) || a.title.localeCompare(b.title);
    });
    // stable topological fix-up: pull dependencies ahead of dependents
    var out = [], seen = {};
    function emit(p, guard) {
      if (seen[p.id] || guard[p.id]) return;
      guard[p.id] = true;
      (p.requires || []).forEach(function (r) {
        if (chosen[r]) emit(chosen[r], guard);
      });
      if (!seen[p.id]) { seen[p.id] = true; out.push(p); }
    }
    list.forEach(function (p) { emit(p, {}); });
    return out;
  }

  function renderPlan() {
    var mount = $("#plan");
    if (!mount) return;
    var steps = collectPath();
    if (!steps.length) {
      mount.innerHTML = '<p class="plan-empty">Pick at least one track above.</p>';
      return;
    }
    var budget = Infinity;
    BUDGETS.forEach(function (b) { if (b.id === pathState.budget) budget = b.mins; });

    // Budget against the midpoint of each estimate, not the optimistic low —
    // otherwise "an evening" happily returns a plan whose upper bound is 11 hours.
    var lo = 0, hi = 0, spent = 0, kept = [], dropped = 0;
    steps.forEach(function (p) {
      var mid = (p.timeMin + p.timeMax) / 2;
      if (spent + mid <= budget) { spent += mid; lo += p.timeMin; hi += p.timeMax; kept.push(p); }
      else dropped++;
    });

    var rows = kept.map(function (p) {
      var badges = "";
      if (p.verdict === "NATIVE") badges += '<span class="badge b-NATIVE">Spark-native</span>';
      if (p.verdict === "SETUP") badges += '<span class="badge b-SETUP">Setup</span>';
      if (p.twoSpark) badges += '<span class="badge b-two">Multi-Spark</span>';
      return "<li>" +
        '<div class="step-main">' +
          '<div class="step-t"><a href="' + esc(pbUrl(p)) + '" target="_blank" rel="noopener noreferrer">' + esc(p.title) + "</a>" + badges + "</div>" +
          '<p class="step-d">' + esc(p.blurb) + "</p>" +
        "</div>" +
        '<span class="step-time">' + esc(fmtRange(p.timeMin, p.timeMax)) + "</span>" +
      "</li>";
    }).join("");

    mount.innerHTML =
      '<div class="plan-head">' +
        '<span class="plan-title">' + kept.length + " step" + (kept.length === 1 ? "" : "s") + ", in order</span>" +
        '<span class="plan-total">' + esc(fmtRange(lo, hi)) + "<span>hands-on, excl. downloads</span></span>" +
      "</div>" +
      '<ol class="steps">' + rows + "</ol>" +
      '<div class="plan-foot">' +
        (dropped
          ? '<span class="plan-cut">' + dropped + " further step" + (dropped === 1 ? "" : "s") +
            " didn’t fit the budget. Nothing is hidden — switch to “No limit” to see the full path.</span>"
          : "That’s the whole path for the tracks you picked.") +
        " Times are the playbooks’ own estimates and generally exclude model downloads, which on this machine are frequently the longest part." +
      "</div>";
  }

  /* -------------------------------------------------------------- watchlist */
  function renderWatch() {
    var mount = $("#watch");
    if (!mount) return;
    WATCHLIST.forEach(function (w) {
      var box = el("div", "watch");
      box.innerHTML =
        '<div class="watch-head"><h3>' + esc(w.title) + "</h3>" +
          '<span class="badge b-' + esc(w.status) + '">' + esc(w.status) + "</span></div>" +
        '<div class="watch-body">' +
          '<p class="watch-was"><b>What it covered:</b> ' + esc(w.was) + "</p>" +
          '<ul class="findings">' + w.findings.map(function (f) {
            return "<li><span><b>" + esc(f.t) + tag(f.conf) + "</b>" + esc(f.d) + "</span></li>";
          }).join("") + "</ul>" +
          '<p class="watch-fix"><b>What to do instead' + tag(w.workaroundConf) + ":</b> " + esc(w.workaround) + "</p>" +
        "</div>";
      mount.appendChild(box);
    });
  }

  /* ------------------------------------------------------------ corrections */
  function renderCorrections() {
    var mount = $("#corrections");
    if (!mount) return;
    var items = [
      ["“The Spark is 2.5× faster now.”",
       "One model, one configuration: Qwen-235B on TensorRT-LLM, FP8→NVFP4 plus EAGLE3. Elsewhere the same update delivered about 1.4×, and 35% on llama.cpp MoE models."],
      ["“Unsloth is 2.5× faster on the Spark.”",
       "The Unsloth playbook quotes up to 2× — and that is Unsloth’s own generic single-GPU marketing figure, not a Spark-specific benchmark. No Spark measurement is published in it."],
      ["“There’s a VLM fine-tuning playbook for video.”",
       "There was. It was removed from the repository in November 2025 and has not returned. NVIDIA’s page for it still answers HTTP 200, which is why the recommendation keeps circulating — see the watchlist above."],
      ["“40+ playbooks.”",
       "Accurate for the Spark specifically: " + PLAYBOOKS.length + " in this snapshot. Note that NVIDIA’s catalog also lists a further set for DGX Station, a different machine, which is easy to accidentally count."],
    ];
    items.forEach(function (it) {
      var li = el("li");
      li.innerHTML = "<b>" + esc(it[0]) + "</b>" + esc(it[1]);
      mount.appendChild(li);
    });
  }

  /* --------------------------------------------------------------- sources */
  function renderSources() {
    var mount = $("#sources-list");
    if (!mount) return;
    SOURCES.forEach(function (s) {
      var li = el("li");
      li.innerHTML = '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.label) + "</a>" +
        '<span class="src-type st-' + esc(s.type) + '">' + esc(s.type.replace("-", " ")) + "</span><br>" + esc(s.note);
      mount.appendChild(li);
    });
  }

  /* ------------------------------------------------------------ deep links */
  function wireGoto() {
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("[data-goto]") : null;
      if (!a) return;
      var id = a.getAttribute("data-goto");
      if (!pbById(id)) return;
      e.preventDefault();
      if (window.__resetFilters) window.__resetFilters();
      var node = document.getElementById("pb-" + id);
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        node.classList.remove("flash");
        void node.offsetWidth;
        node.classList.add("flash");
      }
    });
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    if (typeof PLAYBOOKS === "undefined") return;
    renderHero();
    renderLegends();
    renderAnchors();
    renderCalc();
    renderFilters();
    renderCards();
    renderAnnex();
    renderPicker();
    renderWatch();
    renderCorrections();
    renderSources();
    buildNav();
    wireGoto();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
