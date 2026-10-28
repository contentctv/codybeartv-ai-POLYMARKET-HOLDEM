# Sovereign Mesh

Source: https://grok.com/share/c2hhcmQtNQ_e70254a3-82c4-4bc1-be3f-61066e9f58f7

ADDENDUM — SOVEREIGN MESH (LOCKED CONTEXT)
You are implementing / reviewing / expanding Sovereign Mesh: a modular, HITL, offline-first emergency + financial companion.

MISSION
Build a phone-companion system (not a phone-radio hack) that:
1) Carries compressed text / signed Lightning payloads over LoRa mesh (store-carry-forward).
2) Settles value on Lightning (async payments / onion messages) when any hop reaches internet.
3) Runs a local Qwen-family SLM on the phone as the always-on floor.
4) Escalates hard work to a Qwen instance on Mac Studio (or later M5 Max/Ultra) when a trusted path exists.
5) Stays human-in-the-loop. Never auto-sign, auto-publish, auto-broadcast raw txs, auto-withdraw, or auto-mint.

NON-NEGOTIABLE PHYSICS / POLICY
- Phones cannot retune cellular/Wi-Fi radios into LoRa (915/868/433). Radio lives in a companion dock: BLE or USB-C, own battery, own antenna.
- Magnetic loop / magnet dock is in-scope as range differentiator. Do not claim phones emit LoRa themselves.
- Crystal / 5D glass memory is ARCHIVE only. Live compression = lossless text compressor (e.g. mesh-compressor class) + packet format. Do not treat silica as a runtime codec.
- Bitcoin L1 is settlement/archive, not the live pipe. BIP-110 is not an expanded data channel. Lightning + onion messages = private long-haul.
- LEO/Iridium is GATEWAY-ONLY. Phones never bounce off satellites.
- Wi-Fi routers do not amplify LoRa. Dual-radio nodes (LoRa + Wi-Fi/MQTT gateway) are allowed; “router as LoRa amp” is not.
- ISM / FCC 15.247 bandwidth (500 kHz class in US) is a design constraint. Do not ship illegal default presets.
- Medical / survival answers MUST be RAG-grounded with citations. Hallucinated first-aid is a defect.
- Financial actions: draft only. Operator signs. Paper-first unless GATE_LIFT is explicit.

ARCHITECTURE LAYERS (IMPLEMENT IN THIS ORDER)
L0 Survivor core
- App + downloadable SLM + SurvivalRAG-style corpus (medical, maps notes, protocols).
- Airplane-mode first. Language pack toggle (EN/ES/FR/AR/ZH + more). On-device translation of inbound packets.

L1 Radio + dock
- Firmware fork of Meshtastic or MeshCore (document which and why).
- Magnetic snap dock: SX1262-class radio, loop or tuned whip, own LiPo, BLE/USB-C to iPhone/Android.
- Store-carry-forward (MeshDTN-class). Moving nodes (cars) are valid relays.
- Packet budget ~233 B payload class. Compress 2–7× before air.

L2 Pay rail
- Lightning Dev Kit + async receive (offline-capable phone).
- Each mesh packet MAY carry a satoshi + compressed payload.
- Relays earn ONLY on confirmed delivery (Lot49 / HydraMesh-style incentive; not a new L1).
- Breez SDK / USDC–BTC conversion is allowed at gateways. Circle nanopayments allowed for agent micro-fees when online.
- BTC Mesh pattern: signed tx hex chunked over LoRa → internet gateway → mempool. No block sync over LoRa.

L3 On-device intelligence
- Phone default family: Qwen 3.5 (match Mac Studio Qwen). Same tokenizer / tool style / RAG chunk conventions.
- Install path iPhone: Locally AI (LM Studio, MLX) first; PocketPal AI as GGUF fallback.
- Start: Qwen 3.5 0.8B (~0.6 GB). Escalate device RAM: 2B then 4B. 9B only on 8 GB+ Pro class.
- Second slot (optional): MedPsy 1.7B/4B or medical-Gemma fine-tune for first-aid; Phi-4 Mini for code/protocol.
- Apple Foundation Models / Gemini Nano = short-task helpers only, not the financial brain.
- Grok / Grok-2 weights are NOT phone-resident. Grok Build MAY compile the app locally. Grok Bots are cloud computers — not offline mesh nodes.
- Memory: local RAG over small TEXT packs from GitHub (protocols, tx logs, 50/50 contracts, Lightning SOP). Tens of MB, not video. Incremental index + delete-propagate.
- Hybrid escalate: low-confidence → mesh/gateway → Mac Studio Qwen (Ollama/MLX) or Barefoot/Compass self-host. Trust boundary required; compromised gateway must not inject system prompts.

L4 Reconstruction
- Default: text. Premium: compact Higgsfield MCSLA prompt packet → on-device or gateway video regen. Never stream raw video over LoRa.

L5 Satellite
- Optional gateway modem (Iridium SBD / MeshSat class). Queue + pay in sats.

L6 Prompt book
- 150-prompt engine: MCSLA (Model, Camera, Subject, Look, Action). Each prompt is a transmission-sized packet.

MODEL TEXTURE (USE THESE REASONS IN DOCS / UI)
- Qwen 3.5 0.8B: default floor; vision+thinking; multilingual; safe RAM.
- Qwen 3.5 2B/4B: financial companion + multi-step SOP; same family as Studio = less RAG drift.
- Gemma 4 E2B/E4B: backup mobile-tuned multimodal; Google Edge Gallery path.
- Llama 3.2 1B/3B: oldest-phone fallback.
- Phi-4 Mini: code, packet schemas, JSON tools.
- MedPsy / MedGemma-class small: first-aid; NEVER sole clinical authority.
- Studio tier: Qwen 27B–35B-A3B (and later M5 Ultra 70B-class) = escalation ceiling.

SCAFFOLDING RULES FOR CURSOR / GROK 4.7 HIGH
- Prefer existing open stacks: Meshtastic/MeshCore, LDK, Breez, llama.cpp/MLX, SurvivalRAG, mesh-compressor.
- Repo layout: /firmware /dock-hw /app-ios /app-android /rag-packs /ln /docs /prompts-150
- Every module: README, threat model, power budget, packet size table, HITL gate.
- Secrets: no keys in git. Operator wallet / Safe / Lightning node stay off the companion radio’s flash.
- Tests: airplane-mode chat; 233 B pack round-trip; compress/decompress; RAG citation present; unsigned PSBT only.
- iOS: no entitlement fantasies. Companion via BLE. Background limits documented.
- Output format unless asked otherwise: (1) files to create (2) interfaces (3) risks (4) HITL tickets (5) what is NOT built this pass.

OUT OF SCOPE THIS PASS
Full phone OEM LoRa, crystal-as-codec, PoS L1, auto-trading, auto-refunds, CSAM, weapons how-to, live order routing.

WHEN UNCERTAIN
Say so. Prefer a smaller working dock + Qwen 0.8B + compressed text + unsigned Lightning invoice over a cinematic all-in-one.
