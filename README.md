# create-lazy-init

Scaffold a clean TypeScript project with zero demo content. No logos, no counter buttons, no styles to delete.

```bash
npm create lazy-init@latest
```

Pass `.` to scaffold into the current folder:

```bash
npm create lazy-init@latest .
```

## Templates

| Template  | Stack                     |
| --------- | ------------------------- |
| `react`   | Vite + React + TypeScript |
| `next`    | Next.js App Router + TypeScript (`src/` dir, `@/*` alias) |
| `vanilla` | Vite + TypeScript         |

Each template ships with an empty entry point and a two-rule CSS reset. Nothing else.

### Optional extras

Picked during setup, removed cleanly (config, deps and imports) when not selected:

- **ESLint**: flat config per template
- **Tailwind CSS v4**: Vite plugin, or PostCSS for Next.js

## Flags

Everything can be passed up front to skip the prompts:

```bash
npm create lazy-init@latest my-app -- -t react --tailwind --eslint
```

| Flag                    | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `-t, --template <name>` | `react`, `next` or `vanilla`                             |
| `--eslint`              | Include ESLint                                           |
| `--tailwind`            | Include Tailwind CSS                                     |
| `--no-git`              | Skip `git init`                                          |
| `-y, --yes`             | Use defaults for anything not passed (no extras, git on) |
| `-f, --force`           | Write into a non-empty folder without asking             |

Git init is skipped automatically when the target is already inside a repository.

## Requirements

Node.js 22.4 or newer.
