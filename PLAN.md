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
| **1 · Data** | loopt | intervals.icu stroomt binnen — 121 wellness-dagen (mét slaap), 119 activiteiten. Sync loopt **elk uur**, plus verversen zodra je de app opent. Hevy en de weegschaal nog niet. |
| **2 · Rekenregels** | klaar | 71 tests groen. Puur, deterministisch, en de Worker gebruikt ze. |
| **3 · PWA** | klaar | Vandaag + week, installeerbaar, offline met de laatste snapshot. |
| **4 · Invoer** | klaar | Beschikbaarheid (7×3 schuifjes), loggen ná de sessie (duur + RPE), ziek melden. |
| **5 · Coach** | werkt | De coach antwoordt **nu al**, volledig op regels: status, week, loggen, ziek melden. De model-API is optioneel en komt later. |
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
| Weegschaal | Smart Life → Health Connect | €0 |
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

**Risico:** de weegschaal-route. Probeer eerst Smart Life → Health Connect (nul code). Werkt dat niet, dan Tuya Cloud API met de Body Fat Scale-service.

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
- [x] sparren via Telegram (`status`, `week`, `log …`, `ik ben ziek`)
- [x] ziek melden → dag op pauze (regel) + advies
- [ ] `POST /api/chat` + het model voor plannen/reviews — **wacht op de model-API**

**Klaar als:** je "ik ben ziek" stuurt, de dag op pauze gaat (regel), en je een advies
terugkrijgt. **Dat werkt nu** — het advies komt uit de regels; het model vervangt dat later
voor de open oordelen.

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

- **Weegschaal-route** — eerst Smart Life → Health Connect proberen; de Tuya Cloud API is de terugval.
- **Model-keuze** — welk model achter Opencode. Bepaalt de kosten per oordeel.
- **Cloudflare-account** — bestaat die al, of moet die nog?
