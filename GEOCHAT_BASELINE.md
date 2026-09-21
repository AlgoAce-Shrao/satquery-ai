# GeoChat Baseline Report

Generated: 2026-09-20
Scope: Environment + repository inspection only. No training or fine-tuning performed. No local project files modified.

## 1. Current State in This Repository

No GeoChat integration exists yet anywhere in `satquery-ai`:
- No GeoChat/VLM checkpoint, weights, or inference code in the repo.
- No dataset for fine-tuning.
- `docs/FUTURE_ROADMAP.md` (Phase 5) lists "Geospatial Foundation Models & VLMs" (Prithvi, Clay, SatMAE, RemoteCLIP) as a *planned* future item — GeoChat itself is not yet mentioned there.
- `README.md`'s `ToolRegistry` lists a conceptual `RS_VQA_CLASSIFIER` tool (vision-language scene understanding) as a catalog entry, but it is not backed by any model code — it's a planned specialist-model slot.
- Backend Python services (`services/nlp-service`, `services/eo-analysis-service`, `services/data-service`) are lightweight FastAPI services with only `fastapi`, `pydantic`, `httpx`, `numpy`, `shapely` in their `requirements.txt` — no `torch`/`transformers`/ML deps at all.

**Conclusion:** This is a greenfield start. We are not resuming or fixing an existing GeoChat setup — we are standing one up from scratch.

## 2. Model Identification (verified via Hugging Face Hub metadata)

- **Checkpoint source:** `MBZUAI/geochat-7B` on Hugging Face Hub (the official released checkpoint from the CVPR 2024 paper "GeoChat: Grounded Large Vision-Language Model for Remote Sensing", MBZUAI / Oryx group).
- **Repo files:** `config.json`, `generation_config.json`, `pytorch_model-00001-of-00002.bin` (9.98 GB), `pytorch_model-00002-of-00002.bin` (4.15 GB), `pytorch_model.bin.index.json`, `tokenizer.model`, `tokenizer_config.json`, `special_tokens_map.json`.
- **Total checkpoint size:** ~14.1 GB (legacy PyTorch `.bin` shards, not `safetensors`).
- No custom `modeling_*.py` files are hosted in the HF repo — the `GeoChatLlamaForCausalLM` class is **not** loadable via `trust_remote_code=True` from the Hub. It only exists in the official GitHub codebase.

## 3. Model Architecture

From `config.json` (`_name_or_path: llava-v1.5-7b`, `model_type: geochat`, `architectures: ["GeoChatLlamaForCausalLM"]`):

| Property | Value |
|---|---|
| Base VLM design | LLaVA-1.5 style (vision tower → MLP projector → LLM) |
| Language model | Vicuna-7B-v1.5 (LLaMA architecture): hidden_size 4096, 32 layers, 32 attn heads, vocab 32000, max_position_embeddings 4096 |
| Vision encoder | `openai/clip-vit-large-patch14-336` (CLIP ViT-L/14 @ 336px), `mm_hidden_size` 1024, feature select layer -2 ("patch" features) |
| Multimodal projector | `mlp2x_gelu` (2-layer MLP, LLaVA-1.5 style — not a simple linear projection) |
| Image preprocessing | `image_aspect_ratio: "pad"` (square-pad before resize), no `image_grid_pinpoints` (no anyres/tiling — single 336×336 crop) |
| Precision | `torch_dtype: float16` |
| Original `transformers` version used to save config | `4.31.0` |

GeoChat's actual novelty over LLaVA-1.5 is in training data/task formulation (region-level grounding, referring expressions, scene classification for RS imagery) and instruction-tuning data — the architecture itself is a LLaVA-1.5 fork.

## 4. Tokenizer / Processor

- Tokenizer: LLaMA/SentencePiece tokenizer (`tokenizer.model`, `tokenizer_config.json`, `special_tokens_map.json`) — same as Vicuna-7B-v1.5.
- Image processor: CLIP image processor for `openai/clip-vit-large-patch14-336` (336×336 input, standard CLIP normalization), used via the LLaVA-derived `CLIPImageProcessor`.
- No unified HF `AutoProcessor` is published for this checkpoint — the official codebase wires tokenizer + image processor together manually in its inference script (`geochat/eval/...` in the GitHub repo).

## 5. Current Inference Code

None exists in this project. The only available inference path is the official GitHub repo's own scripts (`mbzuai-oryx/GeoChat`, cloned read-only into the Colab session at `/content/GeoChat` for inspection — not installed/executed). It depends on the custom `GeoChatLlamaForCausalLM` class defined in that repo, not on vanilla `transformers.AutoModelForCausalLM`.

## 6. Dependency / Version Requirements — Resolved via Isolated Environment

Official `pyproject.toml` (GeoChat GitHub repo) pins:

```
torch==2.0.1        torchvision==0.15.2
transformers==4.31.0
accelerate==0.21.0
peft==0.4.0
bitsandbytes==0.41.0
deepspeed==0.9.5
timm==0.6.13
tokenizers>=0.12.1
sentencepiece==0.1.99
```

The main Colab kernel runs Python 3.13 with a modern stack (`torch 2.11.0+cu128`, `transformers 5.16.1`, `accelerate 1.14.0`, `peft 0.20.0`). **Directly installing the pinned legacy stack into that kernel is not possible**: PyPI/PyTorch's wheel index has no `torch==2.0.1` build for Python 3.13 at all (oldest cu118 wheel available is `2.5.0+cu118`), and `tokenizers==0.13.3` (required by `transformers==4.31.0`) fails to build from source against Python 3.13's ABI.

**Working fix:** created an isolated Miniconda environment (`geochat_env`, Python 3.10) inside the same Colab runtime and installed the pinned stack there instead of touching the main kernel:

```
torch==2.0.1+cu118, torchvision==0.15.2+cu118
transformers==4.31.0, accelerate==0.21.0, peft==0.4.0
timm==0.6.13, sentencepiece==0.1.99, einops==0.6.1, einops-exts==0.0.4
numpy<2
```

Two further fixes were needed inside that env:
- `bitsandbytes==0.41.0` (the pinned version) crashes on import — it's built against CUDA 11.8 and this Colab image only ships CUDA 12.8 runtime libraries (`libcusparse.so.11` missing). Since `accelerate==0.21.0` imports `bitsandbytes` eagerly at package-import time, this crash took down `accelerate`/`peft` imports too, not just quantized loading. **Fix:** installed latest `bitsandbytes` (0.50.2) instead of the pin — it detects CUDA 12.8 correctly and imports cleanly; the exact-pinned old build is simply incompatible with this host's CUDA runtime.
- The main Colab kernel's `torch==2.0.1` install itself (attempted before finding the wheel-availability issue above) also failed for the same Python-3.13-too-new reason — confirming the isolated env was the correct call, not an optional nicety.

This isolated-env approach means the main kernel's modern stack was never touched — no downgrade risk to the rest of the SatQuery AI ML work.

## 7. GPU / Environment

| Item | Value |
|---|---|
| GPU | Tesla T4 (16 GB card, 15,360 MiB reported to CUDA) |
| Free VRAM at inspection time | ~14.9 GB |
| CUDA (driver, via `nvcc`) | 12.8 |
| PyTorch build | 2.11.0+cu128 |
| Python | 3.13.15 |
| Disk available | 66 GB free of 113 GB |
| `bitsandbytes` | Not installed (required for 4-bit/8-bit QLoRA) |
| `peft` | Installed (0.20.0) — LoRA-capable, but API has moved on from the 0.4.0 GeoChat was built against |
| `accelerate` | Installed (1.14.0) |

## 8. Dataset Status

No fine-tuning dataset exists in this project yet. GeoChat's own instruction-tuning dataset ("GeoChat-Instruct", ~318K RS VQA/grounding/conversation samples) is separately hosted by MBZUAI and would need to be sourced if we intend to replicate/extend their tuning, or we bring our own SatQuery-specific RS image + query/answer pairs. Neither has been pulled into this environment.

## 9. Fine-Tuning Constraints (T4, 16 GB)

Even once the version mismatch is resolved:
- Full fp16 fine-tuning of a 7B LLM (weights alone ≈14 GB) does not fit in a 16 GB T4 alongside activations/optimizer state.
- **QLoRA (4-bit base weights + LoRA adapters)** is the realistic path on a single T4 — this requires `bitsandbytes` (currently not installed) and careful VRAM budgeting (4-bit 7B ≈ 4–5 GB weights, leaving headroom for LoRA + activations + a modest batch size, likely batch size 1 with gradient accumulation).
- The vision tower (CLIP ViT-L/14-336) is typically frozen during LoRA fine-tuning of this architecture family — only the LLM (via LoRA) and optionally the MLP projector are trained.

## 10. Baseline Inference — Completed

Ran successfully in the isolated `geochat_env` (Python 3.10) described above, against the full `MBZUAI/geochat-7B` checkpoint.

**Setup:**
- Sample image: no remote-sensing image exists in this repo's `assets/` (only an `.aistudio/.gitignore` placeholder), so one was sourced via `torchvision.datasets.EuroSAT` (a standard, permissively-available Sentinel-2 land-use benchmark) — a 64×64 `AnnualCrop`-labeled patch.
- Image preprocessing: **discovered GeoChat does not use CLIP's native 336×336 resolution.** `geochat/model/multimodal_encoder/clip_encoder.py` calls a custom `clip_interpolate_embeddings(image_size=504, patch_size=14)` at load time, which bicubically interpolates the CLIP ViT-L/14 position embeddings from 577 tokens (336² / 14² + 1) to 1297 tokens (504² / 14² + 1). Preprocessing must also pad-to-square then resize to 504×504 via `geochat.mm_utils.process_images` (not a plain `image_processor.preprocess()` call at default size) — using the default 336 resolution throws a tensor-shape `RuntimeError` at the vision embedding layer. **This is a real, previously-undocumented-in-config architectural detail worth remembering for any future fine-tuning/data pipeline work.**
- VRAM: full fp16 (7B, ~14 GB weights) plus ~1300 image+text tokens of attention activation overflowed the T4's 16 GB (`CUDA out of memory` during the LLM's self-attention softmax). Re-ran with `load_8bit=True` (via `bitsandbytes` 0.50.2) — fit comfortably and completed.

**Result** (prompt: *"What type of land use or scene does this satellite image show?"*):

> Based on the information provided, it is not possible to determine the specific type of land use or scene depicted in the satellite image. However, the presence of a building and a road suggests that it could be an urban or suburban area, possibly with residential or commercial buildings and infrastructure. The absence of any other objects or features in the image makes it difficult to determine the exact context or purpose of the scene.

The output is coherent and on-topic but hedging/generic — plausibly because a 64×64 EuroSAT thumbnail (upsampled to 504×504) is far lower native resolution and a different visual domain than the high-resolution aerial imagery GeoChat's instruction-tuning data used. This was a pipeline-correctness smoke test, not a quality benchmark — it confirms the checkpoint, custom architecture, tokenizer, and generation path all work end-to-end on this hardware.

## 11. Recommended Next Step

1. **Reuse the `geochat_env` isolated-environment recipe** (Section 6) as the standing environment for any further GeoChat work in this Colab runtime — it's verified working end-to-end. Note it is ephemeral (this Colab session's local disk); capture it as a `requirements-geochat.txt` / setup script in the repo so it's reproducible in a fresh runtime rather than rebuilt ad hoc each time.
2. Decide whether to fine-tune the original (legacy-stack) GeoChat as-is inside `geochat_env`, or first port/patch `GeoChatLlamaForCausalLM` to run under current `transformers` (5.16.1) — the latter is more upfront work but avoids maintaining two incompatible ML environments long-term for SatQuery AI.
3. For fine-tuning specifically (not just inference): QLoRA (4-bit) is required, not just 8-bit — confirmed 8-bit fp16-base inference alone already uses most of the T4's 16 GB; training adds gradients/optimizer state on top. Validate 4-bit + LoRA loading in `geochat_env` before committing to a training script.
4. Re-run the baseline check against a higher-resolution, more representative remote-sensing image (e.g. a genuine aerial/satellite scene rather than a 64×64 EuroSAT thumbnail) to get a more meaningful quality read before/after any fine-tuning.
5. Source or construct the fine-tuning dataset (GeoChat-Instruct and/or SatQuery-specific RS QA pairs) — none exists yet.
6. Only after 1–5 are settled: begin actual fine-tuning (explicitly out of scope for this pass).

## 12. Unrelated Finding: Local Disk Full

The local machine's `C:` drive is reporting 0 bytes free (444 GB used / 444 GB total) as of this session. Unrelated to the Colab/GeoChat work above, but worth resolving soon since it will block local builds, git operations, and file writes.
