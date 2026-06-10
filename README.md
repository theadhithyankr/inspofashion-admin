# Inspo Fashion Admin

Protected React admin dashboard for managing the Inspo Fashion storefront.

## Key Features
- Protected React admin dashboard for managing the Inspo Fashion storefront
- Supabase integration is called out for the data, auth, or application state layer present in the codebase.
- Includes management-facing screens such as admin, dashboard, or coordinator workflows where present.
- Organized UI components and screens make the main user flows visible from the project structure.
- Existing media assets are referenced only where they are already present in the repository.
- Package scripts provide reproducible development, build, and preview commands.

## Tech Stack
- JavaScript/TypeScript
- React
- Vite
- Tailwind CSS
- Supabase
- HTML/CSS

## Project Structure
- src/app or app - application routes, screens, and layout files.
- components - reusable UI and workflow components.
- public / assets - static images, icons, manifests, and visual assets.

## Setup and Run
```bash
git clone https://github.com/theadhithyankr/inspofashion-admin.git
cd inspofashion-admin
npm install
npm run dev
npm run build
npm run preview
```

## Color Variant Image Mapping

Products store their color-specific images in the `color_image_map` JSONB column:

```json
{
  "Red": ["https://example.com/red-front.webp", "https://example.com/red-back.webp"],
  "Blue": ["https://example.com/blue-front.webp"]
}
```

Apply `supabase/migrations/20260610000000_add_color_image_map_to_products.sql` to the Supabase project before saving products with this feature.

The storefront can use `getProductImagesForColor(product, selectedColor)` from `src/utils/productVariants.js`. It returns the selected color's images and falls back to the existing `images` or `image_url` fields for legacy products.

## Screenshots and Media
- Existing asset: src/assets/hero.png

## What This Project Demonstrates
- Building user-facing web applications with component-based UI and modern frontend tooling.
- Integrating managed backend services for auth, persistence, realtime data, or app infrastructure.
- Presenting project scope, setup, and technical choices clearly for reviewers and recruiters.

## Repository
- GitHub: https://github.com/theadhithyankr/inspofashion-admin
