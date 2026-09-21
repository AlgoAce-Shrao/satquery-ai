# GeoChat Source-Code Audit for SatQuery AI (SIH26167)

**Scope:** source-code audit only. No GeoChat code was modified, no training was started, no new dataset was created. This report builds on — and narrows the scope of — the prior `GEOCHAT_BASELINE.md` (environment/inference) and `GEOCHAT_TRAINING_PIPELINE.md` (full training-pipeline reverse-engineering) already in this repo; it does not repeat their full derivations, but every fact restated here was independently re-traced to source in this pass.

**Repository / commit inspected:** `https://github.com/mbzuai-oryx/GeoChat`, commit `4850920e005a849bd224d0ce35aa9db031fa5155`.

**Labeling convention used throughout, per the task's requirement:**
- **VERIFIED FROM SOURCE** — read directly in the cited file/function.
- **INFERRED** — a reasonable conclusion from source code plus common, independently-documented facts (e.g. public dataset lineage), not itself stated in the GeoChat repo.
- **UNKNOWN — SOURCE DOES NOT ESTABLISH THIS** — the repository does not answer the question; not guessed.
- **PROPOSED FOR SATQUERY** — our own design recommendation, not a claim about GeoChat.

---

## 1. GeoChat Architecture

```
Image
  ↓  PIL.Image.open(path).convert('RGB')                     [geochat/train/train.py::LazySupervisedDataset.__getitem__,
  ↓                                                            geochat/conversation.py::Chat.encode_img (inference)]
Preprocessing
  ↓  expand2square() → pad to square with CLIP mean color     [geochat/mm_utils.py::expand2square]
  ↓  processor.preprocess(..., crop_size=504, size=504)       [geochat/mm_utils.py::process_images / process_images_demo;
  ↓                                                            geochat/train/train.py inlines the same call]
CLIP
  ↓  CLIPVisionTower.forward() → vision_tower(images,          [geochat/model/multimodal_encoder/clip_encoder.py::
  ↓  output_hidden_states=True) → feature_select()              CLIPVisionTower.forward, .feature_select]
Visual features
  ↓  hidden_states[-2], CLS token dropped ("patch" select)     same file, `feature_select`
  ↓  shape: [batch, 1296, 1024]  (see §2 for the 1296/1024 derivation)
MLP projector
  ↓  mm_projector = Linear(1024,4096) → GELU → Linear(4096,4096)  [geochat/model/multimodal_projector/builder.py::
  ↓                                                                  build_vision_projector, called from
  ↓                                                                  GeoChatMetaForCausalLM.encode_images]
LLM embedding space
  ↓  shape after projection: [batch, 1296, 4096]  (Vicuna hidden size)
Multimodal sequence
  ↓  IMAGE_TOKEN_INDEX (-200) sentinel located in input_ids and   [geochat/model/geochat_arch.py::
  ↓  replaced in-place by the 1296 projected vectors, concatenated  GeoChatMetaForCausalLM.prepare_inputs_labels_for_multimodal]
  ↓  with the surrounding text token embeddings → inputs_embeds
LLM
  ↓  self.model(inputs_embeds=..., attention_mask=..., ...)      [geochat/model/language_model/geochat_llama.py::
  ↓  → self.lm_head(hidden_states)                                 GeoChatLlamaForCausalLM.forward]
  ↓  (self.model is GeoChatLlamaModel(GeoChatMetaModel, LlamaModel) — an
  ↓   otherwise-stock transformers LlamaModel)
Answer
  ↓  tokenizer.batch_decode(output_ids[:, input_len:], skip_special_tokens=True)  [inference scripts, e.g.
                                                                                     geochat/eval/batch_geochat_vqa.py]
```

Every arrow above is **VERIFIED FROM SOURCE** against the exact function named. No step in this chain is GeoChat-specific architecture beyond the CLIP position-embedding interpolation (§2) — the projector, splicing mechanism, and LLM wiring are structurally identical to LLaVA-1.5 (same class-naming pattern, same Apache header crediting Haotian Liu in `geochat_arch.py`/`geochat_llama.py`).

---

## 2. Image Pipeline

| Question | Answer | Status |
|---|---|---|
| Original expected image size | CLIP ViT-L/14-336's native training resolution is 336×336 (`openai/clip-vit-large-patch14-336`), but GeoChat **never actually feeds it 336px** — every call site hardcodes 504. | VERIFIED FROM SOURCE (config identity from `GEOCHAT_BASELINE.md` §3; override confirmed in `mm_utils.py`, `train.py`, all `geochat/eval/batch_geochat_*.py`) |
| Resize/crop/padding behaviour | `expand2square()`: pads the shorter side with the CLIP processor's mean color to make the image square (no cropping, no stretching of content) — then `CLIPImageProcessor.preprocess(image, do_resize=True, crop_size={'height':504,'width':504}, size={'shortest_edge':504})` resizes the square canvas to exactly 504×504. | VERIFIED FROM SOURCE, `geochat/mm_utils.py` |
| Why 504×504 | Not stated as a design rationale anywhere in the repo (no comment, no doc explains "why 504" specifically, as opposed to some other larger number) — the only verifiable fact is *how*: `CLIPVisionTower.clip_interpolate_embeddings(image_size=504, patch_size=14)` is hardcoded as the default argument at both its call sites (`__init__`'s eager branch and `load_model()`), and this determines the resolution the interpolated position-embedding table is sized for. README.md only says this "increased resolution" helps handle "high-resolution RS imagery" and small objects — no numeric justification for 504 specifically is given. | Mechanism: VERIFIED FROM SOURCE. Rationale for the specific number 504: UNKNOWN — SOURCE DOES NOT ESTABLISH THIS (README gives only a qualitative reason, not a derivation). |
| CLIP patch size | 14 (ViT-L/14) | VERIFIED FROM SOURCE, `clip_interpolate_embeddings(..., patch_size=14)` and confirmed by config identity in `GEOCHAT_BASELINE.md` |
| Resulting spatial patch grid | 504 / 14 = **36 × 36** patches | VERIFIED FROM SOURCE (arithmetic from the hardcoded 504/14 values; `clip_interpolate_embeddings` explicitly computes `image_size // patch_size` as the new 1-D grid side) |
| Number of visual tokens | 36 × 36 = **1296** patch tokens per image (CLS token dropped by `feature_select()`'s `select_feature == 'patch'` branch, which does `image_features[:, 1:]`) | VERIFIED FROM SOURCE, `clip_encoder.py::feature_select` |
| Positional embedding interpolation | Bicubic 2-D interpolation (`torch.nn.functional.interpolate(..., mode='bicubic', align_corners=True)`) of the CLIP checkpoint's native 24×24 position-embedding grid (336/14) up to 36×36, CLS-token position embedding left untouched and re-concatenated, then the whole `position_embedding` module is replaced with a freshly-sized `nn.Embedding(1297, hidden_dim)` loaded from the interpolated weights. | VERIFIED FROM SOURCE, `clip_encoder.py::clip_interpolate_embeddings` (full derivation already in `GEOCHAT_TRAINING_PIPELINE.md` §3) |
| Exact tensor shapes (verifiable from source) | Input image tensor: `[3, 504, 504]`. CLIP hidden states at layer -2 before CLS-drop: `[batch, 1297, 1024]`. After `feature_select` (`'patch'`): `[batch, 1296, 1024]`. After `mm_projector` (`mlp2x_gelu`, `Linear(1024→4096)…Linear(4096→4096)`): `[batch, 1296, 4096]`. `4096` = Vicuna-7B-v1.5's `hidden_size`, `1024` = CLIP-L's `mm_hidden_size` (both from `config.json`, per `GEOCHAT_BASELINE.md` §3). | VERIFIED FROM SOURCE, cross-referenced against `GEOCHAT_BASELINE.md`'s config.json facts |

**Do not confuse (explicitly addressed per the prompt's instruction):**
- **The `<image>` sentinel token**: a literal substring `"<image>"` in the *text* prompt string, converted by `tokenizer_image_token()` into exactly **one** `-200` integer placed in the `input_ids` tensor. It is one position in the token-id sequence.
- **Visual patch embeddings**: the 1296 real-valued vectors (each width 4096, post-projection) produced by CLIP+MLP. They never pass through the LLM's `nn.Embedding` lookup table — they are concatenated directly into `inputs_embeds`.
- **Actual sequence positions**: the final `inputs_embeds` sequence length is `(len(input_ids) - 1) + 1296` (the one `-200` slot is removed and replaced by 1296 slots) — i.e. the sequence *grows* by 1295 positions relative to the raw tokenized prompt length. This expansion is exactly why `prepare_inputs_labels_for_multimodal` also independently re-pads `attention_mask`/`labels` to match the new, longer length (see `geochat_arch.py`'s post-loop `if any(x.shape != new_input_embeds[0].shape ...)` branch, and `GEOCHAT_TRAINING_PIPELINE.md` §2 for the full mechanics).

---

## 3. Multimodal Token Injection

**VERIFIED FROM SOURCE**, `geochat/constants.py` + `geochat/mm_utils.py::tokenizer_image_token` + `geochat/model/geochat_arch.py::prepare_inputs_labels_for_multimodal`:

- `IMAGE_TOKEN_INDEX = -200` (`geochat/constants.py`). Chosen negative specifically so it can never collide with a real vocabulary id (LLaMA/Vicuna vocab is 32000 + a handful of added tokens, all ≥ 0).
- **Where the sentinel is created**: `tokenizer_image_token(prompt, tokenizer, ...)` splits the prompt string on the literal substring `"<image>"`, tokenizes each surrounding text chunk independently with the real tokenizer, and interleaves the integer `-200` between chunks (preserving a leading BOS token if the first chunk starts with one).
- **Where the sentinel is detected**: `prepare_inputs_labels_for_multimodal()` — `image_token_indices = torch.where(cur_input_ids == IMAGE_TOKEN_INDEX)[0]`, iterated per-sample in the batch, inside a `while image_token_indices.numel() > 0:` loop (supporting more than one image per sample if more than one sentinel is present — see the multi-image note in `GEOCHAT_TRAINING_PIPELINE.md` §2).
- **Where visual embeddings are inserted**: in that same loop, `cur_new_input_embeds` is built by appending (a) the text-embedding slice up to the sentinel position (`self.get_model().embed_tokens(cur_input_ids[:image_token_start])`), then (b) the full `[1296, 4096]` `cur_image_features` block, then continuing with the remaining text after the sentinel. The concatenated result becomes `inputs_embeds`, and `input_ids` is discarded (`return None, ...` for `input_ids` in the function's return tuple) — the LLM is called with `inputs_embeds=` from this point on, never `input_ids=`.
- **How labels are aligned**: `cur_new_labels` is built in lockstep with `cur_new_input_embeds` — wherever 1296 image-embedding vectors are inserted into the embeds, exactly 1296 `IGNORE_INDEX` (`-100`) values are inserted into the labels at the same relative position (`torch.full((cur_image_features.shape[0],), IGNORE_INDEX, ...)`). This guarantees `labels.shape == inputs_embeds.shape[:2]` even though the original `input_ids`/`labels` from the dataset only had one placeholder position for the whole image.
- **How `IGNORE_INDEX` is used**: `IGNORE_INDEX = -100` (`geochat/constants.py`) is PyTorch's standard `CrossEntropyLoss` ignore value. It is used in (a) the text-level masking done in `train.py::preprocess_v1` (masks system prompt + user turns + the placeholder position itself, before splicing — see §4), and (b) the embedding-splice-level masking just described (masks the *expanded* 1296-position image span, independent of and in addition to (a)).
- **Whether image start/end tokens are actually enabled**: **No.** `DEFAULT_IM_START_TOKEN = "<im_start>"` and `DEFAULT_IM_END_TOKEN = "<im_end>"` exist as constants and as dead-code branches (`if model_args.mm_use_im_start_end: ...` in `preprocess_multimodal`, `initialize_vision_tokenizer`, and the alternate splicing branch inside `prepare_inputs_labels_for_multimodal`), but `scripts/finetune_lora.sh` — the one script actually adapted for GeoChat — passes `--mm_use_im_start_end False`. So the plain `<image>` sentinel path is what GeoChat actually uses; the start/end-token machinery is present in the codebase but inert for the released checkpoint. (VERIFIED FROM SOURCE: the flag's value in `finetune_lora.sh`, cross-checked against the `if/else` branching in `geochat_arch.py`.)

---

## 4. Conversation + Training Labels

**VERIFIED FROM SOURCE**, full derivation already exists in `GEOCHAT_TRAINING_PIPELINE.md` §4/§6; restated here in the exact chain the task asked for, with file/function per arrow:

```
JSON conversation                {"image": "...", "conversations": [{"from":"human","value":"..."}, {"from":"gpt","value":"..."}, ...]}
        ↓                        [geochat/train/train.py::LazySupervisedDataset.__getitem__ reads this schema —
        ↓                         see §7 for the fact that the actual GeoChat_Instruct.json file was not available to confirm this is its literal on-disk schema]
prompt construction              preprocess_multimodal() moves "<image>" to the front of the first human turn, prepends "\n";
        ↓                        geochat/conversation.py::Conversation.get_prompt() (conv_vicuna_v1, SeparatorStyle.TWO) renders:
        ↓                        "<system> USER: <image>\n<question> ASSISTANT: <answer></s>USER: ... ASSISTANT: ...</s>"
tokenization                     geochat/mm_utils.py::tokenizer_image_token() — splits on "<image>", tokenizes chunks,
        ↓                        inserts -200 sentinel (see §3)
input_ids                        one flat LongTensor per example, containing one -200 entry
        ↓
labels                           train.py::preprocess_v1(): targets = input_ids.clone()
        ↓
masked instruction tokens        preprocess_v1(): splits the rendered string on sep2 ("</s>") into per-round chunks; for each
        ↓                        round, splits on sep (" ASSISTANT: ") into [prefix, answer]; sets
        ↓                        target[cur_len : cur_len+instruction_len] = IGNORE_INDEX for the prefix span
        ↓                        (system prompt + "USER:" + question + the not-yet-expanded image placeholder + "ASSISTANT: ")
assistant-only loss              only the tokenized `answer` text plus the trailing "</s>" for every round keeps its real
                                 token id in `labels`; everything else is -100. Cross-entropy in
                                 geochat/model/language_model/geochat_llama.py::GeoChatLlamaForCausalLM.forward()
                                 (`CrossEntropyLoss()` on shifted logits/labels) therefore only ever receives gradient
                                 signal from assistant-turn tokens.
```

**Which tokens explicitly contribute to training loss (direct answer to the task's question):** only the assistant (`"gpt"`-role) turn's own generated text tokens, plus the literal `"</s>"` end-of-turn token, for every round of a multi-turn conversation. System prompt, every user turn's text, the `<image>` placeholder token itself (pre-splice) and its expanded 1296-position image-embedding span (post-splice, masked a second time — see §3) are all excluded from the loss via `-100`.

A real failure mode also confirmed in source: if `preprocess_v1`'s running length accounting doesn't exactly match the tokenizer's actual output length for a given example (`cur_len != total_len`), the **entire example's** labels are silently set to all-`-100` (only a printed warning, no exception) — that example then contributes zero gradient at all rather than a partially-correct one. (VERIFIED FROM SOURCE, `train.py::preprocess_v1`.)

---

## 5. LoRA Training

**Instruction, honored**: `scripts/finetune_qlora.sh` is **not** treated as authoritative here. Source inspection proves it is not GeoChat-specific — it invokes `deepspeed llava/train/train_mem.py` (a module path that does not exist in this repository, which only has `geochat/train/train_mem.py`), targets `openai/clip-vit-large-patch14` (224px-native, not the `-336` tower GeoChat actually uses), omits `--mm_projector_type mlp2x_gelu` and `--image_aspect_ratio pad`, and points at generic `llava_instruct_80k.json`/`coco/train2017` paths. It is unmodified upstream LLaVA boilerplate. **`scripts/finetune_lora.sh` is the script actually adapted for GeoChat** (correct `geochat/train/train_mem.py` entry point, `clip-vit-large-patch14-336`, `mlp2x_gelu`, `image_aspect_ratio pad`, `GeoChat_Instruct.json` placeholder path) and is the authoritative source for this section.

| Item | Value | Source | Status |
|---|---|---|---|
| Base model | `path/to/base/llavav1.5-7b` (i.e. LLaVA-1.5-7B checkpoint, itself Vicuna-7B-v1.5 + pretrained CLIP+projector) | `--model_name_or_path` in `finetune_lora.sh` | VERIFIED FROM SOURCE |
| Vision tower | `openai/clip-vit-large-patch14-336` | `--vision_tower` in `finetune_lora.sh` | VERIFIED FROM SOURCE |
| Projector | `mlp2x_gelu`, initialized from `path/to/llava-v1.5-mlp2x-336px-pretrain-vicuna-7b-v1.5/mm_projector.bin` | `--mm_projector_type`, `--pretrain_mm_mlp_adapter` in `finetune_lora.sh` | VERIFIED FROM SOURCE |
| LoRA target modules | `find_all_linear_names(model)` — every `nn.Linear` in the model **except** ones whose name contains `mm_projector`/`vision_tower`/`vision_resampler`, and excluding `lm_head` | `geochat/train/train.py::find_all_linear_names` | VERIFIED FROM SOURCE |
| LoRA rank (`r`) | **not overridden** by `finetune_lora.sh` (only `--lora_enable True` is passed) → falls back to the `TrainingArguments` dataclass default, **`64`** | `train.py`, `TrainingArguments.lora_r: int = 64` | VERIFIED FROM SOURCE |
| LoRA alpha | not overridden → default **`16`** | `TrainingArguments.lora_alpha: int = 16` | VERIFIED FROM SOURCE |
| LoRA dropout | not overridden → default **`0.05`** | `TrainingArguments.lora_dropout: float = 0.05` | VERIFIED FROM SOURCE |
| Learning rate | `finetune_lora.sh`: `--learning_rate 2e-4`. **README.md's hyperparameter table states `2e-5`.** | Both files | **DISCREPANCY — reported, not resolved.** VERIFIED FROM SOURCE that both values exist; which was actually used for the released checkpoint is UNKNOWN — SOURCE DOES NOT ESTABLISH THIS. |
| Epochs | `1` | `--num_train_epochs 1` (matches README table) | VERIFIED FROM SOURCE |
| Batch size | `--per_device_train_batch_size 32`, `--gradient_accumulation_steps 1`. README states global batch size 144 on 3 GPUs (`32×1×3=96≠144`). | Both files | **DISCREPANCY — reported, not resolved.** |
| Precision | `--bf16 True`, `--tf32 True` | `finetune_lora.sh` | VERIFIED FROM SOURCE |
| Max sequence length | `2048` | `--model_max_length 2048` (matches README) | VERIFIED FROM SOURCE |
| DeepSpeed configuration | `--deepspeed ./scripts/zero2.json` → **ZeRO stage 2** (confirmed by `"stage": 2` in `scripts/zero2.json`). README.md's prose says "Training script with DeepSpeed ZeRO-3" — **contradicts the script's actual flag.** | `finetune_lora.sh`, `scripts/zero2.json`, `README.md` | **DISCREPANCY — reported, not resolved.** |
| Which parameters are frozen | Vision encoder (CLIP): unconditionally, hardcoded (`vision_tower.requires_grad_(False)` inside `CLIPVisionTower` itself, independent of any training flag). LLM base weights: frozen by `peft.get_peft_model()`. `lm_head`: frozen (excluded from LoRA targets, and no code path re-enables it when `mm_use_im_start_end=False`, which is GeoChat's setting). `embed_tokens`: frozen for the same reason. | `clip_encoder.py`; `train.py` (`find_all_linear_names`, `initialize_vision_tokenizer`) | VERIFIED FROM SOURCE |
| Which parameters are trainable | LoRA adapter weights (rank 64) on the LLM's non-multimodal `Linear` layers. `mm_projector`: trainable — **but only as an emergent side effect of code ordering**, not an explicit flag: `get_peft_model()` is called *before* `initialize_vision_modules()` constructs the (fresh, `requires_grad=True`-by-default) `mm_projector` module, so it is never included in PEFT's freeze pass and no flag (`tune_mm_mlp_adapter`/`freeze_mm_mlp_adapter`, both default `False` and unset by `finetune_lora.sh`) touches it either way. | `train.py::train()`, exact call order | VERIFIED FROM SOURCE — this ordering dependency is not documented anywhere in README/LoRA.md/MODEL_ZOO.md. |

**QLoRA code-path status (relevant to §12/adaptation planning):** `train.py` itself has fully-wired `--bits {4,8,16}` support (`BitsAndBytesConfig`, `peft.prepare_model_for_kbit_training`) independent of which shell script invokes it — the gap is only that no committed script correctly combines GeoChat's real architecture args (from `finetune_lora.sh`) with the quantization args (from the otherwise-irrelevant `finetune_qlora.sh`). VERIFIED FROM SOURCE.

---

## 6. Grounding / Region Capability

**VERIFIED FROM SOURCE (mechanism, not exact grammar):**

- Three literal, plain-text task prefixes trigger grounding-family behavior — these are ordinary sub-word text, **not** tokenizer special tokens (never passed to `tokenizer.add_tokens`):
  - `"[grounding]" + question` — grounded scene description (`geochat/eval/batch_geochat_grounding.py`, `type != 'ref'` branch)
  - `"[refer] Give me the location of <p> " + expression + " </p>"` — referring-expression localization (`batch_geochat_grounding.py`, `type == 'ref'` branch)
  - `"[identify] What is the object present at " + region_description` — reverse localization / region → identity (`geochat/eval/batch_geochat_referring.py`)
- README.md states the LLM "can generate natural language responses interleaved with corresponding object locations" and the paper abstract (external, `arxiv.org/abs/2311.15826`) says grounding is expressed via "spatial coordinates" — both describe **text output from the LLM**, not a structured/regression head. No bounding-box regression layer, no RoI head, no coordinate-embedding module exists anywhere in `geochat/model/`.
- The evaluation JSONL schema consumed by `batch_geochat_grounding.py`/`batch_geochat_referring.py` carries fields `question_id`, `image_id`, `type`, `dataset`, `ground_truth`, `obj_ids`, `size_group` — confirming ground truth for grounding/referring is stored and compared as data, but the **field's actual string format is never printed, parsed, or regex-matched anywhere in the inspected scripts** — the code treats `ground_truth` as an opaque string it writes back out for external (unseen) evaluation tooling to compare against the model's free-text `answer`.

**Explicitly per the task's requirement:**
- Exact textual coordinate grammar (e.g., whether boxes are written as normalized `{<x1><y1><x2><y2>}`-style strings, pixel coordinates, or rotated-box parameters — README's qualitative image captions mention "rotated bounding boxes" for referring-expression results, but no code confirms the literal string format the LLM is trained to emit): **UNKNOWN — SOURCE DOES NOT ESTABLISH THIS.**
- Whether region *input* (e.g., "at region X" in `[identify]`'s prompt) is itself a coordinate string embedded as plain text in `questions[j]['question']`, or something else: **UNKNOWN — SOURCE DOES NOT ESTABLISH THIS** (the eval script only shows string concatenation of an already-opaque `question` field; its contents were never inspected because the actual data file is not in the repository).
- Whether masks (as opposed to boxes) are ever produced or consumed: **UNKNOWN — SOURCE DOES NOT ESTABLISH THIS.** No segmentation-mask handling code exists anywhere in `geochat/`.

**Conclusion relevant to SIH26167:** GeoChat's grounding is a prompt-and-generate convention layered on an otherwise-generic causal LM, with an unverified output grammar. It cannot be assumed, without further investigation, to produce bounding boxes in a format directly usable for the PS's "bounding boxes, or masks, as applicable" evaluation deliverable.

---

## 7. Inference Pipeline

**VERIFIED FROM SOURCE**, traced through `geochat/conversation.py::Chat` (used by the Gradio demo, `geochat_demo.py`/`geochat/serve/gradio_web_server.py`) and the batch eval scripts (`geochat/eval/batch_geochat_*.py`), both of which converge on the same underlying model call:

```
user question + image
        ↓                Chat.upload_img() appends DEFAULT_IMAGE_TOKEN+'\n' as a new human turn
        ↓                [geochat/conversation.py::Chat.upload_img, .ask]
prompt                   conv.append_message(conv.roles[1], None); prompt = conv.get_prompt()
        ↓                [geochat/conversation.py::Chat.answer_prepare / Conversation.get_prompt]
image preprocessing      process_images_demo(images, image_processor) — same expand2square + hardcoded
        ↓                504×504 CLIPImageProcessor.preprocess() call as training (§2)
        ↓                [geochat/mm_utils.py::process_images_demo]
multimodal embedding     text_input_ids = tokenizer_image_token(prompt, tokenizer, IMAGE_TOKEN_INDEX, ...)
        ↓                → model.generate(input_ids=..., images=..., ...) → internally, every forward()
        ↓                call re-invokes prepare_inputs_labels_for_multimodal() (§3); on the FIRST decode
        ↓                step (full prompt, input_ids.shape[1] > 1) it does the real image-splice; on
        ↓                every SUBSEQUENT decode step (input_ids.shape[1] == 1, using the KV cache) the
        ↓                function's own early-exit (`if ... input_ids.shape[1] == 1: return input_ids,
        ↓                attention_mask, past_key_values, None, labels`) skips vision processing entirely
        ↓                [geochat/model/geochat_arch.py::prepare_inputs_labels_for_multimodal;
        ↓                 geochat/model/language_model/geochat_llama.py::GeoChatLlamaForCausalLM.forward,
        ↓                 .prepare_inputs_for_generation]
LLM generation            HuggingFace `generate()` (stock `transformers` generation loop) with
        ↓                 `KeywordsStoppingCriteria` watching for the conversation's stop string (`conv.sep`
        ↓                 or `conv.sep2` depending on `sep_style`) [geochat/mm_utils.py::KeywordsStoppingCriteria]
decoded answer            tokenizer.batch_decode(output_ids[:, input_token_len:], skip_special_tokens=True),
                          then stop-string stripped [geochat/eval/batch_geochat_vqa.py and siblings;
                          geochat/conversation.py::Chat.model_generate for the interactive demo path]
```

**Exact entry points**: `geochat/model/builder.py::load_pretrained_model()` is the single shared model/tokenizer/image-processor loading entry point used by both the batch eval scripts and (indirectly, via `geochat/serve/`) the Gradio demo — it handles the plain, LoRA-unmerged, and 8-bit/4-bit-quantized loading paths (VERIFIED FROM SOURCE, already documented in full in `GEOCHAT_BASELINE.md`/`GEOCHAT_TRAINING_PIPELINE.md`). Decoding parameters observed in the eval scripts: `do_sample=False, num_beams=1, max_new_tokens=256, length_penalty=2.0` (greedy decoding — README explicitly states evaluation uses greedy decoding, not beam search, "to make the inference process consistent with the chat demo").

No confidence score, structured output, or execution trace is produced anywhere in this pipeline — `generate()` returns token ids and nothing else; there is no logit-based confidence estimate exposed by any inspected script. **VERIFIED FROM SOURCE (absence).**

---

## 8. SatQuery Adaptation Boundary

| Component | Classification | Justification |
|---|---|---|
| Vision encoder (CLIP ViT-L/14, 504px-interpolated) | **MUST PRESERVE INITIALLY** for the single-image optical/RGB path; **MUST REPLACE/EXTEND** for SAR and >3-band multispectral input | CLIP's patch embedding is a `Conv2d` fixed to 3 input channels (standard CLIP architecture); nothing in the inspected code adapts it to arbitrary band counts or radar backscatter statistics. BigEarthNet's Sentinel-1 SAR (VV/VH, 2 channels) and Sentinel-2 optical (up to 12 bands) cannot be fed through this encoder unmodified. |
| Image resolution (504×504, fixed single crop, no tiling) | **SAFE TO ADAPT** | Resolution and crop/pad strategy are ordinary preprocessing constants, not hard architecture; no anyres/multi-tile support exists (`image_grid_pinpoints` is always `None`), so full Cartosat-2S/RISAT scenes will need an external tiling step regardless of what resolution is chosen. |
| Projector (`mlp2x_gelu`) | **MUST PRESERVE INITIALLY** | Standard, well-understood LLaVA-style alignment layer; retraining (not rewriting) it is the normal adaptation path already built into `train.py`. |
| LLM (Vicuna-7B-v1.5) | **SAFE TO ADAPT** | Nothing in `geochat_arch.py`'s meta-architecture is Vicuna-specific beyond the `LlamaModel`/`LlamaForCausalLM` base classes; a smaller or different LLaMA-family checkpoint could be substituted for latency/VRAM reasons without touching the multimodal wiring, at the cost of re-running/re-verifying the LoRA recipe. |
| Tokenizer | **MUST PRESERVE INITIALLY** (tied 1:1 to whichever LLM is chosen) | Swapping the LLM requires swapping the tokenizer in lockstep; not an independent decision. |
| Conversation format (`conv_vicuna_v1`, single `<image>` sentinel per turn) | **SAFE TO ADAPT** | The template renderer (`Conversation.get_prompt`) and masking logic (`preprocess_v1`) are generic string-processing, not architecture; however, extending it to name multiple distinct image slots in one turn (needed for optical+SAR pairs and bi-temporal pairs, see below) is genuinely new work, not present in any inspected file. |
| Dataset (`GeoChat_Instruct`, single-image optical RS instruction data) | **MUST REPLACE/EXTEND** | GeoChat_Instruct is single-image, optical-only (per `docs/Data.md`/README and the HF card's named source datasets — none of which are BigEarthNet, VRSBench, RSVQA, or CDVQA). It contains no cross-modal or multitemporal examples. The PS's mandatory BigEarthNet-based adaptation and VRSBench/RSVQA/CDVQA evaluation are entirely disjoint from what GeoChat was built on. |
| Grounding representation | **UNKNOWN** (mechanism verified, exact grammar not) → practically **MUST REPLACE/EXTEND** | Per §6, the coordinate output format cannot be verified from source; building a PS-compliant, auditable bounding-box/mask output cannot safely inherit GeoChat's unverified convention without first reverse-engineering or simply replacing it with a defined, tested format. |
| Training objective (causal-LM cross-entropy on assistant tokens, via LoRA) | **MUST PRESERVE INITIALLY** for text/VQA-style outputs; **MUST REPLACE/EXTEND** for anything requiring dense pixel output | A pure next-token text objective cannot natively produce the PS's "spatial change map" or "reference masks" deliverables — those require an auxiliary model/head with a different loss entirely (e.g. a segmentation or change-detection network), which GeoChat's codebase does not contain in any form. |
| Inference layer (CLI/Gradio, single request → single generated answer) | **MUST REPLACE/EXTEND** | Zero orchestration, task-classification, multi-model routing, confidence estimation, or structured execution-trace logic exists anywhere in `geochat/serve/` or the eval scripts (§7's "absence" finding) — the PS's entire "Agentic Model and Tool Orchestration" section is unaddressed by GeoChat as-is. |

---

## 9. SIH Mapping

| SIH Requirement | GeoChat Provides? | Evidence | What SatQuery Must Add |
|---|---|---|---|
| Single-image VQA (mandatory baseline) | **Yes, partially** — architecturally and via its own evaluation harness | `geochat/eval/batch_geochat_vqa.py`; `docs/Evaluation.md` documents evaluation against LRBEN/HRBEN (INFERRED to be the RSVQA-LR/RSVQA-HR benchmarks by dataset-name convention and Zenodo record identity — this lineage is not itself stated inside the GeoChat repo, so marked INFERRED, not VERIFIED FROM SOURCE) | Re-adaptation/fine-tuning so the VQA capability is demonstrably grounded in the PS's own mandated data (BigEarthNet-derived adaptation) and evaluated on the PS's actual named benchmarks (VRSBench, RSVQA) rather than assumed transferable from GeoChat's original tuning. |
| Captioning / scene description OR text-guided region grounding (one mandatory, single-image) | **Partially** — both exist as separate capabilities | Scene classification: `geochat/eval/batch_geochat_scene.py`. Captioning: README overview text claims "image and region captioning" ability; not independently traced to a captioning-specific eval script in this pass (only scene-classification and VQA/grounding eval scripts were inspected). Grounding: `[grounding]`/`[refer]` task tokens (§6). | If grounding is the chosen path, the output-format gap in §6 must be closed and validated against VRSBench's grounding annotations specifically before it can be claimed to satisfy this requirement. |
| Multi-image change analysis (change description or change-VQA, mandatory) | **No** | No code path, task token, training-data reference, or architecture component for two-image/temporal input was found anywhere in `geochat/`. `prepare_inputs_labels_for_multimodal`'s multi-image support (§2) handles multiple `<image>` sentinels *within one turn's text*, generically — there is no evidence it was ever trained or evaluated for a "before/after" semantic, and no "[change]"-style task token exists. | An entirely new change-VQA/change-description component (likely a separate model architecture, e.g. a Siamese/pair-encoder over BigEarthNet-style bi-temporal patches, or fine-tuning a VLM on CDVQA specifically), since GeoChat provides no starting point here at all. |
| Cross-modal optical+SAR pair analysis (mandatory) | **No** | CLIP's vision tower is a fixed 3-channel RGB encoder (standard CLIP `Conv2d` patch embedding); no SAR-specific channel handling, dual-encoder fusion module, or optical-SAR joint-embedding code exists anywhere in `geochat/model/`. | A dedicated fusion/joint-embedding component (e.g. a second encoder branch for SAR, or a late-fusion strategy combining independent optical and SAR model outputs) — GeoChat contributes nothing here beyond, at best, its optical-only encoder as one half of a fusion pipeline someone else must build. |
| GeoTIFF/TIFF ingestion with multiband/SAR support | **No** | Every inspected image-loading call site uses `PIL.Image.open(path).convert('RGB')` (`train.py`, `mm_utils.py`) — PIL can technically open some GeoTIFFs but `.convert('RGB')` silently collapses/discards any band beyond the first three and drops all georeferencing/CRS metadata; no `rasterio`/`GDAL`/`osgeo` import exists anywhere in the codebase. | A proper geospatial raster-ingestion layer (rasterio/GDAL-based) with explicit band selection, SAR-appropriate normalization (radar backscatter is not natural-image-like and CLIP's ImageNet-derived mean/std normalization is inappropriate for it), and metadata/CRS preservation for downstream coordinate-referenced outputs. |
| Agentic orchestration (task classification, model/tool registry, execution trace, confidence) | **No** | Confirmed absent in §7 — GeoChat is a single monolithic model invoked directly by a CLI/Gradio wrapper; no registry, router, or trace-generation code exists. | The entire agentic controller layer: query→task classification, input compatibility checking (format/modality/band count), a tool registry of specialist models (VQA/captioning/grounding, change-VQA, optical-SAR fusion), output combination, confidence estimation, and an auditable execution-summary generator — none of this can be adapted from GeoChat; it is new system-level engineering sitting *around* whichever specialist model(s) are chosen. |
| Remote-sensing domain adaptation (mandatory — "a generic LLM/VLM without RS adaptation will not satisfy the requirements") | **Partially / arguably** | GeoChat itself is LoRA-adapted (§5) to remote-sensing instruction data (`GeoChat_Instruct`) — it is not a "generic" VLM in that narrow sense. But its adaptation corpus is unrelated to BigEarthNet/VRSBench/RSVQA/CDVQA (the PS's named datasets), and it has never seen SAR or multitemporal RS data. | Additional fine-tuning/domain-adaptation specifically incorporating BigEarthNet (the PS's mandated minimum) is required regardless of whether GeoChat is used as the starting checkpoint, since GeoChat's own adaptation lineage does not, by itself, satisfy the PS's specific dataset mandate. |
| Interactive GUI/web application | **Partially** | `geochat/serve/gradio_web_server.py` + `geochat_demo.py` provide a working Gradio chat UI for single-image conversation. | Upload/compatibility-checking UI for multi-image and paired-image inputs, visual-evidence overlays (bounding boxes/change maps), confidence display, downloadable execution-summary reports — none of this exists in the current Gradio demo, which is a plain chat interface. |
| Evaluation against ISRO/SAC Cartosat-2S/RISAT data | **No basis to claim transfer** | GeoChat's training/eval data provenance (GeoChat_Instruct + LRBEN/HRBEN/UCMerced/AID/GeoChat-Bench, per `docs/`) shows no evidence of Indian-satellite-sensor imagery (Cartosat-2S, RISAT) anywhere in its pipeline. | Zero-shot transfer to Cartosat-2S/RISAT imagery must be empirically validated, not assumed; budget for a validation pass against representative Indian-sensor imagery before relying on any GeoChat-derived component for the ISRO/SAC evaluation set. |

---

## 10. Final Recommendation

**1. Should SatQuery fork/adapt GeoChat?**
Yes, but strictly as **one specialist tool inside the agentic system** — the single-image optical VQA/captioning/grounding specialist — not as the SatQuery system itself. §9 shows GeoChat provides zero coverage of the PS's three other mandatory pillars (multi-image change analysis, cross-modal optical-SAR fusion, agentic orchestration), and even its "RS adaptation" credential doesn't automatically transfer to satisfying the PS's specific BigEarthNet/VRSBench/RSVQA/CDVQA mandate (§9) — that requires its own additional fine-tuning pass regardless.

**2. What part of GeoChat should become the SatQuery VLM?**
The architecture + training recipe: `GeoChatLlamaForCausalLM` (CLIP-504 → `mlp2x_gelu` → Vicuna-7B-v1.5) together with `geochat/train/train.py`'s LoRA fine-tuning pipeline, re-run (not reused as-is) on data that actually includes BigEarthNet-derived and/or VRSBench-style instruction examples, so the resulting specialist's domain-adaptation lineage is defensible against the PS's own evaluation datasets rather than inherited from GeoChat's original, disjoint training corpus.

**3. What functionality must remain outside GeoChat?**
The agentic controller/task router and tool registry; the optical–SAR fusion/joint-analysis component; the bi-temporal change-detection/change-VQA component; the GeoTIFF/SAR-aware ingestion and compatibility-checking layer (rasterio/GDAL-based, replacing GeoChat's PIL-`.convert('RGB')` loader); confidence estimation and auditable execution-summary generation; and the multi-image-aware GUI shell. None of this exists in GeoChat's codebase in any form (§7, §9).

**4. What should be implemented BEFORE fine-tuning?**
(a) A GeoTIFF/TIFF + SAR ingestion pipeline with explicit band handling, since GeoChat's own loader cannot be trusted with anything beyond 3-band RGB (§9); (b) a fixed internal image/tensor contract between that ingestion layer and whatever single-image VLM specialist is chosen, so the specialist's fine-tuning data pipeline is built against the same contract from day one; (c) the agentic controller's task-classification/tool-registry skeleton, so integration boundaries (what a "tool" must accept/return) are settled before committing GPU-hours to any one specialist's fine-tuning; (d) a decision on the grounding output format (§6's unresolved grammar), since retrofitting a coordinate convention after data has already been prepared in the wrong shape is expensive.

**5. What should NOT be modified yet?**
The internal multimodal-splicing mechanism (`prepare_inputs_labels_for_multimodal`) and the `clip_interpolate_embeddings` position-embedding surgery (§2/§3) — both are subtle, already-working, and non-trivial to reproduce correctly if broken. Before touching either, first confirm GeoChat (vs. some other base VLM) is actually the chosen single-image specialist once the GeoTIFF/SAR/multi-image ingestion requirements are scoped in full — a different base model might be selected for reasons unrelated to these internals (e.g. license, size, easier multi-band adaptation).

**6. Top unresolved technical risks:**
- CLIP ViT-L/14 has no verified path in GeoChat's code for anything beyond 3-channel RGB — both BigEarthNet's multiband Sentinel-2 optical data and any SAR input require new encoder/preprocessing work that sits entirely outside GeoChat.
- No bi-temporal/change-detection capability exists in GeoChat in any form — this is the PS's *principal* focus, and it is the single largest gap between what GeoChat provides and what the PS mandates.
- The grounding coordinate output format is unverified from source (§6); it is unsafe to assume GeoChat's grounding text can be mechanically converted into the bounding-boxes/masks format the PS's evaluation expects without first confirming (or independently defining) that grammar.
- `transformers==4.31.0`-era code compatibility with a modern deployment stack is an open risk (already flagged in `GEOCHAT_TRAINING_PIPELINE.md` §12) that affects how cleanly this specialist can be embedded in a modern agentic web-app backend.
- Vicuna-7B's inference latency/VRAM footprint, multiplied across a pipeline that may need to run several specialist models (VQA/grounding specialist + change-VQA model + fusion component) concurrently for a single user query, is an unbudgeted risk for interactive-demo hardware.
- The PS's ISRO/SAC evaluation set (Cartosat-2S optical + RISAT SAR) is a sensor domain GeoChat's training/eval provenance shows no evidence of ever having seen (§9) — zero-shot transfer risk remains even after BigEarthNet-based adaptation, since BigEarthNet itself is Sentinel-1/2 data, not Cartosat-2S/RISAT.

---

## Source File Reference (this pass)

`geochat/constants.py`, `geochat/conversation.py`, `geochat/mm_utils.py`, `geochat/model/geochat_arch.py`, `geochat/model/language_model/geochat_llama.py`, `geochat/model/multimodal_encoder/clip_encoder.py`, `geochat/model/multimodal_encoder/builder.py`, `geochat/model/multimodal_projector/builder.py`, `geochat/model/builder.py`, `geochat/train/train.py`, `geochat/train/geochat_trainer.py`, `geochat/eval/batch_geochat_vqa.py`, `batch_geochat_grounding.py`, `batch_geochat_referring.py`, `batch_geochat_scene.py`, `scripts/finetune_lora.sh`, `scripts/finetune_qlora.sh`, `scripts/zero2.json`, `docs/Data.md`, `docs/LoRA.md`, `docs/MODEL_ZOO.md`, `docs/Evaluation.md`, `README.md`, `pyproject.toml` — all at commit `4850920e005a849bd224d0ce35aa9db031fa5155`, all previously fetched and quoted in full earlier in this session and in `GEOCHAT_TRAINING_PIPELINE.md`.
