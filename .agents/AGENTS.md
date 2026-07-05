# GET Solar Energy — Workspace Customization Rules

This file defines the project-scoped rules and brand creative guidelines for all AI agents collaborating on the GET Solar Energy workspace.

---

# GET Solar Energy — Creative Direction Bible
### Version 1.1 — Enterprise Creative Standard
### Classification: Internal Design & Brand System
### Status: Foundational Document / Active Authority

---

## Brand Philosophy
GET Solar Energy is not selling solar panels. We are helping homeowners make one of the biggest long-term investments in their home. Our role is to remove uncertainty and replace it with confidence. The product experience should never feel like software; it should feel like a trusted advisor guiding customers through a life-changing decision.

---

## Brand Personality
The brand should consistently communicate:
*   **Engineering Excellence** — Precision, data accuracy, structural integrity.
*   **Calm Confidence** — Unhurried presentation, factual authority, serene design.
*   **Long-term Reliability** — Built to last, sustainable materials, guaranteed returns.
*   **Premium Quality** — Editorial rhythm, bespoke assets, clean architecture.
*   **Professional Craftsmanship** — Real workers, verified installations, zero shortcuts.
*   **Financial Clarity** — Truthful charts, explicit government subsidies, real savings.
*   **Sustainability through Technology** — Clean code, smart models, architectural harmony.

*Never communicate: Hype, urgency, fear, aggressive sales, buzzwords, or flashy technology.*

---

## Emotional Journey
The emotional journey must progress through these stages:
`Curiosity` ➔ `Possibility` ➔ `Confidence` ➔ `Trust` ➔ `Commitment` ➔ `Ownership` ➔ `Pride` ➔ `Advocacy`. Every product experience should reinforce this progression.

---

## 1. Creative Principles (Expanded)

### Editorial Design
*   **Why it exists:** To elevate the web page from a generic dashboard into a premium, tactile publication. It respects the user's intelligence and time by presenting information with deliberate visual pauses, high typographic contrast, and intentional pacing.
*   **When to apply:** High-visibility pages, hero sections, case studies, and primary educational modules.
*   **When NOT to apply:** Deep administrative tables, configuration portals, or logs where information density and utility are the primary requirements.
*   **Real Platform Example:** The layout of [landing.html](file:///e:/GET%20SOLAR%20ENERGY/get-solar-energy/frontend/landing.html) where large imagery is balanced with single-column text blocks and generous vertical margins.

### Architectural Composition
*   **Why it exists:** To establish physical permanence and structural stability. Solar is integrated into the home; the digital space must mirror physical architecture.
*   **When to apply:** Scene backgrounds, product visualizers, and key layout splits.
*   **When NOT to apply:** Toast alerts, settings screens, profile dropdowns.
*   **Real Platform Example:** The split layout in the Roof Assessment scene where the 3D-like HUD is anchored cleanly to the satellite image frame.

### Calm Interfaces
*   **Why it exists:** Anxious interfaces use alerts, flashing badges, and pop-ups to force attention, which destroys trust. Calm interfaces allow the user to explore at their own pace, reducing uncertainty.
*   **When to apply:** Across the entire application, especially during checkout, estimates, and analytical reports.
*   **When NOT to apply:** True emergency warnings (e.g., system hardware failure alert).
*   **Real Platform Example:** The Quick Estimate form which waits for user input before displaying calculations, showing shimmers rather than flashing red indicators.

### Engineering Trust
*   **Why it exists:** Homeowners are investing substantial capital. Factual transparency, verifiable metrics, and precision build the authority necessary to secure long-term commitment.
*   **When to apply:** All charts, savings breakdowns, calculations, and technical specifications.
*   **When NOT to apply:** Marketing hooks and abstract illustrations.
*   **Real Platform Example:** The Live Stats Counter and ROI charts in [index.html](file:///e:/GET%20SOLAR%20ENERGY/get-solar-energy/frontend/index.html) which display clear, verifiable data points.

### Human-first Storytelling
*   **Why it exists:** Customers connect with real people and authentic experiences, not marketing assets. 
*   **When to apply:** Landing pages, customer portals, installer bios, and case studies.
*   **When NOT to apply:** Pure mathematical code, configuration scripts, API parameters.
*   **Real Platform Example:** The Quality Assurance inspection scene which focuses on the human engineer inspecting the physical installation.

### Cinematic Product Design
*   **Why it exists:** To create a sense of scale, depth, and wonder. By treating the viewport as a cinematic camera, the interface feels alive, immersive, and premium.
*   **When to apply:** Scene transitions, hero presentations, and interactive assessments.
*   **When NOT to apply:** Standard settings lists or data forms.
*   **Real Platform Example:** The unified Cinematic Storytelling Engine in [landing.js](file:///e:/GET%20SOLAR%20ENERGY/get-solar-energy/frontend/landing.js) which triggers smooth viewport prying and camera translations on scroll.

### Premium Restraint
*   **Why it exists:** A premium brand is defined by what it chooses *not* to show. Overloading the interface with secondary features dilutes the primary message and creates friction.
*   **When to apply:** Above-the-fold content, main navigation menus, CTA sections.
*   **When NOT to apply:** Search directories or tabular report exports.
*   **Real Platform Example:** The sticky navigation bar which houses only four core navigation links and a single primary button.

---

# Design Guardrails

## Layout
*   Every screen must have one primary focal point. Elements must never compete with equal visual weight.
*   Maximum of two primary actions may reside above the fold.
*   Every page must contain intentional negative space (minimum vertical spacing between major sections must be `var(--space-16)` or `64px`).
*   Never place competing visual elements side by side. Avoid stacking a complex chart next to a heavy visual graphic.

## Typography
*   Headlines must be concise, memorable, and limited to a maximum of three lines of text.
*   Avoid marketing buzzwords (e.g., do not use "revolutionize your energy"). Use factual copy (e.g., "Analyze your solar potential").
*   The maximum reading width for body text blocks is strictly capped at `600px` (or `60ch`) to maintain readability.
*   Use hierarchy (font size, weight, letter spacing) before using decoration (dividers, borders, background badges).

## Photography
*   Only feature premium Indian residential architecture with modern solar integration. 
*   Ensure all engineering environments show real, clean, and organized worksites.
*   Installers must be depicted wearing authentic safety gear, with zero staged smiles or unnatural poses.
*   Never use standard, bright, generic stock-office photography.
*   Strictly prohibit AI-generated branding artifacts on clothing, helmets, vehicles, or equipment. All branding must correspond exactly to the official GET Solar Energy logo.
*   Lighting direction must remain consistent throughout any sequential storytelling flow.

## Glass & Materials
*   **Acceptable Blur:** Standard glass cards must use `backdrop-filter: blur(20px)` (`var(--blur-glass)`). Modals use `blur(32px)` (`var(--blur-modal)`).
*   **Border Opacity:** Glass borders must be subtle and thin (`1px solid rgba(255, 255, 255, 0.08)`).
*   **Shadow Depth:** Glass elements must use soft, deep shadows (`box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28)`).
*   **Reflection Intensity:** Top highlights must be simulated using a linear gradient of `rgba(255, 255, 255, 0.04)` to `transparent`.
*   **Layer Hierarchy:** Base sections are solid/deep (`#060F1F`). Intermediate panels are standard glass (`rgba(8, 24, 42, 0.72)`). Floating HUD elements and overlays use heavy/opaque glass (`rgba(6, 17, 31, 0.88)`).

---

## 2. Motion Language

### Scroll Pacing & Camera
*   Scroll pacing must feel deliberate and heavy. Viewport camera movements must use a custom slow easing curve (`cubic-bezier(0.2, 0.9, 0.3, 1)`).
*   Parallax camera scaling is limited to a maximum zoom change of `1.08`.
*   Avoid sudden layout shifts. All layout reveals must slide smoothly over `var(--duration-slow)` (400ms).

### Interaction Physics
*   **Hover Snappiness:** Button hover states must activate within `var(--duration-fast)` (150ms) to feel highly responsive.
*   **Card Inertia:** Card hover lifts must use a smooth transition (`var(--duration-normal)` / 250ms) with a gentle vertical translation (maximum `3px`).
*   **Reveal Timing:** Reveal keyframes must stagger children by exactly `80ms` to create a rhythmic, flowing entrance.
*   **Reduced-Motion Behaviour:** When a user has `prefers-reduced-motion: reduce` active, all animations must disable immediately, and elements must load at `opacity: 1` with `transform: none`.

### Examples
*   **Good Motion:** The subtle stagger of values on the ROI graph, the smooth fade-in of satellite contours in the Roof Assessment scene.
*   **Poor Motion:** Cards bouncing wildly on hover, fast spinning loading wheels, flashing text highlights.

---

## 3. Storytelling Rules

### Scene 1 — Arrival
*   **Purpose:** Introduce the platform's vision and create aspiration.
*   **Customer Question:** *Why choose solar?*
*   **Emotional Objective:** Aspiration and curiosity.
*   **Visual Objective:** High-end modern Indian home integrated naturally with clean solar arrays under architectural morning light.
*   **Camera Angle:** Eye-level architectural perspective, tracking slowly forward.
*   **Lens Recommendation:** 35mm (natural perspective, wide but structured).
*   **Lighting:** Morning sun (Warm 3200K, key light from 45° right, long soft shadows).
*   **Composition:** Off-center; text block left, architectural structure dominating center/right.
*   **Transition:** Slow fade-out of background elements as the user scrolls, foreground column sliding up.
*   **Ending Frame:** Centered path leading toward the house entry.

### Scene 2 — Estimate
*   **Purpose:** Provide instant value with zero friction.
*   **Customer Question:** *Could this work for my home?*
*   **Emotional Objective:** Possibility and intrigue.
*   **Visual Objective:** Elegant input panel layered over a softly blurred glass sheet.
*   **Camera Angle:** Fixed flat layout, looking slightly down at a clean tabletop surface.
*   **Lens Recommendation:** 50mm (undistorted details).
*   **Lighting:** Diffuse midday sun, soft overhead softbox.
*   **Composition:** Central input card with clear margins and high-contrast inputs.
*   **Transition:** Horizontal card shift.
*   **Ending Frame:** Display of calculated monthly savings with a blue highlight overlay.

### Scene 3 — Roof
*   **Purpose:** Prove technical capability.
*   **Customer Question:** *Will it work on my roof specifically?*
*   **Emotional Objective:** Confidence and clarity.
*   **Visual Objective:** Crisp satellite imagery of a residential roof, detailed with vector layout lines.
*   **Camera Angle:** Orthographic top-down satellite perspective.
*   **Lens Recommendation:** Flat/Telephoto (infinite focal length).
*   **Lighting:** Noon sun, high contrast, crisp shadows indicating roof slope.
*   **Composition:** Top-down roof centered, with glass HUD readouts floating on the left and right borders.
*   **Transition:** Radial scan line swipe.
*   **Ending Frame:** Outlined solar panel arrays placed on the active roof face.

### Scene 4 — Installation
*   **Purpose:** Demystify the physical installation process.
*   **Customer Question:** *Can I trust these people inside my home?*
*   **Emotional Objective:** Trust and security.
*   **Visual Objective:** Professional engineers working systematically on a solar frame mounting assembly.
*   **Camera Angle:** Low angle, looking up at the work team to emphasize craftsmanship.
*   **Lens Recommendation:** 28mm (editorial, dramatic scale).
*   **Lighting:** Late afternoon sun (Warm gold 3000K, backlighting the team).
*   **Composition:** Diagonal lines of the frame crossing the frame, engineers aligned to grid nodes.
*   **Transition:** Hard slide-left panel.
*   **Ending Frame:** Finished array silhouette against a clean sky.

### Scene 5 — Quality
*   **Purpose:** Confirm long-term durability and engineering control.
*   **Customer Question:** *Will this system last?*
*   **Emotional Objective:** Assurance and reliability.
*   **Visual Objective:** Close-up of quality assurance check; engineer inspecting electrical components.
*   **Camera Angle:** Medium close-up, over-the-shoulder.
*   **Lens Recommendation:** 85mm (shallow depth of field, extreme focus on the subject).
*   **Lighting:** Neutral daytime (5000K, crisp details).
*   **Composition:** Engineer's hands centered on the testing tool, background blurred.
*   **Transition:** Soft blur dissolve.
*   **Ending Frame:** Verified inspection stamp on the QA interface.

### Scene 6 — Savings
*   **Purpose:** Remove financial anxiety.
*   **Customer Question:** *Is it financially worthwhile for me?*
*   **Emotional Objective:** Commitment and excitement.
*   **Visual Objective:** Minimalist, clear financial charts showing direct savings over a 25-year lifespan.
*   **Camera Angle:** Orthographic front view.
*   **Lens Recommendation:** 50mm.
*   **Lighting:** Bright, clean studio lighting.
*   **Composition:** Centered data visualization chart flanked by core metric summary cards.
*   **Transition:** Linear bar wipe from left to right.
*   **Ending Frame:** Highlight on the break-even year (Year 4-5).

### Scene 7 — Lifestyle
*   **Purpose:** Present the emotional payoff of solar ownership.
*   **Customer Question:** *How will my daily life improve?*
*   **Emotional Objective:** Pride and peace of mind.
*   **Visual Objective:** Family enjoying a warm, illuminated home evening, powered quietly by solar.
*   **Camera Angle:** Wide interior perspective looking out to a garden patio.
*   **Lens Recommendation:** 35mm.
*   **Lighting:** Warm interior lights (2700K) contrasting with the cool blue dusk outside.
*   **Composition:** Golden ratio focal point on the lighted window/interior scene.
*   **Transition:** Slow vertical scroll fade.
*   **Ending Frame:** The illuminated GET Solar home exterior.

### Scene 8 — CTA
*   **Purpose:** Call the user to action.
*   **Customer Question:** *Am I ready?*
*   **Emotional Objective:** Commitment and action.
*   **Visual Objective:** Minimal, clean portal gateway card centered in the frame.
*   **Camera Angle:** Straight-on front view.
*   **Lens Recommendation:** 50mm.
*   **Lighting:** Cinematic ambient glow.
*   **Composition:** Symmetric; the primary CTA card centered, framed by extensive negative space.
*   **Transition:** Scale-in pop.
*   **Ending Frame:** Active input cursor inside the signup form.

---

## 4. Photography Bible

### Camera & Lens Specification
*   **Camera Height:** Strictly chest-level or eye-level for residential views. Never use extreme bird's-eye views or wide-angle drone shots for lifestyle images.
*   **Lens Style:** Anamorphic or high-end prime lenses with natural vignetting. 
*   **Depth of Field:** Wide open (`f/1.8` to `f/2.8`) for close-ups of engineers and equipment to isolate subjects; closed down (`f/8.0`) for wide architectural home shots.

### Atmosphere & Tone
*   **Time of Day:** Morning golden hour or late afternoon dusk. Never shoot under flat, high-noon overhead sunlight (except for top-down satellite views).
*   **Weather:** Clear skies with light, soft clouds. No overcast gray or artificially saturated skies.
*   **Color Grading:** Cool shadowed bases with warm, sun-kissed skin tones and panel highlights. No green color cast in shadows.

### Materials & Landscaping
*   **Architecture:** Clean, concrete, natural wood, and glass panels. Homes must look like high-end Indian modern residences.
*   **Landscaping:** Local native Indian flora (Bougainvillea, Palm, Frangipani) kept neat and uncrowded.
*   **Reflections:** Real reflections of clouds and sun on the panel surfaces, matching the sky in the frame.

---

## 5. Product Language

### Vocabulary Guide

| Word / Phrase to USE | Word / Phrase to AVOID | Why? |
| :--- | :--- | :--- |
| **Solar Journey** | *Sales Pipeline* | Replaces commercial transaction with guidance. |
| **Proposal** | *Quote / Price Sheet* | Sounds architectural, not transactional. |
| **Engineering Assessment** | *Site Survey* | Emphasizes technical excellence. |
| **Quality Inspection** | *Audit / Checkup* | Communicates thorough engineering. |
| **Built to Perform** | *State-of-the-art* | Focuses on physical results, not hype. |
| **Verified Installation** | *Job Complete* | Emphasizes safety and oversight. |
| **Ownership** | *Paying customer* | Promotes long-term partnership. |
| **Support** | *Customer Helpdesk* | Feels calm, secure, and helpful. |
| *Factual description of systems* | **AI-powered / Revolutionary** | Avoids hype and buzzwords. |
| *Designed for your home* | **Next-generation / Cutting-edge** | Focuses on the client, not marketing terms. |

---

## 6. Design Review Checklist

Every pull request, page modification, and style override must pass these checks:

*   [ ] **Does this reduce uncertainty?** — Is the primary user query answered directly?
*   [ ] **Does this feel premium and calm?** — Are colors and gradients used sparingly?
*   [ ] **Is there unnecessary information?** — Have you removed secondary badges, icons, or text lines?
*   [ ] **Is typography doing enough work?** — Can the layout communicate hierarchy without borders?
*   [ ] **Is the photography authentic?** — Are there any AI text errors or generic stock smiles?
*   [ ] **Is whitespace sufficient?** — Does the container have room to breathe?
*   [ ] **Would Apple or Tesla remove something from this screen?** — If yes, remove it.
*   [ ] **Does this look unmistakably GET Solar Energy?** — Does it match the brand style?

*If the implementation fails any item, it must be revised before merge.*

---

## 7. Portal Standards

```
                     [UNIFIED ECOSYSTEM]
                            ┌───┐
                      ┌────►│ L │◄────┐
                      │     └───┘     │
                      ▼               ▼
                    ┌───┐           ┌───┐
                    │ C │           │ E │
                    └───┘           └───┘
                      ▲               ▲
                      │     ┌───┐     │
                      └────►│ A │◄────┘
                            └───┘
  L: Landing (Aspirational)      E: Engineer Portal (Functional)
  C: Customer Portal (Guidance)   A: Admin Portal (Control)
```

*   **Landing Page:** Focuses on aspiration, curiosity, and emotional storytelling. Clean images and large headlines dominate.
*   **Customer Portal:** Feels like a personal dashboard operating system. Calm confidence, high visibility, and clear savings metrics are prioritized.
*   **Engineer Portal:** Focuses on pure utility and information density. The color system shifts toward standard blue accents for tool controls, maintaining clean grids and solid table containers.
*   **Vendor Portal:** Focuses on logistics clarity. Clear timelines, receipt uploads, status badges, and simplified table views are key.
*   **Administrator Portal:** Focuses on operational overview and control. Dense grid layouts, chart aggregations, filter toolbars, and color-coded status badges rule here.

---

## 8. Brand Evolution Rules

To protect the platform from design drift over years of development:

1.  **Extend, Never Replace:** When building a new component, customize the design tokens in `styles/tokens.css` first. Never create parallel variables.
2.  **Reuse Before Creating:** Check if an existing component from the Design System (`styles/design-system.css`) can be modified or wrapped before writing a new stylesheet.
3.  **Simplify Before Adding:** If a screen feels cluttered, remove secondary visual elements rather than adding dividers or containers to separate them.
4.  **Preserve Cross-Platform Identity:** The customer dashboard and administrative views must share the exact typography weights, button radius values, and color palettes.

---

## 9. Governance

This Creative Direction Bible is the **supreme creative authority** for the GET Solar Energy platform.

### Authority Hierarchy
1.  **Creative Direction Bible** (`AGENTS.md`)
2.  **Enterprise Design System** (`styles/design-system.css`)
3.  **Product Requirements** (`PRD`)
4.  **Feature Requests**

*If any visual layout, codebase update, or copy change conflicts with this Bible, the implementation must be rejected or rewritten. The Bible is not modified to justify inconsistent design.*
