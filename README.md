# create-lazy-init

My app setup, as a CLI. Scaffolds a React or Next.js app with my providers, hooks and
data files already wired up, and lets me pull my components into any project, shadcn-style:
the source is copied into your project, so you own it and can edit it.

```bash
npm create lazy-init@latest            # new project
npx create-lazy-init@latest add header-bar # add components to an existing one
```

## Templates

| Template  | Stack                                                    |
| --------- | -------------------------------------------------------- |
| `react`   | Vite + React Router + TypeScript + Tailwind               |
| `next`    | Next.js App Router + TypeScript + Tailwind (`src/` dir)   |
| `vanilla` | Vite + TypeScript, nothing else (Tailwind / ESLint opt-in) |

`react` and `next` share the same structure, and every component works in both:

```Plaintext
src/
├── app/ or routes/   # Next pages / React Router routes
├── components/       # added components land here
├── data/             # site.ts, navigation.ts, texts.ts: all copy and site details
├── hooks/            # useMediaQuery, useUser
├── lib/              # router + image adapters, scroll helpers
├── providers/        # index.tsx (all providers), smoothScroll, user
└── utils/            # viewport helpers
```

- **Smooth scroll**: Lenis, driven by the GSAP ticker and kept in sync with ScrollTrigger.
  `lockScroll()`, `unlockScroll()`, `syncScroll()` and `getLenis()` are in `@/lib/scroll`.
- **Adapters**: components import `Link` / `usePathname` from `@/lib/router` and `Image` from
  `@/lib/image`. In Next these are `next/link` and `next/image`, in React a React Router
  wrapper and an `<img>`, so one component file works in both.
- **Data**: components read their copy and site details from `src/data`. Fill those in per project.

## Components

```bash
npx create-lazy-init@latest add --list    # what's available
npx create-lazy-init@latest add header-floating footer-big-type
npx create-lazy-init@latest add --all
```

`add` copies the component and anything it depends on, then installs missing npm packages
with your package manager. Files you have edited are never overwritten unless you pass
`--overwrite`. You can also pick components while creating the project.

## Flags

```bash
npm create lazy-init@latest my-app -- -t next -c header-bar,footer-reveal --eslint
```

| Flag                      | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `-t, --template <name>`   | `react`, `next` or `vanilla`                             |
| `-c, --components <list>` | comma separated components, or `all`                     |
| `--eslint`                | Include ESLint                                           |
| `--tailwind`              | Include Tailwind CSS (vanilla only, the others always have it) |
| `--no-git`                | Skip `git init`                                          |
| `-y, --yes`               | Use defaults for anything not passed (no extras, git on) |
| `-f, --force`             | Write into a non-empty folder without asking             |

## Adding a component to the registry

1. Put the file in `registry/shared/` at the path it should have under `src/`, e.g.
   `registry/shared/components/ui/marquee.tsx`. Import other registry files with `@/…`, and
   use `@/lib/router` / `@/lib/image` instead of `next/*` or `react-router`.
2. Add an entry to `registry/registry.json` with its `files`, npm `dependencies`, and the
   registry items it imports (`registryDependencies`).
3. Run `npm test`. It checks that every file exists and that every import is covered.

Variants are named `<category>-<what makes it different>`: `header-bar`, `header-floating`,
`footer-reveal`, `footer-big-type`, `hero-fullscreen`. The file and export follow the name
(`components/layout/headerFloating.tsx`, `HeaderFloating`). If only styling changes, add a
prop instead of a new component.

A file that has to differ per framework goes in `registry/next/` and `registry/react/` instead.

## Requirements

Node.js 22.4 or newer.
