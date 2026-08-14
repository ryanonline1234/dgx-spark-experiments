# DGX Spark Experiments

A field guide to what's actually worth running on an NVIDIA DGX Spark.

Live: https://dgxsparkexperiments.vercel.app

Every playbook NVIDIA publishes for the Spark, graded on one question: **does
this need 128 GB of coherent unified memory, or would a laptop and a consumer
GPU do it just as well?** Plus the honest version of the performance numbers,
a memory-fit calculator, and a path builder that turns a set of interests and
a time budget into an ordered run list.

Independent. Not affiliated with or endorsed by NVIDIA.

## Stack

Vanilla HTML/CSS/JS. No build step, no dependencies, no framework. Opens
correctly from `file://` with zero console errors — that is a hard constraint,
not a nicety, and `verify.js` enforces the parts of it that are checkable.

```
index.html     structure and mount points only — no facts live here
data.js        SINGLE SOURCE OF NUMBERS. Every fact on the site comes from here
app.js         all rendering, filtering, the calculator and the path builder
styles.css     the "spec plate" visual system
verify.js      Node harness — run before every deploy
```

## Editing

**Change a number by editing `data.js` and nothing else.** The house rule is
that no fact, duration, model name or link may appear in `index.html`. If you
find yourself typing a number into the HTML, the change belongs in `data.js`.

Every claim carries a confidence tag:

| Tag | Means |
|---|---|
| `HARD` | Measured, or read verbatim from the primary source |
| `DECENT` | Third-party field notes, or an editorial call with a harder anchor |
| `SOFT` | Self-reported, predicted, or resting on a single forum post |
| `VENDOR` | A manufacturer claim — best-case by construction |
| `DERIVED` | Arithmetic from harder inputs, with the formula shown |

Verdicts (`NATIVE` / `FINE` / `SETUP`) are editorial, so they are `DECENT` at
best, and `verify.js` requires each one to cite a `SOURCES` entry via `anchor`.

## Refreshing the catalog

NVIDIA adds playbooks often. To re-snapshot:

```bash
git clone --depth 1 https://github.com/NVIDIA/dgx-spark-playbooks /tmp/pb
```

Then, for each directory in `/tmp/pb/nvidia` that does **not** start with
`station-` (those are DGX Station, a different machine), read its `README.md`
for the title, the stated duration, the model list and the prerequisites, and
update the matching entry in `data.js`. Bump `SNAPSHOT.date`. Grade new
entries against the rubric in `docs/superpowers/specs/`.

## Verify before deploying

```bash
node verify.js
```

616 assertions covering data integrity, HTML↔JS wiring, CSS class coverage,
the calculator arithmetic (against published measurements, with negative
controls), and path-builder ordering and budgeting. Exits non-zero on failure.

To check that every playbook and source URL still resolves:

```bash
node -e 'const{PLAYBOOKS,SOURCES,SNAPSHOT}=require("./data.js");(async()=>{for(const[i,u]of[...PLAYBOOKS.map(p=>[p.id,SNAPSHOT.repoUrl+"/tree/main/nvidia/"+p.id]),...SOURCES.map(s=>[s.id,s.url])]){const r=await fetch(u).catch(e=>({ok:0,status:e.message}));if(!r.ok)console.log("BAD",r.status,i,u)}console.log("done")})()'
```

## Deploy

GitHub-connected Vercel project `dgxsparkexperiments`. Push to `main`
auto-deploys.
