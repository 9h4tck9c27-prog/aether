# æther

Your daily astrological weather. It's not just you.

æther is a free web app that reads your birth chart (Western and Vedic together) against today's sky, the real space weather above you, and how everyone else is feeling. You check in on any kind of day, heavy or golden, and get a reading that starts from your own words.

This is the first prototype.

## What's in it

- A 3D celestial sphere with the real positions of the planets, which you turn by tilting your phone or dragging.
- Colours that follow the real sunrise and sunset: dawn, day, dusk and night.
- Onboarding with birth date, time and city, and a reveal of your Sun, Moon, rising sign and Vedic Moon mansion.
- The "How's today?" check-in: a heavy-to-golden slider, a few words, and a reading built from your transits, the Vedic daily sky, NOAA space weather and a line from the old traditions.
- A breathing ritual for heavy days and "Bottle this" for golden ones.
- A sky journal kept on your phone, with backup and restore.
- Add-to-home-screen prompt, app icon, native share sheet, shareable reading cards and link previews.

Everything runs in the browser. Your birth details, check-ins and words never leave your phone.

## Project layout

```
site/             The app itself (static files, published as-is)
  index.html
  css/styles.css
  js/app.js       Screens and interactions
  js/astro.js     Astrology engine and reading writer
  js/data.js      Cities, signs, Vedic mansions, reading copy
  js/sky3d.js     The 3D sphere (three.js)
  vendor/         three.js and Astronomy Engine
  fonts/          Fraunces and Figtree (SIL Open Font License)
  icons/, og-image.png, manifest.webmanifest, sw.js
tools/            Scripts that draw the icons and link-preview image
netlify.toml      Hosting settings
```

## Run it locally

```
python3 -m http.server 8000 -d site
```

Then open http://localhost:8000.

## Credits

- Planet positions: [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT)
- 3D: [three.js](https://threejs.org) (MIT)
- Space weather: [NOAA Space Weather Prediction Center](https://www.swpc.noaa.gov)
- Fonts: Fraunces and Figtree, via Fontsource (SIL Open Font License)

æther is for reflection, not prediction.
