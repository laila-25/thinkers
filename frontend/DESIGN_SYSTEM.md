# Thinkers Design System

Thinkers keeps its existing navy, amber, warm-white identity. New interfaces should use the shared primitives in `src/components/ui` before adding page-specific styles.

## Theme

`ThemeProvider` resolves `light`, `dark`, or `system` preferences. With no explicit preference it follows the operating system live. Explicit choices are stored under `thinkers-theme`.

```jsx
const { theme, preference, toggleTheme, setTheme, useSystemTheme } = useTheme();
```

The document uses `data-theme="light|dark"`; Tailwind's `dark:` variant is configured against this attribute. Use semantic slate surfaces and the shared CSS tokens rather than fixed page colors.

## Components

```jsx
import {
  Badge, Button, Card, EmptyState, Input,
  LoadingState, Modal, ToastProvider, useToast,
} from './components/ui';
```

- `Button`: `primary`, `secondary`, `outline`, `danger`, `ghost`, `accent`, and compatible legacy variants.
- `Card`: standard surface; add `interactive` only when the complete card is actionable.
- `Input`: accessible label, hint, validation error, and generated description IDs.
- `Modal`: Escape/backdrop dismissal, focus entry, scroll locking, and accessible dialog semantics.
- `Badge`: `neutral`, `success`, `warning`, `danger`, and `info` tones.
- `EmptyState`: icon, title, description, and optional action.
- `LoadingState`: accessible, responsive skeletons that respect reduced motion.
- `ToastProvider` / `useToast`: stacked success, error, and informational notices with automatic dismissal.

## Visual rules

- Use 12px–24px control radii and 24px card radii.
- Use amber for primary actions and progress, not large text blocks.
- Prefer slate typography with `text-slate-950`, `text-slate-600`, and `text-slate-500`; global dark mappings preserve contrast.
- Use spacing increments already present in Tailwind; standard card padding is `p-5` or `p-6`.
- Motion must communicate interaction or state. `prefers-reduced-motion` globally disables nonessential animation and transforms.
- Keep feature routes lazy and do not import feature-only primitives into the application bootstrap.
