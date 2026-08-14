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
