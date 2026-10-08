# Athlete Intelligence — bouwplan

**Status:** de bouw is begonnen — zie "Stand van zaken" hieronder.
**Voorstel & onderbouwing:** zie `index.html` (en de bijlagen A–E).
**Dit document:** wat er in welke fase gebouwd wordt, met acceptatiecriteria.

---

## Stand van zaken — 8 oktober 2026

De bouw loopt. Wat er nu echt staat:

| Fase | Stand | Wat er is |
|---|---|---|
| **0 · Fundament** | klaar | D1, Worker live, PWA live, en het geheel achter een login (Basic Auth). |
| **1 · Data** | loopt | intervals.icu stroomt binnen — 121 wellness-dagen (mét slaap), 119 activiteiten en rusthartslag. Sync loopt **elk uur**, plus verversen zodra je de app opent. Alles via de **Huawei-koppeling**; geen telefoon-brug nodig. Alleen het gewicht (weegschaal) is nog een **toekomstige fase**. |
| **2 · Rekenregels** | klaar | 71 tests groen. Puur, deterministisch, en de Worker gebruikt ze. |
| **3 · PWA** | klaar | Vandaag + week, installeerbaar, offline met de laatste snapshot. |
| **4 · Invoer** | klaar | Beschikbaarheid (7×3 schuifjes), loggen ná de sessie (duur + RPE), ziek melden. |
| **5 · Coach** | klaar | Regels voor de cijfers, een **model** voor het oordeel. Standaard **deepseek-v4-flash** (via OpenCode Go), met een **automatische fallback-keten** (mimo-v2.6-flash › glm-5.3-flash › minimax-m3). Valt het voorkeursmodel weg, dan waarschuwt de coach via Telegram en maakt een workboard-kaart. |
| **6 · Kracht** | deels | oefeningenbibliotheek (30 oefeningen, echte demo-URL's uit free-exercise-db) + de `build-strength-block`-skill. Het echte blok wacht op **doel + materiaal + beschikbaarheid**. |
| **7 · Telegram** | klaar | Webhook live, de coach appt terug, en elke ochtend om 07:00 de herstelbrief. |

**Live:** `https://athlete-intelligence.aq-bd6.workers.dev` — **privé, achter Basic Auth**.
**Telegram:** [@AthleteIntelligencebot](https://t.me/AthleteIntelligencebot).
**Vault + app:** `github.com/RM-bcn/athlete-intelligence` (private) — de Worker en PWA staan in `app/`.

**Health Connect bereikt AQ niet.** Het is een databank op de telefoon; er is geen
server-API. De weegschaal loopt via **Tuya**, Hevy via de handmatige AQ-log.

---

## De vastgeklikte stack

| Laag | Keuze | Kosten |
|---|---|---|
| PWA | Cloudflare Pages | €0 |
| API | Cloudflare Worker | €0 (100k req/dag) |
| Database | Cloudflare D1 (SQLite) | €0 (5 GB, 5M rijen lezen/dag) |
| Privé-toegang | Cloudflare Access (e-mailcode) | €0 (tot 50 gebruikers) |
| Push + sparren | Telegram Bot | €0 |
| Data-spine | intervals.icu | €0 (5.000 req/dag) |
| Kracht | Hevy (gratis plan) | €0 |
| Weegschaal | lokaal via Health Connect; lichaamscompositie later via Tuya | €0 |
| Brein | Opencode + model-API | **alleen deze post** |
| Vault | GitHub private | €0 |

**Het leidende principe:** rekenen is **code**, oordelen zijn **tokens**. Zie bijlage E §03.

---

## Repo-indeling (het product)

```
athlete-intelligence/
├── worker/                 # Cloudflare Worker — API + rekenregels
│   ├── src/index.ts        # routes
│   ├── src/rules/          # ← de rekenmachine, puur en getest
│   │   ├── load.ts         # CTL/ATL/TSB, RPE-load
│   │   ├── readiness.ts    # slaap + RHR + load → oordeel
│   │   └── trends.ts       # 7/28-daags, drift
│   ├── src/sources/        # intervals.icu, Hevy, weegschaal
│   ├── src/coach.ts        # de dunne brug naar het model
│   └── schema.sql          # D1
├── pwa/                    # de PWA (Pages)
│   ├── index.html          # vandaag
│   ├── week.html
│   ├── availability.html   # ← de schuifjes
│   ├── log.html            # ← ná de sessie
│   ├── manifest.webmanifest
│   └── sw.js               # offline
├── brain/                  # de markdown-vault (gesynct met GitHub)
│   ├── AGENTS.md
│   ├── athlete-profile.md
│   ├── training/ · reviews/ · races/ · health/ · goals/
│   └── .opencode/skills/   # de skills voor Opencode
├── tests/                  # de rekenregels, met vaste invoer
└── docs/
```

---

## Fasen

Elke fase is één workboard-kaart. Niet groter, niet kleiner. Een fase is klaar als de
acceptatiecriteria aantoonbaar gehaald zijn.

### Fase 0 — Fundament
**Levert:** een lege maar werkende keten: Worker live, D1 aangemaakt, PWA live, Access ervoor.

- [ ] Cloudflare-account, `wrangler` geïnstalleerd
- [ ] D1-database aangemaakt, `schema.sql` gemigreerd
- [ ] Worker gedeployed met één endpoint: `GET /api/health` → `{ok:true}`
- [ ] Pages-project gekoppeld aan `pwa/`, `index.html` toont "hallo"
- [ ] Access-policy: alleen jouw e-mailadres
- [ ] GitHub-repo private, eerste commit

**Klaar als:** je op je telefoon `https://<project>.pages.dev` opent, een inlogscherm krijgt, inlogt met een e-mailcode, en "hallo" ziet.

---

### Fase 1 — De data naar binnen
**Levert:** intervals.icu, Hevy en de weegschaal komen in D1.

- [ ] `sources/intervals.ts` — activiteiten + wellness ophalen
- [ ] `sources/hevy.ts` — workouts + body measurements
- [ ] `sources/scale.ts` — gewicht + vet% (Smart Life → Health Connect, of Tuya API)
- [ ] Cron-trigger in de Worker: dagelijks syncen
- [ ] `GET /api/debug/sources` → toon wat er per bron binnenkwam

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

- [ ] `manifest.webmanifest` + service worker
- [ ] `GET /api/today` → readiness + de sessie
- [ ] `index.html` — de vandaag-weergave (ring, sessie, drie bijdragers)
- [ ] `week.html` — de week met de geplaatste sessies
- [ ] Offline: laatste snapshot in de cache
- [ ] Installeerbaar op je beginscherm

**Klaar als:** je hem installeert, in vliegtuigmodus opent, en je dag nog ziet.

---

### Fase 4 — Invoer
**Levert:** jij kunt iets teruggeven aan het systeem.

- [ ] `availability.html` — weeksgrid met schuifjes (7 dagen × 3 dagdelen, minuten + sport)
- [ ] `PUT /api/availability`
- [ ] `log.html` — **ná** de sessie: duur + RPE
- [ ] `POST /api/log`
- [ ] `POST /api/sick` — ziek melden → dag op pauze

**Klaar als:** je met je duim je week instelt in onder een minuut, en een gemiste/extra sessie kunt loggen.

> Let op: RPE is een **meting na**, geen plan voor. Beschikbaarheid is vooraf, loggen is achteraf.

---

### Fase 5 — De coach
**Levert:** Opencode doet het zware denkwerk, en de regels doen de rest.

- [x] `brain/AGENTS.md` + `athlete-profile.md`
- [x] Skills in `.opencode/skills/`: `set-goal`, `build-season-plan`, `plan-my-week`, `adapt-week`, `weekly-review`
- [x] `coach.ts` — de brug: regels waar het kan, model waar het moet
- [x] sparren via Telegram (`status`, `week`, `log …`, `ik ben ziek`) én vrije tekst
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
- [ ] Het echte blok — **wacht op doel + materiaal + beschikbaarheid** (één vraag tegelijk)

**Klaar als:** je een blok krijgt, het in Hevy staat, en de load in je week meeweegt.
De machinerie staat; het persoonlijke blok volgt zodra de drie invoeren er zijn.

---

### Fase 7 — Telegram
**Levert:** het komt naar jou toe.

- [x] Bot aangemaakt, webhook naar de Worker (buiten de Basic Auth-poort, met eigen geheim)
- [x] Twee-richting: `status`, `week`, `log loop 45 6`, `ik ben ziek`
- [x] Ochtendbrief om 07:00 lokaal (elke dag één bericht)
- [ ] `render` — kaart als PNG (Playwright) in plaats van tekst
- [ ] Weekreview op maandag

**Klaar als:** je 's ochtends een bericht met de herstelbrief krijgt zonder iets te doen.
**Dat werkt nu** — als tekst; de PNG-kaart volgt.

---

## Opencode-tooling

| | |
|---|---|
| `/ai-phase <n>` | voert één fase uit volgens dit plan en stopt bij de acceptatiecriteria |
| `/ai-deploy` | `wrangler deploy` + Pages deploy + verificatie van de live URL |
| `/ai-test` | draait de rekenregel-tests (moet altijd groen zijn vóór een deploy) |
| agent `athlete-ai` | de domeinkennis: wetenschap, load-model, Hevy-API, Tuula-routes |

En de skills uit `brain/.opencode/skills/` zijn de coach-skills — die gebruiken Opencode
tijdens het draaien, niet tijdens het bouwen.

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

---

## Waar de model-API veilig staat

De sleutel hoort **nooit** in de app of in git. De app is statisch en downloadbaar; een
sleutel erin is een sleutel voor iedereen.

| Optie | Waar | Waarom |
|---|---|---|
| **Worker-secret** (aanbevolen) | `wrangler secret put MODEL_API_KEY` | Versleuteld, alleen in de Worker-runtime, nooit in de code |
| **Cloudflare AI Gateway** | vóór de Worker | Houdt de providersleutel zelf, plus rate-limiting, caching, logging en kosten |
| **OpenCode (het brein)** | op je eigen machine, buiten de repo | `opencode auth login`; de sleutel verlaat je machine niet |

Zet daarnaast een **uitgavenlimiet** bij de provider. De coach werkt nu al zonder model;
de sleutel is alleen voor de zware oordelen (plannen, reviews, sparren).
