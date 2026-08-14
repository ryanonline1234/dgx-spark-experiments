# DGX Spark Experiments — site design spec

Date: 2026-08-13
Status: awaiting Ryan's approval. Build and deploy do NOT start until approved.
Target: https://dgxsparkexperiments.vercel.app (new standalone project)

## 1. Purpose & thesis

A public field guide to what you can actually do with an NVIDIA DGX Spark,
built on the official [NVIDIA/dgx-spark-playbooks](https://github.com/NVIDIA/dgx-spark-playbooks)
catalog (46 Spark playbooks as of 2026-08-13; Apache-2.0, 1,259★, last push
2026-07-29).

Organizing thesis — the thing NVIDIA's own catalog doesn't tell you:

> **What's worth running *on this box* rather than on a laptop, a 5090, or
> rented cloud.** The Spark's moat is 128 GB of unified memory behind a
> 273 GB/s bandwidth wall. Experiments that need the memory are Spark-native;
> experiments that need bandwidth are better done elsewhere. The guide grades
> every playbook on that axis.

Not a link dump. NVIDIA already lists the playbooks; this site adds the verdict
layer, honest measured numbers, and customizable starting paths.

## 2. Audience & voice

Public field guide, neutral editorial voice (gpu-study register — "you", not
"I"; no persona). Reader = a Spark owner or prospective owner who wants a
broad map they can bend to their own interests. No assumed prior NVIDIA-stack
knowledge beyond "can use a terminal."

## 3. Scope

**In:**
- All current playbooks from `nvidia/` in the playbooks repo, excluding
  `station-*` (DGX Station is a different machine) and the duplicate
  `spark-reachy-photo-booth` alias → ~46 entries.
- Setup/plumbing playbooks (vscode, tailscale, connect-to-your-spark,
  dgx-dashboard, register-to-brev, ollama) included but categorized as
  **Setup**, not graded as experiments.
- A small **dual-Spark annex**: the ~9 multi-node playbooks, clearly flagged
  (reader default = one Spark; annex is for owners of two+).
- One **withdrawn watchlist** entry: `vlm-finetuning` (see §8.3).
- Editorial context: what the hardware rewards/punishes; CES 2026 software
  gains (vendor-tagged).

**Out:**
- Ryan-specific project mapping (public guide; no personal stack section).
- Community/third-party projects beyond the official repo (v2 candidate).
- Cross-links to dgxaiagent.vercel.app / gpu-study (standalone by request).
- Purchase advice / vs-Mac comparisons (dgx-ai-agent's territory).

## 4. Information architecture (single page, numbered sections)

1. **Hero** — thesis in two sentences; hardware reality strip (128 GB unified,
   273 GB/s, 1 PFLOP sparse FP4, 140 W GB10, $3,999–4,699 street).
2. **How to read this guide** — badge legend + provenance legend
   (HARD / DECENT / SOFT / VENDOR).
3. **What the box rewards and punishes** — short editorial section:
   MoE sparse activation rewarded, dense decode punished
   (HARD anchor: Llama 3.1 70B FP8 measured at 803 tok/s prefill vs
   2.7 tok/s decode, LMSYS); speculative decoding as the antidote
   (~2× measured, LMSYS); NVFP4 as the memory lever.
4. **The experiments** — the core sortable/filterable catalog (§5, §7).
5. **Pick your path** — interest-track chooser + time-budget path builder (§6).
6. **Dual-Spark annex** — the multi-node playbooks, one honest paragraph on
   what 200 GbE actually buys (up to ~405B FP4 across two units, vendor claim).
7. **Watchlist** — withdrawn `vlm-finetuning` entry with receipts (§8.3).
8. **The CES 2026 update, scoped honestly** — 2.5–2.6× is Qwen-235B
   FP8→NVFP4+Eagle3 specifically; ~1.4× Qwen3-30B / SD3.5-Large;
   llama.cpp MoE avg +35%. All VENDOR-tagged.
9. **Sources** — every citation used, linked.

Chrome: sticky section nav, scroll progress bar, copy-link headings —
gpu-study house pattern.

## 5. Grading rubric (the site's editorial spine)

Each non-Setup playbook gets exactly one verdict badge:

| Badge | Criterion (discriminating question) | Examples |
|---|---|---|
| **SPARK-NATIVE** | Does it *need* ≥32 GB of coherent GPU-addressable memory, or multiple resident models? A 24–32 GB consumer card can't do it at all, or only crippled. | 70B LoRA/QLoRA fine-tune, FLUX.1-dev Dreambooth training, gpt-oss-120B / Nemotron-3-Super-120B serving, multi-agent chatbot (LLMs+VLM resident), VSS agent, FLUX.2 full-precision (90 GB) |
| **SPARK-FINE** | Runs well and is worth doing, but a 5090 or decent laptop does it as well or better. No memory moat. | ComfyUI/SDXL, Open WebUI, LM Studio, 7–8B serving, Live VLM WebUI, CUDA-X data science, portfolio optimization, single-cell RNA, JAX |
| **KNOW-THE-WALL** | Technically runs, but the 273 GB/s bandwidth wall makes the obvious use miserable; do it only with the listed mitigation (MoE choice, spec-decode, batch) or do it elsewhere. | Dense-70B interactive chat; any latency-critical dense-decode workload |
| **SETUP** | Plumbing, not an experiment. Listed for the path builder's dependency graph. | vscode, tailscale, connect-to-your-spark, ollama, dgx-dashboard, register-to-brev |
| **2-SPARK** | Orthogonal flag (any badge can also carry it) for multi-node content. | connect-two/three-sparks, multi-sparks-through-switch, nccl, 2-node modes of vllm / trt-llm / speculative-decoding / pytorch-fine-tune / nemo |

Grading provenance: badge assignments are editorial (DECENT at best) but each
must cite at least one HARD or VENDOR anchor (a measured number or an explicit
capability statement in the playbook itself). No unanchored verdicts.

## 6. Tracks & path builder

**Tracks** (interest lenses; a playbook can appear in multiple):

1. *Serve LLMs locally* — ollama → open-webui/lm-studio → vllm →
   nvfp4-quantization → speculative-decoding → sglang / trt-llm → nim-llm
2. *Fine-tune models* — unsloth or llama-factory (first win) →
   pytorch-fine-tune (70B QLoRA, the flagship) → nemo-fine-tune
3. *Make images & video* — comfy-ui → multi-modal-inference →
   flux-finetuning (Dreambooth LoRA, 1–2 h)
4. *Run agents* — cli-coding-agent / vibe-coding → multi-agent-chatbot →
   hermes-agent / openclaw → openshell (sandboxing) → nemoclaw +
   nemoclaw-applications
5. *See & understand video* — live-vlm-webui → vss → txt2kg
6. *Data science & quant* — cuda-x-data-science → single-cell →
   portfolio-optimization → jax → cutile-kernels
7. *Robotics* — isaac (+ reachy-photo-booth as the fun demo)
8. *Cluster two Sparks* — the annex track (gated on owning 2+)

**Path builder** (vanilla JS, no backend): user picks 1–3 tracks + a time
budget (An evening ≈ 3 h / A weekend ≈ 16 h / No limit). Output: ordered run
list with per-step time (from the playbooks' own stated durations — HARD),
cumulative total, and dependency edges enforced (e.g. ollama before
cli-coding-agent; connect-two-sparks + nccl before any 2-SPARK step; comfy-ui
before flux-finetuning's ComfyUI test step). Dependencies live in data.js as
`requires: []`.

No time-budget default bias — "No limit" is the neutral default per Ryan.

## 7. Data model — `data.js` is the single source of numbers

House rule (gpu-study / dgx-ai-agent): no fact, number, or link may appear in
HTML that isn't rendered from `data.js` (editorial prose sections excepted,
but their numbers must cite SOURCES entries).

```js
// PLAYBOOKS: one entry per playbook
{
  id: "flux-finetuning",             // dir name in the NVIDIA repo
  title: "FLUX.1 Dreambooth LoRA Fine-tuning",
  url: "https://github.com/NVIDIA/dgx-spark-playbooks/tree/main/nvidia/flux-finetuning",
  category: "finetune",              // serve|finetune|create|agents|vision|data|robotics|setup|cluster
  verdict: "SPARK-NATIVE",           // SPARK-NATIVE|SPARK-FINE|KNOW-THE-WALL|SETUP
  twoSpark: false,                   // 2-SPARK flag (true also for 2-node-capable)
  timeMin: 60, timeMax: 120,         // minutes, from playbook's stated duration (HARD)
  models: ["FLUX.1-dev"],
  tracks: [3],
  requires: ["comfy-ui"],
  anchor: "s-flux",                  // SOURCES id backing the verdict
  conf: "HARD",                      // provenance of time/models fields
  blurb: "Train custom concepts into FLUX.1-dev 12B; drop the LoRA into ComfyUI."
}
// SOURCES: {id, label, url, type: "measured"|"vendor"|"field-notes"|"repo"}
// PERF_ANCHORS: the editorial numbers (LMSYS measurements, CES vendor claims)
//   each tagged HARD|DECENT|SOFT|VENDOR — rendered wherever cited.
// WATCHLIST: withdrawn entries (see §8.3)
```

Playbook facts (title, duration, models, 2-Spark capability) were extracted
from a clone of the repo on 2026-08-13 — HARD. Verdicts are editorial per §5.

## 8. Editorial content requirements

### 8.1 Numbers that must appear, with tags
- 803 tok/s prefill / 2.7 tok/s decode, Llama 3.1 70B FP8 — HARD (LMSYS measured)
- ~2× from EAGLE3 speculative decoding (SGLang, Llama 3.1 8B) — HARD (LMSYS)
- 2.5–2.6× Qwen-235B FP8→NVFP4+Eagle3; ~1.4× Qwen3-30B & SD3.5-Large;
  llama.cpp MoE avg +35% — VENDOR (NVIDIA CES 2026 blog); never generalized
  to "the Spark got 2.5× faster"
- FLUX.2 full precision = 90 GB, fits in 128 GB — VENDOR; flagged as the
  single most Spark-native capability in the catalog
- 2 Sparks ≈ up to 405B params FP4 — VENDOR
- Unsloth: "up to 2×" per its own playbook — VENDOR (generic Unsloth claim,
  not Spark-measured; the site explicitly corrects the circulating "2.5×")

### 8.2 "Rewards and punishes" section
GB10 rewards sparse activation (MoE, few active params) and punishes dense
decode — bandwidth wall at 273 GB/s. Field-notes anchor (ai-muninn, DECENT):
current daily-driver pick Gemma-4-26B-A4B NVFP4 on stock vLLM ≈ 52 tok/s;
MTP path measured 108 tok/s. Numbers tagged DECENT (third-party field notes,
not lab-controlled).

### 8.3 Watchlist entry — the withdrawn VLM fine-tuning playbook
Verified 2026-08-13:
- `nvidia/vlm-finetuning` existed in the playbooks repo (video VLM
  fine-tuning: InternVL3-8B dangerous-driving; image VLM: Qwen2.5-VL-7B
  wildfire GRPO per contemporaneous accounts); GitHub commit history for the
  path runs through 2025-11-20, when a "Regenerate all playbooks" commit
  removed it — HARD (API-verified).
- Still absent from `main` today; `build.nvidia.com/spark/vlm-finetuning`
  returns an HTTP-200 **soft 404** (identical 404 markers to a control
  nonsense URL) — HARD (probed).
- Workaround while withdrawn: Nemotron Nano VL + Megatron Bridge route —
  SOFT (forum recommendation).
Site presents this as "withdrawn — watch for return", with the receipts.
It also serves as the guide's credibility marker: we verify, including 404s
that lie with a 200.

## 9. Tech, repo, deploy

- Vanilla HTML/CSS/JS, no build step, works from `file://` with zero console
  errors (house constraint). Files: `index.html`, `styles.css`, `app.js`,
  `data.js`, `vercel.json` (cleanUrls), `README.md`, `DESIGN-NOTES.md`,
  `DECISIONS.md`, `STATE.md`.
- Single page v1. Sortable catalog table (sort: verdict, time, category;
  filter: track, badge, 2-Spark, setup-visible toggle).
- Visual identity: new skin, not a clone of gpu-study/dgx-ai-agent. Direction
  chosen at build time via defeating-ai-slop + frontend-design passes; spec
  pins only: dark-first, single accent (spark green family), data-dense
  field-guide register, system-ui/monospace type acceptable.
- Repo: `~/dgx-spark-experiments`, GitHub `ryanonline1234/dgx-spark-experiments`
  (**public** — public field guide, gpu-study precedent; flip to private if
  Ryan objects), branch `main`.
- Vercel: new project **`dgxsparkexperiments`** (name must match to claim
  dgxsparkexperiments.vercel.app), GitHub-connected, push-to-main auto-deploy.
  Standalone — no cross-links to Ryan's other sites.

## 10. Verification plan (before declaring done)

1. `node --check` on `app.js` / `data.js`.
2. Harness: cross-check every `getElementById` against HTML ids; load real
   `data.js` in Node and exercise render, sort/filter, and path-builder logic
   (dependency ordering, time summation) with positive and negative cases.
3. Local static serve + browser pass: zero console errors, all sections
   render, badges/legend consistent.
4. Data audit: every PLAYBOOKS entry's url resolves (HEAD 200 against
   github.com); every editorial number traces to a SOURCES entry.
5. Post-deploy: fetch production URL, confirm 200 + content.

## 11. Assumptions & open items

- **A1:** Public GitHub repo (see §9). Reversible.
- **A2:** Playbook count drifts (NVIDIA lands new ones frequently). Site
  footer states the snapshot date; `data.js` regeneration from a fresh clone
  is the documented update path in DESIGN-NOTES.md.
- **A3:** Price shown as a range ($3,999–4,699) since street price varies by
  config; tagged DECENT.
- **O1 (deferred, v2):** community projects section; per-playbook "we ran it"
  results if Ryan ever runs them on his Spark — that would upgrade verdicts
  from DECENT to HARD.
