# Dashboard redesigno prototipas

- [ ] Sukurti atskirą `ui/dashboard-redesign-prototype` šaką.
- [ ] Užfiksuoti bazinę `main` būklę ir jos build / lint rezultatus.
- [ ] Peržiūrėti Dashboard layout, page ir kortelių komponentus.
- [ ] Pakeisti tik Dashboard UI kompoziciją ir stilius.
- [ ] Nelies­ti Clerk, Stripe, API route’ų, Prisma ir env failų.
- [ ] Paleisti lokalų prototipą.
- [ ] Patikrinti Dashboard desktop ir mobile išvaizdą.
- [ ] Pateikti vartotojui naujo UI peržiūrą bei pakeitimų santrauką.

## Preview pataisa

- [ ] Patikrinti, ar preview puslapis gauna globalų CSS ir Next assetus.
- [ ] Patikrinti dev serverio cross-origin / allowedDevOrigins būseną.
- [ ] Pataisyti tik preview infrastruktūrą, neliečiant produkcijos auth ar billing logikos.
- [ ] Iš naujo patikrinti desktop ir mobile rendered rezultatą prieš siunčiant nuorodą.

## Balto preview puslapio blokatorius

- [ ] Patikrinti preview HTTP atsakymą, HTML, CSS ir JavaScript assetus.
- [ ] Patikrinti naršyklės console ir network klaidas.
- [ ] Patikrinti, ar laikinas viešas URL vis dar aktyvus ir rodo tą patį serverį.
- [ ] Jei reikia, sukurti patikimesnį preview būdą arba atskirą statinį prototipo peržiūros paketą.
- [ ] Nepateikti naujos nuorodos, kol puslapis nebus patikrintas kaip veikiantis.

## Pilnas redesignas po pirmo prototipo

- [ ] Atsisakyti seno dashboard karkaso kaip pagrindinės vizualinės nuorodos.
- [ ] Sukurti aiškią produkto shell struktūrą: kompaktiška navigacija, stipri page header hierarchija ir mažiau vienodų kortelių.
- [ ] Iš naujo suprojektuoti hero / decision zoną, kad ji būtų vizualiai dominuojanti ir turėtų aiškią būseną.
- [ ] Pertvarkyti KPI pateikimą į mažiau, bet prasmingesnių įrodymų.
- [ ] Sukurti savitesnį chart / session analysis modulį vietoje bendro SaaS kortelių tinklelio.
- [ ] Sustiprinti mobile-first kompoziciją ir realų 375 px vaizdą.
- [ ] Tik tada integruoti naują kompoziciją su esamais gyvais komponentais ir patikrinti regresijas.

## Pilnas profesionalus reworkas

- [ ] Parengti naują getALPHA dashboard design brief: brand, type scale, color roles, spacing, component states.
- [ ] Iš naujo suprojektuoti app shell: desktop sidebar, mobile header, page framing ir navigation hierarchy.
- [ ] Sukurti naują hero decision surface su realia būsena, įrodymais ir next action.
- [ ] Perkurti chart / market context modulį kaip pagrindinį darbo paviršių, ne kaip šalutinę kortelę.
- [ ] Pertvarkyti performance, recent trades, risk ir watchlist į prasmingas grupes su aiškiomis prioritetų būsenomis.
- [ ] Įdiegti loading, empty, stale, error ir no-connection būsenas su nuosekliu UX.
- [ ] Įgyvendinti tikrą mobile-first layout ir keyboard / contrast prieinamumą.
- [ ] Patikrinti auth, navigation, pricing / checkout links, build ir lint po reworko.
