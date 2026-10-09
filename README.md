# Athlete Intelligence — voorstel

**Live: <https://rm-bcn.github.io/athlete-os/>**

Vijf pagina's om een zelfgebouwd, adaptief trainingssysteem te bespreken — met een flink
deel dat inmiddels **gebouwd** is (zie [`PLAN.md`](PLAN.md)). Deze repo is het voorstel:
wetenschap, architectuur en interface-schets. De productcode (Worker + PWA) staat in de
app-repo.

Open `index.html` in je browser, of gebruik de live-link hierboven. Geen server nodig, geen build stap.

| Bestand | Wat het is |
|---|---|
| `index.html` | **Het voorstel.** Scroll-door pitch: probleem, kernvondst, de adaptieve lus, doelen en domeinen, de acht fasen (0–7), de keuzes, wat het oplevert, de grenzen, de kosten. |
| `science.html` | **De wetenschap.** Gepolariseerde intensiteitsverdeling (80/20), periodisering, het CTL/ATL/TSB-loadmodel, wat we verwerpen (ACWR), en de stabiliteitsregels tegen plan-gerammel. |
| `strength.html` | **Kracht &amp; doel.** Twee soorten doelen (event én lichaamscompositie), de interferentie tussen duur en kracht, de hypertrofie-wetenschap, de oefeningenbibliotheek, de lus naar Hevy en de weegschaal-integratie. |
| `pwa.html` | **PWA &amp; architectuur.** De vijf vastgeklikte besluiten, de cloud-architectuur, en het principe dat rekenen regels zijn en alleen oordelen tokens kosten. |
| `backend.html` | **De architectuur.** Datastroom-diagram, de opslaglaag (markdown vs SQLite/D1), schrijfwegen (intervals.icu, Hevy), lagen, datamodel, skills, adaptatieregels, schema. |
| `PLAN.md` | **Het bouwplan.** Acht fasen (0–7) met acceptatiecriteria, de repo-indeling en de Opencode-tooling. |
| `frontend.html` | **De interface.** Tien telefoonschermen (vandaag, herstel, week, voortgang, coach, ochtendbrief, kracht, beschikbaarheid, profiel, weegschaal) en het desktop-dashboard. |
| `screenshots/` | 114 renders — desktop (1440) en mobiel (390 @2x), volledige pagina's plus per sectie. |
| `tools/screenshots.mjs` | Waarmee die renders gemaakt worden. |

## Screenshots

Alles in `screenshots/` is te bekijken op GitHub, ook op mobiel:

- `screenshots/desktop/` — één `*-full.png` per pagina (index, science, strength, pwa, backend, frontend)
- `screenshots/desktop/sections/` — per sectie
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

## Drie oppervlakken, niet één

"Telegram, geen eigen app" en "je ziet een herstelring" zijn geen tegenstelling:

| | |
|---|---|
| **Telegram** | de push en het gesprek — de ochtendbrief komt binnen als tekst én met de **herstelkaart als PNG-foto** |
| **Het dashboard** | de visuals — de PWA op een privé-URL (nu login met Basic Auth; Cloudflare Access later) of lokaal |
| **De bestanden** | de bron — markdown op je schijf, alles leesbaar en aanvechtbaar |

De herstelkaart wordt zodra de slaap van vannacht binnen is uit dezelfde HTML gerenderd tot een
PNG (Satori + resvg-wasm in de Worker) en meegestuurd met het Telegram-bericht — dat is
**gebouwd**. Zie [`frontend.html#oppervlakken`](frontend.html) en [`frontend.html#kaart`](frontend.html).

Twee dingen die de broncursus mist en hier wél in zitten:

1. **Een adaptieve herplanner** (`adapt-week`) — de cursus bouwt een plan en reviewt het,
   maar herplant nooit.
2. **Stabiliteit als ontwerpregel** — het seizoensplan is een contract dat alleen bij een
   echte trigger verandert. De dagelijkse laag mag uitsluitend de uitvoering bijstellen.
   Anders krijg je een model dat elke dag "optimaliseert" en een plan dat niemand volgt.

## De wetenschap in het kort

| | |
|---|---|
| **Duurverdeling** | gepolariseerd, ~80% makkelijk / ~20% hard, bijna niets in de grijze zone (Seiler) |
| **Vorm** | periodisering: Base › Build › Peak › Taper, terug vanaf racedag |
| **Instrument** | CTL/ATL/TSB (Banister; Coggan) — gelezen uit intervals.icu, niet zelf gebouwd |
| **Kracht** | 10–20 sets per spiergroep per week, 2× frequentie, 0–3 reps in reserve (Schoenfeld e.a.) |
| **Interferentie** | duur + kracht botsen om hetzelfde signaal; ≥6 uur scheiding en fase-denken (Wilson 2012, Hickson 1980) |
| **Verworpen** | ACWR als blessurevoorspeller — AUC 0,55–0,65, wiskundig ondeugdelijk (Impellizzeri e.a.) |
| **Grens** | geen arts, geen fysiotherapeut. Het signaleert, het diagnosticeert niet. |

Volledig met bronnen en bewijskracht per onderdeel: [`science.html`](science.html) en
[`strength.html`](strength.html).

## Wat het kost

Alles is €0 behalve de **model-API** voor Opencode — geen abonnement, Opencode zelf is gratis.
Geen VPS, geen vaste lasten. De opslag is markdown (beslissingen) plus **Cloudflare D1**
(metingen; SQLite lokaal als alternatief) — beide gratis.

## Status

- [x] Lesmateriaal bestudeerd (199 lessen, geverifieerd tegen de bron)
- [x] Wetenschappelijke basis uitgewerkt en geciteerd
- [x] Architectuur en interface uitgewerkt
- [x] Fase 0 — fundament (Worker + D1, live achter Basic Auth)
- [x] Fase 1 — data naar binnen (intervals.icu)
- [x] Fase 2 — rekenregels (**494 tests**)
- [x] Fase 3 — PWA (tien schermen)
- [x] Fase 4 — invoer
- [x] Fase 5 — coach (plant de week, beoordeelt, herplant met bevestiging)
- [ ] Fase 6 — kracht (deels; wacht op doel + materiaal)
- [x] Fase 7 — Telegram (brief wacht op de slaap; herstelkaart als PNG)
- [ ] Jouw twee antwoorden: **doel** en **beschikbare uren/dagen**

## Technisch

Statische HTML + één gedeeld CSS- en JS-bestand. Lettertypes van Google Fonts met een
systeem-fallback, dus de pagina's blijven leesbaar zonder internet. Alle grafieken zijn
met de hand getekende SVG — geen Chart.js, geen CDN. Dat is een bewuste keuze: het
dashboard dat hieruit volgt moet écht offline werken.
