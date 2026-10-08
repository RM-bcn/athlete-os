# Athlete Intelligence — bouwplan

**Status:** de bouw is begonnen — zie "Stand van zaken" hieronder.
**Voorstel & onderbouwing:** zie `index.html` (en de bijlagen A–E).
**Dit document:** wat er in welke fase gebouwd wordt, met acceptatiecriteria.

---

## Stand van zaken — 8 oktober 2026

De bouw loopt. Wat er nu echt staat:

| Fase | Stand | Wat er is |
|---|---|---|
| **0 · Fundament** | klaar | D1, Worker live, PWA live, en het geheel achter een login (Basic Auth). Cloudflare Access staat nog op **later**. |
| **1 · Data** | loopt | intervals.icu stroomt binnen — 122 wellness-dagen (mét slaap), 119 activiteiten en rusthartslag. Sync loopt **elk uur**, plus verversen zodra je de app opent. Alles via de **Huawei-koppeling**; geen telefoon-brug nodig. Alleen het gewicht (weegschaal) is nog een **toekomstige fase**. |
| **2 · Rekenregels** | klaar | **193 tests groen**. Puur, deterministisch, en de Worker gebruikt ze. |
| **3 · PWA** | klaar | De acht schermen: **Vandaag · Herstel · Week · Trends · Coach · Kracht · Invoer · Feedback**. Installeerbaar, offline met de laatste snapshot. De oude losse log-pagina is uit de nav; **Feedback** vervangt die. |
| **4 · Invoer** | klaar | Beschikbaarheid per dag en per sport, en **Feedback**: kies een afgeronde training en geef **RPE**, een **score 0–100%** (hoe accuraat t.o.v. het plan), **gepland/iets anders/overgeslagen**, een notitie en **plan-vs-gedaan**. |
| **5 · Coach** | klaar | Regels voor de cijfers, een **model** voor het oordeel. Standaard **deepseek-v4-flash** (via OpenCode Go), met een **automatische fallback-keten** (mimo-v2.6-flash › glm-5.3-flash › minimax-m3). De coach zit nu ook **in de app** (`POST /api/coach`) en deelt **één geheugen** met Telegram. Valt het voorkeursmodel weg, dan waarschuwt de coach via Telegram en maakt een workboard-kaart. |
| **6 · Kracht** | deels | oefeningenbibliotheek (30 oefeningen, echte demo-URL's uit free-exercise-db) + de `build-strength-block`-skill. Het **Kracht-scherm** toont het blok van de dag met demo-beeld per oefening (of een eerlijke lege staat). Het echte blok wacht op **doel + materiaal + beschikbaarheid**. |
| **7 · Telegram** | klaar | Webhook live, de coach appt terug, en elke ochtend om 07:00 de herstelbrief — nu met de **herstelkaart als PNG-foto**. De coach **vraagt na een nieuwe training hoe het ging** (inline knoppen: verdict › RPE). |

**Body Battery** is er: een herstelsaldo (0–100) dat 's nachts oplaadt (slaap, rust-HR en HRV
tegen je eigen basislijn) en overdag leegloopt met je training — eerlijk als **schatting**
gelabeld. Je kunt je **doel** tegen de coach zeggen ("mijn doel is de halve marathon op 5:07/km
op …"); hij zet het **vast** in D1 en bouwt de **periodisering** (Base › Build › Peak › Taper),
zichtbaar in Trends. Meerdere doelen kunnen naast elkaar staan. De **feedback-lus**
(`session_feedback` in D1) haalt je valkuilen op in het blok **Patronen** in Trends. Het
**gesprek is gedeeld** tussen Telegram en de app: één geheugen.

De **UI-fases A–F** zijn af: het design-fundament (A), Vandaag + Herstel (B), Trends + de week (C),
de coach in de app (D), Kracht + de ochtendkaart als PNG (E), en de afwerking met de drie
hoofdtabbladen (F). De bouwkaarten lopen tot `aq-039` (doelen en het seizoensplan) en `aq-040`
(een doel uit vrije tekst halen en de periodisering bouwen).

**Live:** `https://athlete-intelligence.aq-bd6.workers.dev` — **privé, achter Basic Auth**.
**Telegram:** [@AthleteIntelligencebot](https://t.me/AthleteIntelligencebot).
**Vault + app:** `github.com/RM-bcn/athlete-intelligence` (private) — de Worker en PWA staan in `app/`.

**Health Connect bereikt AQ niet.** Het is een databank op de telefoon; er is geen
server-API. De weegschaal loopt via **Tuya**, Hevy via de handmatige AQ-log.

---

## De vastgeklikte stack

| Laag | Keuze | Kosten |
|---|---|---|
| PWA | Cloudflare Workers (static assets) | €0 |
| API | Cloudflare Worker | €0 (100k req/dag) |
| Database | Cloudflare D1 (SQLite) | €0 (5 GB, 5M rijen lezen/dag) |
| Privé-toegang | HTTP Basic Auth in de Worker (Cloudflare Access later) | €0 |
| Push + sparren | Telegram Bot | €0 |
| Data-spine | intervals.icu | €0 (5.000 req/dag) |
| Kracht | Hevy (gratis plan) | €0 |
| Weegschaal | toekomstige fase; lichaamscompositie via de Tuya Cloud API | €0 |
| Brein | de coach in de Worker + model-API | **alleen deze post** |
| Vault | GitHub private | €0 |

**Het leidende principe:** rekenen is **code**, oordelen zijn **tokens**. Zie bijlage E §03.

---

## Repo-indeling (het product)

```
athlete-intelligence/
├── app/                    # de Worker + de PWA
│   ├── src/                # rekenregels + routes
│   │   ├── rules/          # ← de rekenmachine, puur en getest
│   │   │   ├── load.ts     # CTL/ATL/TSB, RPE-load
│   │   │   ├── readiness.ts# slaap + RHR + load → oordeel
│   │   │   └── trends.ts   # 7/28-daags, drift
│   │   ├── sources/        # intervals.icu, Hevy, weegschaal
│   │   └── coach.ts        # de dunne brug naar het model
│   ├── public/             # de PWA (static assets)
│   │   ├── index.html      # de acht schermen als tabs (vandaag › herstel › week › trends › coach › kracht › invoer › feedback)
│   │   ├── manifest.webmanifest
│   │   └── sw.js           # offline
│   └── schema.sql          # D1
├── brain/                  # de markdown-vault (gesynct met GitHub)
│   ├── AGENTS.md
│   ├── athlete-profile.md
│   ├── training/ · reviews/ · races/ · health/ · goals/
│   └── .opencode/skills/   # de 8 skills voor de coach
└── docs/
```

---

## Fasen

Elke fase is één workboard-kaart. Niet groter, niet kleiner. Een fase is klaar als de
acceptatiecriteria aantoonbaar gehaald zijn.

### Fase 0 — Fundament
**Levert:** een lege maar werkende keten: Worker live, D1 aangemaakt, PWA live, login ervoor.

- [ ] Cloudflare-account, `wrangler` geïnstalleerd
- [ ] D1-database aangemaakt, `schema.sql` gemigreerd
- [ ] Worker gedeployed met één endpoint: `GET /api/health` → `{ok:true}`
- [ ] Worker met static assets uit `public/`, `index.html` toont "hallo"
- [ ] Toegang: HTTP Basic Auth in de Worker (Cloudflare Access later)
- [ ] GitHub-repo private, eerste commit

**Klaar als:** je op je telefoon `https://<worker>.workers.dev` opent, een login krijgt, inlogt met Basic Auth, en "hallo" ziet.

---

### Fase 1 — De data naar binnen
**Levert:** intervals.icu, Hevy en de weegschaal komen in D1.

- [ ] `sources/intervals.ts` — activiteiten + wellness ophalen
- [ ] `sources/hevy.ts` — workouts + body measurements
- [ ] `sources/scale.ts` — gewicht + vet% (toekomstige fase, via de Tuya Cloud API)
- [ ] Cron-trigger in de Worker: elk uur syncen (`0 * * * *`)
- [ ] verifieer via `GET /api/health` + `GET /api/wellness`

**Klaar als:** je het endpoint opent en echte aantallen ziet die kloppen met wat je in de apps ziet. **Twee weken observe-only** vanaf hier.

**Risico:** de weegschaal-route. **Health Connect bereikt AQ niet** — het is on-device,
zonder server-API. De weegschaal is dus een **toekomstige fase**: lichaamscompositie
(gewicht, vet%, spiermassa) via de **Tuya** Body Fat Scale-service. Niet nodig om te
starten — slaap, rusthartslag en trainingen komen al binnen via intervals.icu.

---

### Fase 2 — De rekenmachine
**Levert:** alle standaardberekeningen als pure functies, met tests. **Geen model, geen tokens.**

- [ ] `rules/load.ts` — CTL (42 d), ATL (7 d), TSB, RPE-load, krachtload uit tonnage + hartslag
- [ ] `rules/readiness.ts` — score uit slaap + RHR + load → groen/amber/rood
- [ ] `rules/trends.ts` — 7- en 28-daags gemiddelden, hartslagdrift
- [ ] `rules/polarisation.ts` — de 80/20-verdeling bewaken
- [ ] `tests/` — vaste invoer, verwachte uitvoer, alles groen

**Klaar als:** `npm test` groen is, en dezelfde invoer altijd hetzelfde antwoord geeft.

> Dit is de belangrijkste fase. Alles daarna leunt erop, en het is het enige stuk dat nooit een token kost.

---

### Fase 3 — De PWA-schil
**Levert:** installeerbaar, offline, en het toont je dag.

- [x] `manifest.webmanifest` + service worker
- [x] `GET /api/today` → readiness + de sessie
- [x] `index.html` — de PWA met acht schermen als tabs (vandaag › herstel › week › trends › coach › kracht › invoer › feedback)
- [x] Offline: laatste snapshot in de cache
- [x] Installeerbaar op je beginscherm

**Klaar als:** je hem installeert, in vliegtuigmodus opent, en je dag nog ziet.

---

### Fase 4 — Invoer
**Levert:** jij kunt iets teruggeven aan het systeem.

- [x] `availability.html` — beschikbaarheid per dag en per sport (minuten + sport)
- [x] `PUT /api/availability`
- [x] `feedback.html` — **ná** de sessie: RPE, score 0–100%, gepland/iets anders/overgeslagen, notitie en plan-vs-gedaan
- [x] `POST /api/feedback` + `session_feedback` in D1
- [x] `POST /api/sick` — ziek melden → dag op pauze

**Klaar als:** je met je duim je week instelt in onder een minuut, en een gemiste/extra sessie kunt loggen.

> Let op: RPE is een **meting na**, geen plan voor. Beschikbaarheid is vooraf, feedback is achteraf.

---

### Fase 5 — De coach
**Levert:** de coach doet het zware denkwerk, en de regels doen de rest.

- [x] `brain/AGENTS.md` + `athlete-profile.md`
- [x] Skills in `.opencode/skills/`: `set-goal`, `build-season-plan`, `plan-my-week`, `adapt-week`, `weekly-review`
- [x] `coach.ts` — de brug: regels waar het kan, model waar het moet
- [x] sparren via Telegram (`status`, `week`, `log …`, `ik ben ziek`) én vrije tekst
- [x] de coach **in de app** (`POST /api/coach`): hetzelfde brein en hetzelfde gesprek als Telegram
- [x] ziek melden → dag op pauze (regel) + advies
- [x] `POST /api/chat` + het model voor de open oordelen (deepseek-v4-flash, met fallback)

**Klaar als:** je "ik ben ziek" stuurt, de dag op pauze gaat (regel), en je een advies
terugkrijgt. **Dat werkt** — de cijfers komen uit de regels, het oordeel uit het model.
Valt een model weg, dan zakt de coach automatisch naar het volgende goedkope model en
waarschuwt hij je.

---

### Fase 6 — Kracht
**Levert:** een krachtblok van maanden, met oefeningen en demo's.

- [x] `exercises.md` — bibliotheek van 30 oefeningen met **echte demo-URL's** uit `free-exercise-db`
- [x] `build-strength-block` skill — 12 weken, accumulatie › intensificatie › deload
- [x] Export naar markdown dat je in Hevy overtypt (geen Pro)
- [x] Krachtload in de week verrekenen (tonnage + hartslag) — `strengthLoad` in de rekenregels
- [x] Kracht-scherm in de PWA: het blok van de dag met demo-beeld per oefening (of een eerlijke lege staat)
- [ ] Het echte blok — **wacht op doel + materiaal + beschikbaarheid** (één vraag tegelijk)

**Klaar als:** je een blok krijgt, het in Hevy staat, en de load in je week meeweegt.
De machinerie staat; het persoonlijke blok volgt zodra de drie invoeren er zijn.

---

### Fase 7 — Telegram
**Levert:** het komt naar jou toe.

- [x] Bot aangemaakt, webhook naar de Worker (buiten de Basic Auth-poort, met eigen geheim)
- [x] Twee-richting: `status`, `week`, `log loop 45 6`, `ik ben ziek`
- [x] Ochtendbrief om 07:00 lokaal (elke dag één bericht)
- [x] `render` — de herstelkaart als **PNG-foto** bij de ochtendbrief (Satori + resvg-wasm in de Worker)
- [x] De coach vraagt na een nieuwe training hoe het ging (inline knoppen: verdict › RPE)
- [ ] Weekreview op maandag

**Klaar als:** je 's ochtends een bericht met de herstelbrief krijgt zonder iets te doen.
**Dat werkt** — de brief komt om 07:00, met de herstelkaart als PNG-foto erbij.

---

## Opencode-tooling

| | |
|---|---|
| `/ai-phase <n>` | voert één fase uit volgens dit plan en stopt bij de acceptatiecriteria |
| `/ai-deploy` | `wrangler deploy` + verificatie van de live URL |
| `/ai-test` | draait de rekenregel-tests (moet altijd groen zijn vóór een deploy) |
| agent `athlete-ai` | de domeinkennis: wetenschap, load-model, Hevy-API, Tuya-routes |

En de skills uit `brain/.opencode/skills/` zijn de coach-skills — instructies die de coach
gebruikt, niet het bouwgereedschap.

---

## De volgorde die ik aanraad

```
0 fundament  →  1 data  →  2 rekenregels  →  3 PWA  →  4 invoer
                                ↑
                    hier zit de waarde
```

Fase 2 vóór 3, altijd. Een mooie PWA op onbetrouwbare berekeningen is erger dan geen PWA.

Fase 5 (de coach) kan later — de eerste vier fasen geven je al een werkend dashboard met
echte cijfers, **zonder één token**. Dat is precies het punt.

---

## Roadmap

**Nu (in gebruik).** Het dashboard (PWA, offline, achter login) met de acht schermen —
**Vandaag, Herstel, Week, Trends, Coach, Kracht, Invoer en Feedback**. De data via
intervals.icu (slaap, rusthartslag, trainingen), de rekenregels (**193 tests**), de invoer
(beschikbaarheid, feedback, ziek melden), de coach met een echt model (+ automatische fallback)
die **ook in de app** zit en **één geheugen deelt** met Telegram, de ochtendbrief om 07:00 met de
**herstelkaart als PNG-foto**, en de workout-invoer: een `.fit` of screenshot › de coach leest en
vertaalt › workout op de kalender › horloge. Plus het `push`-commando. Daar horen de **Body
Battery** bij (een herstelsaldo, eerlijk als schatting gelabeld) en je **doel + seizoensplan**:
je zegt het tegen de coach, hij zet het vast in D1 en periodiseert het — zichtbaar in Trends.

**Volgende.** De coach past je week écht aan (verplaatsen, verzachten) in plaats van alleen
adviseren; een meerdaags plan in één keer; en de weekreview met het model.

**Later.** De weegschaal (Tuya) voor lichaamscompositie; Cloudflare Access als nettere poort;
en het echte krachtblok zodra doel en materiaal bekend zijn.

---

## Wat er nog open is

- **Toekomstige fase — weegschaal (Tuya)** — gewicht en lichaamscompositie (vet%,
  spiermassa, water, visceraal vet). Health Connect is on-device en bereikt AQ niet, dus
  de weegschaal koppelen we later rechtstreeks via de **Tuya** Body Fat Scale-service.
- **Model-keuze** — **klaar**: de coach draait op **deepseek-v4-flash** via OpenCode Go,
  met een automatische fallback-keten en een waarschuwing (Telegram + workboard) als een
  model wordt uitgefaseerd. Kosten: fracties van een cent per antwoord.
- **Workouts naar het horloge** — intervals.icu pusht geplande workouts (Huawei: alleen
  lopen/wandelen/hiken; Wahoo: volledige workouts). Zie de notitie hieronder.

---

## Workouts naar het horloge (kan dit?)

**Ja — via intervals.icu.** De Worker schrijft een workout als **event** op je
intervals.icu-kalender; intervals.icu pusht die naar je toestel zodra daar
"Upload planned workouts" aanstaat (Settings › Connections).

| Toestel | Wat er gepusht wordt |
|---|---|
| **Huawei** (lopen) | alleen **lopen, wandelen en hiken** — de rest wordt overgeslagen |
| **Wahoo ELEMNT** (fietsen) | volledige gestructureerde workouts (via de ELEMNT-app) |
| **Kracht** | niet naar het horloge — dat loopt via Hevy |

Dus de coach kan je **loop-** en **fietsworkouts** naar het horloge sturen. Kracht blijft
in Hevy. De API-kant is `POST /api/v1/athlete/{id}/events` met de workout-stappen in
`description`; intervals.icu parseert die naar een gestructureerde workout.

**Gebouwd (08/10):** stuur een **`.fit`** of een **screenshot** naar de bot. De coach leest
hem (FIT-decoder respectievelijk een vision-model), vertaalt naar doel/effect en een
intervals.icu-workout, en zet hem op je kalender. Staat "Upload planned workouts" aan, dan
gaat hij door naar je horloge. Nog open: de coach past de **rest van de week** echt aan.

---

## Waar de model-API veilig staat

De sleutel hoort **nooit** in de app of in git. De app is statisch en downloadbaar; een
sleutel erin is een sleutel voor iedereen.

| Optie | Waar | Waarom |
|---|---|---|
| **Worker-secret** (aanbevolen) | `wrangler secret put MODEL_API_KEY` | Versleuteld, alleen in de Worker-runtime, nooit in de code |
| **Cloudflare AI Gateway** | vóór de Worker | Houdt de providersleutel zelf, plus rate-limiting, caching, logging en kosten |
| **Opencode (de vault)** | lokaal, buiten de repo | het geheugen: `AGENTS.md` en de skills. De **model-aanroep zelf gebeurt in de Worker**, niet lokaal |

Zet daarnaast een **uitgavenlimiet** bij de provider. De coach gebruikt het model nu al voor
sparren (`POST /api/chat`) en workout-invoer (`POST /api/ingest`) — de zware oordelen.
