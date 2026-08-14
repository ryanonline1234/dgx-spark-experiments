/* =============================================================================
   lf-data.js — single source of numbers for the LLaMA Factory deep dive
   (/llama-factory). Same house rule as data.js: no fact, number, command or
   config line may live in llama-factory.html.

   Provenance: playbook steps, durations, troubleshooting and example output
   read from nvidia/llama-factory/README.md (playbook last updated 2026-02-18,
   re-read 2026-08-14) — HARD. The training config and dataset sample are
   fetched verbatim from the upstream hiyouga/LLaMA-Factory repository the
   playbook clones — HARD. Memory arithmetic is DERIVED (formula shown).
   ========================================================================== */

const LF = {
  meta: {
    playbookUrl: "https://github.com/NVIDIA/dgx-spark-playbooks/tree/main/nvidia/llama-factory",
    upstreamUrl: "https://github.com/hiyouga/LLaMA-Factory",
    docsUrl: "https://llamafactory.readthedocs.io/en/latest/getting_started/data_preparation.html",
    lastUpdated: "2026-02-18",
    reread: "2026-08-14",
    setup: "30–60 min",
    training: "1–7 h",
    exampleModel: "Qwen3-4B-Instruct-2507",
    exampleRuntime: "14 min 32 s",
    exampleLoss: "0.9993",
    exampleEpochs: 3,
  },

  /* --------------------------- the three methods, honest comparison ------ */
  methods: [
    {
      id: "full", name: "Full fine-tuning",
      trains: "every weight in the model",
      artifact: "a whole new model (GBs)",
      analogy: "reprinting the book",
      bytesPerParam: 16,
      formula: "2 (bf16 weights) + 2 (gradients) + 4 (fp32 master copy) + 8 (Adam optimizer states)",
      note: "Most faithful, most expensive. On this box the practical ceiling is single-digit-billions of parameters.",
    },
    {
      id: "lora", name: "LoRA",
      trains: "small adapter matrices (~0.1–1% of weights); the base model is frozen",
      artifact: "an adapter file (MBs)",
      analogy: "a transparent overlay on the printed page",
      bytesPerParam: 2.1,
      formula: "2 (frozen bf16 base) + ~0.1 (adapter weights, gradients and optimizer — tiny because the adapter is tiny)",
      note: "The default. Nearly all of the benefit for a fraction of the memory, and the output is a file you can share, stack or delete.",
    },
    {
      id: "qlora", name: "QLoRA",
      trains: "the same adapters, but the frozen base is compressed to 4-bit first",
      artifact: "an adapter file (MBs)",
      analogy: "same overlay, paperback edition of the book",
      bytesPerParam: 0.7,
      formula: "0.5 (4-bit quantized base) + ~0.2 (adapter states and quantization overhead)",
      note: "Slightly lossier, dramatically smaller. This is what makes 70B-class fine-tuning possible on one desk.",
    },
  ],

  /* Memory chart: sizes × methods, against the 128 GB line.
     GB = params(B) × bytesPerParam. DERIVED rule of thumb — ignores
     activations and KV cache, so real usage is somewhat higher. */
  memSizes: [4, 8, 70],
  memCapacity: 128,
  memNotes: [
    "4B is the playbook's own worked example — every method fits with room to spare.",
    "At 8B, full fine-tuning's ~16 bytes per parameter already collides with the 128 GB ceiling once activations join. This is why NVIDIA's raw-PyTorch playbook does full fine-tuning at 3B and switches to LoRA at 8B.",
    "At 70B, even a frozen bf16 base (~140 GB) is over the line — plain LoRA needs offload tricks. QLoRA's 4-bit base (~35 GB) is the comfortable path, and it's why the phrase '70B on a desktop' is a QLoRA phrase.",
  ],

  /* ----------------------------------- the stack, dissolved prereqs ------ */
  stack: [
    { layer: "You", does: "decide what behavior you want, and prove it with examples", touch: "This is the whole job. Everything below is machinery." },
    { layer: "LLaMA Factory", does: "turns one YAML file into a full training run — CLI or WebUI", touch: "You edit a config and run one command. This replaces the training script you'd otherwise write." },
    { layer: "Transformers + PEFT", does: "loads the model from Hugging Face; PEFT injects the LoRA adapters", touch: "Never directly. LLaMA Factory drives it." },
    { layer: "PyTorch", does: "the math: forward pass, loss, backpropagation, optimizer steps", touch: "One install command, one verify command. That's the entire 'PyTorch experience' this playbook requires." },
    { layer: "CUDA 13", does: "compiles the math onto the GPU", touch: "Ships with DGX OS. You run nvcc --version once to confirm it exists." },
    { layer: "GB10 + 128 GB unified memory", does: "holds the model, gradients and optimizer states in one pool shared by CPU and GPU", touch: "The reason a 4B–70B fine-tune fits on a desk at all." },
  ],

  /* ----------------------------------------- dataset format + sample ----- */
  dataset: {
    format: "alpaca",
    file: "data/identity.json",
    registry: "data/dataset_info.json",
    sample: [
      { instruction: "Who are you?", input: "", output: "I am {{name}}, an AI assistant developed by {{author}}. How can I assist you today?" },
      { instruction: "hi", input: "", output: "Hello! I am {{name}}, an AI assistant developed by {{author}}. How can I assist you today?" },
    ],
    fields: [
      { k: "instruction", v: "what the user asks — the situation you're training for" },
      { k: "input", v: "optional extra context (a document, a table). Usually empty" },
      { k: "output", v: "the exact answer you want the model to give. You are writing the model's half of the conversation" },
    ],
    point: "The playbook's default run trains on this file. Replace {{name}} and {{author}}, run the training, and the model introduces itself with your words — the entire concept of fine-tuning, demonstrated in ninety JSON lines.",
    ruleOfThumb: "Behavioral changes (tone, format, identity, refusal style): dozens to hundreds of examples. Domain skills (your product's support answers, your codebase's conventions): hundreds to thousands. Quality dominates quantity — the model becomes the average of your examples, including the sloppy ones.",
  },

  /* -------------------------- the real config, annotated line by line ---- */
  config: {
    path: "examples/train_lora/qwen3_lora_sft.yaml",
    lines: [
      { code: "model_name_or_path: Qwen/Qwen3-4B-Instruct-2507", why: "which base model to download from Hugging Face. Swap this line to fine-tune something else." },
      { code: "stage: sft", why: "supervised fine-tuning — 'copy these examples'. The other stages (DPO, RLHF) teach from preferences instead; ignore them on day one." },
      { code: "finetuning_type: lora", why: "the overlay method. Change to qlora-style by adding quantization, or full — see the memory chart before you do." },
      { code: "lora_rank: 8", why: "the 'thickness' of the overlay. 8 is the standard default; higher learns more but risks memorizing. Not the first knob to touch." },
      { code: "dataset: identity,alpaca_en_demo", why: "which datasets from data/dataset_info.json to train on. Your own data gets registered there, then named here." },
      { code: "cutoff_len: 2048", why: "examples longer than this many tokens get truncated. Longer costs memory quadratically-ish — raise only if your data needs it." },
      { code: "per_device_train_batch_size: 1", why: "examples processed simultaneously. THE memory knob — first thing to lower when you see 'CUDA out of memory'." },
      { code: "gradient_accumulation_steps: 8", why: "fakes a bigger batch (1×8 = effective 8) by summing gradients across steps. Costs time instead of memory — the trade you almost always want here." },
      { code: "learning_rate: 1.0e-4", why: "step size. Too high: loss jumps around or explodes. Too low: nothing happens. This default is sane for LoRA; change it last, and by 3–10× at a time." },
      { code: "num_train_epochs: 3.0", why: "how many times the model sees your whole dataset. More epochs on a small dataset = memorization risk (see the loss curves below)." },
      { code: "bf16: true", why: "16-bit math, the Blackwell-native precision. Leave it on." },
      { code: "output_dir: saves/qwen3-4b/lora/sft", why: "where checkpoints, the loss plot and your finished adapter land." },
    ],
  },

  /* --------------------------------- the run: playbook steps, condensed -- */
  steps: [
    { t: "Check the machine", cmd: "nvcc --version && nvidia-smi && python3 --version && git --version", why: "Four version prints. If all four answer, every environment prerequisite on the old list is already met — DGX OS shipped it." },
    { t: "Make a sandbox", cmd: "python3 -m venv factoryEnv && source ./factoryEnv/bin/activate", why: "A virtual environment is a disposable folder of Python packages. Worst case, you delete it and start over — that's the whole rollback plan." },
    { t: "Install PyTorch for this GPU", cmd: "pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu130", why: "The one hardware-specific moment: the cu130 index gives you the CUDA-13 build that matches the Spark." },
    { t: "Prove the GPU is visible", cmd: "python -c \"import torch; print(torch.cuda.is_available())\"", why: "Must print True. If it prints False, stop and fix this first — training on CPU is not a slower version of the same thing, it's a different week." },
    { t: "Get LLaMA Factory", cmd: "git clone --depth 1 https://github.com/hiyouga/LLaMA-Factory.git && cd LLaMA-Factory && pip install -e \".[metrics]\"", why: "Clone and install. Everything from here on happens inside this folder." },
    { t: "Read the config", cmd: "cat examples/train_lora/qwen3_lora_sft.yaml", why: "The annotated version is above. This is the file you'll edit for every future run — model, data, knobs." },
    { t: "Train", cmd: "llamafactory-cli train examples/train_lora/qwen3_lora_sft.yaml", why: "One command. Downloads Qwen3-4B (log in with 'hf auth login' first if a model is gated), then trains. The example run finishes in ~14 minutes on a Spark." },
    { t: "Talk to it", cmd: "llamafactory-cli chat examples/inference/qwen3_lora_sft.yaml", why: "Loads base + your adapter and opens a chat. Ask it who it is — the identity dataset's answer coming back is your proof the whole loop worked." },
    { t: "Ship it (optional)", cmd: "llamafactory-cli export examples/merge_lora/qwen3_lora_sft.yaml", why: "Merges the overlay into the base weights, producing one standalone model you can serve from Ollama or vLLM like anything else in the catalog." },
  ],

  /* --------------------------------------------- reading the training --- */
  loss: {
    what: "Loss is the model's average wrongness on your examples — how surprised it is by your outputs. Training exists to push it down. The playbook saves a plot to training_loss.png automatically; the example run lands at 0.9993 after 3 epochs.",
    healthy: "Falls fast, then flattens into a gentle slope. The model has learned the pattern in your data.",
    overfit: "Keeps diving toward zero on a small dataset. The model is memorizing your exact examples — it will parrot them verbatim and get weirder on everything else. Fewer epochs, more data, or lower rank.",
    flat: "Never really drops. Learning rate off by an order of magnitude, or the dataset is too small/inconsistent for a pattern to exist. The playbook's own troubleshooting: adjust learning_rate, check dataset quality.",
  },

  /* ------------------------------------------------ when it breaks ------- */
  breaks: [
    { s: "CUDA out of memory", m: "The run needed more than what's free. Lower per_device_train_batch_size first, raise gradient_accumulation_steps to compensate — same effective batch, less resident memory." },
    { s: "Cannot access gated repo", m: "Some models (Llama especially) require clicking 'request access' on their Hugging Face page while logged in, then 'hf auth login' in the terminal. Qwen models are unrestricted — the playbook's default avoids this entirely." },
    { s: "OOM while apparently within 128 GB", m: "Spark-specific: the unified memory can hold stale file cache the GPU can't reclaim. The playbook's fix: sudo sh -c 'sync; echo 3 > /proc/sys/vm/drop_caches'" },
    { s: "Loss not decreasing", m: "See the flat-line curve above — learning rate or data, in that order." },
    { s: "Anything else", m: "Paste the full error into your AI assistant along with 'LLaMA Factory on DGX Spark'. That is not cheating; it is how this workflow is designed to be operated in 2026. Your job is the paragraph above each step, not the stack trace." },
  ],

  /* --------- the old prerequisite list, dissolved into what matters ------ */
  dissolve: [
    { was: "Basic Python knowledge", now: "You will edit one YAML file and run five commands. The venv is disposable; deleting the folder is the undo button." },
    { was: "PyTorch & Hugging Face familiarity", now: "One pip install and one True. LLaMA Factory exists precisely so you configure these instead of programming them." },
    { was: "CUDA/cuDNN setup & VRAM management", now: "DGX OS ships CUDA; nvcc --version confirms it. 'VRAM management' on a Spark means reading one chart (above) and knowing which two knobs to turn." },
    { was: "LoRA vs QLoRA vs full tradeoffs", now: "Overlay vs compressed-book-overlay vs reprint. You now know when each fits in 128 GB and what artifact each produces — which is the entire tradeoff." },
    { was: "Dataset preparation", now: "One JSON shape: instruction / input / output. This is the part that is genuinely yours, because it's the specification of what you want." },
    { was: "Resource management", now: "batch size down, gradient accumulation up. That one sentence is most of it." },
  ],

  /* ------------------------------------------------------- sources ------- */
  sources: [
    { id: "lf-playbook", label: "NVIDIA playbook — LLaMA Factory on DGX Spark", url: "https://github.com/NVIDIA/dgx-spark-playbooks/tree/main/nvidia/llama-factory", type: "repo", note: "Steps, durations, troubleshooting and the example training output. Last updated 2026-02-18; re-read for this page 2026-08-14." },
    { id: "lf-upstream", label: "hiyouga/LLaMA-Factory", url: "https://github.com/hiyouga/LLaMA-Factory", type: "repo", note: "The framework itself. The training YAML and identity.json sample on this page are quoted verbatim from it." },
    { id: "lf-docs", label: "LLaMA Factory documentation — data preparation", url: "https://llamafactory.readthedocs.io/en/latest/getting_started/data_preparation.html", type: "repo", note: "The full dataset-format reference, including formats beyond alpaca." },
    { id: "lf-lora", label: "LoRA: Low-Rank Adaptation of Large Language Models (Hu et al., 2021)", url: "https://arxiv.org/abs/2106.09685", type: "measured", note: "The original paper behind the overlay idea." },
    { id: "lf-qlora", label: "QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al., 2023)", url: "https://arxiv.org/abs/2305.14314", type: "measured", note: "The 4-bit-base variant that put 70B-class fine-tuning in reach of single machines." },
  ],
};

if (typeof module !== "undefined" && module.exports) module.exports = { LF };
