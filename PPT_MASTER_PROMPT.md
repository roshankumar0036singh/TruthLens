# 🔬 TruthLens — PPT Master Prompt & Design Guide

> **Purpose**: This document is the single source of truth for creating and designing the TruthLens project PowerPoint presentation. Use this as a complete reference when editing the PPT template — every slide's content, layout, design rules, and visual assets are defined here.

---

## 📋 PROJECT SNAPSHOT (For Designer Context)

| Key | Value |
|---|---|
| **Project Name** | TruthLens |
| **Tagline** | *"AI-Powered Misinformation Shield for the Open Web"* |
| **Category** | AI + Web3 + Browser Extension |
| **Tech Stack** | FastAPI · Gemini Pro · Mistral · Shardeum Blockchain · React (Vite) · Chrome Extension · NetworkX · Firecrawl · Discord.py · WhatsApp Cloud API |
| **Blockchain** | Shardeum Mezame Testnet |
| **Smart Contracts** | TruthDAO · TruthLensReputation (SBT) · DeFactBridge · ContentIntegrity · TruthQuests · TruthLensSocial |
| **AI Agents** | 11 specialized agents in an orchestrated pipeline |
| **Delivery Formats** | Chrome Side-Panel Extension · WhatsApp Bot · Discord Sentinel Bot · Community Web Frontend |

---

## 🎨 DESIGN SYSTEM (Apply to Every Slide)

### Color Palette

| Role | Hex | Usage |
|---|---|---|
| **Background (Primary)** | `#020617` | Slide backgrounds — deep space navy |
| **Background (Alt)** | `#0F172A` | Card/panel backgrounds |
| **Accent (Lime)** | `#A3E635` | Headlines, CTAs, highlights, icons |
| **Accent (Lime Glow)** | `rgba(235, 228, 36, 0.15)` | Glassmorphism borders, glows |
| **Text (Primary)** | `#FFFFFF` | Headings, key text |
| **Text (Secondary)** | `#94A3B8` | Body text, subtitles, descriptions |
| **Success** | `#22C55E` | Verified / True indicators |
| **Danger** | `#EF4444` | False / Misinformation flags |
| **Warning** | `#F59E0B` | Partially True / Needs Review |
| **Gradient (Hero)** | `linear-gradient(135deg, #dde635ff, #1c1e20ff)` | Feature highlights, hero banners |

### Typography

| Element | Font | Weight | Size (approx.) |
|---|---|---|---|
| **Slide Title** | Inter / Outfit | Black (900) | 36–44pt |
| **Subtitle** | Inter | Bold (700) | 20–24pt |
| **Body** | Inter | Regular (400) | 14–16pt |
| **Code / Tech Labels** | JetBrains Mono / Fira Code | Medium (500) | 12–14pt |
| **Captions** | Inter | Medium (500) | 10–12pt |

### Layout Rules

1. **Dark mode ONLY** — no white backgrounds anywhere.
2. **Glassmorphism panels** — use frosted glass cards (semi-transparent BG, 1px lime-glow border) for all content boxes.
3. **Grid dot pattern** — subtle 40x40px grid overlay on backgrounds at 2% opacity lime.
4. **Generous whitespace** — never cram. Each slide should breathe.
5. **Icons** — use Lucide/Feather-style line icons in lime green. No clipart.
6. **No generic stock photos** — use abstract tech/neural network visuals if needed.
7. **Consistent margins** — 60px from edges on all sides.
8. **Slide aspect ratio** — 16:9 widescreen.

### Visual Effects

- **Glow accents**: Soft radial glow behind key icons/numbers.
- **Gradient text**: Use lime-to-cyan gradient on hero headings.
- **Animated builds** (if PPT supports): Fade-in for bullet points, scale-up for icons.
- **Connection lines**: Use thin dashed lines (lime at 30% opacity) to connect architecture components.

---

## 📑 SLIDE-BY-SLIDE CONTENT

---

### SLIDE 1 — Title Slide

**Layout**: Center-aligned, minimal. Large logo + title + tagline.

| Element | Content |
|---|---|
| **Logo** | Shield icon with eye/lens motif inside (lime stroke on dark bg) |
| **Title** | `TRUTHLENS` (all caps, gradient text lime to cyan, 54pt Black) |
| **Tagline** | *"AI-Powered Misinformation Shield for the Open Web"* (muted white, 18pt) |
| **Bottom Strip** | `DevYatra 2026 · Team [Your Team Name]` |
| **Background** | `#020617` with centered radial glow (lime at 5% opacity) + grid dots |

> **Designer Note**: Keep this extremely clean. The logo and title should command attention. No clutter.

---

### SLIDE 2 — The Problem

**Layout**: Left text (60%) + Right visual (40%)

| **Title** | `THE CRISIS` |
| **Subtitle** | *"Misinformation is the #1 threat to digital trust."* |
| **Stat 1** | 🔴 **86%** of internet users have been exposed to fake news (UNESCO 2025) |
| **Stat 2** | 🔴 **Fake news spreads 6x faster** than verified facts on social media |
| **Stat 3** | 🔴 **$78B** economic damage from misinformation annually |
| **Stat 4** | 🔴 Current fact-checkers take **72+ hours** — by then, the damage is done |
| **Point 5** | ⚠️ **AI-Generated Hyper-Realism**: Deepfakes are becoming indistinguishable. |
| **Point 6** | ⚠️ **Algorithmic Echo Chambers**: Polarization is fueled by automated amplification. |
| **Point 7** | ⚠️ **Coordinated Inauthentic Behavior**: State-sponsored bot networks distorting reality. |
| **Visual** | Abstract visualization: red spreading nodes (mis-info) vs green contained nodes |

> **Designer Note**: Use large, bold stat numbers in white with red accent lines. The visual should evoke a contagion spreading across a network.

---

### SLIDE 3 — Our Solution (Overview)

**Layout**: Full-width centered hero statement + 4 pillars below

| **Title** | `TRUTHLENS` |
| **Hero Statement** | *"A full-stack ecosystem that combines Multi-Agent AI, Knowledge Graphs, and Decentralized Governance to detect, verify, and combat misinformation in real-time."* |
| **Pillar 1** | 🧠 **Multi-Agent AI Swarm** — 11 specialized verification agents working in orchestrated waves. <br>• Cross-dimension analysis (Source, Media, Sentiment). <br>• Consensus-based final verdict logic. |
| **Pillar 2** | 🌐 **Chrome Extension** — Real-time detection as you browse. <br>• Visual-first headline & media extraction. <br>• Live WebSocket-based "Trace" of AI thoughts. |
| **Pillar 3** | ⛓️ **On-Chain DAO** — Community-driven dispute resolution on Shardeum. <br>• Reputation-weighted voting (SBT). <br>• Decentralized fact-check request marketplace. |
| **Pillar 4** | 📡 **Omnichannel Reach** — WhatsApp Bot + Discord Sentinel + Web Feed. <br>• Fact-checking in everyone's pocket. <br>• Proactive misinformation alerts for servers. |

> **Designer Note**: Use 4 glassmorphism cards in a row at the bottom. Each card has a lime icon, bold title, and one-line description. The hero statement above should use gradient text.

---

### SLIDE 4 — System Architecture (High-Level)

**Layout**: Full-slide architecture diagram

```
+-----------------------------------------------------------------------+
|                         TRUTHLENS ECOSYSTEM                           |
|                                                                       |
|   +---------+    +----------------------------------+    +---------+  |
|   | CHROME  |--->|      FASTAPI BACKEND (v1.1)      |<---| WHATSAPP|  |
|   |EXTENSION|    |                                    |    |  BOT    |  |
|   | (React) |    |  +-----------------------------+  |    +---------+  |
|   +---------+    |  |   ORCHESTRATOR (Wave-Based)  |  |                |
|                  |  |  +------++------++------+   |  |    +---------+  |
|   +---------+    |  |  |Claims||Source||Graph |   |  |    | DISCORD |  |
|   |COMMUNITY|--->|  |  |Extrct||Cred. || RAG  |   |  |<---| SENTINEL|  |
|   |   WEB   |    |  |  +------++------++------+   |  |    |  BOT    |  |
|   |FRONTEND |    |  |  +------++------++------+   |  |    +---------+  |
|   +---------+    |  |  |Media ||Senti-||Bot   |   |  |                |
|                  |  |  |Forens||ment  ||Detect|   |  |                |
|                  |  |  +------++------++------+   |  |                |
|                  |  |  +------++------++------+   |  |                |
|                  |  |  |Cross ||Viral ||Citat-|   |  |                |
|                  |  |  |Lang  ||Track ||ions  |   |  |                |
|                  |  |  +------++------++------+   |  |                |
|                  |  |        v AGGREGATOR v        |  |                |
|                  |  +-----------------------------+  |                |
|                  |              |                      |                |
|                  +--------------+----------------------+                |
|                                v                                       |
|                  +----------------------------------+                  |
|                  |     SHARDEUM BLOCKCHAIN LAYER     |                  |
|                  |  TruthDAO . ReputationSBT . Quests|                  |
|                  |  ContentIntegrity . DeFactBridge   |                  |
|                  +----------------------------------+                  |
+-----------------------------------------------------------------------+
```

| Element | Content |
|---|---|
| **Title** | `SYSTEM ARCHITECTURE` |
| **Subtitle** | *"Full-stack verification pipeline from input to on-chain consensus"* |

> **Designer Note**: Recreate this diagram with glassmorphism nodes, lime connection lines with arrows, and subtle glow behind the central orchestrator. Group the 11 agents inside the backend panel. Use dashed borders for the blockchain layer at the bottom.

---

### SLIDE 5 — Multi-Agent AI Pipeline (Deep Dive)

**Layout**: Horizontal pipeline flow (left to right) showing the wave-based execution

| Element | Content |
|---|---|
| **Title** | `11-AGENT VERIFICATION SWARM` |
| **Subtitle** | *"Wave-based orchestration — batched parallelism to prevent API overload"* |

**Agent Pipeline (show as flow):**

```
WAVE 0 (Preprocessing)
  - Firecrawl Ingester    -> Extracts clean text/markdown from URLs, bypassing anti-bot measures.
  - CrossLanguage Agent   -> Detects 40+ languages, translates regional context into English for uniform analysis.

WAVE 1 (Analysis — Parallel Batch)
  - Claim Extractor       -> Deep-dives into raw text to isolate atomic, verifiable factual statements.
  - Source Credibility     -> Analyzes 50+ signals including domain age, bias rating, and cross-reference history.
  - Citation Finder        -> Fetches evidence from Google Scholar, Google News, and academic repositories.
  - Graph RAG              -> Maps entities into a NetworkX graph to detect structural inconsistencies.
  - Sentiment & Bias       -> Flags manipulative emotional triggers and ideological framing patterns.
  - Media Forensics        -> Reverse searches images and checks for metadata/pixel manipulation anomalies.

WAVE 2 (Context & Propagation)
  - Viral Tracker          -> Measures social spread velocity and identifies amplification botnets.
  - Bot Detection          -> Analyzes coordination patterns to flag inauthentic account behavior.
  - Aggregator Agent       -> Synthesizes the 11-agent consensus into a "Truth Score" and human-readable verdict.

FINAL: Consensus Record -> Verdict timestamped on-chain for metadata integrity.
```

> **Designer Note**: Use a horizontal pipeline layout with wave separators (thin vertical lime lines). Each agent is a small glassmorphism card with an icon + name + one-liner. Animated build order: Wave 0 then Wave 1 then Wave 2 then Aggregator.

---

### SLIDE 6 — Graph RAG (Knowledge Graph Verification)

**Layout**: Left explanation (50%) + Right graph visualization (50%)

| Element | Content |
|---|---|
| **Title** | `GRAPH RAG ENGINE` |
| **Subtitle** | *"Relational claim verification through Knowledge Graph topology"* |
| **Point 1** | Extracts **Subject -> Predicate -> Object** triplets from raw text claims. |
| **Point 2** | Performs **Multi-Hop Validation**: Checks if related nodes are contextually consistent. |
| **Point 3** | Builds an in-memory **NetworkX** directed graph for high-performance path traversal. |
| **Point 4** | Implements **Topology-Aware Detection**: Flags claims that defy established "Web of Truth" structures. |
| **Point 5** | Persists atomic knowledge units to an **Async SQLite** graph database for cross-check learning. |
| **Visual** | Network graph with green nodes (verified facts) and red nodes (contradictions), connected by labeled edges |

> **Designer Note**: The graph visualization is the star here. Use a force-directed graph layout with lime-green edges and red highlighted contradiction edges. Add a subtle pulse animation on contradiction nodes.

---

### SLIDE 7 — Chrome Extension (UI Showcase)

**Layout**: Center: mockup of Chrome sidepanel. Surrounding: feature callouts.

| Element | Content |
|---|---|
| **Title** | `BROWSER EXTENSION` |
| **Subtitle** | *"Real-time fact-checking right in your Chrome sidebar"* |
| **Feature 1** | 🔍 **Analyzer Hub**: AI-driven auto-detection of headlines and hero images from any news page. |
| **Feature 2** | 📊 **Live Agent Tracing**: Real-time WebSocket stream showing exactly what each of the 11 agents is "thinking." |
| **Feature 3** | 📈 **Interactive Graph**: Zoomable Knowledge Graph visualization showing the relational "Web of Truth." |
| **Feature 4** | 🏆 **Truth Quests**: On-chain bounty portal where users earn SHM for solving complex social verification tasks. |
| **Feature 5** | 🗳️ **MetaMask Bridge**: Integrated Shardeum bridge for voting, disputes, and reputation management. |
| **Feature 6** | 📰 **Community Insights**: Global feed of analyzed URLs with credibility scores and platform-wide consensus. |
| **Feature 7** | 📜 **Verification History**: Full audit trail of your past scans with detailed evidence snippets and sources. |
| **Feature 8** | 🎯 **Overlay System**: Subtle UI injection on social media to flag known misinformation before you click. |

**Extension Views**: `AnalyzerView . FeedView . GraphHistoryView . HistoryView . QuestsView . RegistryView . SettingsView . TelemetryView`

> **Designer Note**: Show a stylized Chrome browser with the TruthLens side panel open. Use annotation arrows pointing from features to the relevant sections of the mockup. Dark theme throughout — the extension itself uses #020617 background.

---

### SLIDE 8 — Blockchain Layer (Shardeum)

**Layout**: 3-column grid of smart contract cards

| Element | Content |
|---|---|
| **Title** | `ON-CHAIN TRUST LAYER` |
| **Subtitle** | *"Deployed on Shardeum Mezame Testnet — Decentralized Governance for AI Verdicts"* |

**Smart Contracts:**

| Contract | Purpose | Key Points |
|---|---|---|
| **TruthDAO** | Governance & Disputes | Multi-sig enabled. Handles SHM stake for challenges. Reputation-weighted voting. |
| **TruthReputation** | Soulbound (SBT) | Non-transferable ERC-721. Tracks user "Truth Score" based on successful verifications. |
| **TruthQuests** | Web3 Marketplace | Automates SHM bounty distribution for successful human-in-the-loop fact checks. |
| **IntegrityRegistry** | Forensic Hash Store | Creates an immutable timestamped log of web content to prevent "silent edits" by publishers. |
| **DeFactBridge** | Data Oracle Link | Links off-chain AI analysis reports to on-chain dispute records for valid evidence proofs. |
| **TruthSocial** | Community Graph | Tracks trust relationships and coordinated reporting accuracy across the network. |

| **Key Design** | Details |
|---|---|
| **Voting Weight** | Reputation-weighted (SBT balance determines vote power) |
| **Stake** | 10 SHM minimum to create a dispute |
| **Voting Period** | 3 days |
| **Outcome** | `CHALLENGE_SUCCESS` -> stake returned OR `AI_VERDICT_UPHELD` -> stake to DAO treasury |

> **Designer Note**: Use 6 glassmorphism cards in a 3x2 grid. Each card has: contract icon (shield, badge, puzzle, lock, bridge, people), contract name (lime), one-line purpose, and key functions in monospace font. Add a Shardeum logo badge in the corner.

---

### SLIDE 9 — DAO Governance Flow

**Layout**: Horizontal flowchart: User -> Dispute -> Community Vote -> Resolution

```
    +---------+     +----------+     +-----------+     +--------------+
    |  USER   |---> |  STAKE   |---> | COMMUNITY |---> |   RESOLVE    |
    |disagrees|     |  10 SHM  |     |   VOTES   |     |              |
    | with AI |     | to DAO   |     | (3 days)  |     | CHALLENGE_   |
    | verdict |     |          |     | Rep-Weight|     | SUCCESS      |
    +---------+     +----------+     +-----------+     | or AI_UPHELD |
                                                        +--------------+
```

| Element | Content |
|---|---|
| **Title** | `DECENTRALIZED DISPUTE RESOLUTION` |
| **Key Point** | *"Humans override AI when the community has greater consensus wisdom"* |
| **MetaMask Bridge** | Secure localhost transaction page bypasses sidepanel isolation |

> **Designer Note**: Clean horizontal flow with 4 glassmorphism steps connected by lime arrows. Add step numbers (01, 02, 03, 04) in large faded lime numbers behind each card.

---

### SLIDE 10 — WhatsApp Bot

**Layout**: Left phone mockup (40%) + Right feature list (60%)

| Element | Content |
|---|---|
| **Title** | `WHATSAPP GUARDIAN BOT` |
| **Subtitle** | *"Fact-checking in everyone's pocket — no app download needed"* |
| **Feature 1** | 📩 Forward any suspicious message -> get instant AI verdict |
| **Feature 2** | 🔗 Send any URL -> full multi-agent analysis returned |
| **Feature 3** | 🌍 **Cross-language support** — works in Hindi, Spanish, Arabic, and 40+ languages |
| **Feature 4** | 📊 Color-coded verdict with credibility score |
| **Feature 5** | 🏷️ Sources cited with every response |
| **Integration** | WhatsApp Cloud API -> FastAPI Backend -> 11-Agent Pipeline -> Response |

> **Designer Note**: Show a dark-themed WhatsApp chat mockup with a sample conversation: user sends a fake headline, bot responds with a formatted verdict. Keep the phone mockup minimal (just the chat area, no phone frame).

---

### SLIDE 11 — Discord Sentinel Bot

**Layout**: Left features (50%) + Right Discord embed mockup (50%)

| Element | Content |
|---|---|
| **Title** | `DISCORD SENTINEL` |
| **Subtitle** | *"Autonomous misinformation radar for community servers"* |
| **Feature 1** | 🤖 **Proactive Monitoring** — Sentinel scans trending topics autonomously |
| **Feature 2** | 🚨 **Real-time Alerts** — Broadcasts misinformation warnings to Discord channels |
| **Feature 3** | 📊 **Slash Commands** — `/verify <url>` for on-demand fact-checking |
| **Feature 4** | 🔔 **Subscriber Alerts** — Community members get pinged on new threats |
| **Integration** | Sentinel Service -> Discord.py Bot -> Embedded Rich Alerts |

> **Designer Note**: Show a Discord server dark theme with TruthLens bot posting an embedded alert (lime accent bar, verdict details, source links). Use the Discord embed format.

---

### SLIDE 12 — Community Web Frontend

**Layout**: Browser mockup showing the community feed

| Element | Content |
|---|---|
| **Title** | `COMMUNITY TRUST FEED` |
| **Subtitle** | *"Crowd-verified intelligence shared openly"* |
| **Feature 1** | 📰 News feed of community-verified content |
| **Feature 2** | 👤 Creator profiles with reputation scores |
| **Feature 3** | 🏪 Verification Marketplace — request and fulfill fact-check bounties |
| **Feature 4** | 📊 Telemetry Dashboard — real-time system health and agent metrics |

> **Designer Note**: Show a clean web dashboard with card-based feed items. Each card shows: headline, verdict badge (TRUE/FALSE/MIXED), credibility score bar, and sharing actions.

---

### SLIDE 13 — Live Demo Flow

**Layout**: Numbered step-by-step flow (cinematic style)

| Step | Action | What Happens |
|---|---|---|
| **01** | User pastes a suspicious URL into the Chrome Extension | Extension sends to FastAPI backend |
| **02** | Firecrawl extracts the page content | Raw HTML to clean text |
| **03** | Cross-Language agent detects Hindi, translates to English | Normalized input for all agents |
| **04** | 11 agents run in parallel waves (WebSocket live tracing) | Real-time status updates stream to extension |
| **05** | Graph RAG builds knowledge graph, detects contradiction | Visual graph appears in extension |
| **06** | Aggregator synthesizes final verdict | Verdict card appears: FALSE — Credibility: 23% |
| **07** | User clicks "Dispute" then MetaMask bridge opens | 10 SHM staked to TruthDAO |
| **08** | Community votes over 3 days (reputation-weighted) | DAO resolves: CHALLENGE_SUCCESS |
| **09** | User shares result to Community Feed + WhatsApp | Omnichannel dissemination |

> **Designer Note**: Use a vertical timeline layout with alternating left/right content cards. Each step number is large (72pt) and faded lime. Add small screenshots/icons for each step.

---

### SLIDE 14 — Tech Stack

**Layout**: Logo grid with technology names

| Layer | Technologies |
|---|---|
| **Frontend** | React (Vite) . Framer Motion (Animations) . Lucide React (Icons) . TailwindCSS . Chrome Extension Manifest v3 |
| **Backend** | Python 3.12 . FastAPI . Uvicorn (ASGI) . AsyncIO . Pydantic v2 (Data Validation) |
| **AI / ML** | Google Gemini 1.5 Pro . Mistral Large 2 . LangChain / Custom Orchestration . Structured JSON Outputs |
| **Knowledge** | NetworkX (Topology analysis) . SQLAlchemy (Async) . SQLite . Firecrawl (Managed Scraper API) |
| **Blockchain** | Solidity . Shardeum Mezame (EVM) . ethers.js . OpenZeppelin (SBT & DAO standards) |
| **Bots** | Discord.py (Sentinel Bot) . WhatsApp Business Cloud API . Webhooks for real-time delivery |
| **DevOps** | Docker . Docker Compose . GitHub Actions (Automation) . Postman (API Documentation) |

> **Designer Note**: Use a clean icon grid — each tech has its official logo (small, 40x40px) with the name below. Group by layer with a section header. Dark cards, lime dividers between sections.

---

### SLIDE 15 — Unique Selling Points (USP)

**Layout**: 3 large feature cards in a row

| USP | Detail |
|---|---|
| **🧠 AI Swarm Intelligence** | **11 Specialized Agents**: Not a single black-box model, but a distributed swarm. <br>• Parallel Wave execution prevents latency. <br>• Domain-specific experts (Media vs. Logic vs. Viral). |
| **⛓️ Human > AI Override** | **Skin-In-The-Game Governance**: Humans override AI when community conviction is high. <br>• Reputation-weighted Voting (SBT). <br>• Staking mechanism prevents sybil attacks and spam. |
| **🌐 Omnichannel Shield** | **Universal Coverage**: Misinformation is cross-platform; our verification is too. <br>• Same core engine powers Extension, Discord, and WhatsApp. <br>• Real-time web-feed democratizes access to verified truths. |

> **Designer Note**: Three large glassmorphism cards, each with a big emoji/icon at top, bold title (lime), and 2-line description. Equal spacing.

---

### SLIDE 16 — Competitive Advantage

**Layout**: Comparison table (TruthLens vs. competitors)

| Feature | TruthLens | Snopes | Google Fact Check | Community Notes |
|---|---|---|---|---|
| **Real-time** | ✅ Instant (< 30s) | ❌ Days/Weeks | ⚠️ Limited | ⚠️ Hours |
| **Multi-Agent AI** | ✅ 11 agents | ❌ Human only | ⚠️ Single model | ❌ None |
| **Knowledge Graph** | ✅ Graph RAG | ❌ None | ❌ None | ❌ None |
| **On-Chain Governance** | ✅ Shardeum DAO | ❌ None | ❌ None | ❌ None |
| **Reputation System** | ✅ SBT (Soulbound) | ❌ None | ❌ None | ⚠️ Engagement |
| **Cross-Language** | ✅ 40+ languages | ⚠️ English focus | ⚠️ Limited | ⚠️ Some |
| **Browser Extension** | ✅ Chrome Sidebar | ❌ Website only | ⚠️ Search only | ✅ Twitter only |
| **WhatsApp Bot** | ✅ Yes | ❌ No | ❌ No | ❌ No |

> **Designer Note**: Clean dark table with lime header row. Use checkmarks (green), warnings (amber), and crosses (red) for visual scanning. TruthLens column should have a subtle lime background tint to stand out.

---

### SLIDE 17 — Impact & Metrics

**Layout**: 4 large metric cards + bottom impact statement

| Metric | Value | Detail |
|---|---|---|
| **Verif. Speed** | < 30 seconds | Automated logic replaces 72-hour manual processes. |
| **Agent Depth** | 11 Specialists | Source Credibility, Media Forensics, Sentiment, Logic-check, etc. |
| **Language Reach** | 40+ Languages | Real-time translation and regional idiom normalization. |
| **On-Chain Scale** | 6 Contracts | Full DAO lifecycle from Quest to Dispute on Shardeum Mezame. |
| **Human Insight** | Skin-In-The-Game | Staking 10 SHM ensures only serious disputes enters the DAO. |

**Impact Statement**: *"TruthLens makes verified truth accessible to 2B+ WhatsApp users, 150M+ Discord users, and every Chrome browser — meeting people where misinformation already lives."*

> **Designer Note**: Big numbers (72pt, lime, bold) with labels below. Impact statement in a centered glassmorphism banner at the bottom with gradient border.

---

### SLIDE 18 — Future Roadmap

**Layout**: Horizontal timeline with milestones

| Phase | Timeline | Milestone |
|---|---|---|
| **Phase 1** ✅ | Completed | Core Multi-Agent Engine . Chrome Extension Side-Panel . Shardeum DAO Prototype |
| **Phase 2** ✅ | Completed | Graph RAG Integration . WhatsApp Cloud API Bot . Discord Sentinel Automated Alerts |
| **Phase 3** 🔄 | Q2 2026 | **Mobile PWA Support**: Take TruthLens to iOS/Android. <br>• **Browser Live Overlay v2**: Native injection into Twitter/X & Facebook feeds. |
| **Phase 4** 🎯 | Q3 2026 | **Multi-Chain Expansion**: Deploy to Polygon & Base for wider accessibility. <br>• **TRUTH Token Economics**: Incentive layer for top-tier community fact-checkers. |
| **Phase 5** 🚀 | Q4 2026 | **Institutional API**: License the TruthLens verification swarm to newsrooms and social media platforms. |

> **Designer Note**: Horizontal timeline with nodes. Completed phases in lime green, current in amber pulse, future in faded lime outline. Each node expands to a detail card.

---

### SLIDE 19 — Team

**Layout**: Team member cards in a row (adapt to your team size)

| Element | Content |
|---|---|
| **Title** | `THE ARCHITECTS` |
| **Card Structure** | Photo (circle, lime border) . Name . Role . Key Contribution |

> **Designer Note**: Circular photos with a 2px lime ring. Name in white bold, role in lime small caps, contribution in muted text below. Keep it minimal and professional.

---

### SLIDE 20 — Thank You / Q&A

**Layout**: Center-aligned, dramatic close

| Element | Content |
|---|---|
| **Title** | `TRUTHLENS` (gradient text, same as Slide 1) |
| **Statement** | *"In a world drowning in misinformation, TruthLens is the lifeboat."* |
| **CTA** | `github.com/[your-repo]` and `[your-email]` |
| **Background** | Same as Slide 1 — full circle, bookend the presentation |

> **Designer Note**: Mirror the title slide's layout for a clean bookend. Add a subtle upward-flowing particle animation if possible. The quote should hit hard — this is the last thing they see.

---

## 🛠️ TEMPLATE EDITING INSTRUCTIONS

When you receive the PPT template, apply these transformations:

### Step 1: Global Changes
1. Set **all slide backgrounds** to `#020617`.
2. Replace ALL default fonts with **Inter** (download from Google Fonts).
3. Remove any default decorative elements, watermarks, or colored bars.
4. Set slide dimensions to **16:9 widescreen** (13.33 x 7.5 inches).

### Step 2: Per-Slide Editing
1. Replace placeholder titles with content from this document (exact text above).
2. Apply the **color palette** to all text elements.
3. Create **glassmorphism cards** using rounded rectangles:
   - Fill: `#0F172A` at 60% opacity
   - Border: 1px solid lime (`#A3E635`) at 15% opacity
   - Corner radius: 20px
   - Shadow: 0 25px 50px black at 50%
4. Add **icons** from Lucide icon set (https://lucide.dev) — export as SVG.
5. Replace any stock images with abstract tech/AI visuals or generated screenshots.

### Step 3: Diagrams
1. Recreate the **architecture diagram** (Slide 4) using PowerPoint shapes.
2. Build the **agent pipeline** (Slide 5) as a horizontal flow using SmartArt or custom shapes.
3. Create the **DAO flow** (Slide 9) as a stepped horizontal process.
4. Build the **comparison table** (Slide 16) using a styled PowerPoint table.

### Step 4: Polish
1. Apply **Fade** transitions between slides (0.5s duration).
2. Add **Appear** animations for bullet points (0.3s stagger).
3. Ensure all text is readable — minimum 14pt body text.
4. Export a **PDF backup** alongside the PPTX file.

---

## 📝 TALKING POINTS (Speaker Notes)

### Slide 2 (Problem)
> "Misinformation isn't just an inconvenience — it manipulates elections, tanks stock markets, and costs lives during health crises. Current solutions are either too slow, too manual, or too centralized. We need something fundamentally different."

### Slide 5 (Multi-Agent)
> "Instead of relying on one AI model to do everything, we built 11 specialized agents. Think of it as a forensic team — each expert analyzes one dimension, and then the Aggregator synthesizes a consensus verdict. The wave-based orchestration prevents API rate limits while maintaining real-time speed."

### Slide 6 (Graph RAG)
> "This is our secret weapon. Most fact-checkers just check if a statement matches some database. We extract the relational structure — WHO said WHAT about WHOM — and compare the claim's topology against the verified web's topology. If the structures contradict, we catch it — even when the wording is completely different."

### Slide 8 (Blockchain)
> "Why Shardeum? It's the only EVM-compatible chain with linear scaling — meaning our DAO can handle thousands of concurrent disputes without gas fee spikes. The TruthLensReputation SBT ensures that vote weight is earned through genuine participation, not purchased."

### Slide 15 (USP)
> "Three things make TruthLens unique: First, swarm intelligence — 11 agents, not one. Second, human override — when AI is unsure, humans with skin in the game decide. Third, omnichannel — we meet misinformation everywhere it lives, not just on one platform."

---

## 🎯 FINAL CHECKLIST

- [ ] All 20 slides created with content from this document
- [ ] Dark theme (#020617) applied globally
- [ ] Inter font used everywhere
- [ ] Lime accent (#A3E635) used consistently
- [ ] Glassmorphism cards on every applicable slide
- [ ] Architecture diagram accurately represents the system
- [ ] All 11 agents listed in the pipeline slide
- [ ] All 6 smart contracts listed with purposes
- [ ] Comparison table shows clear TruthLens advantage
- [ ] Transitions and animations applied
- [ ] Speaker notes added for key slides
- [ ] PDF export created as backup
- [ ] No spelling errors
- [ ] All stats and claims are accurate
- [ ] Team slide populated with actual team info
- [ ] Contact/GitHub links are correct

---

> **This document is self-contained.** Anyone with this file and a PPT template can produce a competition-ready TruthLens presentation without needing access to the codebase.
