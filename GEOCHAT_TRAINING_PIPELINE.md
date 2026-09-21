# GeoChat Training Pipeline Reverse Engineering

**Scope of this pass:** source-code inspection and documentation only. No training was started, no new dataset was created, and the existing baseline inference pipeline (`GEOCHAT_BASELINE.md`) was not modified. No files were changed inside the `geochat_env` isolated environment.

**Source repository inspected:** `https://github.com/mbzuai-oryx/GeoChat`
**Commit inspected:** `4850920e005a849bd224d0ce35aa9db031fa5155` (`Thu Nov 28 16:05:13 2024 +0400`), cloned shallow (`--depth 1`) read-only into a scratch Colab container for inspection. Not installed into any active environment.
**Checkpoint inspected (architecture/config only, not weights):** `MBZUAI/geochat-7B` on Hugging Face Hub (see `GEOCHAT_BASELINE.md` §2–4 for the config.json-level facts, which are treated as already-verified and referenced here rather than re-derived).

Every claim below is tagged with its source file. Where the source code does not answer a question, it is marked **UNKNOWN** rather than filled in from generic LLaVA knowledge, per the task's ground rules.

---

## 1. Executive Summary

GeoChat is architecturally a **LLaVA-1.5 fork** (`GeoChatLlamaForCausalLM` subclasses LLaVA's meta-architecture pattern almost verbatim, down to copied Apache-license headers crediting Haotian Liu). GeoChat's actual novelty is concentrated in exactly two places in the code:

1. **A hardcoded resolution bump from CLIP's native 336×336 to 504×504**, achieved by bicubically interpolating the CLIP vision tower's learned position embeddings at load time (`geochat/model/multimodal_encoder/clip_encoder.py::clip_interpolate_embeddings`).
2. **The instruction-tuning data and task-token vocabulary** (`[grounding]`, `[identify]`, `[refer] ... <p>...</p>`) that teach the otherwise-unmodified LLaVA architecture to emit remote-sensing scene/VQA/grounding/referring answers, including textual spatial coordinates.

There is **no dedicated geospatial module, no coordinate embedding layer, no metadata channel, and no multispectral input path** anywhere in the inspected code. Grounding is achieved purely by the LLM generating coordinate text, the same paradigm as other grounded VLMs of that era (Shikra/Kosmos-2-style), not by any GeoChat-specific architecture.

The training code (`geochat/train/train.py`) already contains full, working 4-bit/8-bit QLoRA plumbing (`--bits`, `BitsAndBytesConfig`, `prepare_model_for_kbit_training`, `peft.LoraConfig`). However, the one script in the repo literally named `finetune_qlora.sh` is **stale, unmodified LLaVA-original boilerplate** that does not point at GeoChat's own training entry point or its 504px vision tower — only `finetune_lora.sh` was actually adapted for GeoChat. This is a real, non-obvious footgun for anyone assuming `finetune_qlora.sh` is ready to run.

Two numeric **discrepancies between primary sources** (README.md vs. `scripts/finetune_lora.sh`) were found and are flagged explicitly in §10 rather than silently resolved.

---

## 2. Model Architecture

**VERIFIED FROM SOURCE:**

| Property | Value | Source |
|---|---|---|
| Model class | `GeoChatLlamaForCausalLM(LlamaForCausalLM, GeoChatMetaForCausalLM)` | `geochat/model/language_model/geochat_llama.py` |
| Config class | `GeoChatConfig(LlamaConfig)`, `model_type = "geochat"`, registered via `AutoConfig.register("geochat", GeoChatConfig)` | same file |
| Inner model | `GeoChatLlamaModel(GeoChatMetaModel, LlamaModel)` | same file |
| Language model | Vicuna-7B-v1.5 (`LlamaForCausalLM`/`LlamaModel` from `transformers`) | `geochat_llama.py` + `GEOCHAT_BASELINE.md` config.json facts |
| Vision encoder | `CLIPVisionModel`/`CLIPImageProcessor` from `openai/clip-vit-large-patch14-336`, wrapped in `CLIPVisionTower` | `geochat/model/multimodal_encoder/clip_encoder.py` |
| Vision tower selection | `build_vision_tower()` accepts any `mm_vision_tower` starting with `"openai"` or `"laion"`, or a local path | `geochat/model/multimodal_encoder/builder.py` |
| Feature layer | `mm_vision_select_layer = -2` (second-to-last hidden state), `select_feature = 'patch'` (drops CLS token) | `clip_encoder.py::feature_select`, set via `--mm_vision_select_layer -2` in `scripts/finetune_lora.sh` |
| Projector | `mlp2x_gelu` = `nn.Sequential(Linear(1024,4096), GELU(), Linear(4096,4096))`, i.e. a 2-layer MLP, **not** a single linear layer | `geochat/model/multimodal_projector/builder.py::build_vision_projector` |
| Vision→LLM connection | `GeoChatMetaForCausalLM.encode_images()`: vision tower → `mm_projector` → embeddings spliced directly into the LLM's input-embedding sequence at the position of a `-200` sentinel token | `geochat/model/geochat_arch.py::encode_images`, `::prepare_inputs_labels_for_multimodal` |

**Frozen vs. trainable (verified, see full derivation in §11):**
- Vision encoder (CLIP): **unconditionally frozen** — `self.vision_tower.requires_grad_(False)` is hardcoded in both the `delay_load` and eager paths of `CLIPVisionTower.__init__`/`load_model`. There is no training flag that unfreezes it.
- LLM (Vicuna): frozen base weights; only LoRA adapter deltas train, when `--lora_enable True` is set.
- `mm_projector`: ends up **trainable** during GeoChat's actual LoRA finetuning recipe — see §11 for why this is a non-obvious, order-of-operations-dependent fact rather than an explicit flag.
- `lm_head`: explicitly excluded from the LoRA target-module list (`find_all_linear_names` in `train.py` removes `'lm_head'` "needed for 16-bit") and is not touched by any unfreezing branch when `mm_use_im_start_end=False` (GeoChat's setting) — so the output vocabulary head is entirely inherited, frozen, from base Vicuna.

**GeoChat-specific modules beyond stock LLaVA-1.5:** **none found**. `geochat_arch.py`, `geochat_llama.py`, `clip_encoder.py`, and `multimodal_projector/builder.py` are structurally identical to LLaVA-1.5's equivalents (same class names pattern, same Apache header crediting Haotian Liu), with the sole code-level addition being `clip_interpolate_embeddings()` inside `CLIPVisionTower`.

**Geographic/spatial special embeddings, tokens, or modules:** **none exist**. See §9 for full detail — grounding/referring capability is implemented as plain natural-language task-prefix strings (`[grounding]`, `[identify]`, `[refer] ... <p>...</p>`) consumed and produced as ordinary text tokens, not as any dedicated architecture component.

---

## 3. Image Processing Pipeline

**Trace of one image, dataset → model (VERIFIED FROM SOURCE, `geochat/train/train.py::LazySupervisedDataset.__getitem__` for training; `geochat/mm_utils.py::process_images`/`process_images_demo` for inference):**

1. **Load**: `PIL.Image.open(path).convert('RGB')` — plain RGB PIL load, no multispectral/GeoTIFF handling, no EXIF/geotag reading.
2. **Pad to square** (`expand2square`, duplicated verbatim in both `train.py` and `mm_utils.py`): if not already square, pastes the image onto a new square canvas of side `max(w,h)`, centered, filled with the CLIP image processor's per-channel mean color scaled to 0–255. This is the LLaVA-1.5 `image_aspect_ratio="pad"` strategy — it **preserves the aspect ratio of the actual image content** (no stretching) at the cost of adding mean-color letterbox padding.
3. **Resize/crop to a hardcoded 504×504**: `image_processor.preprocess(image, do_resize=True, crop_size={'height':504,'width':504}, size={'shortest_edge':504}, return_tensors='pt')`. This call explicitly overrides the CLIP processor's native 336×336 default — every one of `mm_utils.py::process_images`, `mm_utils.py::process_images_demo`, `train.py::LazySupervisedDataset.__getitem__`, and every `geochat/eval/batch_geochat_*.py` script independently hardcodes the same `504`/`504` literals inline. There is no single shared constant; 504 is a copy-pasted magic number repeated ~6 times across the codebase.
4. **Normalization**: standard CLIP per-channel mean/std normalization, applied inside `CLIPImageProcessor.preprocess()` (from `transformers`) — unchanged from stock CLIP.
5. **Tensor shape entering CLIP**: `[3, 504, 504]` float tensor, `.half()`/fp16 in inference paths.
6. **CLIP forward**: `CLIPVisionTower.forward()` calls `self.vision_tower(images, output_hidden_states=True)`, then `feature_select()` takes `hidden_states[-2]` and drops the CLS token (`select_feature='patch'`) → `(504/14)² = 36² = 1296` patch-token embeddings of width 1024 (CLIP-L hidden size) per image.
7. **Projection**: `mm_projector` (`mlp2x_gelu`) maps `1296 × 1024 → 1296 × 4096` (Vicuna hidden size).
8. **Splice into LLM input**: `prepare_inputs_labels_for_multimodal()` finds the single `-200` sentinel position in `input_ids` and replaces it with all 1296 projected image-embedding vectors, concatenated with the surrounding text embeddings — see §5/§6.

**Why/how 504×504 is produced (the specific ask in the prompt):**

The vision tower is CLIP ViT-L/14 pretrained at 336×336 (position-embedding table sized for `(336/14)²+1 = 577` positions). GeoChat wants a higher-resolution input for small-object remote-sensing detail, so at model-load time it **bicubically interpolates the pretrained 2D position-embedding grid** from its native 24×24 patch grid up to a 36×36 grid (`504/14 = 36`), replacing `vision_tower.vision_model.embeddings.position_embedding` with a freshly-sized `nn.Embedding(1297, hidden_dim)` loaded from the interpolated weights, and updating `embeddings.image_size`/`patch_size`/`position_ids` to match.

**Exact source function**: `CLIPVisionTower.clip_interpolate_embeddings(self, image_size=504, patch_size=14)` in `geochat/model/multimodal_encoder/clip_encoder.py`. It is called unconditionally from both `CLIPVisionTower.load_model()` and the eager branch of `__init__` — there is no flag to disable it or run at native 336px; 504 is hardcoded as the default argument value at both call sites. (This exactly matches and confirms the mechanism already found empirically in `GEOCHAT_BASELINE.md` §10 during baseline inference — this pass locates the precise function and confirms it is unconditional, not merely a data-pipeline convention.)

Mechanically, the interpolation:
- Splits off the CLS-token position embedding (not interpolated).
- Reshapes the remaining 576 positions to a `24×24×hidden_dim` grid.
- `nn.functional.interpolate(..., size=36, mode='bicubic', align_corners=True)`.
- Reshapes back to `1296×hidden_dim`, re-concatenates the CLS embedding → `1297×hidden_dim`.

**Aspect ratio**: preserved for image *content* (via mean-padding to square before resize), but the final tensor is always exactly square 504×504 regardless of original aspect ratio.

**Multiple images**: `prepare_inputs_labels_for_multimodal` in `geochat_arch.py` contains branching for `images` being a list or a 5-D tensor (concatenates, encodes, and re-splits per-sample) — the architecture is *mechanically* multi-image-capable. Whether any actual GeoChat training example uses more than one image is **UNKNOWN** — none of the inspected eval scripts or data-prompt templates show a multi-image example.

**Satellite/remote-sensing-specific preprocessing**: **none found**. No band selection, no radiometric normalization beyond generic CLIP mean/std, no georeferencing, no tiling of large scenes, no GSD-aware resizing. Preprocessing is identical in kind to standard LLaVA-1.5, only the fixed resolution differs.

---

## 4. Conversation / Prompt Format

**Default template actually used for GeoChat (VERIFIED):** `train.py::train()` sets `conversation_lib.default_conversation = conversation_lib.conv_templates["vicuna_v1"]` whenever `model_args.version` is neither `"v0"` nor `"v0.5"` nor a recognized template name — `scripts/finetune_lora.sh` sets `PROMPT_VERSION=v1`, which is not itself a key in `conv_templates` (only `"vicuna_v1"`/`"v1"` are), so it falls through to the `"vicuna_v1"` default in the `else` branch. Source: `geochat/train/train.py` lines defining `if model_args.version in conversation_lib.conv_templates: ... else: conversation_lib.default_conversation = conversation_lib.conv_templates["vicuna_v1"]`.

`conv_vicuna_v1` (from `geochat/conversation.py`):
```python
system = ("A chat between a curious user and an artificial intelligence assistant. "
          "The assistant gives helpful, detailed, and polite answers to the user's questions.")
roles = ("USER", "ASSISTANT")
sep_style = SeparatorStyle.TWO
sep = " "
sep2 = "</s>"
```
`get_prompt()` for `SeparatorStyle.TWO` builds: `system + " " + "USER: " + msg1 + " " + "ASSISTANT: " + msg2 + "</s>" + "USER: " + msg3 + " " + ...`

**Image placeholder handling**: `preprocess_multimodal()` in `train.py` strips any `<image>` token from wherever it appears in the first human turn's text and re-inserts it at the very front, followed by `"\n"`: `sentence['value'] = DEFAULT_IMAGE_TOKEN + '\n' + sentence['value']`. Since GeoChat's `finetune_lora.sh` sets `--mm_use_im_start_end False`, the plain `<image>` token is used (no `<im_start>`/`<im_end>` wrapper).

**GeoChat task-token vocabulary** (found only in `geochat/eval/batch_geochat_*.py`, prepended as plain text to the user question — these are **not** tokenizer special tokens, just literal strings the model was fine-tuned to recognize):
- `"[grounding]" + question` — grounded description task (`batch_geochat_grounding.py`)
- `"[refer] Give me the location of <p> " + expression + " </p>"` — referring-expression localization (`batch_geochat_grounding.py`, for `type=='ref'` items)
- `"[identify] What is the object present at " + region_description` — reverse-referring/identification (`batch_geochat_referring.py`)

**Real example from the original data-generation pipeline** (verbatim, `playground/data/prompts/conversation/`) — this is the **prompt template + one-shot example fed to an LLM (Vicuna/GPT) to synthesize training conversations from object-detection-derived captions**, i.e. the *data-generation-time* format, not the format GeoChat itself is trained on token-for-token:

`system_message.txt` (verbatim):
> You are an AI visual assistant, and you are seeing a single image. What you see are provided with sentences, describing the same image you are looking at. [...] Design a conversation between you and a person asking about this photo. [...] Only give definite answers.

`000_caps.txt` (the synthetic "seen" caption fed to the generator, itself derived from object-detection annotations — note the explicit positional/count language: "3 white ships anchored at harbor at the center", "5 gray small-vehicle at the bottom"):
> This is a view from above of harbor. A white ship anchored at harbor at the left. [...] 3 harbor close to each other at bottom. 3 tennis-court close to each other at top. [...]

`000_conv.txt` (the resulting synthetic Q/A pairs used as one-shot exemplar for the generator — and structurally identical to what ends up as a `conversations` list entry in the final training JSON):
> Question: How many ships are anchored at the left of the harbor? Answer: There are five white ships anchored at the left of the harbor. [...]

**The actual training-time prompt GeoChat's `train.py` builds and tokenizes** (reconstructed precisely from `preprocess_v1`/`conv_vicuna_v1.get_prompt`, using the above Q/A as a stand-in for one real pair):
```
A chat between a curious user and an artificial intelligence assistant. The assistant gives
helpful, detailed, and polite answers to the user's questions. USER: <image>
How many ships are anchored at the left of the harbor? ASSISTANT: There are five white ships
anchored at the left of the harbor.</s>USER: What is the color of the ships anchored at the
left of the harbor? ASSISTANT: The ships anchored at the left of the harbor are white in
color.</s>
```

**Multi-turn handling**: `preprocess_v1` splits the full rendered prompt on `conv.sep2` (`"</s>"`) into per-round chunks and masks each round's `"...USER: ... ASSISTANT: "` prefix independently, so an arbitrary number of alternating turns is supported natively (see §6).

**Special Q/A formatting**: Evaluation-time only (per `docs/Evaluation.md`), a fixed instruction suffix is appended for two task types:
- VQA (LRBEN/HRBEN): `"Answer the question using a single word or phrase."`
- Scene classification: `"Classify the image from the following classes. Answer in one word or a short phrase."`
Whether these exact suffixes are also present verbatim inside the *training* JSON (`GeoChat_Instruct.json`) is **UNKNOWN** — that file is not in the repository and was not inspected in this pass.

---

## 5. Tokenization

**VERIFIED FROM SOURCE:**
- Tokenizer: `transformers.AutoTokenizer.from_pretrained(model_name_or_path, use_fast=False)` — the standard LLaMA/SentencePiece tokenizer shipped with Vicuna-7B-v1.5 (`tokenizer.model`, confirmed present in the HF checkpoint repo per `GEOCHAT_BASELINE.md` §4).
- Base vocab: 32000 (LLaMA/Vicuna), plus tokens added by `initialize_vision_tokenizer()`/`load_pretrained_model()`: `<im_patch>` is always added (`mm_use_im_patch_token` defaults `True` and is never overridden to `False` in `finetune_lora.sh`); `<im_start>`/`<im_end>` are **not** added for GeoChat since `--mm_use_im_start_end False`.
- Pad token: since `model_args.version` is neither `"v0"` nor `"v0.5"`, `train.py` sets `tokenizer.pad_token = tokenizer.unk_token` — no new `[PAD]` token is added; the existing `<unk>` id is reused for padding.
- `IMAGE_TOKEN_INDEX = -200` (`geochat/constants.py`) is a **sentinel value that is never a real vocabulary id** — negative, so it cannot collide with any tokenizer output. It exists purely as a Python-side marker.
- `tokenizer_image_token()` (`geochat/mm_utils.py`) builds `input_ids` by splitting the prompt string on the literal substring `"<image>"`, tokenizing each text chunk independently with the real tokenizer, and interleaving the `-200` sentinel between chunks (preserving a leading BOS token if present).
- **How image tokens enter the sequence**: the `-200` sentinel is a placeholder for exactly one position in the *token* sequence, but at the *embedding* level (`prepare_inputs_labels_for_multimodal`, `geochat_arch.py`) that single position is located via `torch.where(cur_input_ids == IMAGE_TOKEN_INDEX)` and then **replaced by concatenating in all 1296 projected image-patch embedding vectors** in place of that one token's embedding — i.e., one placeholder token expands into 1296 embedding-space positions. This only works because the model consumes `inputs_embeds` (not `input_ids`) for the spliced region — `-200` is never actually passed through `nn.Embedding` lookup.
- BOS/EOS: BOS is preserved at position 0 if the tokenizer produces one (`offset=1` logic in `tokenizer_image_token`); EOS is the literal `sep2 = "</s>"` string appended after every assistant turn by `conv.get_prompt()`, which for the Llama/Vicuna tokenizer is also the real `eos_token` string.

**Conceptual token sequence** for one image + one Q/A turn (embedding-space, not literal sub-word tokens for the image span):
```
[BOS] "A chat ... questions." [sp] "USER:" [sp] <IMG_EMB_1> <IMG_EMB_2> ... <IMG_EMB_1296> "\n" "How many ships..." "ASSISTANT:" "There are five white ships..." "</s>"
```
where everything except the `<IMG_EMB_i>` span is ordinary sub-word tokens run through the LLM's normal embedding table, and the `<IMG_EMB_i>` span is 1296 continuous vectors produced by CLIP+MLP-projector, not looked up from any embedding table.

**GeoChat-specific tokens**: none beyond the generic LLaVA `<im_patch>` bookkeeping token (added to the tokenizer's vocabulary but, since `mm_use_im_start_end=False`, not actually placed into any training sequence by `preprocess_multimodal`) — task tokens like `[grounding]`/`[identify]`/`[refer]` are **plain text**, tokenized as ordinary sub-words, not added to the tokenizer's special-token table anywhere in the code.

---

## 6. Label and Loss Construction

**IGNORE_INDEX = -100** (`geochat/constants.py`), standard PyTorch `CrossEntropyLoss` ignore value, consumed in `GeoChatLlamaForCausalLM.forward()`'s `CrossEntropyLoss()` call (`geochat_llama.py`).

**Text-level masking** — `preprocess_v1()` in `geochat/train/train.py` (this is the function actually invoked, since `conversation_lib.default_conversation.version == "v1"` — see `preprocess()`'s dispatch table):

1. Tokenize the *entire* rendered conversation (system + all turns) once via `tokenizer_image_token`. `targets = input_ids.clone()`.
2. `sep = conv.sep + conv.roles[1] + ": "` → the literal string `" ASSISTANT: "`.
3. `rounds = conversation.split(conv.sep2)` → split the whole rendered string on `"</s>"`, giving one chunk per full USER→ASSISTANT round.
4. `target[:1] = IGNORE_INDEX` (mask the leading BOS position).
5. For each round: split it on `" ASSISTANT: "` into `[prefix, answer]`. `instruction_len = len(tokenize(prefix + " ASSISTANT: ")) - 2`; `round_len = len(tokenize(whole round))`. Set `target[cur_len : cur_len+instruction_len] = IGNORE_INDEX` (masks system prompt + `USER:` + the question + the image-embedding span + the literal `"ASSISTANT: "` marker — i.e. **everything up to but not including the answer text**). Advance `cur_len += round_len`.
6. `target[cur_len:] = IGNORE_INDEX` for any trailing/padded region past the last round.
7. **Safety check with a real failure mode**: if the running `cur_len` doesn't match the tokenizer's actual non-pad length at the end (`cur_len != total_len`), the code does `target[:] = IGNORE_INDEX` for the **entire example** and prints a warning — i.e. any tokenization/template mismatch silently zeroes out the loss contribution of that whole training example rather than raising an error. This is a genuine, easy-to-miss failure mode worth carrying into any new fine-tuning pipeline built on this code.

**Which tokens contribute to loss**: only the **assistant's answer text plus the trailing `"</s>"`** for every round, for every turn, in a multi-turn conversation. User instructions, the system prompt, and the image-embedding span are all masked with `-100`. This is symmetric across all turns — multi-turn conversations mask every `USER:` segment and keep every `ASSISTANT:` segment, independently per round, because the round-splitting/masking loop iterates over every `</s>`-delimited chunk.

**Embedding-level masking (a second, independent masking step)** — inside `prepare_inputs_labels_for_multimodal()` (`geochat_arch.py`), when the single `-200` placeholder is expanded into 1296 image embeddings, the corresponding `labels` tensor is expanded in lockstep with `torch.full((cur_image_features.shape[0],), IGNORE_INDEX, ...)` — i.e. the label sequence is masked out for the image span *again*, at the embedding-splice stage, independent of and in addition to whatever `preprocess_v1` already decided for that one placeholder token's position.

**Are image tokens masked?** Yes, at both the text-preprocessing stage (implicitly, as part of the "instruction" span) and explicitly at the embedding-splice stage.
**Is the system prompt masked?** Yes (it's part of round 1's `instruction_len` span).
**Do only assistant responses contribute to loss?** Yes.

**Concrete simplified example** (as requested in the prompt):
```
INPUT (conceptual):  [BOS] "<system prompt> USER: <image>\n What is this? ASSISTANT: " + "A satellite image of a harbor." + "</s>"
LABELS:               -100   -100 -100 -100 ...........................-100............   "A" "satellite" "image" "of" "a" "harbor" "." "</s>"
```
Everything up to and including the literal `"ASSISTANT: "` marker is `-100`; only the answer's own sub-word tokens plus the terminal `</s>` keep real token ids as labels.

---

## 7. Original Datasets

**VERIFIED FROM `docs/Data.md` and `README.md` (GitHub repo — primary source):**

| Dataset | Purpose | Size | Source | Notes |
|---|---|---|---|---|
| `GeoChat_Instruct.json` (+ associated `images.zip`, split into multi-part archives) | **Instruction-tuning** (stage 2 — the only stage GeoChat itself performs) | 263 MB annotation JSON; README states 318k total instruction pairs | `https://huggingface.co/datasets/MBZUAI/GeoChat_Instruct` | Not present in the GitHub repo or in this Colab session — only its existence, location, and merge procedure (`cat images_parta* > images.zip`) are documented in-repo. |
| CC-3M Concept-balanced 595K (`chat.json`/`metadata.json`) **or** LAION/CC/SBU BLIP-Caption 558K (`blip_laion_cc_sbu_558k.json`) | **Pretraining** (stage 1, feature-alignment) — but GeoChat **reuses LLaVA-1.5's already-trained projector** rather than repeating this stage itself (`docs/MODEL_ZOO.md`: "We use the projector from LlaVA-1.5 for initialization") | 211 MB / 181 MB | `liuhaotian/LLaVA-CC3M-Pretrain-595K` / `liuhaotian/LLaVA-Pretrain` on HF | This is **LLaVA's** pretraining data, not GeoChat-specific; GeoChat's own release did not redo stage-1 pretraining. |
| `GeoChat-Bench` (evaluation only, not training) | 7-benchmark evaluation suite: scene classification, region captioning, visual grounding, grounded description, VQA | — | `https://huggingface.co/datasets/MBZUAI/GeoChat-Bench` | Referenced in `docs/Evaluation.md`, not training data. |

**Source datasets composing the 318k `GeoChat_Instruct` set** — **not stated anywhere in the GitHub repository**. The only place this is enumerated is the Hugging Face dataset card for `MBZUAI/GeoChat_Instruct` (an **external, non-GitHub source**, fetched via web lookup in this pass, lower confidence than the repo itself): it names five source datasets abbreviated as **"LRBEN, NWPU_captions, SOTA, SIOR, and FAST"**. These are reported here verbatim as they appeared on the dataset card; I did **not** attempt to "correct" these to their likely full names (e.g. whether "SOTA"/"SIOR" are typos or abbreviations for known remote-sensing detection datasets) since that would be exactly the kind of unverified generic-knowledge assumption the task rules prohibit. **Mark as UNKNOWN / needs primary-source confirmation** against the actual dataset card or paper PDF before relying on it.

**Annotation format actually consumed by the training code** (this part **is** verified, from `LazySupervisedDataset` in `train.py`, independent of not having the real JSON file): each example is a dict with:
- `"image"`: relative filename, joined with `--image_folder`.
- `"conversations"`: a list of `{"from": "human"|"gpt", "value": str}` turns (standard LLaVA schema).
No other top-level keys are read by `LazySupervisedDataset.__getitem__` for the *training* path. (The *evaluation* JSONL files for grounding/referring, by contrast, carry additional fields visible in `geochat/eval/batch_geochat_grounding.py`/`batch_geochat_referring.py`: `question_id`, `image_id`, `type`, `dataset`, `ground_truth`, `obj_ids`, `size_group` — whether the *training* data mirrors this richer schema for its grounding/referring subset is **UNKNOWN**, since only the generic `LazySupervisedDataset` code path was inspected, not the file itself.)

**Synthetic vs. human-generated — VERIFIED via `playground/data/prompts/conversation/`**: the repository includes the actual **data-generation prompt** (`system_message.txt`) and a one-shot exemplar (`000_caps.txt` + `000_conv.txt`) used to have an LLM (Vicuna/GPT, LLaVA-style) synthesize the "conversation" subset of the instruction data from **object-detection-derived positional captions** (e.g. "3 white ships anchored at harbor at the center", "5 gray small-vehicle at the bottom" — language clearly derived from bounding-box detections rather than free-form human annotation). This confirms at least part of `GeoChat_Instruct` is **LLM-synthesized from detection annotations**, not human-written — a mechanism not mentioned in the README and only discoverable by reading `playground/data/prompts/`.

**Whether geographic coordinates/metadata are included in the training data**: **UNKNOWN** for the raw JSON (not inspected — file absent from repo/session). Object *pixel-space* bounding-box-derived positional language ("at the left", "at the bottom right") is present in the synthetic conversation-generation captions; there is no evidence anywhere in the inspected code of real-world lat/lon, GSD, or sensor metadata being part of any training example.

---

## 8. Geographic / Spatial Information

Investigated specifically per the prompt's instruction not to assume this exists. **Findings, all negative except for textual pixel-space region description:**

| Candidate mechanism | Present? | Evidence |
|---|---|---|
| Latitude/longitude input | **No** | Not referenced anywhere in `geochat/`, `scripts/`, or `docs/`. |
| Ground sampling distance (GSD) / sensor metadata | **No** | Not referenced anywhere. |
| Location names | **No** | Not referenced anywhere. |
| Bounding boxes / region information | **Yes, but as plain generated/consumed text, not a model component** | Task-prefix strings `[grounding]`, `[identify] What is the object present at ...`, `[refer] Give me the location of <p> ... </p>` in `geochat/eval/batch_geochat_grounding.py`/`batch_geochat_referring.py`; README states the LLM "can generate natural language responses interleaved with corresponding object locations" and the paper abstract says objects are grounded via "spatial coordinates" — both describe **text output**, not a structured prediction head. |
| Coordinate tokens / dedicated embeddings | **No** | `geochat/constants.py` defines only image-related special tokens (`<im_patch>`, `<im_start>`, `<im_end>`); no coordinate or region tokens are added anywhere in `train.py`/`geochat_arch.py`. |
| Spatial relationships | **Yes, but only as natural language** in captions/answers (e.g. "at the bottom right", "close to each other") — a property of the *training text*, not of any architecture feature. |
| Region-conditioned input (e.g., a bounding box fed *in* alongside the image for region captioning) | **Plausible given the referring/identify eval tasks ask "what is at region X"**, but the *exact* wire format for encoding an input region (is it embedded as text coordinates in the prompt? UNKNOWN) was not found in the inspected eval scripts — `batch_geochat_referring.py`'s `question` field is concatenated as free text after `"[identify] What is the object present at "`, implying the region is itself expressed as a text string already present in `questions[j]['question']`, not as a separate tensor/coordinate input to the model. **Exact textual coordinate grammar is UNKNOWN** — would require the actual `GeoChat_Instruct.json`/`GeoChat-Bench` files to confirm (e.g. whether boxes are written as `{<x1><y1><x2><y2>}`-style strings). Not guessed here per task rules. |

**Conclusion**: GeoChat has **no geospatial-specific architecture at all**. All "geo-awareness" is: (a) the 504px resolution bump for small-object detail, and (b) instruction-tuning on remote-sensing imagery and detection-derived, spatially-worded text — the model itself is domain-general LLaVA-1.5.

---

## 9. Original Training Configuration

**VERIFIED, cross-referencing `README.md` and `scripts/finetune_lora.sh` (the only script actually adapted to GeoChat's paths/vision tower — see §12 for why `finetune_qlora.sh` should be disregarded as a source of truth):**

| Item | Value | Source |
|---|---|---|
| Framework | HuggingFace `transformers.Trainer` (subclassed) + DeepSpeed | `geochat/train/train.py`, `geochat/train/geochat_trainer.py` |
| Trainer class | `GeoChatTrainer(Trainer)` — overrides `_get_train_sampler` (optional length-grouped-by-modality sampling), `_save_checkpoint`/`_save` (adapter-only saving when `tune_mm_mlp_adapter`) | `geochat_trainer.py` |
| Dataset class | `LazySupervisedDataset(Dataset)` — lazy, per-item image load/preprocess | `train.py` |
| Data collator | `DataCollatorForSupervisedDataset` — `pad_sequence` on `input_ids`/`labels`, `attention_mask` derived from pad positions, `images` stacked if uniform shape else kept as list | `train.py` |
| Model init | `GeoChatLlamaForCausalLM.from_pretrained(model_name_or_path, ...)`, optional `BitsAndBytesConfig` if `--bits` in {4,8} | `train.py::train()` |
| Vision tower init | `model.get_model().initialize_vision_modules()` → `build_vision_tower` → `CLIPVisionTower("openai/clip-vit-large-patch14-336")` → `clip_interpolate_embeddings(504,14)` | `geochat_arch.py`, `clip_encoder.py` |
| Optimizer | `adamw_torch` (the `TrainingArguments.optim` dataclass default; not overridden in `finetune_lora.sh`) | `train.py` (`TrainingArguments` dataclass) |
| LR scheduler | `cosine` | `--lr_scheduler_type "cosine"` in `finetune_lora.sh` |
| Learning rate | **`2e-4`** per the actually-committed `finetune_lora.sh` (`--learning_rate 2e-4`) — **but** `README.md`'s hyperparameter table states `2e-5` for GeoChat-7B. **This is a direct discrepancy between two primary sources in the same repo; not resolved here, flagged as-is.** | `finetune_lora.sh` vs. `README.md` |
| Batch size | `--per_device_train_batch_size 32`, `--gradient_accumulation_steps 1` in `finetune_lora.sh`. README states global batch size 144 on 3 GPUs. `32 × 1 × 3 = 96 ≠ 144` — **a second discrepancy, flagged as-is, not resolved.** | `finetune_lora.sh` vs. `README.md` |
| Epochs | `1` | `--num_train_epochs 1` (matches README table) |
| Weight decay | `0.` | `--weight_decay 0.` (matches README table) |
| Warmup | `--warmup_ratio 0.03` | `finetune_lora.sh` |
| Precision | `--bf16 True`, `--tf32 True` | `finetune_lora.sh` |
| Gradient checkpointing | `--gradient_checkpointing True` | `finetune_lora.sh` |
| Max sequence length | `2048` | `--model_max_length 2048` (matches README table) |
| Image resolution | `504×504`, hardcoded (not a CLI flag) | `mm_utils.py`, `clip_encoder.py` |
| Checkpointing strategy | `--save_strategy "epoch"`, `--save_steps 7000` (unused when strategy is `epoch`), `--save_total_limit 1` | `finetune_lora.sh` |
| Evaluation strategy | `--evaluation_strategy "no"` — **no in-loop eval during training at all** | `finetune_lora.sh` |
| DeepSpeed config | `--deepspeed ./scripts/zero2.json` (**ZeRO stage 2**) — note `README.md`'s Train section text says "Training script with DeepSpeed ZeRO-3", which **contradicts** the `--deepspeed` flag's actual target in the committed script (`zero2.json`, confirmed by `cat`: `"stage": 2`). **Third discrepancy, flagged as-is.** | `finetune_lora.sh`, `scripts/zero2.json` |
| Hardware / wall-clock | 3× A100 40GB, ~25 hours for instruction tuning (~3.5 hours was for the *reused* LLaVA pretrain stage GeoChat did not itself run) | `README.md` |
| `zero2.json`/`zero3.json` provenance | Both are generic DeepSpeed configs, not GeoChat/LLaVA-authored beyond copy — `docs/LoRA.md` literally links to `haotian-liu/LLaVA`'s GitHub copies of these same files rather than describing them as GeoChat originals | `docs/LoRA.md` |

---

## 10. Parameter Freezing

**VERIFIED FROM SOURCE**, traced precisely through the order of operations in `train.py::train()` (this ordering is the load-bearing detail, not any single flag):

1. Model loaded (`GeoChatLlamaForCausalLM.from_pretrained`), `model.config.use_cache = False`.
2. `if model_args.freeze_backbone: model.model.requires_grad_(False)` — **not set** in `finetune_lora.sh` (no `--freeze_backbone` flag passed), so this no-ops.
3. If `--bits` in {4,8}: `prepare_model_for_kbit_training(model, ...)` — **not exercised** by `finetune_lora.sh` (which doesn't pass `--bits`, defaulting to `bits=16`).
4. **`if training_args.lora_enable:` → `peft.get_peft_model(model, LoraConfig(...))` is called HERE**, before the vision tower or `mm_projector` exist on the model at all (they are added in the next step). `get_peft_model` freezes every parameter of the base model that existed at call time and adds trainable LoRA adapter weights on the `nn.Linear` modules named by `find_all_linear_names(model)` (every `Linear` in the LLM except ones under `mm_projector`/`vision_tower`/`vision_resampler`, and excluding `lm_head`).
5. **Only afterward**, `model.get_model().initialize_vision_modules(...)` runs, which (a) attaches the frozen CLIP vision tower (`vision_tower.requires_grad_(False)` is set unconditionally inside `CLIPVisionTower` itself, independent of PEFT), and (b) **constructs a brand-new `mm_projector` `nn.Module`** (`build_vision_projector`) — a freshly instantiated `nn.Sequential`/`nn.Linear`, whose parameters carry PyTorch's ordinary default of `requires_grad=True`. Because this object did not exist when `get_peft_model` ran its freeze pass, and because `LoraConfig` was not given a `modules_to_save` list including `mm_projector`, **`mm_projector` is never explicitly frozen or unfrozen by any flag — it simply retains its instantiation-time trainable default.** `model_args.tune_mm_mlp_adapter` (freeze-everything-except-projector, for the *pretrain* stage) and `training_args.freeze_mm_mlp_adapter` (explicit freeze) both default to `False` and are not passed by `finetune_lora.sh`, so neither branch touches it either way.
6. The pretrained LLaVA projector weights are loaded into this newly-created (trainable) `mm_projector` via `pretrain_mm_mlp_adapter` — so training *starts* from LLaVA's aligned projector and *continues updating* it during the LoRA stage.

**Net result for GeoChat's actual `finetune_lora.sh` recipe:**
- **Vision encoder (CLIP): frozen.** No documented way to unfreeze it.
- **LLM (Vicuna) base weights: frozen.** Only LoRA adapter deltas (rank 64 default, see §12) on attention/MLP `Linear` layers train.
- **`lm_head`: frozen**, and not LoRA-adapted (explicitly excluded from `find_all_linear_names`'s output).
- **`mm_projector`: trainable**, as an emergent consequence of code ordering rather than an explicit design flag — **this is the single most non-obvious fact in the whole freezing story** and is not documented anywhere in `README.md`/`LoRA.md`/`MODEL_ZOO.md`.
- **`embed_tokens` (input embedding table): frozen** — the only branch that would set it trainable (`initialize_vision_tokenizer`'s `mm_use_im_start_end=True` path) is inactive since GeoChat sets `--mm_use_im_start_end False`.

This matches and is fully consistent with the paper/README's own framing: "Our LoRA fine-tuning is efficient... whose MLP projection is trained to align images... This allows GeoChat to retain the conversation and instruction following abilities of LLaVA."

---

## 11. LoRA / QLoRA Compatibility

**VERIFIED: the underlying training code (`geochat/train/train.py`) has full, working support for all of the following, already wired up:**

- **LoRA / PEFT**: `TrainingArguments` fields `lora_enable` (bool), `lora_r` (default `64`), `lora_alpha` (default `16`), `lora_dropout` (default `0.05`), `lora_bias` (default `"none"`), `lora_weight_path`. When enabled, `peft.LoraConfig(r=..., lora_alpha=..., target_modules=find_all_linear_names(model), lora_dropout=..., bias=..., task_type="CAUSAL_LM")` + `peft.get_peft_model(model, lora_config)`.
- **4-bit / 8-bit quantization (QLoRA)**: `TrainingArguments.bits` (`16`/`8`/`4`), `double_quant` (bool, default `True`), `quant_type` (`"nf4"`/`"fp4"`, default `"nf4"`). When `bits in [4, 8]`: builds `transformers.BitsAndBytesConfig(load_in_4bit=..., load_in_8bit=..., llm_int8_threshold=6.0, llm_int8_has_fp16_weight=False, bnb_4bit_compute_dtype=compute_dtype, bnb_4bit_use_double_quant=double_quant, bnb_4bit_quant_type=quant_type)`, passes it into `from_pretrained(...)`, then calls `peft.prepare_model_for_kbit_training(model, use_gradient_checkpointing=training_args.gradient_checkpointing)` — this **is** the standard QLoRA recipe (4-bit frozen base + LoRA adapters), fully present in `train.py`.
- **bitsandbytes**: pinned at `bitsandbytes==0.41.0` in `pyproject.toml`; imported indirectly through `transformers.BitsAndBytesConfig`/`peft`.
- `scripts/merge_lora_weights.py` exists for post-hoc adapter merging (referenced by `docs/LoRA.md`).

**However — an important, previously-undocumented gap**: the repository's one script literally named for this purpose, `scripts/finetune_qlora.sh`, is **not actually a GeoChat script**. Evidence, read directly from the file:
- It calls `deepspeed llava/train/train_mem.py` — the module path `llava/train/train_mem.py` **does not exist** in this repository (only `geochat/train/train_mem.py` does). It is unmodified LLaVA-original boilerplate, carried over verbatim (it even opens with the comment `"# IMPORTANT: this is the training script for the original LLaVA, NOT FOR LLaVA V1.5!"`).
- It uses `--vision_tower openai/clip-vit-large-patch14` (the 224px-native, non-`-336` CLIP checkpoint) with **no** `--mm_projector_type mlp2x_gelu` and **no** `--image_aspect_ratio pad` — i.e., none of the settings that make GeoChat's 504px pipeline work.
- It points at generic LLaVA data paths (`./playground/data/llava_instruct_80k.json`, `/path/to/coco/train2017`), not `GeoChat_Instruct.json`.

By contrast, `scripts/finetune_lora.sh` **is** the real, GeoChat-adapted script (correct `geochat/train/train_mem.py` entry point, `clip-vit-large-patch14-336` tower, `mlp2x_gelu` projector, `image_aspect_ratio pad`, real `GeoChat_Instruct.json` path placeholder) — but it does **not** pass any `--bits`/quantization flags, i.e. it runs in full bf16, not QLoRA.

**Conclusion**: GeoChat's training *code* supports QLoRA out of the box; GeoChat's *packaged QLoRA script* does not actually target the GeoChat architecture and would silently misconfigure the vision pipeline (wrong resolution, wrong projector) if run as-is without modification. **To safely introduce QLoRA for this project**, the correct base is `finetune_lora.sh` (for its GeoChat-correct model/vision/data args) with the `--bits 4 --double_quant True --quant_type nf4` triplet added from `finetune_qlora.sh` — a combination that is not pre-packaged anywhere in the repo but requires no code changes to `train.py` itself, since that file already branches on `--bits` correctly regardless of which shell script invokes it.

---

## 12. Dependency Compatibility

**Original pinned requirements — VERIFIED from `pyproject.toml` in the cloned repo (commit `4850920e`):**
```
torch==2.0.1, torchvision==0.15.2, transformers==4.31.0, accelerate==0.21.0,
peft==0.4.0, bitsandbytes==0.41.0, deepspeed==0.9.5, timm==0.6.13,
tokenizers>=0.12.1, sentencepiece==0.1.99, einops==0.6.1, einops-exts==0.0.4,
scikit-learn==1.2.2, gradio==3.35.2, httpx==0.24.0
```

**Current main Colab kernel** (re-verified live in this pass; matches `GEOCHAT_BASELINE.md` §6):

| Component | Original requirement | Current version (main kernel) | Compatible? | Action |
|---|---|---|---|---|
| Python | (repo: `requires-python >= 3.8`; legacy stack needs ≤3.10 in practice) | `3.13.15` | **No** — no `torch==2.0.1` wheel exists for cp313 | Use the isolated `geochat_env` (Python 3.10) already set up per `GEOCHAT_BASELINE.md`, not the main kernel, for anything needing the legacy stack. |
| PyTorch | `2.0.1` (+cu118 in practice) | `2.11.0+cu128` | **No** | Same — isolated env required. |
| Transformers | `4.31.0` | `5.16.1` | **No** — `GeoChatLlamaForCausalLM`'s `forward()` signature and internals target the 4.31-era `LlamaModel`/`CausalLMOutputWithPast` API; a 5.x `transformers` is very likely API-incompatible without patching (not tested in this pass — flagged as risk, not confirmed failure). | Use isolated env for unmodified GeoChat code; OR budget separate engineering effort to port `geochat_arch.py`/`geochat_llama.py` to current `transformers` (see §17). |
| torchvision | `0.15.2` | `0.26.0+cu128` | **No** | Isolated env. |
| tokenizers | `>=0.12.1` | `0.23.1` | Nominally satisfies the lower bound, but `transformers==4.31.0` itself pins a much narrower `tokenizers` range (`~0.13.3` in practice) — **effectively incompatible when paired with the legacy transformers pin.** | Isolated env installs the transformers-compatible tokenizers version automatically via pip resolution. |
| bitsandbytes | `0.41.0` | **not installed** in main kernel | N/A | Confirmed absent again in this pass (`ModuleNotFoundError`). Required for any 4/8-bit path; already resolved inside `geochat_env` per baseline (installed `0.50.2` there, since the exact `0.41.0` pin crashes against this host's CUDA 12.8 runtime — see `GEOCHAT_BASELINE.md` §6). |
| accelerate | `0.21.0` | `1.14.0` | **No** | Isolated env. |
| PEFT | `0.4.0` | `0.20.0` | **No** — `LoraConfig`/`get_peft_model` API has evolved substantially since 0.4.0 (e.g. `modules_to_save`, quant-aware defaults) | Isolated env for exact reproduction; current PEFT is LoRA-capable in general but not guaranteed call-compatible with `train.py`'s exact 0.4.0-era usage. |
| sentencepiece | `0.1.99` | `0.2.2` | Likely fine (stable wire format) but not pinned-identical | Low risk; isolated env matches exactly if strict reproduction is required. |
| protobuf | (transitive, unpinned in `pyproject.toml`) | `5.29.6` | UNKNOWN — no explicit original pin found in this repo's `pyproject.toml` to compare against | No action needed beyond what transformers/sentencepiece already require. |
| CUDA | (repo assumes CUDA 11.8-era, per `torch==2.0.1+cu118`) | Driver reports CUDA 12.8 (`nvcc` `V12.8.93`, driver `580.82.07`) | Compatible at the driver level (backward compatible), but the *exact* `torch==2.0.1+cu118` wheel + `bitsandbytes==0.41.0` combination is not — already diagnosed and worked around in `GEOCHAT_BASELINE.md` §6 (`libcusparse.so.11` missing under the pinned bnb build; fixed by using `bitsandbytes==0.50.2` inside `geochat_env`). | No further action; isolated-env workaround already validated end-to-end (baseline inference ran successfully). |
| GPU | — | Tesla T4, 15360 MiB total / 14913 MiB free at check time | N/A | Re-confirmed identical to baseline. |

**Overall verdict, re-confirmed**: the main Colab kernel cannot run GeoChat's code as-is; the previously-created `geochat_env` isolated Python-3.10 environment remains the only validated path, and this pass found no new information that changes that conclusion.

---

## 13. End-to-End Training Data Flow

```
RAW DATA  (GeoChat_Instruct.json + images.zip — NOT present in repo/session, per §7)
   ↓
dataset loader        geochat/train/train.py :: LazySupervisedDataset.__init__  (json.load)
   ↓
image loading          LazySupervisedDataset.__getitem__  →  PIL.Image.open(...).convert('RGB')
   ↓
image preprocessing    same method: expand2square()  →  processor.preprocess(..., crop_size=504, size=504)
   ↓                    [vision tower itself: geochat/model/multimodal_encoder/clip_encoder.py ::
   ↓                     CLIPVisionTower.clip_interpolate_embeddings(504,14) — applied once at model load,
   ↓                     not per-sample, but is what makes the 504px input tensor valid downstream]
   ↓
conversation formatting  geochat/train/train.py :: preprocess_multimodal()  (inserts "<image>\n" placeholder)
   ↓                      geochat/conversation.py :: Conversation.get_prompt()  (renders full USER/ASSISTANT string)
   ↓
tokenization            geochat/mm_utils.py :: tokenizer_image_token()  (splits on "<image>", tokenizes chunks,
   ↓                     inserts -200 sentinel)
   ↓
label construction      geochat/train/train.py :: preprocess_v1()  (per-round -100 masking of everything
   ↓                     except assistant answers — see §6)
   ↓
data collator            geochat/train/train.py :: DataCollatorForSupervisedDataset.__call__
   ↓                      (pad_sequence on input_ids/labels, build attention_mask, stack images)
   ↓
model forward pass        geochat/model/language_model/geochat_llama.py :: GeoChatLlamaForCausalLM.forward()
   ↓                       → geochat/model/geochat_arch.py :: prepare_inputs_labels_for_multimodal()
   ↓                          (encode_images: vision_tower → mm_projector; splice into inputs_embeds/labels
   ↓                           at the -200 sentinel position — second round of -100 masking here too)
   ↓                       → self.model(...) [GeoChatLlamaModel/LlamaModel] → self.lm_head(hidden_states)
   ↓
loss                      CrossEntropyLoss() on shifted logits/labels, inside GeoChatLlamaForCausalLM.forward()
   ↓
backpropagation / optimizer   transformers.Trainer (via GeoChatTrainer subclass) standard training loop;
                               DeepSpeed ZeRO-2 (per finetune_lora.sh's --deepspeed ./scripts/zero2.json)
                               handles gradient/optimizer-state partitioning; optimizer = adamw_torch.
```

---

## 14. MUST PRESERVE

Components that are load-bearing and easy to break if reimplemented casually:

- **`clip_interpolate_embeddings(504, 14)`** and the fact it must run exactly once at model construction, before any forward pass — the entire 504px capability depends on this exact bicubic-interpolation procedure being applied to *this specific* CLIP-L/14-336 checkpoint's position embeddings. (`clip_encoder.py`)
- **The `-200` sentinel / `prepare_inputs_labels_for_multimodal` splicing mechanism** — any new data pipeline must keep producing exactly one `<image>` placeholder per image and rely on this exact splice-into-`inputs_embeds` mechanism; it is not a drop-in-replaceable convention. (`geochat_arch.py`)
- **The exact `preprocess_v1` masking logic** (round-splitting on `sep2`, masking on `sep`) — any change to the conversation template's separators (`sep`/`sep2`/role strings) without updating this function will silently corrupt label masking (and, per the code's own fallback, silently zero out the affected examples' loss with only a printed warning).
- **`image_aspect_ratio='pad'` + the hardcoded `504/504` crop/size overrides** in whatever preprocessing path is used — mixing this with the CLIP processor's own default (336) breaks shape-compatibility with the interpolated position embeddings (confirmed as a hard `RuntimeError` in `GEOCHAT_BASELINE.md` §10 baseline testing).
- **`mm_use_im_start_end=False` / `mm_use_im_patch_token` settings matching whatever the base checkpoint was tokenized with** — mismatching these against a pretrained checkpoint's vocabulary size will break `resize_token_embeddings` alignment.

---

## 15. SAFE TO ADAPT

Components explicitly designed to be swapped and that SatQuery-specific fine-tuning should target:

- **The instruction dataset itself** (`GeoChat_Instruct.json` schema: `{"image": ..., "conversations": [...]}`) — this is exactly the extension point; new SatQuery-specific QA/task data can be authored in this same schema without touching any code.
- **LoRA hyperparameters** (`lora_r`, `lora_alpha`, `lora_dropout`, `lora_bias`, target modules) — already fully parameterized via CLI flags.
- **Task-token vocabulary** (`[grounding]`, `[identify]`, `[refer]`, or new SatQuery-specific task prefixes) — these are plain text conventions, not architecture, so new ones can be introduced purely through training data.
- **Batch size / gradient accumulation / epochs / LR / warmup** — all ordinary `TrainingArguments`, safe to retune for a T4's constraints.
- **Whether `mm_projector` continues training or is explicitly frozen** — trivially controllable via `freeze_mm_mlp_adapter`, once the current implicit (order-of-operations-driven) behavior is understood (§10).

---

## 16. CAN REWRITE

Components that can be modernized without touching the multimodal architecture's behavior:

- **The shell-script wrappers** (`finetune_lora.sh`, the broken `finetune_qlora.sh`) — these are just CLI argument lists; a clean, correct QLoRA-on-T4 script can be written from scratch using `train.py`'s existing flags (see §11's conclusion).
- **DeepSpeed configs** — `zero2.json`/`zero3.json` are generic and can be replaced or removed entirely in favor of a single-GPU T4 setup (no DeepSpeed needed for a single-GPU QLoRA run; the accompanying `accelerate`/`bitsandbytes` path is sufficient).
- **Data-loading performance details** (`LazySupervisedDataset`'s per-item PIL processing, `dataloader_num_workers`) — can be optimized/rewritten (e.g. pre-resizing images offline) without any effect on model behavior.
- **Evaluation scripts** (`geochat/eval/batch_geochat_*.py`) — utilitarian batch-inference scripts; can be rewritten for SatQuery's own eval needs while keeping the same prompt-construction conventions.

---

## 17. DO NOT TOUCH YET

Requires further investigation before any decision:

- **The exact textual grammar for bounding-box/coordinate output** (§8) — unresolved without the real `GeoChat_Instruct.json`/`GeoChat-Bench` files; any grounding-task fine-tuning work should not proceed on a guessed coordinate format.
- **`transformers` 4.31.0 → current-version portability of `GeoChatLlamaForCausalLM`** — flagged as a risk in §12 but not empirically tested in this pass; needs an actual attempt (in a disposable environment) before committing to either "keep the legacy stack forever" or "port the architecture" as a strategy.
- **The three README/script discrepancies in §9** (LR 2e-4 vs 2e-5; batch size 96 vs 144; ZeRO-2 vs "ZeRO-3" wording) — do not assume either value is "the" correct original training configuration for reproduction purposes; if faithful reproduction of the paper's exact run matters, this needs resolution against the paper PDF (`docs/geochat_supp.pdf`, not yet read in this pass) or direct author clarification.
- **Whether `GeoChat_Instruct`'s five source datasets** (from the external HF card, §7) are accurately named/spelled — needs cross-referencing against the actual paper text before being used to plan a SatQuery-equivalent data pipeline.

---

## 18. Proposed T4 QLoRA Architecture

Everything in this section is **OUR PROPOSED DESIGN**, not verified GeoChat behavior — clearly distinguished from all sections above, which are source-verified. Proposed only; not implemented in this pass.

| Aspect | Proposal | Rationale |
|---|---|---|
| Quantization | 4-bit NF4, double quantization on (`bnb_4bit_quant_type='nf4'`, `bnb_4bit_use_double_quant=True`), `bnb_4bit_compute_dtype=torch.float16` | Matches `train.py`'s existing, already-coded QLoRA branch (§11) exactly — no code changes needed, just CLI flags (`--bits 4 --double_quant True --quant_type nf4`). |
| LoRA target modules | `find_all_linear_names(model)` as-is (all LLM `Linear` layers except `mm_projector`/`vision_tower`/`lm_head`) | Reuses the exact, already-implemented targeting logic; no reason to deviate without evidence it underperforms. |
| LoRA rank (`r`) | Start at 16–32 (lower than GeoChat's own default of 64) | A T4's 16GB has far less headroom than the 3×A100-40GB GeoChat was tuned on; a smaller adapter reduces optimizer-state and activation memory with likely-acceptable quality loss for a narrower SatQuery task distribution — this is a memory/quality tradeoff to validate empirically, not a source-verified number. |
| LoRA alpha | `2× r` (i.e. 32–64) | Common convention; not GeoChat-verified, purely our own default. |
| LoRA dropout | `0.05` (keep GeoChat's own default) | No evidence to change it. |
| Vision encoder | Frozen (matches source — CLIP is unconditionally frozen in-code anyway; not actually a choice) | §10. |
| Projector | Trainable (matches source's emergent behavior, §10), but consider explicitly setting `--freeze_mm_mlp_adapter False` for clarity rather than relying on the implicit ordering | Avoids depending on an undocumented code-order side effect for a new pipeline. |
| Gradient checkpointing | Enabled | Required to fit 7B activations at 504px/1296 image tokens on 16GB; already how GeoChat itself trains. |
| Batch size | `per_device_train_batch_size=1`, `gradient_accumulation_steps` tuned to hit a reasonable effective batch (e.g. 16–32) | A T4 cannot fit more than batch size 1 at 2048 tokens + 1296 image-embedding positions in 4-bit + LoRA + activations; confirmed by `GEOCHAT_BASELINE.md` §10 showing even 8-bit **inference alone** (no gradients) nearly saturates 16GB. |
| Sequence length | Keep `model_max_length=2048` unless SatQuery's own data needs less/more | Matches source; no reason to change without a data-driven need. |
| Learning rate | `1e-4`–`2e-4` for LoRA-only params (in line with GeoChat's own committed `2e-4`, not the possibly-inconsistent README `2e-5`) | Standard LoRA LR range; picking the number GeoChat's actual script uses rather than the possibly-erroneous README table entry (§9). |
| Mixed precision | `bf16` if the environment's GPU/driver stack supports it cleanly on a T4 (T4 has limited native bf16 throughput — Turing architecture lacks bf16 tensor cores; consider `fp16` instead, which T4 supports natively) — **this is a genuine deviation from GeoChat's own `--bf16 True`, justified because GeoChat trained on A100s (bf16-native, Ampere) and a T4 (Turing) does not have the same hardware bf16 support.** | Hardware-appropriate adaptation, not a source claim. |
| Optimizer | `paged_adamw_8bit` (bitsandbytes) or `adamw_torch` if memory allows | Paged optimizer further reduces optimizer-state VRAM for QLoRA on a memory-constrained GPU; not what GeoChat used (`adamw_torch`), but standard for QLoRA on constrained hardware. |
| Expected VRAM | Rough budget on 16GB T4: ~4–5GB (4-bit 7B weights) + ~1–3GB (LoRA adapters + optimizer state, rank-dependent) + several GB (activations at 2048+1296 tokens, mitigated by gradient checkpointing + batch size 1) — **should fit, but needs empirical validation before committing to a batch size/rank combination.** | Consistent with `GEOCHAT_BASELINE.md` §9's own back-of-envelope estimate; not empirically re-tested in this pass (training was explicitly out of scope). |

---

## 19. Open Questions / Unknowns

1. Exact textual/coordinate grammar for grounding & referring outputs (bounding-box string format) — not found in any inspected file.
2. Full, correct list and per-dataset breakdown of the five source datasets composing `GeoChat_Instruct`'s 318k pairs — only an externally-sourced (HF card), unverified abbreviation list is available.
3. Whether `GeoChat_Instruct.json`'s VQA/scene-classification subsets already contain the "answer in one word/phrase" instruction suffix at training time, or whether that's purely an evaluation-time addition (`docs/Evaluation.md`).
4. Which of the three README-vs-script numeric discrepancies (LR, batch size, ZeRO stage) reflects the actual run used to produce the released `MBZUAI/geochat-7B` checkpoint.
5. `transformers==4.31.0`-era `GeoChatLlamaForCausalLM` forward-pass compatibility with modern `transformers` — flagged as a risk, not empirically tested.
6. Whether multi-image input (mechanically supported in `geochat_arch.py`) is ever actually exercised by any real GeoChat training example.
7. Contents of `docs/geochat_supp.pdf` (CVPR supplementary material) — not read in this pass; may resolve several of the above.

---

## 20. Source File & Function References

All claims above trace to these files (commit `4850920e005a849bd224d0ce35aa9db031fa5155`, `mbzuai-oryx/GeoChat`):

- `geochat/constants.py` — special-token/index constants.
- `geochat/conversation.py` — `Conversation`, `SeparatorStyle`, `conv_templates`, `conv_vicuna_v1`.
- `geochat/mm_utils.py` — `expand2square`, `process_images`, `process_images_demo`, `tokenizer_image_token`, `KeywordsStoppingCriteria`.
- `geochat/model/geochat_arch.py` — `GeoChatMetaModel`, `GeoChatMetaForCausalLM.{encode_images, prepare_inputs_labels_for_multimodal, initialize_vision_tokenizer}`.
- `geochat/model/language_model/geochat_llama.py` — `GeoChatConfig`, `GeoChatLlamaModel`, `GeoChatLlamaForCausalLM`.
- `geochat/model/multimodal_encoder/clip_encoder.py` — `CLIPVisionTower.{clip_interpolate_embeddings, load_model, feature_select, forward}`.
- `geochat/model/multimodal_encoder/builder.py` — `build_vision_tower`.
- `geochat/model/multimodal_projector/builder.py` — `build_vision_projector`.
- `geochat/model/builder.py` — `load_pretrained_model` (inference-time loading, including LoRA-merge and 4/8-bit paths).
- `geochat/train/train.py` — `ModelArguments`, `DataArguments`, `TrainingArguments`, `preprocess_multimodal`, `preprocess_v1`/`preprocess_llama_2`/`preprocess_mpt`/`preprocess_plain`, `LazySupervisedDataset`, `DataCollatorForSupervisedDataset`, `find_all_linear_names`, `train()`.
- `geochat/train/geochat_trainer.py` — `GeoChatTrainer`.
- `geochat/eval/batch_geochat_vqa.py`, `batch_geochat_grounding.py`, `batch_geochat_referring.py`, `batch_geochat_scene.py` — task-token conventions, eval-time prompt construction, 504px inference-time preprocessing.
- `scripts/finetune_lora.sh` — the actual GeoChat training invocation (correct architecture args).
- `scripts/finetune_qlora.sh`, `finetune.sh`, `finetune_full_schedule.sh`, `finetune_sqa.sh`, `pretrain.sh` — stale/unmodified LLaVA-original scripts (not GeoChat-specific; several explicitly self-labeled as such).
- `scripts/zero2.json`, `zero3.json`, `zero3_offload.json` — generic DeepSpeed configs.
- `scripts/merge_lora_weights.py` — LoRA merge utility.
- `docs/Data.md`, `docs/LoRA.md`, `docs/MODEL_ZOO.md`, `docs/Evaluation.md`, `README.md` — documentation cross-referenced throughout.
- `playground/data/prompts/conversation/system_message.txt`, `000_caps.txt`, `000_conv.txt` — real data-generation prompt/exemplar.
- `pyproject.toml` — pinned dependency versions.

---

## FINAL REQUIREMENT check

This report was written directly against the source files quoted above, re-fetched fresh in this session (not from memory of the earlier baseline inspection), and cross-checked once more against the live `pyproject.toml`/environment versions at the end of this pass (§12) before being finalized. Where the README and the actual committed scripts disagree, both values are reported rather than one being silently chosen (§9). Where the source code does not answer a question, it is marked UNKNOWN (§8, §17, §19) rather than filled in from generic LLaVA/VLM knowledge.
