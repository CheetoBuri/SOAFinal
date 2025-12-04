# Cafe Ordering React (SPA)

This React app lives alongside the existing frontend and reuses your CSS. It focuses first on Shop (Menu + Cart) then will port other views.

## Run (macOS, zsh)

```sh
cd frontend/react
npm install
npm run dev
```

Open http://localhost:5173

API calls under `/api/*` are proxied to `http://localhost:3000` (FastAPI). Adjust `vite.config.js` if needed.

## Structure
- `src/pages/Shop.jsx`: Shop page rendering category sections
- `src/components/CategorySection.jsx`: Full-width category section, 2 products/row inside
- `src/components/ProductCard.jsx`: Product card + Add to cart
- `src/components/CartSidebar.jsx`: Cart with +/- and remove
- `src/context/AppContext.jsx`: App-wide state
- `src/hooks/useMenu.js`: Fetch menu

## Next
- Wire menu endpoints to match FastAPI
- Port Customization Modal (size/milk/sugar/upsells/toppings)
- Connect Checkout + OTP
