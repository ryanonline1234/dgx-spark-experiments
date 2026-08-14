# Decisions (append-only)

## D1 — 2026-08-13 — Verdict-graded field guide, not a link catalog
Site's value layer is grading every official playbook on "does it need this
box?" (SPARK-NATIVE / SPARK-FINE / KNOW-THE-WALL / SETUP, + 2-SPARK flag).
NVIDIA already hosts the raw catalog; duplicating it adds nothing.

## D2 — 2026-08-13 — Public field guide, neutral voice, standalone
Ryan: broad-direction guide anyone can customize; no personal-stack section;
no cross-links to dgxaiagent/gpu-study. One-Spark reader default, dual-Spark
annex kept because "a few double spark experiments would be nice."

## D3 — 2026-08-13 — vlm-finetuning ships as a Watchlist entry, not a playbook
Verified: path existed in NVIDIA/dgx-spark-playbooks until 2025-11-20 removal
commit; build.nvidia.com page is an HTTP-200 soft 404 (matches control URL)
as of 2026-08-13. Two prior agents disagreed; both partly right — it existed,
it is currently withdrawn. Nemotron Nano VL + Megatron Bridge is the
circulating workaround (SOFT).

## D4 — 2026-08-13 — Vendor numbers stay scoped
CES "2.5×" renders only as: Qwen-235B, FP8→NVFP4 + Eagle3, TRT-LLM (~1.4×
elsewhere, llama.cpp MoE +35%). Unsloth renders as "up to 2×" (its own
generic claim), explicitly correcting the circulating 2.5×. All VENDOR-tagged.

## D5 — 2026-08-13 — House tech pattern, new skin
Vanilla static, data.js single source of numbers, HARD/DECENT/SOFT/VENDOR
tags, file:// + zero-console-errors constraint (gpu-study lineage). Visual
identity chosen fresh at build time. New public repo dgx-spark-experiments;
GitHub-connected Vercel project `dgxsparkexperiments`.

## D6 — 2026-08-13 — "Bandwidth trap" is a flag, not a verdict
Spec §5 proposed a 4-way verdict including KNOW-THE-WALL. Implemented as an
orthogonal `wall` flag instead, because the bandwidth wall is a property of the
*workload you choose*, not of the playbook: vLLM/SGLang/TRT-LLM are genuinely
Spark-native for capacity AND carry a decode trap. Verdict axis is now a clean
3-way (NATIVE / FINE / SETUP); `wall` + `wallNote` name the trap and its
mitigation on the card.

## D7 — 2026-08-13 — No invented prerequisites
Spec §6 assumed flux-finetuning depends on comfy-ui. Checked the README: its
only prerequisites are "device set up" and "no other GPU processes". Dependency
dropped. `requires[]` now encodes only prerequisites stated verbatim in a
playbook: ollama → {cli-coding-agent, open-webui, vibe-coding},
nemoclaw → nemoclaw-applications, connect-two-sparks → nccl.

## D8 — 2026-08-13 — Path builder budgets on the midpoint
Budgeting on `timeMin` let "An evening" return a plan whose upper bound was
11 h 35 m. Now accumulates (timeMin+timeMax)/2 while still displaying the full
range. "An evening" now yields ~2 h 25 m–3 h 35 m.

## D9 — 2026-08-13 — "Multi-Spark only" overrides the setup filter
The connection playbooks are graded SETUP, so the setup filter was hiding the
very content a multi-Spark user asked for. Filter precedence inverted: when
Multi-Spark is on, everything with `twoSpark` shows regardless of verdict.
Caught by the DOM harness, not by reading the code.

## D10 — 2026-08-13 — Signature widget is a fit calculator, not per-playbook memory bars
Per-playbook memory footprints would have been invented numbers. Instead the
page ships one calculator doing transparent arithmetic (params × bytes; bandwidth
÷ bytes-per-token) and shows how far real measurements fall below the roofline —
~69% for dense (Llama 70B FP8: 3.9 ceiling, 2.7 measured), ~38% for MoE
(Gemma 26B-A4B: 136 ceiling, 52 measured). Both calibration points are cited.

## D11 — 2026-08-14 — /llama-factory deep dive: mental model over prerequisites
Ryan picked LLaMA Factory as his playbook; second page added for a vibe-coding
audience. Design bet (his framing): the reader has AI for the mechanical parts,
so the page optimizes for being able to EXPLAIN the run, not perform it — every
prerequisite from NVIDIA's list is dissolved into its 90-second version (§10)
instead of assumed. Structure: idea → LoRA picture → memory chart → stack →
dataset → annotated real config → 9 condensed steps → loss curves → failure
modes → dissolve. Facts quoted from the playbook README (re-read 2026-08-14;
now venv-based, updated 2026-02-18 — NOT Docker) and the upstream
qwen3_lora_sft.yaml + identity.json, fetched verbatim. New files: lf-data.js
(single source), lf.js, llama-factory.html; styles appended. Memory chart uses
DERIVED bytes/param rules (16 / 2.1 / 0.7) with formulas shown; verify.js
asserts the arithmetic including 70B-LoRA-over / 70B-QLoRA-fits. Card on index
links via data.js `deepDive` field (.html href so file:// keeps working;
Vercel cleanUrls redirects).
