# Mimic Website

This directory contains the source code for the [Mimic](https://github.com/sagibrant/mimic) official website and documentation, deployed to GitHub Pages.

It is built using [React](https://react.dev/), [Vite](https://vitejs.dev/), and [TypeScript](https://www.typescriptlang.org/).

## Features

- **Product Landing Page**: Introduction to Mimic features and capabilities.
- **Documentation**: Guides, API references, and examples.
- **Interactive Demos**: Live demonstrations of Mimic automation.

## Local Development

### Prerequisites

- Node.js (v23+)
- pnpm (v10+)

### Setup

1. Install dependencies from the project root:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   # Run from apps/web-site directory
   pnpm dev
   
   # Or run from root
   pnpm --filter demo-web-site dev
   ```

3. Open your browser and navigate to the local URL (typically `http://localhost:5173`).

## Building

To build the application for production:

```bash
pnpm build
```

This will compile the TypeScript code and bundle the assets into the `dist` directory.

## Preview

To preview the production build locally:

```bash
pnpm preview
```

## Deployment

The website is automatically built and deployed to GitHub Pages via GitHub Actions when changes are pushed to the main branch.
