# Hero Headline Scroll-Up Vertical Text Carousel

A lightweight, non-destructive animation enhancement that adds a smooth scroll-up vertical carousel to the primary Hero headline, cycling through document types and verification capabilities while preserving 100% of the underlying forensics pipeline and source code.

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selections during interactive clarification, the scroll-up text effect will be implemented with the following specifications:

- **Confirmed Decision 1 (Placement)**: Applied directly to the **Hero headline** in `src/pages/HomePage.tsx`. The fixed lead-in text anchors the statement, while the dynamic key phrase slides upward to reveal rotating aspects of the platform.
- **Confirmed Decision 2 (Animation Style)**: **Smooth vertical carousel sliding up every 3 seconds**. Uses pure CSS transform/transition with an interval timer to glide the incoming text upward while gently scrolling the previous text out of view.
- **Confirmed Decision 3 (Zero Source Code Damage Guarantee)**: Fully non-destructive. Modifies only the visual presentation wrapper of the headline in `src/pages/HomePage.tsx`. All 103 automated tests, ML policy engine (`rlEngine.ts`), edge verification pipeline (`edgePipeline.ts`), and OCR parsing (`ocrEngine.ts`) remain completely untouched.

---

### 1. Overview & Core Concept

- **What It Does**: Replaces static headline text with an engaging, smooth vertical slide-up text rotator that continuously showcases what DocuGuard verifies:
  1. *"...against physical alterations."*
  2. *"...with total on-device privacy."*
  3. *"...across Aadhaar, PAN & Passports."*
  4. *"...detecting screen re-photography."*
  5. *"...with instant ground-truth memory."*
- **Target Audience**: Compliance officers, verification analysts, and visitors landing on the homepage who immediately see the broad scope of documents and tamper checks supported.
- **Key Value**: Adds human dynamic motion and visual polish to the hero fold without any heavy third-party animation dependencies or risk to existing functionality.

---

### 2. User Experience & Visual Design

#### Headline Visual Motion

```
       ┌────────────────────────────────────────────────────────┐
       │   Verify identity documents                            │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │ ▲ [ ...with total on-device privacy.           ] │  │  (Slides up & fades in)
       │  └──────────────────────────────────────────────────┘  │
       │  (Masked container: overflow-hidden, smooth 400ms ease)│
       └────────────────────────────────────────────────────────┘
```

- **Visual Details**:
  - Container: Inline-block with `overflow-hidden` fixed height matching the line-height (`h-[1.25em]`).
  - Active text: Soft indigo-accented gradient (`text-indigo-400 font-extrabold`).
  - Motion: `translateY(0)` to `translateY(-100%)` for exiting text, and `translateY(100%)` to `translateY(0)` for entering text.
  - Reduced Motion Respect: If the user has `prefers-reduced-motion` enabled in their OS, smoothly cross-fades opacity without vertical displacement.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Self-Contained React Hook Component vs. External Library**:
  - *Chosen Approach*: Self-contained React state + CSS transition inside a dedicated micro-component or inline state in `src/pages/HomePage.tsx`.
  - *Why*: Installing external animation packages (e.g. Framer Motion, GSAP) is unnecessary for a single carousel headline and risks bloat or bundle breakage. Native React + Tailwind delivers 60fps performance with zero new dependencies.

- **Decision 2: Cycling Phrases Selection**:
  - *Phrases*:
    1. `"with total on-device privacy."`
    2. `"against physical tampering."`
    3. `"across Aadhaar, PAN & Passports."`
    4. `"detecting screen re-photography."`
    5. `"with instant verification memory."`
  - *Why*: Directly reinforces the 5 core capabilities built into the applet without altering any layout geometry.

---

### 4. Technical Architecture & Implementation Steps

#### Component Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    HomePage Component Render                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Hero Scroll-Up Headline Wrapper                     │
│                                                                 │
│   "Verify identity documents"                                   │
│   ┌───────────────────────────────────────────────────────┐     │
│   │ useEffect Interval (every 3000ms):                     │     │
│   │   1. Trigger exit animation (slide up & fade)         │     │
│   │   2. Increment index (cycle 0 -> 1 -> 2 -> ... -> 0)  │     │
│   │   3. Trigger enter animation (slide up from bottom)   │     │
│   └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

#### Step-by-Step Implementation:

1. **Implement Scroll-Up Text Mechanism in `src/pages/HomePage.tsx`**:
   - [x] Created `ScrollUpText` component cycling through 5 key phrases every 3.2 seconds.
   - [x] Added `@keyframes scrollUpIn` and `@keyframes scrollUpOut` in `src/index.css` with cubic-bezier easing and `prefers-reduced-motion` compliance.
2. **Verify Non-Interference**:
   - [x] Confirmed zero damage to verification pipeline, reinforcement learning agent, OCR engine, or navigation.
   - [x] Fixed-height container prevents layout jitter on mobile and desktop.
3. **Automated Verification**:
   - [x] `npm test`: 103/103 tests passing with 0 failures across all 10 suites.
   - [x] `lint_applet` (`tsc --noEmit`): 0 TypeScript errors.
   - [x] `compile_applet`: Build succeeded cleanly.
   - [x] `restart_dev_server`: Dev server restarted.
