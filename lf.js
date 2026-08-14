/* =============================================================================
   lf.js — rendering for /llama-factory. All facts come from lf-data.js.
   Same constraints as app.js: file:// safe, zero console errors, every mount
   guarded.
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
  function tag(conf) { return '<span class="tag t-' + esc(conf) + '">' + esc(conf) + "</span>"; }

  /* ------------------------------------------------------------- hero */
  function renderStrip() {
    var m = $("#lf-strip");
    if (!m) return;
    [
      ["Setup", LF.meta.setup, "venv + one pip install", "HARD"],
      ["Training", LF.meta.training, "depends on model + dataset", "HARD"],
      ["Worked example", LF.meta.exampleModel.replace("Qwen/", ""), "the playbook's default run", "HARD"],
      ["Example run", LF.meta.exampleRuntime, LF.meta.exampleEpochs + " epochs, final loss " + LF.meta.exampleLoss, "HARD"],
    ].forEach(function (r) {
      var d = el("div");
      d.innerHTML = "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + tag(r[3]) +
        '<span class="hw-note">' + esc(r[2]) + "</span></dd>";
      m.appendChild(d);
    });
  }

  /* -------------------------------------------------- methods mini-table */
  function renderMethods() {
    var m = $("#lf-methods");
    if (!m) return;
    var rows = LF.methods.map(function (x) {
      return "<tr><td><b>" + esc(x.name) + "</b><span class='mm-analogy'>" + esc(x.analogy) + "</span></td>" +
        "<td>" + esc(x.trains) + "</td><td>" + esc(x.artifact) + "</td></tr>";
    }).join("");
    m.innerHTML = '<table class="mmtable"><thead><tr><th>Method</th><th>What trains</th><th>What you get</th></tr></thead><tbody>' +
      rows + "</tbody></table>";
  }

  /* ------------------------------------------------------- memory chart */
  function renderMem() {
    var m = $("#memchart");
    if (!m) return;
    var cap = LF.memCapacity;
    var maxGB = 160; // chart scale; 70B full (1120 GB) is clamped with a marker
    var html = "";

    LF.memSizes.forEach(function (size, si) {
      html += '<div class="memgroup"><div class="memgroup-h">' + size + "B model</div>";
      LF.methods.forEach(function (meth) {
        var gb = size * meth.bytesPerParam;
        var over = gb > cap;
        var clamped = gb > maxGB;
        var pct = Math.min(100, (gb / maxGB) * 100);
        html +=
          '<div class="memrow">' +
            '<span class="memrow-n">' + esc(meth.name) + "</span>" +
            '<span class="memrow-track">' +
              '<i class="memrow-fill ' + (over ? "fill-over" : "fill-ok") + '" style="width:' + pct.toFixed(1) + '%"></i>' +
              '<i class="memrow-cap" style="left:' + ((cap / maxGB) * 100).toFixed(1) + '%"></i>' +
            "</span>" +
            '<span class="memrow-v ' + (over ? "over" : "ok") + '">' +
              (gb >= 100 ? Math.round(gb) : gb.toFixed(0)) + " GB" + (clamped ? " →" : "") +
            "</span>" +
          "</div>";
      });
      html += "</div>";
    });

    html += '<p class="calib">GB = parameters × bytes-per-parameter ' + tag("DERIVED") +
      " — full fine-tune ≈ 16 bytes/param (" + esc(LF.methods[0].formula) + "); LoRA ≈ 2.1 (" +
      esc(LF.methods[1].formula) + "); QLoRA ≈ 0.7 (" + esc(LF.methods[2].formula) +
      "). The green tick is the Spark's " + cap + " GB. Rules of thumb — activations and caches sit on top, so treat a bar near the line as over it.</p>";
    m.innerHTML = html;

    var notes = $("#memnotes");
    if (notes) {
      notes.innerHTML = '<ul class="memnotelist">' + LF.memNotes.map(function (n) {
        return "<li>" + esc(n) + "</li>";
      }).join("") + "</ul>";
    }
  }

  /* ------------------------------------------------------------- stack */
  function renderStack() {
    var m = $("#stacktower");
    if (!m) return;
    LF.stack.forEach(function (s, i) {
      var row = el("div", "stackrow" + (i === 0 ? " stackrow-you" : ""));
      row.innerHTML =
        '<div class="stackrow-l"><b>' + esc(s.layer) + "</b><span>" + esc(s.does) + "</span></div>" +
        '<div class="stackrow-r">' + esc(s.touch) + "</div>";
      m.appendChild(row);
    });
  }

  /* ------------------------------------------------------------ dataset */
  function renderData() {
    var p = $("#lf-data-point");
    if (p) p.innerHTML = esc(LF.dataset.point);
    var r = $("#lf-data-rule");
    if (r) r.innerHTML = "<b>How much data?</b> " + esc(LF.dataset.ruleOfThumb);
    var reg = $("#lf-data-reg");
    if (reg) reg.innerHTML = "To use your own file: drop it in <code>data/</code>, add an entry naming it in <code>" +
      esc(LF.dataset.registry) + "</code>, then reference that name in the config's <code>dataset:</code> line. " +
      'Full reference: <a href="' + esc(LF.meta.docsUrl) + '" target="_blank" rel="noopener noreferrer">the data-preparation docs</a>.';
    var f = $("#lf-data-file");
    if (f) f.textContent = LF.dataset.file + "  ·  “alpaca” format, quoted verbatim";
    var pre = $("#lf-data-sample");
    if (pre) pre.textContent = JSON.stringify(LF.dataset.sample, null, 2);
    var fl = $("#lf-data-fields");
    if (fl) {
      LF.dataset.fields.forEach(function (x) {
        fl.appendChild(el("li", null, "<code>" + esc(x.k) + "</code><span>" + esc(x.v) + "</span>"));
      });
    }
  }

  /* ------------------------------------------------------------- config */
  function renderConfig() {
    var h = $("#lf-config-path");
    if (h) h.textContent = LF.config.path + "  ·  quoted verbatim, annotations ours";
    var m = $("#lf-config");
    if (!m) return;
    LF.config.lines.forEach(function (l) {
      var row = el("div", "cfgrow");
      row.innerHTML = "<code>" + esc(l.code) + "</code><span>" + esc(l.why) + "</span>";
      m.appendChild(row);
    });
  }

  /* --------------------------------------------------------------- steps */
  function renderSteps() {
    var m = $("#lf-steps");
    if (!m) return;
    LF.steps.forEach(function (s) {
      var li = el("li");
      li.innerHTML =
        '<div class="runstep-t">' + esc(s.t) + "</div>" +
        "<pre><code>" + esc(s.cmd) + "</code></pre>" +
        '<p class="runstep-why">' + esc(s.why) + "</p>";
      m.appendChild(li);
    });
  }

  /* ---------------------------------------------------------------- loss */
  function renderLoss() {
    var w = $("#lf-loss-what");
    if (w) w.innerHTML = esc(LF.loss.what);
    var k = $("#lf-loss-key");
    if (k) {
      [["ok", "Healthy", LF.loss.healthy], ["bad", "Overfitting", LF.loss.overfit], ["dim", "Flat line", LF.loss.flat]]
        .forEach(function (r) {
          k.appendChild(el("li", "lk-" + r[0], "<b>" + esc(r[1]) + "</b> — " + esc(r[2])));
        });
    }
  }

  /* -------------------------------------------------------------- breaks */
  function renderBreaks() {
    var m = $("#lf-breaks");
    if (!m) return;
    LF.breaks.forEach(function (b) {
      var d = el("div", "breakrow");
      d.innerHTML = "<b>" + esc(b.s) + "</b><span>" + esc(b.m) + "</span>";
      m.appendChild(d);
    });
  }

  /* ------------------------------------------------------------ dissolve */
  function renderDissolve() {
    var m = $("#lf-dissolve");
    if (!m) return;
    LF.dissolve.forEach(function (d) {
      var row = el("div", "disrow");
      row.innerHTML =
        '<div class="disrow-was"><span>the list said</span>' + esc(d.was) + "</div>" +
        '<div class="disrow-arr" aria-hidden="true">→</div>' +
        '<div class="disrow-now">' + esc(d.now) + "</div>";
      m.appendChild(row);
    });
    var nx = $("#lf-next");
    if (nx) nx.innerHTML = "<b>Where this goes next:</b> the same YAML-and-dataset loop drives the rest of the fine-tuning track — " +
      'Unsloth for speed, raw PyTorch for the 70B QLoRA flagship, NeMo for multi-Spark. See <a href="index.html#experiments">the catalog</a>. ' +
      "And your finished adapter is servable today: merge it (step 9) and point Ollama or vLLM at the result.";
  }

  /* -------------------------------------------------------------- sources */
  function renderSources() {
    var m = $("#lf-sources");
    if (!m) return;
    LF.sources.forEach(function (s) {
      var li = el("li");
      li.innerHTML = '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.label) + "</a>" +
        '<span class="src-type st-' + esc(s.type) + '">' + esc(s.type.replace("-", " ")) + "</span><br>" + esc(s.note);
      m.appendChild(li);
    });
    var fs = $("#foot-snap");
    if (fs) fs.innerHTML = "Playbook last updated " + esc(LF.meta.lastUpdated) + " · re-read for this page " +
      esc(LF.meta.reread) + " · <a href=\"" + esc(LF.meta.playbookUrl) + "\" target=\"_blank\" rel=\"noopener noreferrer\">the playbook</a>";
  }

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

  function boot() {
    if (typeof LF === "undefined") return;
    renderStrip();
    renderMethods();
    renderMem();
    renderStack();
    renderData();
    renderConfig();
    renderSteps();
    renderLoss();
    renderBreaks();
    renderDissolve();
    renderSources();
    buildNav();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
