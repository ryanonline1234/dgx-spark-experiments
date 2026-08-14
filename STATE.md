# State

**Where we are (2026-08-13): SHIPPED.**

Live: https://dgxsparkexperiments.vercel.app
Repo: https://github.com/ryanonline1234/dgx-spark-experiments (public, `main`)
Vercel: project `dgxsparkexperiments` (prj_aDOFTirU1SASwJCGfu7I7CTIQVNN),
GitHub-connected — push to `main` auto-deploys.

Single-page field guide over the 46 NVIDIA DGX Spark playbooks, graded
NATIVE / FINE / SETUP with bandwidth-trap and multi-Spark flags. Ships a
memory-fit calculator, a dependency-aware path builder, a watchlist for the
withdrawn `vlm-finetuning` playbook, and scoped corrections to the circulating
CES 2026 claims. Data snapshot 2026-08-13.

**Verified:** 617 static assertions (`node verify.js`) + 57 headless DOM and
interaction assertions; console clean over `file://` and against production;
all 56 outbound URLs resolve; production render confirmed (36 catalog cards,
13 Spark-native, 9 annex, calculator at 70 GB / 3.9 tok/s).

**Next action:** none pending. Candidates if picked up again —
(a) refresh the snapshot when NVIDIA lands new playbooks (procedure in
README.md), (b) upgrade verdicts from DECENT to HARD by actually running
playbooks on a Spark and recording results, (c) a community/third-party
projects section, deliberately deferred from v1.
