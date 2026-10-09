# Athlete Intelligence — bouwplan

**Status:** de bouw is begonnen — zie "Stand van zaken" hieronder.
**Voorstel & onderbouwing:** zie `index.html` (en de bijlagen A–E).
**Dit document:** wat er in welke fase gebouwd wordt, met acceptatiecriteria.

---

## Stand van zaken — 9 oktober 2026

De bouw loopt. Wat er nu echt staat:

| Fase | Stand | Wat er is |
|---|---|---|
| **0 · Fundament** | klaar | D1, Worker live, PWA live, en het geheel achter een login (Basic Auth). Cloudflare Access staat nog op **later**. |
| **1 · Data** | loopt | intervals.icu stroomt binnen — 122 wellness-dagen (mét slaap), 119 activiteiten en rusthartslag. Sync loopt **elk uur**, plus verversen zodra je de app opent. Alles via de **Huawei-koppeling**; geen telefoon-brug nodig. Het gewicht komt nu via de **weegschaal in de PWA** (Web Bluetooth). |
| **2 · Rekenregels** | klaar | **494 tests groen**. Puur, deterministisch, en de Worker gebruikt ze. De weekplanner (`validateWeekPlan`), de autoplanner, de test-bibliotheek, het seizoensoverzicht, de herstel-curves, de plan-diff en de voortgang zitten er allemaal als regel in. |
| **3 · PWA** | klaar | De **tien schermen**: **Vandaag · Herstel · Week · Trends · Coach · Kracht · Invoer · Feedback · Profiel · Weegschaal**. Installeerbaar, offline met de laatste snapshot. De service worker is **netwerk-eerst voor de schil**, zodat een nieuwe versie meteen doorkomt. De oude losse log-pagina is uit de nav; **Feedback** vervangt die. |
| **4 · Invoer** | klaar | Beschikbaarheid als **week-overzicht**: 7 dagkaarten met een samenvatting en het week-totaal; tik een dag open om de drie dagdelen te bewerken (minuten + sport, incl. "anders" zoals volleybal), met **"kopieer vorige week"** en **"week leegmaken"**. En **Feedback** als **detailweergave**: je klikt op een afgeronde training en **landt op die training** (`/feedback?id=<activity_id>`) — bovenaan de cijfers van wat je deed (duur, afstand, gem./max HR, load, tempo), daaronder **plan vs. gedaan**, en dan jouw oordeel: **RPE 1–10**, **score 0–100%** (hoe accuraat t.o.v. het plan), **gepland/iets anders/overgeslagen**, een notitie en opslaan met bevestiging + "laatst vastgelegd". De **coach vult die accuratie nu ook zelf** (0–100% t.o.v. het plan, `aq-041`), zodat je hem niet meer zelf hoeft te beoordelen als je dat niet wilt. De lijst blijft de index. |
| **5 · Coach** | klaar | Regels voor de cijfers, een **model** voor het oordeel. Standaard **deepseek-v4-flash** (via OpenCode Go), met een **automatische fallback-keten** (mimo-v2.6-flash › glm-5.3-flash › minimax-m3). De coach zit nu ook **in de app** (`POST /api/coach`) en deelt **één geheugen** met Telegram. Hij **plant de week zelf** (ma–wo, `aq-060`) op basis van je beschikbaarheid, toetst dat met **pure regels** (`validateWeekPlan`) en pusht naar intervals.icu; in een gesprek stelt hij een **herziene week** voor met een **diff** en Telegram-knoppen [Opslaan][Aanpassen] — niets verandert zonder bevestiging (`aq-061`). Hij **leest én schrijft je trainingsvoorkeuren** (`aq-050`). Valt het voorkeursmodel weg, dan waarschuwt de coach via Telegram en maakt een workboard-kaart. |
| **6 · Kracht** | deels | oefeningenbibliotheek (30 oefeningen, echte demo-URL's uit free-exercise-db) + de `build-strength-block`-skill. **Kracht log je nu in de app**: kies oefeningen uit de bibliotheek en voeg sets toe (reps + kg); **tonnage = som reps × gewicht**, de **load** rekent de server (`strengthLoad`), en de sessie telt mee in je week/load/coach. Plus een **"recent gelogd"**-lijst en het **importeren van een Hevy data-dump** (CSV/JSON, `aq-046`), zodat je historie in één keer binnenkomt. Het **Kracht-scherm** toont het blok van de dag met demo-beeld per oefening (of een eerlijke lege staat). Het echte blok wacht op **doel + materiaal + beschikbaarheid**. |
| **7 · Telegram** | klaar | Webhook live, de coach appt terug, en elke ochtend de herstelbrief — nu met de **herstelkaart als PNG-foto**. De brief **wacht tot de slaap van vannacht binnen is** (`aq-053`): geen "SLAAP —"-kaart meer om 07:00. De coach **vraagt na een nieuwe training hoe het ging** (inline knoppen: verdict › RPE) en zet een **weekvoorstel** klaar met [Opslaan][Aanpassen] (`aq-061`). |

**Body Battery** is herbouwd: een **continu, waak-verankerd** herstelsaldo (0–100). Het laadt
's nachts op (slaap, rust-HR en HRV tegen je eigen basislijn) en loopt overdag leeg met je
training — **geen reset om middernacht**, Garmin-achtig: de nacht is het oplaadmoment, niet
het begin van een nieuw saldo. Naast de dagwaarde is er **"nog X% nu"**. Op **Herstel** staan
de **herstel-curves** — battery over de laatste 24 u, slaap, herstel% en rust-HR — allemaal
**hoverbaar**, met de hand getekende SVG zonder dependencies (`aq-052`). Whoop spiegelt onze
**ochtend-readiness**; dit saldo is het continue getal daarnaast. Eerlijk als **schatting**
gelabeld — Huawei levert geen continue hartcurve, dus het is benaderd met de **starttijden**
van je activiteiten. Je kunt je **doel** tegen de coach zeggen ("mijn doel is de halve
marathon op 5:07/km op …"); hij zet het **vast** in D1 en bouwt de **periodisering**
(Base › Build › Peak › Taper), zichtbaar in Trends. Meerdere doelen kunnen naast elkaar
staan. De **feedback-lus** (`session_feedback` in D1) haalt je valkuilen op in het blok
**Patronen** in Trends. Het **gesprek is gedeeld** tussen Telegram en de app: één geheugen.

Daarna volgde een **grote feature-ronde** (`aq-041`–`aq-061`). De coach **plant de week zelf**
op basis van je beschikbaarheid en toetst dat met **pure regels** (`validateWeekPlan`:
beschikbaarheid, minutenbudget, hard-easy, kracht niet op een kwaliteitsdag, split-voorkeur)
en pusht naar intervals.icu (`aq-042/047`). Hij **beoordeelt de accuratie** van een training
t.o.v. het plan (0–100%, `aq-041`) en **leest én schrijft je trainingsvoorkeuren** (`aq-050`).
In een gesprek stelt hij een **herziene week** voor — de app toont een **diff**, Telegram
toont de knoppen [Opslaan][Aanpassen] — en niets verandert zonder bevestiging (`aq-061`). In
**Trends** staat **"Voortgang t.o.v. je doel"** (op koers?) en een **seizoensoverzicht** per
fase met de datums, weken, de examens en een streefvolume (u/week = beschikbaarheid ×
fasefactor) (`aq-045/055`). De **test-bibliotheek** (FTP 20/12, ramp, drempel 30/20, 5 km
tijdrit, Cooper) met warming-up en opbouw; de examendatums krijgen automatisch zo'n sessie,
gepland en gepusht (`aq-057/058`), met een **test-taper** (`aq-056`). Daar hoort het
**vermogensprofiel (Coggan) + fenotype** bij: "waar ligt je kracht" (`aq-059`). De **Week**
voegt een bevestigd gematchte gepland-plus-uitgevoerd samen en sessies zijn **aanklikbaar**
(`aq-044/048`): je ziet de opbouw en pusht naar je horloge. **Hevy data-dumps** kun je
importeren (`aq-046`), en je **weegschaal** koppel je via **Web Bluetooth** in de PWA — het
gewicht gaat naar wellness (`aq-015`).

De **UI-fases A–F** zijn af: het design-fundament (A), Vandaag + Herstel (B), Trends + de week (C),
de coach in de app (D), Kracht + de ochtendkaart als PNG (E), en de afwerking met de drie
hoofdtabbladen (F). Daarna volgde een **latere UX-/feature-ronde**: **Feedback** als
detailweergave per training, **beschikbaarheid** als week-overzicht, **kracht-logg in de app**
en de **grote feature-ronde hierboven**. De bouwkaarten lopen nu tot `aq-061` (herplannen in
gesprek met een diff en bevestiging).

**Live:** `https://athlete-intelligence.aq-bd6.workers.dev` — **privé, achter Basic Auth**.
**Telegram:** [@AthleteIntelligencebot](https://t.me/AthleteIntelligencebot).
**Vault + app:** `github.com/RM-bcn/athlete-intelligence` (private) — de Worker en PWA staan in `app/`.

**Health Connect bereikt AQ niet.** Het is een databank op de telefoon; er is geen
server-API. De weegschaal koppel je daarom rechtstreeks via **Web Bluetooth** in de PWA; kracht
log je in de **app** (of je importeert een Hevy-dump).

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
| Kracht | in de app loggen (Hevy-dump importeren kan) | €0 |
| Weegschaal | Web Bluetooth (BLE) in de PWA › wellness | €0 |
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
│   │   │   ├── readiness.ts# slaap + RHR + load › oordeel
│   │   │   ├── battery.ts  # continu, waak-verankerd herstelsaldo
│   │   │   ├── planweek.ts # validateWeekPlan — de planner als regel
│   │   │   ├── autoplan.ts # plant de coach de week zelf?
│   │   │   ├── testlibrary.ts # FTP/ramp/drempel/Cooper + afleiding
│   │   │   ├── season.ts   # per fase: datums, weken, examens, streefvolume
│   │   │   ├── progress.ts # voortgang t.o.v. het doel (op koers?)
│   │   │   ├── plandiff.ts # de diff van een herziene week
│   │   │   └── trends.ts   # 7/28-daags, drift
│   │   ├── hevy.ts         # Hevy data-dump (CSV/JSON) importeren
│   │   ├── accuracy.ts     # accuratie van een training t.o.v. het plan
│   │   └── coach.ts        # de dunne brug naar het model
│   ├── public/             # de PWA (static assets)
│   │   ├── index.html      # de tien schermen als tabs (vandaag › herstel › week › trends › coach › kracht › invoer › feedback › profiel › weegschaal)
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
- [ ] Worker gedeployed met één endpoint: `GET /api/health` › `{ok:true}`
- [ ] Worker met static assets uit `public/`, `index.html` toont "hallo"
- [ ] Toegang: HTTP Basic Auth in de Worker (Cloudflare Access later)
- [ ] GitHub-repo private, eerste commit

**Klaar als:** je op je telefoon `https://<worker>.workers.dev` opent, een login krijgt, inlogt met Basic Auth, en "hallo" ziet.

---

### Fase 1 — De data naar binnen
**Levert:** intervals.icu, de kracht-logg en de weegschaal komen in D1.

- [ ] `sources/intervals.ts` — activiteiten + wellness ophalen
- [ ] kracht-logg in de app — sets (reps + kg) › tonnage › `strengthLoad`
- [ ] weegschaal via **Web Bluetooth** (BLE) in de PWA › `POST /api/weight` › wellness
- [ ] Cron-trigger in de Worker: elk uur syncen (`0 * * * *`)
- [ ] verifieer via `GET /api/health` + `GET /api/wellness`

**Klaar als:** je het endpoint opent en echte aantallen ziet die kloppen met wat je in de apps ziet. **Twee weken observe-only** vanaf hier.

**Risico:** de weegschaal-route. **Health Connect bereikt AQ niet** — het is on-device,
zonder server-API. De weegschaal lezen we daarom rechtstreeks uit via **Web Bluetooth** in de
PWA (Chrome op Android): de standaard Bluetooth-weegservice, en het gewicht gaat naar
`wellness`. Gebruikt de weegschaal een eigen protocol, dan lukt dat niet en vul je het gewicht
handmatig in intervals.icu in. Slaap, rusthartslag en trainingen komen al binnen via
intervals.icu.

---

### Fase 2 — De rekenmachine
**Levert:** alle standaardberekeningen als pure functies, met tests. **Geen model, geen tokens.**

- [ ] `rules/load.ts` — CTL (42 d), ATL (7 d), TSB, RPE-load, krachtload uit tonnage + hartslag
- [ ] `rules/readiness.ts` — score uit slaap + RHR + load › groen/amber/rood
- [ ] `rules/battery.ts` — het continue, waak-verankerde herstelsaldo
- [ ] `rules/planweek.ts` — `validateWeekPlan`: de planner als pure regel
- [ ] `rules/autoplan.ts` — mag de coach de week zelf plannen?
- [ ] `rules/testlibrary.ts` + `rules/tests.ts` — de testen en hun afleiding (eFTP/ePace/VO₂max/fenotype)
- [ ] `rules/season.ts` + `rules/progress.ts` — seizoensoverzicht en voortgang t.o.v. het doel
- [ ] `rules/plandiff.ts` — de diff van een herziene week
- [ ] `rules/trends.ts` — 7- en 28-daags gemiddelden, hartslagdrift
- [ ] `rules/polarisation.ts` — de 80/20-verdeling bewaken
- [ ] `tests/` — vaste invoer, verwachte uitvoer, alles groen (**494 tests**)

**Klaar als:** `npm test` groen is, en dezelfde invoer altijd hetzelfde antwoord geeft.

> Dit is de belangrijkste fase. Alles daarna leunt erop, en het is het enige stuk dat nooit een token kost.

---

### Fase 3 — De PWA-schil
**Levert:** installeerbaar, offline, en het toont je dag.

- [x] `manifest.webmanifest` + service worker
- [x] `GET /api/today` › readiness + de sessie
- [x] `index.html` — de PWA met tien schermen als tabs (vandaag › herstel › week › trends › coach › kracht › invoer › feedback › profiel › weegschaal)
- [x] Offline: laatste snapshot in de cache
- [x] Installeerbaar op je beginscherm
- [x] Service worker netwerk-eerst voor de schil — een nieuwe versie komt meteen door

**Klaar als:** je hem installeert, in vliegtuigmodus opent, en je dag nog ziet.

---

### Fase 4 — Invoer
**Levert:** jij kunt iets teruggeven aan het systeem.

- [x] beschikbaarheid als **week-overzicht** — 7 dagkaarten met week-totaal; tik een dag open voor de drie dagdelen (minuten + sport), plus "kopieer vorige week" en "week leegmaken"
- [x] `PUT /api/availability`
- [x] `feedback.html` — **detailweergave**: klik een afgeronde training aan en land erop (`/feedback?id=<activity_id>`), met de cijfers, **plan vs. gedaan**, RPE 1–10, score 0–100%, gepland/iets anders/overgeslagen en een notitie
- [x] `POST /api/feedback` + `session_feedback` in D1
- [x] `aq-041` — de coach vult de **accuratie** (0–100% t.o.v. het plan); de duur-ratio en de sport-match zijn regels, de nuance is een oordeel
- [x] `POST /api/sick` — ziek melden › dag op pauze

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
- [x] ziek melden › dag op pauze (regel) + advies
- [x] `POST /api/chat` + het model voor de open oordelen (deepseek-v4-flash, met fallback)
- [x] `aq-042/047/060` — de coach **plant de week zelf** (ma–wo) binnen je beschikbaarheid, toetst met `validateWeekPlan` en pusht naar intervals.icu
- [x] `aq-050` — de coach **leest én schrijft je trainingsvoorkeuren** (Profiel-scherm, gedeelde D1)
- [x] `aq-061` — herplannen in gesprek: een **PLAN-blok**, een **diff** in de app en Telegram-knoppen [Opslaan][Aanpassen]; niets verandert zonder bevestiging

**Klaar als:** je "ik ben ziek" stuurt, de dag op pauze gaat (regel), en je een advies
terugkrijgt. **Dat werkt** — de cijfers komen uit de regels, het oordeel uit het model.
Valt een model weg, dan zakt de coach automatisch naar het volgende goedkope model en
waarschuwt hij je.

---

### Fase 6 — Kracht
**Levert:** een krachtblok van maanden, met oefeningen en demo's.

- [x] `exercises.md` — bibliotheek van 30 oefeningen met **echte demo-URL's** uit `free-exercise-db`
- [x] `build-strength-block` skill — 12 weken, accumulatie › intensificatie › deload
- [x] Export naar markdown (voor wie wil) — loggen kan nu ook direct in de app, dus Hevy overtypen is niet meer nodig
- [x] Krachtload in de week verrekenen (tonnage + hartslag) — `strengthLoad` in de rekenregels
- [x] Kracht-scherm in de PWA: het blok van de dag met demo-beeld per oefening (of een eerlijke lege staat)
- [x] **Kracht loggen in de app**: oefeningen kiezen uit de bibliotheek, sets toevoegen (reps + kg), tonnage + load, en een "recent gelogd"-lijst
- [x] `aq-046` — een **Hevy data-dump importeren** (CSV/JSON) zodat je historie in één keer binnenkomt
- [x] `aq-015` — de **weegschaal via Web Bluetooth** in de PWA; het gewicht gaat naar wellness
- [ ] Het echte blok — **wacht op doel + materiaal + beschikbaarheid** (één vraag tegelijk)

**Klaar als:** je een blok krijgt, je het logt (in de app, of in Hevy als logboek), en de load in je week meeweegt.
De machinerie staat; het persoonlijke blok volgt zodra de drie invoeren er zijn.

---

### Fase 7 — Telegram
**Levert:** het komt naar jou toe.

- [x] Bot aangemaakt, webhook naar de Worker (buiten de Basic Auth-poort, met eigen geheim)
- [x] Twee-richting: `status`, `week`, `log loop 45 6`, `ik ben ziek`
- [x] Ochtendbrief (elke dag één bericht) — **wacht tot de slaap van vannacht binnen is** (`aq-053`), niet meer op een vast tijdstip
- [x] `render` — de herstelkaart als **PNG-foto** bij de ochtendbrief (Satori + resvg-wasm in de Worker)
- [x] De coach vraagt na een nieuwe training hoe het ging (inline knoppen: verdict › RPE)
- [x] `aq-061` — een **weekvoorstel** met [Opslaan][Aanpassen]; pas na een klik wordt het toegepast en gepusht
- [ ] Weekreview op maandag

**Klaar als:** je 's ochtends een bericht met de herstelbrief krijgt zonder iets te doen.
**Dat werkt** — de brief komt zodra de slaap van vannacht binnen is, met de herstelkaart als PNG-foto erbij.

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
0 fundament  ›  1 data  ›  2 rekenregels  ›  3 PWA  ›  4 invoer
                                ↑
                    hier zit de waarde
```

Fase 2 vóór 3, altijd. Een mooie PWA op onbetrouwbare berekeningen is erger dan geen PWA.

Fase 5 (de coach) kan later — de eerste vier fasen geven je al een werkend dashboard met
echte cijfers, **zonder één token**. Dat is precies het punt.

---

## Roadmap

**Nu (in gebruik).** Het dashboard (PWA, offline, achter login) met de **tien schermen** —
**Vandaag, Herstel, Week, Trends, Coach, Kracht, Invoer, Feedback, Profiel en Weegschaal**. De
data via intervals.icu (slaap, rusthartslag, trainingen), de rekenregels (**494 tests**), de
invoer (beschikbaarheid als **week-overzicht**, **feedback per training** als detailweergave,
ziek melden), de coach met een echt model (+ automatische fallback) die **ook in de app** zit
en **één geheugen deelt** met Telegram, de ochtendbrief die **wacht tot de slaap binnen is**
met de **herstelkaart als PNG-foto**, en de workout-invoer: een `.fit` of screenshot › de
coach leest en vertaalt › workout op de kalender › horloge. Plus het `push`-commando. **Kracht
log je in de app** (oefeningen + sets, tonnage en load) en een **Hevy data-dump** kun je
importeren. Daar horen de **Body Battery** bij (continu en waak-verankerd, met de **intraday-
regel "nog X% nu"**, eerlijk als schatting gelabeld), de **herstel-curves** op Herstel
(battery, slaap, herstel%, rust-HR, hoverbaar) en je **doel + seizoensplan**: je zegt het tegen
de coach, hij zet het vast in D1 en periodiseert het — zichtbaar in Trends, met **voortgang
t.o.v. het doel** en het **seizoensoverzicht** (examens + streefvolume). De coach **plant de
week zelf** binnen je beschikbaarheid (`validateWeekPlan`) en stelt bij een gesprek een
**herziene week** voor met een diff en bevestiging. De **test-bibliotheek** (FTP 20/12, ramp,
drempel 30/20, 5 km tijdrit, Cooper) voedt de examens en de baseline, met het
**vermogensprofiel + fenotype**. De **weegschaal** koppel je via Web Bluetooth.

**Volgende.** De weekreview met het model; een meerdaags plan in één keer; en het echte
krachtblok zodra doel en materiaal bekend zijn.

**Later.** Cloudflare Access als nettere poort; en lichaamscompositie (vet%, spiermassa) uit
de weegschaal verder benutten.

---

## Wat er nog open is

- **Slaapfases (hypnogram)** — de Huawei-API levert **geen slaapfases**, dus het hypnogram
  (wakker, REM, licht, diep) staat nog open. Tot die er zijn tonen we eerlijk wat er wél is:
  slaapduur en slaapbehoefte.
- **Cloudflare Access** — de nettere poort dan Basic Auth. Dit wacht op de gebruiker; nu zit
  het geheel achter HTTP Basic Auth in de Worker.
- **Lichaamscompositie** — gewicht komt via de **weegschaal in de PWA** (Web Bluetooth) in
  `wellness`. Vetpercentage en spiermassa uit een bio-impedantie-weegschaal zijn een
  **schatting**; die benutten we verder in een latere fase.
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
| **Kracht** | niet naar het horloge — dat loopt via de app (of Hevy als logboek) |

Dus de coach kan je **loop-** en **fietsworkouts** naar het horloge sturen. Kracht blijft
in de app (of in Hevy als logboek). De API-kant is `POST /api/v1/athlete/{id}/events` met de workout-stappen in
`description`; intervals.icu parseert die naar een gestructureerde workout.

**Gebouwd (08/10):** stuur een **`.fit`** of een **screenshot** naar de bot. De coach leest
hem (FIT-decoder respectievelijk een vision-model), vertaalt naar doel/effect en een
intervals.icu-workout, en zet hem op je kalender. Staat "Upload planned workouts" aan, dan
gaat hij door naar je horloge.

**Gebouwd (09/10):** de **geplande week** gaat in één keer naar de kalender (en dus naar je
horloge), en op het **sessiescherm** kun je één sessie openen en met één tik pushen
(`aq-048`). De **test-bibliotheek** zet de examendatums als sessie op de kalender
(`aq-057/058`). En in een gesprek past de coach de **rest van de week** nu écht aan: hij
stelt een herziene week voor met een **diff** en bevestiging (`aq-061`).

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
