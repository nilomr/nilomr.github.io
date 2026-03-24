# nilomr.github.io

My personal website! This repo contains the source code for the live site and a static build output.

## Tech stack

- SvelteKit 2 (Svelte 5)
- Vite 7
- Three.js for WebGL components
- GSAP and Lenis for motion/scroll behavior
- Paraglide for localization (English, Spanish, French)

## Development

Requirements:

- Node.js 20+
- pnpm

Install and run locally:

```bash
pnpm install
pnpm dev
```

## Build

Create a production build:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

The project uses a static adapter, with output written to the build directory.

## Project layout

- src/routes: route files and page composition
- src/lib/components: UI and WebGL components
- messages: localization source messages
- src/lib/paraglide: generated runtime and message modules
- static: static assets served as-is
- build: generated static output

## Notes

- Routing is prerendered with trailing slashes enabled.
- Locale handling is implemented through Paraglide middleware and URL strategy.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.