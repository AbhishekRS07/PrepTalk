# theme.md — Design Tokens & Theme

## Part 1 — Compact Token Summary

Two theme systems coexist in this codebase:

1. **App-wide theme** (`:root` / `.dark` HSL CSS vars in `app/globals.css`, consumed via Tailwind's `hsl(var(--token))` color aliases in `tailwind.config.js`). Used by the dashboard, auth pages, and every non-landing page. Toggled by `next-themes` (`class` strategy, `storageKey: "preptalk-theme"`, default `"system"`).
2. **Landing-page-only theme** (`.pt-landing` scoped CSS vars, hardcoded dark, terminal/hacker aesthetic). Used exclusively by `app/page.js`. Does NOT respond to the light/dark toggle — it's permanently dark by design.

### 1. App-wide color palette (HSL triplets — use as `hsl(var(--token))`)

| Token | Light (`:root`) | Dark (`.dark`) |
|---|---|---|
| `--background` | `0 0% 99%` (near-white) | `224 20% 8%` (near-black navy) |
| `--foreground` | `224 15% 10%` | `220 15% 95%` |
| `--card` | `0 0% 100%` | `224 20% 11%` |
| `--card-foreground` | `224 15% 10%` | `220 15% 95%` |
| `--popover` | `0 0% 100%` | `224 20% 11%` |
| `--popover-foreground` | `224 15% 10%` | `220 15% 95%` |
| `--primary` | `245 75% 55%` (indigo/violet) | `245 75% 65%` |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` |
| `--secondary` | `220 15% 96%` | `224 20% 15%` |
| `--secondary-foreground` | `224 15% 20%` | `220 15% 80%` |
| `--muted` | `220 15% 94%` | `224 20% 15%` |
| `--muted-foreground` | `220 10% 50%` | `220 10% 55%` |
| `--accent` | `245 75% 96%` | `245 40% 18%` |
| `--accent-foreground` | `245 75% 40%` | `245 75% 75%` |
| `--destructive` | `0 84% 60%` (red) | `0 62% 50%` |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 100%` |
| `--border` | `220 15% 90%` | `224 20% 18%` |
| `--input` | `220 15% 90%` | `224 20% 18%` |
| `--ring` | `245 75% 55%` | `245 75% 65%` |

Border radius: `--radius: 0.75rem` (12px) — `lg = radius`, `md = radius - 2px`, `sm = radius - 4px` (mapped in Tailwind).

### 2. Landing-page palette (`.pt-landing` scope, fixed dark, hex values)

| Token | Value | Role |
|---|---|---|
| `--pt-ink` | `#0a0d0c` | page background (near-black, slight green tint) |
| `--pt-panel` | `#121615` | card/panel background |
| `--pt-line` | `#23282a` | borders/dividers |
| `--pt-chalk` | `#edeee7` | primary text (off-white) |
| `--pt-mist` | `#8b958e` | secondary/muted text |
| `--pt-signal` | `#39f2a0` | accent/brand green (CTAs, highlights, "live" indicators) |
| `--pt-ember` | `#ff7a4d` | secondary accent (used sparingly, e.g. "AI — follow-up" label) |

### 3. Fonts

- **App-wide**: `Inter` (Google Font) → CSS var `--font-inter`, applied via `font-family: var(--font-inter), system-ui, sans-serif` on `body`, and as Tailwind's `fontFamily.sans`.
- **Landing page only**: two additional Google Fonts loaded directly in `app/page.js` (not app-wide):
  - `IBM_Plex_Mono` → `--font-plex-mono` → utility class `.pt-mono` (headings, labels, code-like UI, nav)
  - `IBM_Plex_Sans` → `--font-plex-sans` → utility class `.pt-sans` (body copy)

No explicit type-scale/spacing-scale config beyond Tailwind defaults — the codebase uses Tailwind's default `text-xs`…`text-6xl` and spacing scale directly in JSX `className`s (no custom `theme.extend.fontSize`/`spacing`).

### 4. Border radius scale (Tailwind, from `--radius`)

```
lg: 0.75rem (12px)
md: 0.625rem (10px)
sm: 0.4375rem (7px)
```

### 5. Breakpoints

Default Tailwind breakpoints (no overrides): `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl` container capped at `1400px` (via `container.screens["2xl"]`). Container is `center: true` with `padding: "2rem"`.

### 6. Custom utility classes (defined in `globals.css` `@layer utilities`)

- `.gradient-primary` — diagonal gradient `primary → indigo-600 → blue-600`, used as the sign-in/sign-up left panel background.
- `.gradient-text` — gradient text clip, `primary → indigo-600`.
- `.glass` — `backdrop-blur-md` + translucent white/black background + subtle border (used on dashboard `Header`).
- `.dot-grid` — radial-dot background pattern using `--border` color.
- `.animate-float` / `@keyframes float` — gentle vertical float loop.
- `.glow-primary` — soft primary-colored box-shadow glow.
- `.animate-fade-up` / `@keyframes fadeUp` — entrance fade+rise.
- `.pt-landing`, `.pt-mono`, `.pt-sans` — landing-page scope + font utilities (see above).
- `.pt-wave-bar` / `@keyframes pt-wave` — audio-waveform bar animation (hero "listening…" indicator).
- `.pt-cursor-blink` / `@keyframes pt-blink` — blinking terminal cursor after "PrepTalk_" wordmark.
- Global: smooth `scroll-behavior`, and a blanket `transition-property: background-color, border-color, color` on `*` (plus opacity/transform/box-shadow for interactive elements) for smooth light/dark theme switching. Respects `prefers-reduced-motion` for the two `.pt-*` animations.

### 7. Component styling approach

`cva` (class-variance-authority) for variant-based components (`Button`), `tailwind-merge` + `clsx` (via `cn()` in `lib/utils.js`) for className composition everywhere. `tailwindcss-animate` plugin provides `data-[state=...]` open/close animation utilities used by Radix Dialog/AlertDialog (`animate-in`/`animate-out`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`, etc.) plus `accordion-down`/`accordion-up` keyframes.

---

## Part 2 — Raw Source Dumps

### `tailwind.config.js` (full)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### `app/globals.css` (full, 184 lines)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 99%;
    --foreground: 224 15% 10%;

    --card: 0 0% 100%;
    --card-foreground: 224 15% 10%;

    --popover: 0 0% 100%;
    --popover-foreground: 224 15% 10%;

    --primary: 245 75% 55%;
    --primary-foreground: 0 0% 100%;

    --secondary: 220 15% 96%;
    --secondary-foreground: 224 15% 20%;

    --muted: 220 15% 94%;
    --muted-foreground: 220 10% 50%;

    --accent: 245 75% 96%;
    --accent-foreground: 245 75% 40%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --border: 220 15% 90%;
    --input: 220 15% 90%;
    --ring: 245 75% 55%;

    --radius: 0.75rem;
  }

  .dark {
    --background: 224 20% 8%;
    --foreground: 220 15% 95%;

    --card: 224 20% 11%;
    --card-foreground: 220 15% 95%;

    --popover: 224 20% 11%;
    --popover-foreground: 220 15% 95%;

    --primary: 245 75% 65%;
    --primary-foreground: 0 0% 100%;

    --secondary: 224 20% 15%;
    --secondary-foreground: 220 15% 80%;

    --muted: 224 20% 15%;
    --muted-foreground: 220 10% 55%;

    --accent: 245 40% 18%;
    --accent-foreground: 245 75% 75%;

    --destructive: 0 62% 50%;
    --destructive-foreground: 0 0% 100%;

    --border: 224 20% 18%;
    --input: 224 20% 18%;
    --ring: 245 75% 65%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-inter), system-ui, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  /* Smooth theme transitions */
  *,
  *::before,
  *::after {
    transition-property: background-color, border-color, color;
    transition-duration: 0.2s;
    transition-timing-function: ease;
  }

  /* Override transition for elements that shouldn't animate */
  button, a, input, textarea, select {
    transition-property: background-color, border-color, color, opacity, transform, box-shadow;
  }
}

@layer utilities {
  .gradient-primary {
    @apply bg-gradient-to-br from-[hsl(var(--primary))] via-indigo-600 to-blue-600;
  }

  .gradient-text {
    @apply bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent;
  }

  .glass {
    @apply backdrop-blur-md bg-white/70 dark:bg-black/30 border border-white/20 dark:border-white/10;
  }

  .dot-grid {
    background-image: radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }

  .glow-primary {
    box-shadow: 0 0 40px -10px hsl(var(--primary) / 0.4);
  }

  .animate-fade-up {
    animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Landing page: fixed dark, terminal-inspired identity ──
     Scoped to .pt-landing so it never touches the app-wide theme tokens above. */
  .pt-landing {
    --pt-ink: #0a0d0c;
    --pt-panel: #121615;
    --pt-line: #23282a;
    --pt-chalk: #edeee7;
    --pt-mist: #8b958e;
    --pt-signal: #39f2a0;
    --pt-ember: #ff7a4d;
  }

  .pt-mono {
    font-family: var(--font-plex-mono), ui-monospace, "SFMono-Regular", monospace;
  }

  .pt-sans {
    font-family: var(--font-plex-sans), system-ui, sans-serif;
  }

  .pt-wave-bar {
    animation: pt-wave 1.1s ease-in-out infinite;
    transform-origin: center;
  }

  @keyframes pt-wave {
    0%, 100% { transform: scaleY(0.25); }
    50%      { transform: scaleY(1); }
  }

  .pt-cursor-blink {
    animation: pt-blink 1s step-end infinite;
  }

  @keyframes pt-blink {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .pt-wave-bar,
    .pt-cursor-blink {
      animation: none;
    }
  }
}
```

### Theme provider wiring (`app/layout.js`, relevant excerpt)

```jsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
  storageKey="preptalk-theme"
>
```

Full file is in `layouts.md` under "Root Layout".
