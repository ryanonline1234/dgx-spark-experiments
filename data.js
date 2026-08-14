/* =============================================================================
   data.js — SINGLE SOURCE OF NUMBERS for dgxsparkexperiments.vercel.app

   House rule: no fact, number, model name, duration or link may appear in
   index.html. Everything renders from here.

   Playbook facts (title, duration, models, multi-node capability) were
   extracted from a shallow clone of NVIDIA/dgx-spark-playbooks taken on
   2026-08-13 and read directly from each playbook's README.md — tagged HARD.
   Verdicts are editorial judgement — tagged DECENT — and every one cites a
   HARD or VENDOR anchor.

   Confidence tags used across the site:
     HARD    measured, or read verbatim from primary source
     DECENT  third-party field notes, or our own editorial call w/ an anchor
     SOFT    self-reported, predicted, or single-forum-post
     VENDOR  manufacturer claim, best-case by construction
     DERIVED arithmetic from HARD inputs (shown with its formula)
   ========================================================================== */

const SNAPSHOT = {
  date: "2026-08-13",
  repo: "NVIDIA/dgx-spark-playbooks",
  repoUrl: "https://github.com/NVIDIA/dgx-spark-playbooks",
  commitNote: "46 Spark playbooks; DGX Station playbooks excluded",
  stars: 1259,
  lastPush: "2026-07-29",
  license: "Apache-2.0",
};

/* --------------------------------------------------------------- hardware */
const HW = [
  { k: "Unified memory", v: "128 GB", note: "LPDDR5X, coherent CPU+GPU", conf: "HARD", src: "s-nvspec" },
  { k: "Memory bandwidth", v: "273 GB/s", note: "the wall everything else bends around", conf: "HARD", src: "s-lmsys" },
  { k: "AI performance", v: "1 PFLOP", note: "sparse FP4, theoretical", conf: "VENDOR", src: "s-nvspec" },
  { k: "CPU", v: "20-core Arm", note: "10× Cortex-X925 + 10× Cortex-A725", conf: "HARD", src: "s-nvspec" },
  { k: "Node link", v: "200 Gb/s", note: "2× QSFP, ConnectX-7", conf: "HARD", src: "s-nvspec" },
  { k: "GB10 TDP", v: "140 W", note: "240 W PSU, over USB-C", conf: "HARD", src: "s-nvspec" },
  { k: "Footprint", v: "1.2 kg", note: "150 × 150 × 50.5 mm — it fits beside a monitor", conf: "HARD", src: "s-nvspec" },
  { k: "Street price", v: "$3,999–4,699", note: "varies by config and reseller", conf: "DECENT", src: "s-hothardware" },
];

/* ----------------------------------------------------------------- tracks */
const TRACKS = [
  { id: "serve",    n: 1, name: "Serve LLMs locally",   blurb: "Stand up an OpenAI-compatible endpoint on your own box, then make it fast." },
  { id: "finetune", n: 2, name: "Fine-tune models",     blurb: "The clearest thing the 128 GB buys you. Start small, end at a 70B QLoRA." },
  { id: "create",   n: 3, name: "Make images & video",  blurb: "Diffusion at sizes a consumer card can't hold, plus training your own concepts in." },
  { id: "agents",   n: 4, name: "Run agents",           blurb: "Long-running, sandboxed, local-first agents — the workload NVIDIA now markets the box for." },
  { id: "vision",   n: 5, name: "See & understand video", blurb: "Webcam and video in, structured meaning out." },
  { id: "data",     n: 6, name: "Data science & quant", blurb: "GPU-accelerated pandas/sklearn, portfolio optimization, genomics, custom kernels." },
  { id: "robotics", n: 7, name: "Robotics",             blurb: "Simulation and RL. Bring patience and, for one of them, an actual robot." },
  { id: "cluster",  n: 8, name: "Cluster two Sparks",   blurb: "The annex. Skip unless you own more than one." },
];

/* -------------------------------------------------------------- playbooks */
/* verdict: NATIVE | FINE | SETUP
   flags:   twoSpark (needs/uses >1 Spark), wall (bandwidth trap — read note),
            extraHw (needs hardware beyond the Spark)                        */
const PLAYBOOKS = [
  {
    id: "cli-coding-agent", title: "CLI Coding Agent", cat: "agents", tracks: ["agents"],
    verdict: "FINE", timeMin: 15, timeMax: 25, conf: "HARD",
    models: ["Qwen3.6"], requires: ["ollama"],
    blurb: "Point Claude Code, OpenCode or Codex CLI at a model running on your own Spark via Ollama's built-in launcher.",
    why: "A 35B-A3B model at NVFP4 is roughly 18 GB of weights — it fits a 32 GB consumer card too. What the Spark adds is running it all day at 140 W without touching your workstation.",
    anchor: "s-repo",
  },
  {
    id: "comfy-ui", title: "ComfyUI", cat: "create", tracks: ["create"],
    verdict: "FINE", timeMin: 30, timeMax: 45, conf: "HARD",
    models: ["SDXL", "FLUX"], requires: [],
    blurb: "Node-graph image generation and editing in the browser, running on the Spark's GPU.",
    why: "SDXL-class diffusion is compute-bound, not memory-bound. A 5090 will simply be faster. Worth setting up as the front-end you'll reuse for the FLUX work.",
    anchor: "s-repo",
  },
  {
    id: "connect-three-sparks", title: "Connect Three Sparks (ring)", cat: "cluster", tracks: ["cluster"],
    verdict: "SETUP", timeMin: 60, timeMax: 60, conf: "HARD", twoSpark: true,
    models: [], requires: [],
    blurb: "Wire three Sparks into a ring topology over 200 GbE QSFP and set up SSH trust between them.",
    why: "Plumbing for distributed work. Nothing runs faster because you did this — it's the prerequisite for everything in the annex.",
    anchor: "s-repo",
  },
  {
    id: "connect-to-your-spark", title: "Set Up Local Network Access", cat: "setup", tracks: [],
    verdict: "SETUP", timeMin: 5, timeMax: 10, conf: "HARD",
    models: [], requires: [],
    blurb: "Reach the Spark headlessly over your network instead of plugging in a monitor.",
    why: "Do this first. Every other playbook assumes you can get a shell.",
    anchor: "s-repo",
  },
  {
    id: "connect-two-sparks", title: "Connect Two Sparks", cat: "cluster", tracks: ["cluster"],
    verdict: "SETUP", timeMin: 60, timeMax: 60, conf: "HARD", twoSpark: true,
    models: [], requires: [],
    blurb: "Direct-attach two Sparks over 200 GbE QSFP, configure the interfaces and SSH keys, validate the link.",
    why: "The gateway to the annex. NVIDIA claims two linked units can hold models up to 405B parameters at FP4.",
    anchor: "s-lmsys",
  },
  {
    id: "cuda-x-data-science", title: "CUDA-X Data Science", cat: "data", tracks: ["data"],
    verdict: "FINE", timeMin: 20, timeMax: 30, conf: "HARD",
    models: [], requires: [],
    blurb: "RAPIDS, renamed — GPU-accelerate pandas and scikit-learn with zero code changes.",
    why: "Genuinely useful and the zero-code-change claim mostly holds. It is not Spark-specific: any modern NVIDIA GPU does this, and a 5090 does it faster.",
    anchor: "s-repo",
  },
  {
    id: "cutile-kernels", title: "cuTile Kernels", cat: "data", tracks: ["data"],
    verdict: "FINE", timeMin: 30, timeMax: 45, conf: "HARD",
    models: ["DeepSeek-V2-Lite", "Qwen2-7B"], requires: [],
    blurb: "Write GPU kernels in a Python tile DSL that compiles to Tile IR — no hand-written CUDA — and benchmark them with TileGym.",
    why: "The most educational thing in the catalog if you want to understand why the box behaves as it does. Nothing here needs 128 GB.",
    anchor: "s-repo",
  },
  {
    id: "dgx-dashboard", title: "DGX Dashboard", cat: "setup", tracks: [],
    verdict: "SETUP", timeMin: 15, timeMax: 30, conf: "HARD",
    models: ["SDXL"], requires: [],
    blurb: "Local web app for system updates, resource monitoring and a bundled JupyterLab.",
    why: "You will want the memory graph open the first time you try to load something that doesn't fit.",
    anchor: "s-repo",
  },
  {
    id: "flux-finetuning", title: "FLUX.1 Dreambooth LoRA Fine-tuning", cat: "create", tracks: ["create", "finetune"],
    verdict: "NATIVE", timeMin: 60, timeMax: 120, conf: "HARD",
    models: ["FLUX.1-dev"], requires: [],
    blurb: "Train custom multi-concept Dreambooth LoRAs into the 12B FLUX.1-dev image model; usable results after about 90 minutes of training.",
    why: "Training a 12B diffusion transformer is where 24–32 GB cards start needing aggressive offload and quantization tricks. Here it just runs. Best first fine-tune in the catalog: short, visual, and the output is a file you can immediately use.",
    anchor: "s-repo",
  },
  {
    id: "hermes-agent", title: "Hermes Agent", cat: "agents", tracks: ["agents"],
    verdict: "FINE", timeMin: 30, timeMax: 30, conf: "HARD",
    models: ["Qwen3.6-35B-A3B-NVFP4"], requires: [],
    blurb: "Nous Research's self-improving terminal agent — writes its own skills, persists memory, reachable from Telegram/Discord/Slack via a gateway.",
    why: "Runs on ~18 GB of weights. The Spark's contribution is uptime and privacy, not capacity.",
    anchor: "s-repo",
  },
  {
    id: "isaac", title: "Isaac Sim & Isaac Lab", cat: "robotics", tracks: ["robotics"],
    verdict: "FINE", timeMin: 30, timeMax: 30, conf: "HARD",
    models: [], requires: [],
    blurb: "Photoreal, physically accurate robot simulation on Omniverse, plus Isaac Lab for reinforcement learning.",
    why: "Needs 50 GB of disk for build artifacts, not 50 GB of memory. RL throughput here is compute-bound; a desktop RTX card is the better sim box. Included because robotics is a real reason people buy this machine.",
    anchor: "s-repo",
  },
  {
    id: "jax", title: "Optimized JAX", cat: "data", tracks: ["data"],
    verdict: "FINE", timeMin: 120, timeMax: 180, conf: "HARD",
    models: [], requires: [],
    blurb: "NumPy-style Python that JIT-compiles to the GPU, in a build tuned for GB10.",
    why: "A long tutorial rather than an experiment. Take it if JAX is already your stack.",
    anchor: "s-repo",
  },
  {
    id: "live-vlm-webui", title: "Live VLM WebUI", cat: "vision", tracks: ["vision"],
    verdict: "FINE", timeMin: 20, timeMax: 30, conf: "HARD",
    models: ["Gemma", "Llama", "Qwen"], requires: [],
    blurb: "Stream a webcam into any VLM backend — Ollama, vLLM, SGLang or a cloud API — and get live analysis with benchmarking built in.",
    why: "The fastest way to feel what a local VLM can and can't do. Small VLMs; no memory moat, but a great half-hour.",
    anchor: "s-repo",
  },
  {
    id: "llama-cpp", title: "llama.cpp", cat: "serve", tracks: ["serve"],
    verdict: "FINE", timeMin: 30, timeMax: 30, conf: "HARD", wall: true,
    models: ["Qwen3.6-35B-A3B-MTP-GGUF"], requires: [],
    blurb: "Build llama.cpp with CUDA, load GGUF weights, serve an OpenAI-compatible API from llama-server.",
    why: "The simplest possible local stack, and the one where the bandwidth wall bites hardest if you pick badly.",
    wallNote: "Pick an MoE checkpoint. A dense 70B GGUF will load fine and then generate at single-digit tokens per second. NVIDIA's own CES figure for llama.cpp gains — averaging 35% — was specifically on MoE models.",
    anchor: "s-cesblog",
  },
  {
    id: "llama-factory", title: "LLaMA Factory", cat: "finetune", tracks: ["finetune"],
    verdict: "NATIVE", timeMin: 30, timeMax: 420, conf: "HARD",
    timeNote: "30–60 min setup, then 1–7 h of training depending on model and dataset",
    models: ["Qwen3"], requires: [],
    blurb: "CLI or WebUI front-end for LoRA, QLoRA and full fine-tuning across a wide model zoo.",
    why: "Fastest path from 'I want to fine-tune something' to a running job, because you can drive it from a web form. The 128 GB is what lets you pick a model from the list without first checking whether it fits.",
    anchor: "s-repo",
  },
  {
    id: "lm-studio", title: "LM Studio", cat: "serve", tracks: ["serve"],
    verdict: "FINE", timeMin: 15, timeMax: 30, conf: "HARD", wall: true,
    models: ["gpt-oss", "Qwen3.6-35B-A3B", "Gemma3", "DeepSeek", "Nemotron"], requires: [],
    blurb: "Desktop app for discovering, running and serving local models. The least-typing option in the catalog.",
    why: "Fine, easy, and identical to what you'd get on any other machine — except that the model dropdown has more entries you can actually select.",
    wallNote: "The app will happily let you load a dense model far larger than the bandwidth supports at interactive speed. Watch tokens/sec, not just whether it loads.",
    anchor: "s-repo",
  },
  {
    id: "multi-agent-chatbot", title: "Multi-Agent Chatbot", cat: "agents", tracks: ["agents", "serve"],
    verdict: "NATIVE", timeMin: 30, timeMax: 60, conf: "HARD",
    models: ["gpt-oss-120B", "gpt-oss-20B", "Qwen3-Embedding-4B"], requires: [],
    blurb: "A fully local multi-agent system: a 120B supervisor, a 20B worker and an embedding model, all resident at once.",
    why: "The single best proof of what this box is for. The playbook states the demo uses about 120 of the 128 GB by default and tells you to check nvidia-smi first. There is no consumer card on which this configuration exists.",
    anchor: "s-repo",
  },
  {
    id: "multi-modal-inference", title: "Multi-modal Inference", cat: "create", tracks: ["create", "vision"],
    verdict: "FINE", timeMin: 45, timeMax: 90, conf: "HARD",
    models: ["FLUX.1-dev", "SDXL"], requires: [],
    blurb: "Text-to-image and image-to-image pipelines with ONNX-optimized FLUX and SDXL paths.",
    why: "Good grounding in the optimization steps (ONNX export, precision choice) that make the FLUX work later feel less like magic.",
    anchor: "s-repo",
  },
  {
    id: "multi-sparks-through-switch", title: "Connect Multiple Sparks via Switch", cat: "cluster", tracks: ["cluster"],
    verdict: "SETUP", timeMin: 120, timeMax: 120, conf: "HARD", twoSpark: true,
    models: [], requires: [],
    blurb: "Four Sparks through a QSFP switch, with the networking and SSH setup to match.",
    why: "For the small number of people with four of these and a 200 Gb switch.",
    anchor: "s-repo",
  },
  {
    id: "nccl", title: "NCCL for Multiple Sparks", cat: "cluster", tracks: ["cluster"],
    verdict: "SETUP", timeMin: 30, timeMax: 30, conf: "HARD", twoSpark: true,
    models: [], requires: ["connect-two-sparks"],
    blurb: "Build and configure NCCL for multi-node collective communication across two to four Sparks.",
    why: "The playbook explicitly requires you to have completed the matching connection playbook for your node count first. This is the layer every distributed training or inference job actually sits on.",
    anchor: "s-repo",
  },
  {
    id: "nemo-fine-tune", title: "Fine-tune with NeMo", cat: "finetune", tracks: ["finetune"],
    verdict: "NATIVE", timeMin: 45, timeMax: 90, conf: "HARD", twoSpark: true,
    models: ["Llama-3-70B", "Llama-3.1-8B", "Qwen3-8B"], requires: [],
    blurb: "NeMo AutoModel: GPU-accelerated end-to-end training for Hugging Face LLMs and VLMs with native PyTorch, single- or multi-node.",
    why: "NVIDIA's own framework, and the one that scales cleanly if you ever add a second Spark. It also handles vision-language models — currently the only supported route to fine-tuning a VLM here, since the dedicated VLM playbook is withdrawn.",
    anchor: "s-repo",
  },
  {
    id: "nemoclaw", title: "NemoClaw with a Local LLM", cat: "agents", tracks: ["agents"],
    verdict: "FINE", timeMin: 30, timeMax: 60, conf: "HARD",
    models: ["Qwen3.6-35B-A3B-NVFP4"], requires: [],
    blurb: "A sandboxed agent with Web UI and terminal TUI, inference routed to local vLLM, optionally reachable over Telegram.",
    why: "The most complete local-agent setup NVIDIA ships. Runs inside an OpenShell sandbox with vLLM held to 40% of memory, which is the honest reason it isn't NATIVE — it deliberately doesn't need the whole box.",
    anchor: "s-repo",
  },
  {
    id: "nemoclaw-applications", title: "Example NemoClaw Agents", cat: "agents", tracks: ["agents"],
    verdict: "FINE", timeMin: 30, timeMax: 45, conf: "DECENT",
    timeNote: "per application; four are included",
    models: ["Nemotron"], requires: ["nemoclaw"],
    blurb: "Four ready-to-run agents on top of an existing NemoClaw sandbox: a morning news digest, a software development agent, a doc/deck red-team and a calendar negotiator.",
    why: "The best answer to 'now what?' after you have an agent running. Longest README in the repo by a wide margin.",
    anchor: "s-repo",
  },
  {
    id: "nemotron", title: "Nemotron Model Family", cat: "serve", tracks: ["serve"],
    verdict: "NATIVE", timeMin: 30, timeMax: 90, conf: "DECENT",
    timeNote: "playbook says 'tens of minutes to longer', dominated by downloads",
    models: ["Nemotron-3-Nano", "Nemotron-3-Super-120B-A12B-NVFP4"], requires: [],
    blurb: "On-ramp for running NVIDIA's open Nemotron models on a single Spark — a working endpoint, not a tour of every option.",
    why: "Nemotron-3-Super at 120B-A12B in NVFP4 is a model class that only exists for you because of the 128 GB. Nano runs anywhere.",
    anchor: "s-repo",
  },
  {
    id: "nim-llm", title: "NIM on Spark", cat: "serve", tracks: ["serve"],
    verdict: "FINE", timeMin: 15, timeMax: 30, conf: "HARD",
    models: ["Llama", "Qwen3-32B"], requires: [],
    blurb: "Run NVIDIA's packaged NIM inference microservices locally through a plain Docker workflow.",
    why: "Worth an afternoon only if you expect to deploy NIM somewhere else later and want the local mirror of it.",
    anchor: "s-repo",
  },
  {
    id: "nvfp4-quantization", title: "NVFP4 Quantization", cat: "serve", tracks: ["serve", "finetune"],
    verdict: "NATIVE", timeMin: 90, timeMax: 180, conf: "HARD",
    models: ["Qwen3.6-35B-A3B"], requires: [],
    blurb: "Quantize a model yourself to NVFP4 — Blackwell's 4-bit float format, which keeps floating-point semantics and a shared exponent rather than uniform INT4.",
    why: "Run-once, benefit-forever. It is also the lever behind nearly every performance number NVIDIA announced at CES: the headline gains come from moving weights to NVFP4, not from new silicon. Quantizing a 35B model needs room to hold both representations.",
    anchor: "s-cesblog",
  },
  {
    id: "ollama", title: "Ollama", cat: "setup", tracks: ["serve", "agents"],
    verdict: "SETUP", timeMin: 10, timeMax: 15, conf: "HARD",
    models: ["Qwen2.5"], requires: [],
    blurb: "Install Ollama and expose it to your other machines over an SSH tunnel via NVIDIA Sync.",
    why: "The dependency under three other playbooks. Ten minutes, do it early.",
    anchor: "s-repo",
  },
  {
    id: "open-webui", title: "Open WebUI with Ollama", cat: "serve", tracks: ["serve"],
    verdict: "FINE", timeMin: 15, timeMax: 20, conf: "HARD",
    models: ["gpt-oss"], requires: ["ollama"],
    blurb: "Self-hosted ChatGPT-style front-end that runs fully offline against models on your Spark.",
    why: "The 'why did I buy this' payoff moment, and it costs twenty minutes. Needs about 7 GB of disk for the container plus the model.",
    anchor: "s-repo",
  },
  {
    id: "openclaw", title: "OpenClaw", cat: "agents", tracks: ["agents"],
    verdict: "FINE", timeMin: 30, timeMax: 30, conf: "HARD",
    models: ["Qwen3.6-35B-A3B-NVFP4"], requires: [],
    blurb: "Local-first persistent assistant — remembers conversations, reads your files and apps, extensible with community skills.",
    why: "Read the OpenShell playbook before you point this at your home directory.",
    anchor: "s-repo",
  },
  {
    id: "openshell", title: "OpenShell — sandboxed agents", cat: "agents", tracks: ["agents"],
    verdict: "FINE", timeMin: 20, timeMax: 30, conf: "HARD",
    models: ["Qwen3.6-35B-A3B-NVFP4"], requires: [],
    blurb: "Kernel-enforced sandbox for long-running agents, with policy control over filesystem and network access.",
    why: "The playbook is unusually blunt that running an agent directly on your system gives it your files, credentials and network. If you're going to leave an agent running unattended on a box that's on all the time, do this one.",
    anchor: "s-repo",
  },
  {
    id: "portfolio-optimization", title: "Portfolio Optimization", cat: "data", tracks: ["data"],
    verdict: "FINE", timeMin: 20, timeMax: 20, conf: "HARD",
    models: [], requires: [],
    blurb: "End-to-end Mean-CVaR portfolio optimization with cuOpt and cuML, solved near real-time.",
    why: "A tidy, self-contained twenty minutes. Nothing about it requires this machine, but it's the clearest example in the catalog of GPU acceleration outside of deep learning.",
    anchor: "s-repo",
  },
  {
    id: "pytorch-fine-tune", title: "Fine-tune with PyTorch", cat: "finetune", tracks: ["finetune"],
    verdict: "NATIVE", timeMin: 30, timeMax: 45, conf: "HARD", twoSpark: true,
    models: ["Llama3-70B (LoRA + QLoRA)", "Llama3-8B (LoRA)", "Llama3-3B (full)"], requires: [],
    blurb: "Raw PyTorch fine-tuning scripts: full fine-tune at 3B, LoRA at 8B, and LoRA and QLoRA at 70B.",
    why: "The flagship. The repo ships Llama3_70B_LoRA_finetuning.py and Llama3_70B_qLoRA_finetuning.py as actual files — 70B parameter-efficient fine-tuning on one desk-sized machine is the thing the 128 GB was bought for. Most flexible of the four fine-tuning routes, and the least hand-holding.",
    anchor: "s-repo",
  },
  {
    id: "rag-ai-workbench", title: "Agentic RAG in AI Workbench", cat: "data", tracks: ["data", "agents"],
    verdict: "FINE", timeMin: 30, timeMax: 45, conf: "HARD",
    models: [], requires: [],
    blurb: "Clone and run a pre-built agentic RAG app that routes queries and scores its own answers for relevance and hallucination.",
    why: "A reasonable private-documents starting point. The self-evaluation loop is the interesting part, not the retrieval.",
    anchor: "s-repo",
  },
  {
    id: "reachy-photo-booth", title: "Spark & Reachy Photo Booth", cat: "robotics", tracks: ["robotics", "create"],
    verdict: "FINE", timeMin: 120, timeMax: 120, conf: "HARD", extraHw: "Reachy Mini robot",
    models: ["FLUX.1-Kontext-dev", "gpt-oss-20b"], requires: [],
    blurb: "Event-driven photo booth pairing the Spark with a Reachy Mini robot — the demo NVIDIA ran at CES 2026 with Pollen Robotics.",
    why: "Delightful, and completely gated on owning a Reachy Mini. Listed so you know it exists and why it keeps showing up in coverage.",
    anchor: "s-repo",
  },
  {
    id: "register-to-brev", title: "Register Spark to Brev", cat: "setup", tracks: [],
    verdict: "SETUP", timeMin: 5, timeMax: 10, conf: "HARD",
    models: [], requires: [],
    blurb: "Attach your Spark to NVIDIA Brev so environments are remotely accessible and shareable as Launchables.",
    why: "Useful if you want the box reachable as a shared resource rather than a personal one.",
    anchor: "s-repo",
  },
  {
    id: "sglang", title: "SGLang for Inference", cat: "serve", tracks: ["serve"],
    verdict: "NATIVE", timeMin: 30, timeMax: 30, conf: "HARD", wall: true,
    models: ["Llama-3.3-70B-Instruct-FP4", "Llama-3.1-8B-Instruct-FP8", "DeepSeek-V2-Lite"], requires: [],
    blurb: "Fast serving runtime for LLMs and VLMs, with the EAGLE3 speculative-decoding path documented end to end.",
    why: "A 70B at FP4 is roughly 35 GB of weights — over any consumer card, comfortable here. This is also the playbook where LMSYS measured the ~2× speculative-decoding gain.",
    wallNote: "70B FP4 fits, but a naive dense decode is bandwidth-bound. Turn on EAGLE3 speculative decoding — that's the mitigation, and it's in this playbook.",
    anchor: "s-lmsys",
  },
  {
    id: "single-cell", title: "Single-cell RNA Sequencing", cat: "data", tracks: ["data"],
    verdict: "FINE", timeMin: 15, timeMax: 15, conf: "HARD",
    models: [], requires: [],
    blurb: "GPU-accelerated scRNA-seq analysis over high-dimensional expression data.",
    why: "Fifteen minutes, and a genuinely different shape of workload from everything else here. Take it if the domain is yours.",
    anchor: "s-repo",
  },
  {
    id: "speculative-decoding", title: "Speculative Decoding", cat: "serve", tracks: ["serve"],
    verdict: "NATIVE", timeMin: 10, timeMax: 20, conf: "HARD", twoSpark: true,
    timeNote: "10–20 min setup; model downloads add substantially",
    models: ["Llama-3.3-70B-Instruct-FP4", "Qwen3-235B-A22B"], requires: [],
    blurb: "A small draft model proposes tokens ahead; the large model verifies them in parallel. Documented for single- and multi-Spark.",
    why: "The highest-leverage hour in the catalog. It is the direct antidote to the bandwidth wall, LMSYS measured about 2× end-to-end, and it's half of NVIDIA's headline CES gain. Holding a target and a draft model resident at once is itself a memory argument.",
    anchor: "s-lmsys",
  },
  {
    id: "tailscale", title: "Tailscale on Your Spark", cat: "setup", tracks: [],
    verdict: "SETUP", timeMin: 15, timeMax: 30, conf: "HARD",
    models: [], requires: [],
    blurb: "Encrypted peer-to-peer mesh so you can reach the Spark from anywhere without port forwarding.",
    why: "If the box lives at home and you don't, this is the difference between using it and not.",
    anchor: "s-repo",
  },
  {
    id: "trt-llm", title: "TensorRT-LLM for Inference", cat: "serve", tracks: ["serve"],
    verdict: "NATIVE", timeMin: 45, timeMax: 60, conf: "HARD", twoSpark: true, wall: true,
    models: ["Llama-3.3-70B-Instruct-FP4", "Llama-3.1-8B-Instruct-FP8"], requires: [],
    blurb: "NVIDIA's own inference engine — custom kernels, memory management, and tensor/pipeline/sequence parallelism — with an improved two-Spark workflow.",
    why: "Every CES performance number NVIDIA published was measured on this engine. If you want the box at its fastest rather than its easiest, this is the setup pass, and it's the one you only do once.",
    wallNote: "The engine won't repeal physics on dense decode. The gains come from pairing it with NVFP4 weights and speculative decoding — do all three or expect the boring result.",
    anchor: "s-cesblog",
  },
  {
    id: "txt2kg", title: "Text to Knowledge Graph", cat: "data", tracks: ["data", "vision"],
    verdict: "FINE", timeMin: 10, timeMax: 30, conf: "DECENT",
    models: ["Llama"], requires: [],
    blurb: "Extract a knowledge graph from a text corpus and visualize it, end to end.",
    why: "The playbook argues the unified memory lets you use a larger, more accurate extraction model — true, but a mid-size model does this well enough that it isn't the reason to own the machine.",
    anchor: "s-repo",
  },
  {
    id: "unsloth", title: "Unsloth", cat: "finetune", tracks: ["finetune"],
    verdict: "FINE", timeMin: 30, timeMax: 60, conf: "HARD",
    models: ["Llama-3.1-8B-bnb-4bit"], requires: [],
    blurb: "Memory-efficient LoRA and QLoRA fine-tuning with custom kernels; the playbook's worked example is an 8B model in 4-bit.",
    why: "The fastest wall-clock route to a finished fine-tune, and a fine first one. But an 8B 4-bit LoRA fits on a 16 GB card — this is a speed story, not a capacity story.",
    correction: "You will see 'Unsloth is 2.5× faster on the Spark' repeated online. The playbook itself quotes Unsloth's own generic marketing figure — up to 2× on a single GPU. No Spark-specific benchmark is published in it.",
    anchor: "s-repo",
  },
  {
    id: "vibe-coding", title: "Vibe Coding in VS Code", cat: "agents", tracks: ["agents", "serve"],
    verdict: "NATIVE", timeMin: 30, timeMax: 30, conf: "HARD",
    models: ["gpt-oss-120b"], requires: ["ollama"],
    blurb: "Wire VS Code + Continue.dev to a model on the Spark, locally or as a remote coding companion.",
    why: "NATIVE only because of the model the playbook chooses: gpt-oss:120b. That does not fit on a consumer card, and it's the whole argument for pointing your editor at this box instead of your own GPU.",
    anchor: "s-repo",
  },
  {
    id: "vllm", title: "vLLM for Inference", cat: "serve", tracks: ["serve"],
    verdict: "NATIVE", timeMin: 30, timeMax: 30, conf: "HARD", twoSpark: true, wall: true,
    models: ["Gemma-4-31B-IT-NVFP4", "Llama-3.1-405B-Instruct-AWQ-INT4", "Llama-3.1-8B-Instruct-FP8"], requires: [],
    blurb: "The throughput-oriented serving engine, with paged KV cache and a documented two-Spark path up to a 405B INT4 model.",
    why: "The default recommendation from independent field notes: start here, then pick by workload. A 405B INT4 model across two Sparks is the outer edge of what this hardware does at all.",
    wallNote: "Choose sparse-activation MoE checkpoints. Field measurements put a 26B-A4B NVFP4 model near 52 tok/s on stock vLLM, while dense models of similar total size crawl.",
    anchor: "s-muninn",
  },
  {
    id: "vscode", title: "VS Code on Spark", cat: "setup", tracks: [],
    verdict: "SETUP", timeMin: 5, timeMax: 5, conf: "HARD",
    models: [], requires: [],
    blurb: "Install the ARM64 build of VS Code directly on the Spark.",
    why: "Five minutes. Note the ARM64 caveat — it applies to everything you install on this machine.",
    anchor: "s-repo",
  },
  {
    id: "vss", title: "Video Search & Summarization Agent", cat: "vision", tracks: ["vision"],
    verdict: "NATIVE", timeMin: 30, timeMax: 45, conf: "HARD",
    models: ["Cosmos-Reason2-8B"], requires: [],
    blurb: "NVIDIA's VSS blueprint: a VLM, an LLM and retrieval combined into a system that turns raw video into searchable, summarized insight.",
    why: "Three model types resident and cooperating is exactly the shape of workload the unified memory exists for. Closest thing in the catalog to structured understanding of video — and the closest available substitute for the withdrawn VLM fine-tuning playbook, though this one is inference, not training.",
    anchor: "s-repo",
  },
];

/* ------------------------------------------------------------- watchlist */
const WATCHLIST = [
  {
    id: "vlm-finetuning",
    title: "VLM Fine-tuning (video + image)",
    status: "WITHDRAWN",
    was: "Video VLM fine-tuning with InternVL3-8B for dangerous-driving detection and structured metadata output, plus image VLM fine-tuning with Qwen2.5-VL-7B using GRPO.",
    findings: [
      { t: "The path existed.", d: "nvidia/vlm-finetuning has real commit history in NVIDIA/dgx-spark-playbooks running through 2025-11-20.", conf: "HARD" },
      { t: "It was removed, not moved.", d: "The 2025-11-20 'Regenerate all playbooks' commit deleted it. Fetching the directory at that commit returns Not Found, and main has only one branch.", conf: "HARD" },
      { t: "It is still gone today.", d: "Absent from a fresh clone taken 2026-08-13.", conf: "HARD" },
      { t: "The NVIDIA page looks alive but isn't.", d: "build.nvidia.com/spark/vlm-finetuning returns HTTP 200 — a soft 404. Its rendered markup is identical to what a deliberately nonsensical URL on the same host returns. Anything checking only the status code will report this playbook as present.", conf: "HARD" },
    ],
    workaround: "Two supported routes while it's gone: nemo-fine-tune, which handles vision-language models through NeMo AutoModel, or the Nemotron Nano VL + Megatron Bridge path recommended on the developer forum.",
    workaroundConf: "SOFT",
  },
];

/* ---------------------------------------------------- performance anchors */
const PERF = [
  {
    id: "p-dense",
    label: "Dense 70B, the wall in one line",
    value: "803 / 2.7",
    unit: "tok/s prefill / decode",
    detail: "Llama 3.1 70B at FP8, measured on a Spark. Prefill is compute-bound and looks superb. Decode is bandwidth-bound and is the number you actually feel while waiting for a reply.",
    conf: "HARD", src: "s-lmsys",
  },
  {
    id: "p-spec",
    label: "Speculative decoding (EAGLE3)",
    value: "≈2×",
    unit: "end-to-end throughput",
    detail: "Measured in SGLang on Llama 3.1 8B. A small draft model proposes, the large model verifies in parallel. This is the single most effective software answer to the bandwidth wall.",
    conf: "HARD", src: "s-lmsys",
  },
  {
    id: "p-moe",
    label: "MoE daily driver",
    value: "52",
    unit: "tok/s",
    detail: "Gemma-4-26B-A4B at NVFP4 on stock vLLM — third-party field notes, not a lab benchmark. The same source reports 108 tok/s on the MTP path with a correctly matched drafter.",
    conf: "DECENT", src: "s-muninn",
  },
  {
    id: "p-ces",
    label: "The CES 2.5× — scoped",
    value: "2.5×",
    unit: "Qwen-235B only",
    detail: "FP8 → NVFP4 plus EAGLE3 speculative decoding under TensorRT-LLM. Under the same update Qwen3-30B and Stable Diffusion 3.5 Large gained about 1.4×, and llama.cpp MoE models averaged 35%. Fine-tuning gained least. 'The Spark got 2.5× faster' is not what was measured.",
    conf: "VENDOR", src: "s-cesblog",
  },
  {
    id: "p-flux2",
    label: "FLUX.2 at full precision",
    value: "90 GB",
    unit: "fits in 128",
    detail: "NVIDIA's clearest statement of the capacity argument: a 90 GB diffusion model held at full precision, no quantization compromise. There is no consumer card this is possible on.",
    conf: "VENDOR", src: "s-cesblog",
  },
  {
    id: "p-video",
    label: "Offloading a laptop video pipeline",
    value: "8×",
    unit: "wall clock",
    detail: "A ComfyUI pipeline with FLUX.1-dev, WAN 2.2 and upscaling took about 8 minutes on a MacBook Pro M4 Max alone; routing the heavy stages to a Spark brought it to about 1 minute. Vendor-run, best-case, and a genuinely useful pattern.",
    conf: "VENDOR", src: "s-storagereview",
  },
];

/* ----------------------------- fit calculator presets & physical constants */
const CALC = {
  bandwidth: 273,          // GB/s — HARD, s-lmsys
  capacities: [
    { name: "RTX 5090", gb: 32 },
    { name: "RTX PRO 6000", gb: 96 },
    { name: "DGX Spark", gb: 128, hero: true },
    { name: "2× Spark", gb: 256 },
  ],
  precisions: [
    { id: "fp16", label: "FP16/BF16", bytes: 2 },
    { id: "fp8", label: "FP8", bytes: 1 },
    { id: "nvfp4", label: "NVFP4 / INT4", bytes: 0.5 },
  ],
  presets: [
    { name: "Llama 3.1 70B", total: 70, active: 70, prec: "fp8", check: { measured: 2.7, src: "s-lmsys" } },
    { name: "Llama 3.3 70B", total: 70, active: 70, prec: "nvfp4" },
    { name: "Gemma 4 26B-A4B", total: 26, active: 4, prec: "nvfp4", check: { measured: 52, src: "s-muninn" } },
    { name: "Qwen3.6 35B-A3B", total: 35, active: 3, prec: "nvfp4" },
    { name: "gpt-oss 120B", total: 120, active: 120, prec: "nvfp4" },
    { name: "Nemotron-3 Super 120B-A12B", total: 120, active: 12, prec: "nvfp4" },
    { name: "Llama 3.1 405B", total: 405, active: 405, prec: "nvfp4" },
  ],
  // Calibration: theoretical roofline vs what people actually measure.
  calibration: [
    { kind: "Dense", ratio: 0.69, note: "Llama 3.1 70B FP8: roofline 3.9 tok/s, measured 2.7", conf: "HARD" },
    { kind: "MoE", ratio: 0.38, note: "Gemma 4 26B-A4B NVFP4: roofline 136 tok/s, measured 52", conf: "DECENT" },
  ],
};

/* ---------------------------------------------------------------- sources */
const SOURCES = [
  { id: "s-repo", label: "NVIDIA/dgx-spark-playbooks", url: "https://github.com/NVIDIA/dgx-spark-playbooks", type: "repo",
    note: "Every playbook title, duration, model list and prerequisite on this page was read from this repository on 2026-08-13." },
  { id: "s-lmsys", label: "LMSYS — DGX Spark in-depth review", url: "https://www.lmsys.org/blog/2025-10-13-nvidia-dgx-spark/", type: "measured",
    note: "Independent benchmarks: prefill/decode splits, EAGLE3 speedup, bandwidth analysis, thermals." },
  { id: "s-cesblog", label: "NVIDIA — New software and model optimizations supercharge DGX Spark", url: "https://developer.nvidia.com/blog/new-software-and-model-optimizations-supercharge-nvidia-dgx-spark/", type: "vendor",
    note: "Primary source for the CES 2026 performance claims, FLUX.2 at 90 GB, and llama.cpp MoE gains." },
  { id: "s-storagereview", label: "StorageReview — CES 2026 enterprise update", url: "https://www.storagereview.com/news/nvidia-dgx-spark-achieves-2-5x-performance-and-8x-video-speed-in-ces-2026-enterprise-update", type: "vendor",
    note: "Breakdown of which model got which speedup, and the MacBook-offload video pipeline." },
  { id: "s-hothardware", label: "HotHardware — DGX Spark performance and SDK updates at CES 2026", url: "https://hothardware.com/news/nvidia-dgx-spark-performance-and-sdk-updates-ces2026", type: "field-notes",
    note: "Skeptical read of the same announcement; notes the gains are mostly NVFP4 conversion." },
  { id: "s-muninn", label: "ai-muninn — DGX Spark in 2026: what still works, what broke", url: "https://ai-muninn.com/en/blog/dgx-spark-2026-current-guide", type: "field-notes",
    note: "Third-party field notes. Source for the 52 tok/s and 108 tok/s MTP figures and the vLLM-first recommendation." },
  { id: "s-nvspec", label: "NVIDIA — DGX Spark product specifications", url: "https://www.nvidia.com/en-us/products/workstations/dgx-spark/", type: "vendor",
    note: "Official spec table: memory, CPU, NIC, TDP, dimensions." },
  { id: "s-forum", label: "NVIDIA Developer Forums — DGX Spark playbooks update, Jan 2026", url: "https://forums.developer.nvidia.com/t/dgx-spark-playbooks-update-jan-2026/358247", type: "vendor",
    note: "Announcement thread tying the CES gains to specific playbooks." },
  { id: "s-buildnv", label: "build.nvidia.com/spark", url: "https://build.nvidia.com/spark", type: "vendor",
    note: "NVIDIA's own playbook browser. Note that missing pages here return HTTP 200 soft 404s." },
  { id: "s-igorslab", label: "igor'sLAB — DGX Spark at CES 2026", url: "https://www.igorslab.de/en/dgx-spark-at-ces-2026-local-ki-development-between-desktop-edge-and-professional-standards/", type: "field-notes",
    note: "Assessment of the platform's positioning; the value is now in software, not new silicon." },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SNAPSHOT, HW, TRACKS, PLAYBOOKS, WATCHLIST, PERF, CALC, SOURCES };
}
