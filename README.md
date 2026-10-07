# Athlete OS — voorstel

**Live: <https://rm-bcn.github.io/athlete-os/>**

Drie pagina's om een zelfgebouwd, adaptief trainingssysteem te bespreken **voordat** er iets
gebouwd wordt. Geen productcode — een voorstel, een architectuur en een interface-schets.

Open `index.html` in je browser, of gebruik de live-link hierboven. Geen server nodig, geen build stap.

| Bestand | Wat het is |
|---|---|
| `index.html` | **Het voorstel.** Scroll-door pitch: probleem, kernvondst, de adaptieve lus, de vijf fasen, de keuzes, wat het oplevert, de grenzen, de kosten. |
| `backend.html` | **De architectuur.** Datastroom-diagram, lagen, bestandsstructuur, datamodel, skill-in/uit, de adaptatieregels, het schema. |
| `frontend.html` | **De interface.** Vier telefoonschermen (vandaag, de week, voortgang, coach) en het desktop-dashboard. |
| `screenshots/` | 50 renders — desktop (1440) en mobiel (390 @2x), volledige pagina's plus per sectie. |
| `tools/screenshots.mjs` | Waarmee die renders gemaakt worden. |

## Screenshots

Alles in `screenshots/` is te bekijken op GitHub, ook op mobiel:

- `screenshots/desktop/` — `index-full.png`, `backend-full.png`, `frontend-full.png`
- `screenshots/desktop/sections/` — per sectie, 22 stuks
- `screenshots/mobile/` — dezelfde set op 390 px breed

Opnieuw genereren:

```bash
PLAYWRIGHT_MODULE=/pad/naar/playwright/index.js node tools/screenshots.mjs
```

## De kern in één alinea

Er is geen GitHub-repo om te klonen — het "Athlete OS" van Kevin Rudd is een set prompts.
Deze repo vertaalt dat naar **jouw** situatie: Huawei Watch + Wahoo ELEMNT + Hevy op Android.
De ruggengraat is **intervals.icu** (gratis), want dat is de enige gratis dienst die je
apparaten leest *én* geplande workouts terugschrijft *én* fitness/vermoeidheid/vorm berekent.
De cursus mist één ding: een adaptieve herplanner. Die zit hier in als `adapt-week`.

## Wat het kost

Alles is €0 behalve het Claude-plan (verplicht voor Claude Code) en de AI-tokens voor de
automatische taken. Geen VPS, geen database, geen abonnementen.

## Status

- [x] Lesmateriaal bestudeerd (199 lessen, geverifieerd tegen de bron)
- [x] Architectuur en interface uitgewerkt
- [ ] Jouw twee antwoorden: **doel** en **beschikbare uren/dagen**
- [ ] Fase 0 — aansluiten
- [ ] Fase 1 — het brein
- [ ] Fase 2 — de adaptieve lus
- [ ] Fase 3 — automatisering
- [ ] Fase 4 — het dashboard

## Technisch

Statische HTML + één gedeeld CSS- en JS-bestand. Lettertypes van Google Fonts met een
systeem-fallback, dus de pagina's blijven leesbaar zonder internet. De grafieken zijn
met de hand getekende SVG — geen Chart.js, geen CDN. Dat is een bewuste keuze: het
dashboard dat hieruit volgt moet écht offline werken.
