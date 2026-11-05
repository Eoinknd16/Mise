# Mise

A free, mobile-first meal planner and shopping list that learns what you actually buy.

- **Plan**: suggests a week of dinners from built-in recipes, TheMealDB and your own, mixing favourites with something new so you don't get stuck in a rut.
- **Smart list**: combines ingredients across meals, subtracts what's in the pantry, rounds up to real pack sizes, sorts by shop and aisle, and estimates the cost.
- **Pantry**: tracks what you have and when it goes off; "What can I make?" ranks recipes by what's already in the house.
- **Receipts**: scan a photo or screenshot (read on your device), fix any misread lines once and it remembers. Learns real prices, fills the pantry and reviews your shop (gentle, cheeky or savage), with tips and a smarter list for next week.
- **Meal builder**: describe a meal ("creamy chicken pasta for 4, no mushrooms") and tweak it: cheaper, healthier, spicier, quicker, veggie. Optional AI with no running cost to the owner (Chrome on-device AI, or Puter where each user signs in to their own free account).
- **Deals, spending insights, backup/restore.** Everything is stored on the device.

## Run it

It's plain HTML/CSS/JS in `www/` with no build step. Serve the folder with any static server (`npm run serve`) or open the GitHub Pages site.

## GitHub Pages

`.github/workflows/pages.yml` publishes `www/` on every push to `main`. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Android APK

`.github/workflows/android.yml` wraps the same web app with Capacitor and builds a signed release APK on every push. Download it from the repo's **Releases** page on your phone and open it to install.

Every build is signed with the same key (`android/keystore/`) so new versions install over old ones without losing data. That key is committed for convenience. To use a private key instead, add repository secrets `MISE_KEYSTORE_BASE64`, `MISE_STORE_PASSWORD`, `MISE_KEY_ALIAS` and `MISE_KEY_PASSWORD` (switching keys means uninstalling once: back up your data in Settings first).

Build locally (needs Android SDK and JDK 21): `npm install && npm run apk`.

## Data sources

- Recipes: [TheMealDB](https://www.themealdb.com) (free test key `1`; supporters get a personal key, set it in Settings).
- Prices: your own receipts and deals you save. Prices marked "est." are rough Irish discounter guesses only.
- Receipt reading: [Tesseract.js](https://tesseract.projectnaptha.com/), on device.
