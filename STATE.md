# State

**Where we are (2026-08-14): SHIPPED, two pages.**

Live: https://dgxsparkexperiments.vercel.app
Repo: https://github.com/ryanonline1234/dgx-spark-experiments (public, `main`)
Vercel: project `dgxsparkexperiments` (prj_aDOFTirU1SASwJCGfu7I7CTIQVNN),
GitHub-connected — push to `main` auto-deploys.

Field guide over the 46 NVIDIA DGX Spark playbooks, graded
NATIVE / FINE / SETUP with bandwidth-trap and multi-Spark flags. Ships a
memory-fit calculator, a dependency-aware path builder, a watchlist for the
withdrawn `vlm-finetuning` playbook, and scoped corrections to the circulating
CES 2026 claims. Data snapshot 2026-08-13.

**Page 2 (added 2026-08-14): /llama-factory** — beginner deep dive for Ryan's
chosen playbook, written for a vibe-coding audience: mental model over
prerequisites. Files: llama-factory.html + lf-data.js (single source) + lf.js;
styles appended to styles.css; index card links via data.js `deepDive`.
Playbook re-read 2026-08-14 (venv revision of 2026-02-18 — NOT the old Docker
flow); config + dataset quoted verbatim from upstream hiyouga/LLaMA-Factory.

**Verified:** 713 static assertions (`node verify.js`) + 85 headless DOM and
interaction assertions across both pages; console clean over `file://` and
against production for both routes; production render confirmed (index: 36
cards + deep-dive link; /llama-factory: 11 sections, 9-row memory chart,
12 annotated config rows, 9 steps, 3 diagrams).

**Next action:** none pending. Candidates if picked up again —
(a) refresh the snapshot when NVIDIA lands new playbooks (procedure in
README.md), (b) upgrade verdicts from DECENT to HARD by actually running
playbooks on a Spark and recording results, (c) a community/third-party
projects section, deliberately deferred from v1.
