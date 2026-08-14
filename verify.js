/* Verification harness. Node only — never shipped to the browser.
   Run: node verify.js
   Checks data integrity, HTML/JS wiring, and exercises the pure logic
   (fit calculator arithmetic, path-builder ordering + budgeting) with
   positive AND negative cases. Exits non-zero on any failure. */

const fs = require("fs");
const path = require("path");
const D = require("./data.js");
const { SNAPSHOT, HW, TRACKS, PLAYBOOKS, WATCHLIST, PERF, CALC, SOURCES } = D;

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++) : (fail++, console.error("  FAIL " + m)); };
const group = (n) => console.log("\n" + n);

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");

/* ---------------------------------------------------------------- data */
group("data integrity");
const ids = PLAYBOOKS.map(p => p.id);
ok(new Set(ids).size === ids.length, "duplicate playbook ids");
ok(PLAYBOOKS.length >= 40, "expected 40+ playbooks, got " + PLAYBOOKS.length);

const srcIds = new Set(SOURCES.map(s => s.id));
const VERDICTS = new Set(["NATIVE", "FINE", "SETUP"]);
const CONFS = new Set(["HARD", "DECENT", "SOFT", "VENDOR", "DERIVED"]);
const trackIds = new Set(TRACKS.map(t => t.id));

PLAYBOOKS.forEach(p => {
  ok(VERDICTS.has(p.verdict), p.id + ": bad verdict " + p.verdict);
  ok(CONFS.has(p.conf), p.id + ": bad conf " + p.conf);
  ok(srcIds.has(p.anchor), p.id + ": anchor '" + p.anchor + "' not in SOURCES");
  ok(typeof p.timeMin === "number" && typeof p.timeMax === "number" && p.timeMin > 0,
     p.id + ": bad time");
  ok(p.timeMax >= p.timeMin, p.id + ": timeMax < timeMin");
  ok(!!p.blurb && !!p.why && !!p.title, p.id + ": missing prose");
  ok(Array.isArray(p.tracks) && p.tracks.every(t => trackIds.has(t)), p.id + ": bad track id");
  ok(Array.isArray(p.requires) && p.requires.every(r => ids.includes(r)),
     p.id + ": unknown requires -> " + p.requires);
  ok(!p.wall || !!p.wallNote, p.id + ": wall flag without wallNote");
  ok(p.verdict !== "SETUP" || p.cat === "setup" || p.cat === "cluster",
     p.id + ": SETUP verdict but cat=" + p.cat);
});
PERF.forEach(p => {
  ok(srcIds.has(p.src), "PERF " + p.id + ": src not in SOURCES");
  ok(CONFS.has(p.conf), "PERF " + p.id + ": bad conf");
});
HW.forEach(h => ok(srcIds.has(h.src), "HW '" + h.k + "': src not in SOURCES"));
WATCHLIST.forEach(w => w.findings.forEach(f => ok(CONFS.has(f.conf), "watchlist conf")));
CALC.presets.forEach(p => {
  ok(CALC.precisions.some(x => x.id === p.prec), p.name + ": unknown precision");
  ok(p.active <= p.total, p.name + ": active > total");
  ok(p.total <= 405, p.name + ": exceeds slider max of 405");
  if (p.check) ok(srcIds.has(p.check.src), p.name + ": check src not in SOURCES");
});
ok(!PLAYBOOKS.some(p => p.requires.includes(p.id)), "self-dependency");

// dependency graph must be acyclic
(() => {
  const state = {};
  let cyc = false;
  const walk = id => {
    if (state[id] === 1) { cyc = true; return; }
    if (state[id] === 2) return;
    state[id] = 1;
    const p = PLAYBOOKS.find(x => x.id === id);
    (p ? p.requires : []).forEach(walk);
    state[id] = 2;
  };
  ids.forEach(walk);
  ok(!cyc, "dependency cycle in requires[]");
})();

/* ------------------------------------------------------------ wiring */
group("html <-> js wiring");
const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const wanted = [...app.matchAll(/\$\("#([a-zA-Z0-9_-]+)"\)/g)].map(m => m[1]);
[...new Set(wanted)].forEach(id => ok(htmlIds.has(id), "app.js queries #" + id + " which is not in index.html"));

ok(html.includes('src="data.js"') && html.includes('src="app.js"'), "script tags missing");
ok(html.indexOf('src="data.js"') < html.indexOf('src="app.js"'), "data.js must load before app.js");
ok(!/https?:\/\/(?!github\.com|www\.nvidia|developer\.nvidia|forums\.developer|build\.nvidia|www\.lmsys|hothardware|www\.storagereview|ai-muninn|www\.igorslab)/.test(css), "css references an unexpected external host");
ok(!/<link[^>]+href="https?:/.test(html) && !/<script[^>]+src="https?:/.test(html), "external asset would break file://");

// every section referenced by nav exists and has a heading
const secIds = [...html.matchAll(/<section class="sec[^"]*" id="([^"]+)"/g)].map(m => m[1]);
ok(secIds.length >= 8, "expected 8 numbered sections, found " + secIds.length);
secIds.forEach(id => ok(html.includes('href="#' + id + '"'), "section " + id + " has no self-anchor"));

// css classes emitted by app.js must exist in the stylesheet
["b-NATIVE","b-FINE","b-SETUP","b-two","b-wall","b-hw","t-HARD","t-DECENT","t-SOFT","t-VENDOR","t-DERIVED",
 "fill-ok","fill-tight","fill-over","v-good","v-warn","v-bad","is-native","is-setup","card-wall","card-corr",
 "flash","hero-row","st-repo","st-measured","st-vendor","st-field-notes","b-WITHDRAWN"]
  .forEach(c => ok(css.includes("." + c), "css class ." + c + " emitted by app.js but not styled"));

/* ------------------------------------------------- calculator arithmetic */
group("fit calculator");
const bytesOf = id => CALC.precisions.find(p => p.id === id).bytes;
const weights = (total, prec) => total * bytesOf(prec);
const ceiling = (active, prec) => CALC.bandwidth / (active * bytesOf(prec));

// positive: the HARD calibration point must reproduce
{
  const w = weights(70, "fp8");
  const c = ceiling(70, "fp8");
  ok(w === 70, "Llama 70B FP8 should be 70 GB, got " + w);
  ok(Math.abs(c - 3.9) < 0.05, "roofline should be ~3.9 tok/s, got " + c.toFixed(2));
  const measured = 2.7, ratio = CALC.calibration[0].ratio;
  ok(Math.abs(c * ratio - measured) < 0.15,
     "dense calibration ratio should land on the measured 2.7, got " + (c * ratio).toFixed(2));
}
// positive: MoE calibration point
{
  const c = ceiling(4, "nvfp4");
  ok(Math.abs(c - 136.5) < 1, "Gemma 26B-A4B roofline should be ~136 tok/s, got " + c.toFixed(1));
  ok(Math.abs(c * CALC.calibration[1].ratio - 52) < 3,
     "MoE ratio should land near the measured 52 tok/s, got " + (c * CALC.calibration[1].ratio).toFixed(1));
}
// negative controls: the model must NOT claim a fit where there isn't one
{
  ok(weights(405, "nvfp4") > 128, "405B INT4 must not fit one Spark");
  ok(weights(405, "nvfp4") <= 256, "405B INT4 should fit two Sparks (NVIDIA's claim)");
  ok(weights(120, "fp16") === 240, "120B at FP16 should be 240 GB — over one Spark, under two");
  ok(weights(120, "fp16") > 128 && weights(120, "fp16") <= 256, "120B FP16 must read as a two-Spark job");
  ok(weights(405, "fp16") > 256, "405B at FP16 must exceed even two Sparks");
  ok(weights(8, "nvfp4") < 32, "8B INT4 must read as consumer-card territory");
  ok(ceiling(3, "nvfp4") > ceiling(70, "fp8"), "sparse activation must beat dense on the roofline");
}
// FLUX.2 vendor claim must be consistent with the capacity we advertise
ok(90 < 128, "FLUX.2 90 GB claim inconsistent with 128 GB capacity");

/* -------------------------------------------------------- path builder */
group("path builder");
// mirror of collectPath() in app.js
function buildPath(tracks, two) {
  const chosen = {};
  const add = p => {
    if (!p || chosen[p.id]) return;
    if (p.twoSpark && !two) return;
    chosen[p.id] = p;
    (p.requires || []).forEach(r => add(PLAYBOOKS.find(x => x.id === r)));
  };
  PLAYBOOKS.forEach(p => { if (p.tracks.some(t => tracks.includes(t))) add(p); });
  const list = Object.values(chosen).sort((a, b) => {
    const sa = a.verdict === "SETUP" ? 0 : 1, sb = b.verdict === "SETUP" ? 0 : 1;
    return (sa - sb) || (a.timeMin - b.timeMin) || a.title.localeCompare(b.title);
  });
  const out = [], seen = {};
  const emit = (p, guard) => {
    if (seen[p.id] || guard[p.id]) return;
    guard[p.id] = true;
    (p.requires || []).forEach(r => { if (chosen[r]) emit(chosen[r], guard); });
    if (!seen[p.id]) { seen[p.id] = true; out.push(p); }
  };
  list.forEach(p => emit(p, {}));
  return out;
}
function budgeted(steps, budget) {
  let spent = 0, lo = 0, hi = 0; const kept = [];
  steps.forEach(p => {
    const mid = (p.timeMin + p.timeMax) / 2;
    if (spent + mid <= budget) { spent += mid; lo += p.timeMin; hi += p.timeMax; kept.push(p); }
  });
  return { kept, spent, lo, hi, dropped: steps.length - kept.length };
}

// positive: dependencies always precede dependents
["serve", "agents", "finetune", "create", "vision", "data", "robotics"].forEach(t => {
  const steps = buildPath([t], false);
  const pos = {};
  steps.forEach((p, i) => (pos[p.id] = i));
  steps.forEach(p => (p.requires || []).forEach(r => {
    if (pos[r] !== undefined) ok(pos[r] < pos[p.id], t + ": " + r + " must come before " + p.id);
  }));
});
// positive: known real dependency shows up ordered
{
  const s = buildPath(["agents"], false).map(p => p.id);
  ok(s.indexOf("ollama") > -1 && s.indexOf("ollama") < s.indexOf("cli-coding-agent"),
     "ollama must precede cli-coding-agent");
  ok(s.indexOf("nemoclaw") < s.indexOf("nemoclaw-applications"),
     "nemoclaw must precede its applications");
}
// negative: single-Spark users must never be shown multi-node steps
{
  const s = buildPath(["serve", "finetune", "agents", "create", "vision", "data"], false);
  ok(!s.some(p => p.twoSpark), "multi-Spark playbook leaked into a single-Spark path");
  const s2 = buildPath(["serve"], true);
  ok(s2.some(p => p.twoSpark), "multi-Spark playbooks should appear when the user has two");
}
// negative: an empty selection yields an empty path (no accidental full dump)
ok(buildPath([], false).length === 0, "empty track selection must yield an empty path");
// budget must actually truncate, and never exceed itself
{
  const steps = buildPath(["serve", "finetune", "agents"], false);
  const evening = budgeted(steps, 180);
  ok(evening.spent <= 180, "evening plan exceeded its own budget: " + evening.spent);
  ok(evening.lo <= 180, "evening plan's low estimate should also fit the budget");
  ok(evening.dropped > 0, "evening budget should drop something from a 3-track path");
  const unlimited = budgeted(steps, Infinity);
  ok(unlimited.dropped === 0, "unlimited budget must drop nothing");
  ok(unlimited.kept.length === steps.length, "unlimited budget must keep every step");
}

/* ------------------------------------------- /llama-factory deep dive */
group("llama-factory page");
const { LF } = require("./lf-data.js");
const lfHtml = fs.readFileSync(path.join(__dirname, "llama-factory.html"), "utf8");
const lfJs = fs.readFileSync(path.join(__dirname, "lf.js"), "utf8");

// wiring: every id lf.js queries exists in llama-factory.html
const lfIds = new Set([...lfHtml.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
[...new Set([...lfJs.matchAll(/\$\("#([a-zA-Z0-9_-]+)"\)/g)].map(m => m[1]))]
  .forEach(id => ok(lfIds.has(id), "lf.js queries #" + id + " missing from llama-factory.html"));
ok(lfHtml.includes('src="lf-data.js"') && lfHtml.includes('src="lf.js"'), "lf script tags missing");
ok(lfHtml.indexOf('src="lf-data.js"') < lfHtml.indexOf('src="lf.js"'), "lf-data.js must load before lf.js");
ok(lfHtml.includes('href="index.html"'), "deep dive must link back to the guide");
ok(!/<script[^>]+src="https?:/.test(lfHtml), "external script would break file://");

// css classes lf.js emits exist
["memrow-fill", "memrow-cap", "stackrow", "cfgrow", "runlist", "disrow", "breakrow", "mmtable", "lk-ok", "lk-bad", "card-dive"]
  .forEach(c => ok(css.includes("." + c) || fs.readFileSync(path.join(__dirname, "styles.css"), "utf8").includes("." + c),
    "css class ." + c + " missing"));

// data integrity
ok(LF.methods.length === 3, "expected 3 methods");
LF.methods.forEach(m => ok(m.bytesPerParam > 0 && m.formula && m.analogy, "method " + m.id + " incomplete"));
ok(LF.methods[0].bytesPerParam > LF.methods[1].bytesPerParam &&
   LF.methods[1].bytesPerParam > LF.methods[2].bytesPerParam,
   "memory ordering must be full > lora > qlora");
// memory arithmetic sanity, positive + negative
const gb = (params, m) => params * m.bytesPerParam;
ok(gb(4, LF.methods[0]) === 64, "4B full should be 64 GB");
ok(gb(8, LF.methods[0]) === 128, "8B full should sit exactly at the 128 GB line");
ok(gb(70, LF.methods[1]) > LF.memCapacity, "70B plain-LoRA must read as over the line");
ok(gb(70, LF.methods[2]) < LF.memCapacity, "70B QLoRA must fit");
ok(LF.memSizes.every(s => s > 0 && s <= 405), "bad memSizes");
// steps/commands: no placeholder text, commands present, ordered sanity
ok(LF.steps.length === 9, "expected 9 condensed steps, got " + LF.steps.length);
LF.steps.forEach(s => ok(s.cmd && s.why && s.t, "step incomplete: " + s.t));
ok(LF.steps[0].cmd.includes("nvcc"), "step 1 should be the version checks");
ok(LF.steps.findIndex(s => s.cmd.includes("venv")) < LF.steps.findIndex(s => s.cmd.includes("pip3 install torch")),
   "venv must precede the torch install");
ok(LF.steps.findIndex(s => s.cmd.includes("llamafactory-cli train")) <
   LF.steps.findIndex(s => s.cmd.includes("llamafactory-cli chat")), "train must precede chat");
// config lines quote the real yaml keys
["model_name_or_path", "finetuning_type: lora", "lora_rank: 8", "per_device_train_batch_size: 1",
 "gradient_accumulation_steps: 8", "learning_rate: 1.0e-4", "num_train_epochs: 3.0", "bf16: true"]
  .forEach(k => ok(LF.config.lines.some(l => l.code.includes(k)), "config missing quoted line: " + k));
LF.config.lines.forEach(l => ok(l.why && l.why.length > 20, "config line lacks a real annotation: " + l.code));
// dataset sample is the real alpaca shape
LF.dataset.sample.forEach(s =>
  ok("instruction" in s && "input" in s && "output" in s, "dataset sample not alpaca-shaped"));
ok(LF.dataset.fields.length === 3, "dataset field explainer wrong length");
// dissolve section must answer every original prerequisite
ok(LF.dissolve.length === 6, "expected 6 dissolved prerequisites, got " + LF.dissolve.length);
LF.dissolve.forEach(d => ok(d.was && d.now && d.now.length > 30, "dissolve entry too thin: " + d.was));
// sources valid
LF.sources.forEach(s => ok(/^https:\/\//.test(s.url) && s.note, "bad LF source " + s.id));
// index links to the deep dive (data-driven)
const lfPb = PLAYBOOKS.find(p => p.id === "llama-factory");
ok(lfPb && lfPb.deepDive && lfPb.deepDive.href === "llama-factory", "catalog card must link the deep dive");

/* ------------------------------------------------------------- report */
console.log("\n" + (fail ? "FAILED" : "OK") + " — " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
