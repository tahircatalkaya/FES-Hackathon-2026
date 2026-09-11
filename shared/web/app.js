"use strict";
const copy = {
  de: {
    home: "Start",
    together: "Gemeinsam",
    food: "Essen retten",
    reuse: "Mehrweg",
    mobility: "Mobilität",
    hello: "Kleine Schritte. Unser Frankfurt.",
    region: "FRANKFURT AM MAIN",
    intro: "Was passt heute in deinen Alltag?",
    hero: "Dein nächster Schritt zählt.",
    heroText:
      "Entdecke Möglichkeiten in deiner Nähe. Chami begleitet dich und erklärt, wie dein Beitrag anerkannt wird.",
    start: "Möglichkeiten entdecken",
    symbol: "Symbolischer Fortschritt",
    earned: "Verdiente Punkte",
    pending: "Noch in Prüfung",
    balance: "Einlöseguthaben",
    demoPoints: "Nur Demo-Fortschritt",
    noClaims: "Keine Gutscheinansprüche",
    next: "Heute ist ein guter Anfang",
    learn: "Lernmission öffnen",
    near: "In deinem Suchgebiet",
    all: "Alle ansehen",
    source: "Gespeicherter API-Abruf",
    unknown: "Bestand und Öffnungszeiten unbekannt",
    map: "Karte",
    list: "Liste",
    onMap: "Auf Karte",
    area: "Suchgebiet",
    foodIntro:
      "Öffentliche Fairteiler bleiben für alle zugänglich. Prüfe vor dem Weg die Hinweise vor Ort.",
    foodNote:
      "Die API nennt Orte, keinen aktuellen Bestand. Digitale Reservierungen für offene Regale können die Verfügbarkeit nicht garantieren.",
    apiData: "Partnerquelle",
    date: "Abgerufen",
    noLocation: "Manuelle Suche · keine Standortfreigabe nötig",
    distance: "Luftlinie",
    places: "Orte",
    reuseTitle: "Mehrweg passt in deinen Alltag.",
    reuseIntro:
      "Finde einen Partner und sieh, wie ein bestätigter Rückgabezyklus in deiner Historie ankommt.",
    partnerNote:
      "Ausschnitt mit maximal 20 allgemeinen Vytal-Partnern aus dem gespeicherten Abruf. Passende Rückgabemöglichkeiten und Behälterbeschränkungen sind noch zu prüfen.",
    cycle: "Ein Behälter. Ein abgeschlossener Zyklus.",
    cycleText:
      "Diese gemeinsame Integrationsdemo verwendet einen eigenen Testnachweis. Es wird kein Behälter bei Vytal ausgeliehen oder zurückgegeben.",
    demoReturn: "Rückgabenachweis simulieren",
    replay: "Denselben Nachweis erneut prüfen",
    sim: "Eigene Simulation",
    rideTitle: "Bewusst unterwegs.",
    rideIntro:
      "Deine Fahrt beginnt mit deiner Entscheidung. Historische Daten liefern Kontext und bleiben als solche erkennbar.",
    ride: "Eine Fahrt nachvollziehen",
    rideText:
      "Dieser Fixture steht für eine plausible Fahrt. NFC, GPS-Erkennung und automatische Fahrtenden sind hier noch nicht eingebaut.",
    demoRide: "Fahrtnachweis simulieren",
    traffic: "Wann werden Verbindungen gesucht?",
    trafficText:
      "Durchschnittliche Anfragen nach Stunde aus der gelieferten traffiQ-Datei. Das sind Suchanfragen, keine bestätigten Fahrten.",
    trafficTotal: "Anfragen je Durchschnittstag",
    trafficFoot:
      "Bezugszeitraum und Stichprobenumfang sind nicht dokumentiert. Keine Prognose und keine heutige Auslastung.",
    legend: "Originaler gelieferter Tagesgang",
    details: "Quelle und Aussagegrenzen",
    history: "Deine Historie",
    profile: "Dein Demo-Profil",
    profileText:
      "Ein gemeinsames Journal für alle Bereiche. Lokale Beispielperson, kein produktives Login.",
    close: "Schließen",
    none: "Noch keine Aktion. Starte eine Lernmission oder prüfe einen Beispielnachweis.",
    evidence: "Nachweis",
    impact: "Wirkung",
    impactUnknown: "Keine CO₂-Zahl: Menge oder geeigneter Nachweis fehlen.",
    confirmed: "Im Fixture bestätigt",
    plausible: "Im Fixture plausibel",
    accepted: "Anerkannt",
    not_qualified: "Nicht qualifiziert",
    pendingStatus: "Ausstehend",
    quizProgress: "Frage {n} von {total}",
    quizNext: "Nächste Frage",
    quizSeeResult: "Ergebnis ansehen",
    quizScoreLine: "{score} von {total} richtig beantwortet.",
    quizDone: "Mission abgeschlossen",
    quizClaim: "Punkte holen",
    added: "Demo-Punkte hinzugefügt",
    duplicate: "Bereits verarbeitet. Keine zweite Gutschrift.",
    eligibility:
      "Keine Punkte: Der gelieferte Partnerstatus erlaubt aktuell keine Rewards.",
    error: "Das hat nicht geklappt. Bitte erneut versuchen.",
    loading: "Möglichkeiten werden geladen …",
    simulatePickup: "Abholnachweis prüfen (Simulation)",
    pickupNote:
      "Beide eigenen Testnutzer sind derzeit nicht rewardberechtigt. Der Fixture zeigt die ehrliche Null-Punkte-Entscheidung.",
    quiz: "Lernmission",
    returnAction: "Mehrwegrückgabe",
    rideAction: "Plausible Fahrt",
    pickupAction: "Korbabholung",
    community: "Gemeinsam wächst etwas",
    noPlaces: "Keine passenden Orte in diesem Gebiet.",
    cached: "API-Snapshot · kein Livebestand",
    refill: "Nicht erneut belohnt",
    rule: "Regel demo-v1",
    homeTitle: "Dein Alltag kann etwas bewegen.",
    homeIntro: "Ein Ort, vier Wege: Gemeinsam, Essen retten, Mehrweg, Mobilität.",
    sponsor: "Ein Angebot der FES",
    fesTitle: "Frankfurt bleibt sauber.",
    streakLabel: "Tage-Streak",
    streakLabelOne: "Tag-Streak",
    quizCard: "FES-Wissen",
    quizCardSub: "5 Fragen zu Müll, Mehrweg und Mobilität.",
    bingoDoneToday: "Heute erledigt",
    bioCheck: "Biotonnen-Check",
    bioCheckSub: "Foto deiner grünen Tonne — der Check erkennt Fehlwürfe.",
    bioCheckOpen: "Tonne prüfen",
    bioPhoto: "Foto der offenen Biotonne",
    bioAnalyze: "Analysieren",
    bioAnalyzing: "Bild wird ausgewertet …",
    bioNoPhoto: "Bitte zuerst ein Foto auswählen.",
    bioUnclear:
      "Kein klares Ergebnis. Fotografiere die offene Tonne bei Tageslicht von oben.",
    bioGood: "Sauber getrennt!",
    bioBad: "Da ist noch Fremdmaterial drin.",
    bioScore: "Trennqualität",
    bioTipBright:
      "Helle Flächen erkannt — vermutlich Plastiktüte oder Folie. Bioabfall gehört lose oder in Papiertüten hinein.",
    bioTipBlue:
      "Kräftige blaue oder violette Flächen erkannt — vermutlich Verpackungsmüll.",
    bioTipMagenta:
      "Kräftige rote oder pinke Flächen erkannt — vermutlich Verpackung oder Kunststoff.",
    bioLocalNote:
      "Das Bild wird nur auf deinem Gerät ausgewertet und nirgendwo hochgeladen. Der Prototyp nutzt eine Farb- und Flächenanalyse; im Pilot ersetzt ein trainiertes Modell diese Heuristik.",
    bioClaim: "Punkte holen",
    bioRetry: "Neues Foto",
    ctaStart: "Aktion starten",
    actionsTitle: "Aktionen in deiner Nähe",
    actionsNote:
      "Punkte gibt es erst, wenn die Organisation deine Teilnahme bestätigt. Eine Anmeldung allein zählt nicht.",
    actionJoin: "Mitmachen",
    actionJoined: "Angemeldet",
    actionPeople: "dabei",
    actionNone: "Hier ist gerade nichts eingetragen. Trag selbst eine Aktion ein.",
    actionAll: "Alle ansehen",
    bingoFields: "Felder gefüllt",
    actionCreate: "Eigene Aktion eintragen",
    actionTypeField: "Art der Aktion",
    actionPlaceField: "Treffpunkt",
    actionWhenField: "Wann",
    tomorrow: "Morgen",
    actionSave: "Aktion eintragen",
    actionSaved: "Aktion eingetragen",
    nextAction: "Nächste Aktion",
    binBingo: "Mülleimer-Bingo",
    todayChallenge: "Heutige Challenge",
    binBingoOpen: "Heute melden",
    binBingoConfirm:
      "Ich habe es an einem Frankfurter Straßenmülleimer entsorgt",
    binBingoNeedConfirm: "Bitte bestätige, dass du es entsorgt hast.",
    binBingoPhotoNote:
      "Fotos bleiben nur lokal auf deinem Gerät sichtbar; diese Demo lädt oder speichert sie nicht.",
    beforePhoto: "Vorher-Foto",
    afterPhoto: "Nachher-Foto",
    submitBingo: "Aktion melden",
    teams: "Schul- & Firmenteams",
    teamsIntro: "Top 3 im simulierten Team-Vergleich.",
    teamsNote: "Simulierte Demo-Teams, keine echten Anmeldungen.",
    emptyDate: "Abrufzeit unbekannt",
  },
  en: {
    home: "Home",
    together: "Together",
    food: "Save food",
    reuse: "Reuse",
    mobility: "Mobility",
    hello: "Small steps. Our Frankfurt.",
    region: "FRANKFURT AM MAIN",
    intro: "What fits into your day?",
    hero: "Your next step counts.",
    heroText:
      "Discover opportunities nearby. Chami helps you understand how your contribution is recognised.",
    start: "Explore nearby",
    symbol: "Symbolic progress",
    earned: "Earned points",
    pending: "Under review",
    balance: "Redeemable balance",
    demoPoints: "Demo progress only",
    noClaims: "No voucher entitlement",
    next: "Today is a good start",
    learn: "Open learning mission",
    near: "In your search area",
    all: "View all",
    source: "Saved API response",
    unknown: "Stock and opening hours unknown",
    map: "Map",
    list: "List",
    onMap: "Show on map",
    area: "Search area",
    foodIntro:
      "Public food sharing points stay open to everyone. Check local information before travelling.",
    foodNote:
      "The API provides locations, not current stock. Reservations cannot guarantee availability at open shelves.",
    apiData: "Partner source",
    date: "Retrieved",
    noLocation: "Manual search · no location permission needed",
    distance: "Straight-line distance",
    places: "places",
    reuseTitle: "Make reuse part of your day.",
    reuseIntro:
      "Find a partner and see how a confirmed return cycle reaches your shared history.",
    partnerNote:
      "A snapshot of up to 20 general Vytal partners, not a complete directory. Suitable return options and container restrictions still need checking.",
    cycle: "One container. One completed cycle.",
    cycleText:
      "This shared integration demo uses a fixture. It does not borrow or return a container at Vytal.",
    demoReturn: "Simulate return evidence",
    replay: "Check the same evidence again",
    sim: "Own simulation",
    rideTitle: "Travel with intention.",
    rideIntro:
      "Your journey starts with your decision. Historical data provides context and is clearly labelled.",
    ride: "Understand a journey",
    rideText:
      "This fixture represents a plausible journey. NFC, GPS recognition and automatic journey endings are not implemented here.",
    demoRide: "Simulate journey evidence",
    traffic: "When do people search for connections?",
    trafficText:
      "Average requests by hour from the supplied traffiQ file. These are searches, not confirmed journeys.",
    trafficTotal: "requests per average day",
    trafficFoot:
      "Reference period and sample size are undocumented. This is neither a forecast nor current occupancy.",
    legend: "Original supplied daily profile",
    details: "Source and limitations",
    history: "Your history",
    profile: "Your demo profile",
    profileText:
      "One shared journal across all areas. Local sample person, no production login.",
    close: "Close",
    none: "No actions yet. Start a learning mission or check sample evidence.",
    evidence: "Evidence",
    impact: "Impact",
    impactUnknown: "No CO₂ figure: a quantity or suitable evidence is missing.",
    confirmed: "Confirmed in the fixture",
    plausible: "Plausible in the fixture",
    accepted: "Accepted",
    not_qualified: "Not eligible",
    pendingStatus: "Pending",
    quizProgress: "Question {n} of {total}",
    quizNext: "Next question",
    quizSeeResult: "See result",
    quizScoreLine: "{score} out of {total} correct.",
    quizDone: "Mission complete",
    quizClaim: "Claim points",
    added: "demo points added",
    duplicate: "Already processed. No second award.",
    eligibility:
      "No points: the supplied partner status currently does not allow rewards.",
    error: "Something went wrong. Please try again.",
    loading: "Loading nearby opportunities …",
    simulatePickup: "Check pickup evidence (simulation)",
    pickupNote:
      "Both team test users currently lack reward eligibility. This fixture demonstrates an honest zero-point decision.",
    quiz: "Learning mission",
    returnAction: "Container return",
    rideAction: "Plausible journey",
    pickupAction: "Basket pickup",
    community: "Something grows together",
    noPlaces: "No matching places in this area.",
    cached: "API snapshot · no live stock",
    refill: "Not rewarded again",
    rule: "Rule demo-v1",
    homeTitle: "Your everyday choices can make a difference.",
    homeIntro: "One place, four paths: Together, Save food, Reuse, Mobility.",
    sponsor: "Brought to you by FES",
    fesTitle: "Keep Frankfurt clean.",
    streakLabel: "day streak",
    streakLabelOne: "day streak",
    quizCard: "FES knowledge",
    quizCardSub: "5 questions on waste, reuse and mobility.",
    bingoDoneToday: "Done today",
    bioCheck: "Organic bin check",
    bioCheckSub: "Photograph your green bin — the check spots wrong items.",
    bioCheckOpen: "Check the bin",
    bioPhoto: "Photo of the open organic bin",
    bioAnalyze: "Analyse",
    bioAnalyzing: "Analysing image …",
    bioNoPhoto: "Please select a photo first.",
    bioUnclear:
      "No clear result. Photograph the open bin from above in daylight.",
    bioGood: "Nicely separated!",
    bioBad: "There's still foreign material in there.",
    bioScore: "Separation quality",
    bioTipBright:
      "Bright areas detected — likely a plastic bag or film. Organic waste goes in loose or in paper bags.",
    bioTipBlue:
      "Strong blue or violet areas detected — likely packaging waste.",
    bioTipMagenta:
      "Strong red or pink areas detected — likely packaging or plastic.",
    bioLocalNote:
      "The image is analysed on your device only and never uploaded. This prototype uses colour and area analysis; a trained model replaces the heuristic in a pilot.",
    bioClaim: "Claim points",
    bioRetry: "New photo",
    ctaStart: "Start an action",
    actionsTitle: "Actions near you",
    actionsNote:
      "Points are only awarded once the organiser confirms your participation. Signing up alone does not count.",
    actionJoin: "Join in",
    actionJoined: "Signed up",
    actionPeople: "joining",
    actionNone: "Nothing listed here yet. Add an action yourself.",
    actionAll: "View all",
    bingoFields: "fields filled",
    actionCreate: "Add your own action",
    actionTypeField: "Type of action",
    actionPlaceField: "Meeting point",
    actionWhenField: "When",
    tomorrow: "Tomorrow",
    actionSave: "Add action",
    actionSaved: "Action added",
    nextAction: "Next action",
    binBingo: "Bin Bingo",
    todayChallenge: "Today's challenge",
    binBingoOpen: "Check in today",
    binBingoConfirm: "I disposed of it at a Frankfurt street bin",
    binBingoNeedConfirm: "Please confirm you disposed of it.",
    binBingoPhotoNote:
      "Photos stay local on your device only; this demo never uploads or stores them.",
    beforePhoto: "Before photo",
    afterPhoto: "After photo",
    submitBingo: "Report action",
    teams: "School & company teams",
    teamsIntro: "Top 3 in the simulated team comparison.",
    teamsNote: "Simulated demo teams, no real sign-ups.",
    emptyDate: "Retrieval time unknown",
  },
};
copy.de.mapNoStreets = "Standortkarte ohne Straßenebene";
copy.en.mapNoStreets = "Location map without a street layer";
const themes = {
  home: ["#8a4b12", "#f7ece0"],
  together: ["#102b54", "#e6edf8"],
  food: ["#31643a", "#edf5e9"],
  reuse: ["#7c3155", "#f8eaf0"],
  mobility: ["#245e86", "#e8f2f8"],
};
const state = {
  lang: localStorage.getItem("mainwandel-language") === "en" ? "en" : "de",
  tab: "together",
  area: "centre",
  view: "list",
  mapPoint: null,
  account: { earned: 0, pending: 0, redeemable: 0, history: [] },
  catalog: { points: [], stores: [], hours: [] },
  dialog: null,
  bingoPop: false,
  joined: new Set(),
  ownActions: [],
  newType: 0,
  newArea: null,
  pickDay: 0,
  pickTime: 4,
  quizIndex: 0,
  quizScore: 0,
  quizAnswered: false,
  quizPicked: null,
};
const t = (key) => copy[state.lang][key] ?? key;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n) =>
  new Intl.NumberFormat(state.lang === "de" ? "de-DE" : "en-GB", {
    maximumFractionDigits: 1,
  }).format(n);
const date = (s) =>
  s
    ? new Intl.DateTimeFormat(state.lang === "de" ? "de-DE" : "en-GB", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Europe/Berlin",
      }).format(new Date(s))
    : t("emptyDate");
const centres = {
  centre: [50.1109, 8.6821],
  bockenheim: [50.123, 8.644],
  sachsenhausen: [50.097, 8.687],
  bornheim: [50.125, 8.712],
};
const areaSelect = (id = "area") =>
  `<label>${t("area")} <select id="${id}"><option value="centre">Frankfurt · Innenstadt</option><option value="bockenheim">Bockenheim</option><option value="sachsenhausen">Sachsenhausen</option><option value="bornheim">Bornheim</option></select></label>`;
function km(p) {
  const [lat, lon] = centres[state.area],
    r = Math.PI / 180,
    a =
      Math.sin(((p.lat - lat) * r) / 2) ** 2 +
      Math.cos(lat * r) *
        Math.cos(p.lat * r) *
        Math.sin(((p.lon - lon) * r) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const button = (key, action, style = "") =>
  `<button class="${style}" data-action="${action}">${t(key)}</button>`;
function stats() {
  return `<div class="stats"><div class="stat"><strong>${fmt(state.account.earned)}</strong><span>${t("earned")}</span><small>${t("demoPoints")}</small></div><div class="stat"><strong>${fmt(state.account.pending)}</strong><span>${t("pending")}</span></div><div class="stat"><strong>${fmt(state.account.redeemable)}</strong><span>${t("balance")}</span><small>${t("noClaims")}</small></div></div>`;
}
function source() {
  return `<p class="quiet">${t("cached")} · ${t("date")} ${date(state.catalog.retrieved_at)}</p>`;
}
function places(kind, limit = 30) {
  let points = (
    kind === "food"
      ? state.catalog.points
      : state.catalog.stores.map((s) => ({
          id: s.id,
          name: s.name,
          lat: s.lonlat?.latitude,
          lon: s.lonlat?.longitude,
        }))
  ).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  return points
    .map((p) => ({ ...p, distance: km(p) }))
    .filter((p) => p.distance <= 5)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}
function placeList(kind, limit) {
  const data = places(kind, limit);
  return data.length
    ? `<div class="list">${data.map((p) => `<article class="place row"><div><h3>${esc(p.name)}</h3><p>${fmt(p.distance)} km · ${t("distance")}</p><p>${kind === "food" ? t("unknown") : t("apiData") + " · Vytal"}</p></div><button data-map="${esc(p.id)}" data-kind="${kind}">${t("onMap")}</button></article>`).join("")}</div>`
    : `<p class="empty">${t("noPlaces")}</p>`;
}
function map() {
  const p = state.mapPoint ?? {
    lat: centres[state.area][0],
    lon: centres[state.area][1],
  };
  const data = places(state.tab === "reuse" ? "reuse" : "food");
  const centre = centres[state.area];
  const label = t("mapNoStreets");
  const markers = data
    .map((point, index) => {
      const x =
        200 +
        (point.lon - centre[1]) *
          Math.cos((centre[0] * Math.PI) / 180) *
          111 *
          32;
      const y = 160 - (point.lat - centre[0]) * 111 * 32;
      const selected = state.mapPoint?.id === point.id;
      return `<g><circle cx="${x}" cy="${y}" r="${selected ? 11 : 7}" fill="${selected ? "#b9eb73" : "var(--accent)"}" stroke="white" stroke-width="2"><title>${esc(point.name)} · ${fmt(point.distance)} km</title></circle></g>`;
    })
    .join("");
  return `<div class="geo-map"><svg viewBox="0 0 400 320" role="img" aria-label="${label}"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cad7e6" stroke-width=".6"/></pattern></defs><rect width="400" height="320" fill="#edf3f9"/><rect width="400" height="320" fill="url(#grid)"/><circle cx="200" cy="160" r="145" fill="none" stroke="#b4c5d9" stroke-dasharray="4 5"/><path d="M200 150v20m-10-10h20" stroke="#506987" stroke-width="2"/>${markers}<text x="18" y="27" fill="#304e6c" font-size="14">N ↑</text><path d="M20 290h64m-64-4v8m64-8v8" stroke="#304e6c"/><text x="20" y="280" fill="#304e6c" font-size="12">2 km</text></svg><p>${label} · ${t("distance")}</p></div><p class="quiet">${esc(p.name ?? "Frankfurt")} · <a href="https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=16/${p.lat}/${p.lon}" target="_blank" rel="noopener noreferrer">OpenStreetMap ↗</a></p>`;
}
const TEAMS_DEMO = [
  { name: "Otto-Hahn-Schule", points: 812 },
  { name: "FES Azubis", points: 690 },
  { name: "Nachbarschaft Bornheim", points: 540 },
  { name: "IHK Frankfurt Team", points: 410 },
  { name: "Sachsenhausen Cleanup Crew", points: 305 },
];
function teamsCard() {
  const top3 = [...TEAMS_DEMO].sort((a, b) => b.points - a.points).slice(0, 3);
  return `<section class="card"><span class="tag">${t("community")} · ${t("sim")}</span><h3>${t("teams")}</h3><p>${t("teamsIntro")}</p><div class="team-list">${top3.map((team, i) => `<div class="team-row"><span class="team-rank">${i + 1}</span><span>${esc(team.name)}</span><strong>${fmt(team.points)}</strong></div>`).join("")}</div><p class="quiet">${t("teamsNote")}</p></section>`;
}
function home() {
  return `<div class="eyebrow">MAINWANDEL</div><h1>${t("homeTitle")}</h1><p class="lead">${t("homeIntro")}</p><section class="hero"><div><div class="eyebrow">MAINWANDEL × CHAMI</div><h2>${t("hero")}</h2><p>${t("heroText")}</p>${button("start", "food")}</div><div class="world"><div class="planet"><img src="/chameleon.svg" alt="Chami"></div><small>${t("symbol")}</small></div></section>${stats()}<div class="section-head"><h2>${t("next")}</h2></div><div class="twocol"><section class="card"><span class="tag">${t("together")}</span><h3>${t("hello")}</h3><p>${t("intro")}</p><button class="secondary" data-tab="together">${t("together")}</button></section>${teamsCard()}</div>`;
}
const BIN_CHALLENGES = {
  icons: [
    "🧴",
    "🚬",
    "🥫",
    "🛍️",
    "🍾",
    "☕",
    "📦",
    "📰",
    "🍕",
    "🥤",
    "🍫",
    "🧃",
    "🔋",
    "🍌",
    "🧾",
    "🌿",
  ],
  de: [
    "Plastikflasche aufheben",
    "Zigarettenkippe einsammeln",
    "Dose entsorgen",
    "Plastiktüte aufheben",
    "Glasflasche einsammeln",
    "Kaffeebecher wegräumen",
    "Karton vom Gehweg räumen",
    "Zeitung oder Werbung aufheben",
    "Pizzakarton entsorgen",
    "Trinkbecher aufheben",
    "Schokoriegel-Papier aufheben",
    "Saftpäckchen entsorgen",
    "Batterie richtig entsorgen",
    "Bananenschale in die Biotonne",
    "Kassenbon aufheben",
    "Grünabfall richtig entsorgen",
  ],
  en: [
    "Pick up a plastic bottle",
    "Collect a cigarette butt",
    "Dispose of a can",
    "Pick up a plastic bag",
    "Collect a glass bottle",
    "Clear away a coffee cup",
    "Clear a cardboard box off the pavement",
    "Pick up a newspaper or flyer",
    "Dispose of a pizza box",
    "Pick up a drink cup",
    "Pick up a chocolate wrapper",
    "Dispose of a juice carton",
    "Dispose of a battery properly",
    "Banana peel into the organic bin",
    "Pick up a receipt",
    "Dispose of green waste properly",
  ],
  short: {
    de: [
      "Flasche",
      "Kippe",
      "Dose",
      "Tüte",
      "Glas",
      "Kaffee",
      "Karton",
      "Papier",
      "Pizza",
      "Becher",
      "Riegel",
      "Saft",
      "Batterie",
      "Banane",
      "Bon",
      "Grünes",
    ],
    en: [
      "Bottle",
      "Butt",
      "Can",
      "Bag",
      "Glass",
      "Coffee",
      "Box",
      "Paper",
      "Pizza",
      "Cup",
      "Wrapper",
      "Juice",
      "Battery",
      "Banana",
      "Receipt",
      "Green",
    ],
  },
};
function challengeIndexForDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfYear = Math.round(
    (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000,
  );
  return dayOfYear % 16;
}
function todayBerlin() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}
function bingoDates() {
  return new Set(
    state.account.history
      .filter((r) => r.action === "fes.bin_bingo")
      .map((r) =>
        new Date(r.occurred_at).toLocaleDateString("en-CA", {
          timeZone: "Europe/Berlin",
        }),
      ),
  );
}
function bingoStreak(dates) {
  const today = todayBerlin();
  const cursor = new Date(today + "T00:00:00Z");
  if (!dates.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
function bingoCard() {
  const dates = bingoDates();
  const todayIndex = challengeIndexForDate(todayBerlin());
  const done = new Set([...dates].map(challengeIndexForDate));
  const doneToday = dates.has(todayBerlin());
  const texts = BIN_CHALLENGES[state.lang];
  const pop = state.bingoPop;
  state.bingoPop = false;
  const cells = Array.from({ length: 16 }, (_, i) => {
    const isDone = done.has(i);
    const isToday = i === todayIndex;
    const classes = ["bingo-cell"];
    if (isDone) classes.push("done");
    if (isToday) classes.push("today");
    if (isToday && pop) classes.push("pop");
    return `<span class="${classes.join(" ")}" style="--i:${i}" title="${esc(texts[i])}"><span class="bingo-emoji" aria-hidden="true">${BIN_CHALLENGES.icons[i]}</span><span class="bingo-label">${esc(BIN_CHALLENGES.short[state.lang][i])}</span>${isDone ? '<span class="bingo-check" aria-hidden="true">✓</span>' : ""}</span>`;
  }).join("");
  return `<section class="card tint"><h3>${t("binBingo")}</h3><div class="challenge-hero"><span class="challenge-emoji" aria-hidden="true">${BIN_CHALLENGES.icons[todayIndex]}</span><div><span class="quiet">${t("todayChallenge")}</span><strong>${esc(texts[todayIndex])}</strong></div></div><div class="bingo-grid" role="img" aria-label="${t("binBingo")}">${cells}</div><div class="progress"><span style="width:${(done.size / 16) * 100}%"></span></div><p class="quiet">${done.size} / 16 ${t("bingoFields")}</p>${doneToday ? `<p class="done-pill">✓ ${t("bingoDoneToday")}</p>` : button("binBingoOpen", "bin_bingo_open", "block")}</section>`;
}
const ACTIONS_DEMO = [
  {
    id: "a1",
    area: "centre",
    icon: "🧹",
    title: "Clean-up Mainufer",
    place: "Untermainbrücke",
    when: "Sa 10:00",
    people: 12,
  },
  {
    id: "a2",
    area: "centre",
    icon: "🌳",
    title: "Parkputz Bethmannpark",
    place: "Bethmannpark",
    when: "So 14:00",
    people: 6,
  },
  {
    id: "a3",
    area: "bockenheim",
    icon: "🚬",
    title: "Kippen-Sammelrunde",
    place: "Kurfürstenplatz",
    when: "Fr 17:00",
    people: 9,
  },
  {
    id: "a4",
    area: "sachsenhausen",
    icon: "🚲",
    title: "Uferweg-Aktion",
    place: "Schaumainkai",
    when: "Sa 11:00",
    people: 15,
  },
  {
    id: "a5",
    area: "bornheim",
    icon: "🌳",
    title: "Günthersburgpark-Putz",
    place: "Günthersburgpark",
    when: "So 10:00",
    people: 21,
  },
];
function loadActionState() {
  try {
    const raw = JSON.parse(localStorage.getItem("mainwandel-actions") ?? "{}");
    state.joined = new Set(Array.isArray(raw.joined) ? raw.joined : []);
    state.ownActions = Array.isArray(raw.own) ? raw.own : [];
  } catch {
    state.joined = new Set();
    state.ownActions = [];
  }
}
function saveActionState() {
  localStorage.setItem(
    "mainwandel-actions",
    JSON.stringify({ joined: [...state.joined], own: state.ownActions }),
  );
}
function allActions() {
  return [...state.ownActions, ...ACTIONS_DEMO];
}
function joinedAction() {
  return allActions().find((a) => state.joined.has(a.id));
}
function actionRow(a) {
  const joined = state.joined.has(a.id);
  return `<div class="action-row"><span class="action-icon" aria-hidden="true">${a.icon}</span><div class="action-info"><strong>${esc(a.title)}</strong><p class="quiet">${esc(a.place)} · ${esc(a.when)} · ${a.people} ${t("actionPeople")}</p></div><button class="${joined ? "secondary" : ""}" data-action="action_join" data-id="${esc(a.id)}">${t(joined ? "actionJoined" : "actionJoin")}</button></div>`;
}
function areaActions() {
  return allActions().filter((a) => a.area === state.area);
}
function actionsCard() {
  const list = areaActions();
  const rows = list.length
    ? list.slice(0, 3).map(actionRow).join("")
    : `<p class="empty">${t("actionNone")}</p>`;
  const more =
    list.length > 3
      ? `<button class="secondary block" data-action="action_list">${t("actionAll")} (${list.length})</button>`
      : "";
  return `<section class="card"><h3>${t("actionsTitle")}</h3><div class="filters">${areaSelect("action-area")}</div><div class="action-list">${rows}</div>${more}<p class="quiet">${t("actionsNote")}</p></section>`;
}
function actionsListDialog() {
  state.dialog = "actionList";
  const list = areaActions();
  showDialog(
    `<h2>${t("actionsTitle")}</h2><div class="filters">${areaSelect("list-area")}</div><div class="action-list">${list.map(actionRow).join("")}</div><p class="quiet">${t("actionsNote")}</p>`,
  );
  document.querySelector("#list-area").value = state.area;
}
const ACTION_TYPES = [
  {
    icon: "🧹",
    title: { de: "Clean-up", en: "Clean-up" },
    short: { de: "Clean-up", en: "Clean-up" },
  },
  {
    icon: "🚬",
    title: { de: "Kippen-Sammelrunde", en: "Cigarette butt round" },
    short: { de: "Kippen", en: "Butts" },
  },
  {
    icon: "🌳",
    title: { de: "Parkputz", en: "Park clean-up" },
    short: { de: "Park", en: "Park" },
  },
  {
    icon: "🚲",
    title: { de: "Uferweg-Aktion", en: "Riverside action" },
    short: { de: "Uferweg", en: "Riverside" },
  },
  {
    icon: "📣",
    title: { de: "Aufklärungsstand", en: "Awareness stand" },
    short: { de: "Aufklärung", en: "Awareness" },
  },
  {
    icon: "♻️",
    title: { de: "Mülltrennungs-Aktion", en: "Waste sorting action" },
    short: { de: "Trennen", en: "Sorting" },
  },
];
const MEETING_POINTS = {
  centre: ["Untermainbrücke", "Bethmannpark", "Hauptwache", "Zeil"],
  bockenheim: ["Kurfürstenplatz", "Rothschildpark", "Bockenheimer Warte"],
  sachsenhausen: ["Schaumainkai", "Südbahnhof", "Textorpark"],
  bornheim: ["Günthersburgpark", "Berger Straße", "Bornheim Mitte"],
};
function pickerDays() {
  const names =
    state.lang === "de"
      ? ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const base = new Date(todayBerlin() + "T00:00:00Z");
  return Array.from({ length: 14 }, (_, i) => {
    const day = new Date(base);
    day.setUTCDate(base.getUTCDate() + i + 1);
    if (i === 0) return t("tomorrow");
    return `${names[day.getUTCDay()]} ${day.getUTCDate()}.${day.getUTCMonth() + 1}.`;
  });
}
function pickerTimes() {
  const times = [];
  for (let minutes = 8 * 60; minutes <= 20 * 60; minutes += 30) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    times.push(`${h}:${m}`);
  }
  return times;
}
function wheel(id, items, selected) {
  return `<div class="wheel" id="${id}" data-index="${selected}" role="listbox" tabindex="0">${items
    .map(
      (item, i) =>
        `<div class="wheel-item ${i === selected ? "is-active" : ""}" role="option" aria-selected="${i === selected}">${esc(item)}</div>`,
    )
    .join("")}</div>`;
}
function initWheels() {
  document.querySelectorAll(".wheel").forEach((element) => {
    const height = element.querySelector(".wheel-item").offsetHeight;
    element.scrollTop = Number(element.dataset.index) * height;
    let frame;
    element.addEventListener("scroll", () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const index = Math.round(element.scrollTop / height);
        element.dataset.index = index;
        element.querySelectorAll(".wheel-item").forEach((item, i) => {
          item.classList.toggle("is-active", i === index);
          item.setAttribute("aria-selected", i === index);
        });
        if (element.id === "wheel-day") state.pickDay = index;
        if (element.id === "wheel-time") state.pickTime = index;
      });
    });
  });
}
function actionCreateDialog() {
  state.dialog = "actions";
  const area = state.newArea ?? state.area;
  const types = ACTION_TYPES.map(
    (type, i) =>
      `<button class="type-tile ${i === state.newType ? "active" : ""}" data-action="action_type" data-index="${i}" title="${esc(type.title[state.lang])}"><span class="type-emoji" aria-hidden="true">${type.icon}</span><span class="type-label">${esc(type.short[state.lang])}</span></button>`,
  ).join("");
  const places = MEETING_POINTS[area]
    .map((place) => `<option value="${esc(place)}">${esc(place)}</option>`)
    .join("");
  showDialog(
    `<h2>${t("actionCreate")}</h2><div class="field"><span>${t("actionTypeField")}</span><div class="type-grid">${types}</div></div><div class="filters">${areaSelect("new-area")}</div><label class="field"><span>${t("actionPlaceField")}</span><select id="new-place">${places}</select></label><div class="field"><span>${t("actionWhenField")}</span><div class="wheels">${wheel("wheel-day", pickerDays(), state.pickDay)}${wheel("wheel-time", pickerTimes(), state.pickTime)}</div></div>${button("actionSave", "action_create", "block")}`,
  );
  document.querySelector("#new-area").value = area;
  initWheels();
}
const BIO_THRESHOLD = 70;
function analyseBinPhoto(img) {
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const foreign = { bright: 0, blue: 0, magenta: 0 };
  let organic = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (max < 0.12) continue;
    let hue = 0;
    if (max !== min) {
      const span = max - min;
      if (max === r) hue = 60 * (((g - b) / span + 6) % 6);
      else if (max === g) hue = 60 * ((b - r) / span + 2);
      else hue = 60 * ((r - g) / span + 4);
    }
    if (saturation > 0.15 && hue >= 45 && hue <= 165) organic++;
    else if (saturation > 0.18 && hue >= 15 && hue < 45 && max < 0.8) organic++;
    else if (saturation > 0.35 && hue > 175 && hue < 320) foreign.blue++;
    else if (saturation > 0.45 && (hue >= 320 || hue < 15)) foreign.magenta++;
    else if (saturation < 0.12 && max > 0.85) foreign.bright++;
  }
  const wrong = foreign.bright + foreign.blue + foreign.magenta;
  const total = organic + wrong;
  if (total < 400) return { score: null };
  const worst = Object.keys(foreign).sort((a, b) => foreign[b] - foreign[a])[0];
  return {
    score: Math.round((organic / total) * 100),
    tip: { bright: "bioTipBright", blue: "bioTipBlue", magenta: "bioTipMagenta" }[
      worst
    ],
  };
}
function bioResultMarkup(result) {
  if (result.score === null) {
    return `<p class="notice">${t("bioUnclear")}</p>${button("bioRetry", "bio_reset", "secondary")}`;
  }
  const good = result.score >= BIO_THRESHOLD;
  return `<div class="score"><div class="score-value ${good ? "good" : "bad"}">${result.score}</div><div><strong>${t(good ? "bioGood" : "bioBad")}</strong><p class="quiet">${t("bioScore")}</p></div></div>${good ? "" : `<p class="notice">${t(result.tip)}</p>`}${good ? button("bioClaim", "bio_claim", "block") : button("bioRetry", "bio_reset", "secondary")}`;
}
function bioCard() {
  const done = bioDates().has(todayBerlin());
  return `<section class="card"><div class="challenge-hero"><span class="challenge-emoji" aria-hidden="true">♻️</span><div><strong>${t("bioCheck")}</strong><p class="quiet">${t("bioCheckSub")}</p></div></div>${done ? `<p class="done-pill">✓ ${t("bingoDoneToday")}</p>` : button("bioCheckOpen", "bio_open", "block")}</section>`;
}
function bioDates() {
  return new Set(
    state.account.history
      .filter((r) => r.action === "fes.bio_check")
      .map((r) =>
        new Date(r.occurred_at).toLocaleDateString("en-CA", {
          timeZone: "Europe/Berlin",
        }),
      ),
  );
}
function bioDialog() {
  state.dialog = "bio";
  showDialog(
    `<h2>${t("bioCheck")}</h2><label class="photo-tile wide" for="bio-photo"><input type="file" accept="image/*" capture="environment" id="bio-photo" data-preview="bio-preview"><img id="bio-preview" class="photo-preview" hidden alt=""><span class="photo-tile-inner"><span class="photo-icon" aria-hidden="true">📷</span>${t("bioPhoto")}</span></label><p class="quiet">${t("bioLocalNote")}</p><div id="bio-result"></div>${button("bioAnalyze", "bio_analyse", "block")}`,
  );
}
function together() {
  const streak = bingoStreak(bingoDates());
  const next = joinedAction();
  return `<img class="fes-mark" src="/fes-logo.svg" alt="FES" title="${t("sponsor")}"><section class="hero"><div><h1>${t("fesTitle")}</h1><div class="streak"><span aria-hidden="true">🔥</span><strong>${streak}</strong> ${t(streak === 1 ? "streakLabelOne" : "streakLabel")}</div>${next ? `<p class="next-action"><span aria-hidden="true">📍</span> ${t("nextAction")}: <strong>${esc(next.when)} · ${esc(next.place)}</strong></p>` : ""}${button("ctaStart", "action_open", "block")}</div><div class="world"><div class="planet"><img src="/gecko.svg" alt="Gecko"></div></div></section><div class="twocol">${bingoCard()}<div class="stack">${bioCard()}<section class="card"><h3>${t("quizCard")}</h3><p>${t("quizCardSub")}</p>${button("learn", "quiz", "block")}</section>${actionsCard()}</div></div>`;
}
function binBingoDialog() {
  state.dialog = "bin_bingo";
  const index = challengeIndexForDate(todayBerlin());
  showDialog(
    `<h2>${t("binBingo")}</h2><div class="challenge-hero"><span class="challenge-emoji" aria-hidden="true">${BIN_CHALLENGES.icons[index]}</span><div><span class="quiet">${t("todayChallenge")}</span><strong>${esc(BIN_CHALLENGES[state.lang][index])}</strong></div></div><div class="photo-row"><label class="photo-tile" for="bingo-before"><input type="file" accept="image/*" capture="environment" id="bingo-before" data-preview="bingo-before-preview"><img id="bingo-before-preview" class="photo-preview" hidden alt=""><span class="photo-tile-inner"><span class="photo-icon" aria-hidden="true">📷</span>${t("beforePhoto")}</span></label><label class="photo-tile" for="bingo-after"><input type="file" accept="image/*" capture="environment" id="bingo-after" data-preview="bingo-after-preview"><img id="bingo-after-preview" class="photo-preview" hidden alt=""><span class="photo-tile-inner"><span class="photo-icon" aria-hidden="true">✨</span>${t("afterPhoto")}</span></label></div><p class="quiet">${t("binBingoPhotoNote")}</p><label class="check-tile"><input type="checkbox" id="bingo-confirm"><span class="check-box" aria-hidden="true"></span><span>${t("binBingoConfirm")}</span></label>${button("submitBingo", "bin_bingo", "block")}<p id="bingo-error" class="quiet"></p>`,
  );
}
function food() {
  return `<div class="eyebrow">FRANKFURT FOODSHARING</div><h1>${t("food")}</h1><p class="lead">${t("foodIntro")}</p><div class="filters">${areaSelect()}<div class="toggle"><button data-view="list" class="${state.view === "list" ? "active" : ""}">${t("list")}</button><button data-view="map" class="${state.view === "map" ? "active" : ""}">${t("map")}</button></div></div><p class="quiet">${t("noLocation")}</p>${state.view === "map" ? map() : ""}${placeList("food")}${source()}<p class="notice">${t("foodNote")}</p><details><summary>${t("simulatePickup")}</summary><p>${t("pickupNote")}</p>${button("simulatePickup", "pickup")}</details>`;
}
function reuse() {
  return `<div class="eyebrow">VYTAL</div><h1>${t("reuseTitle")}</h1><p class="lead">${t("reuseIntro")}</p><section class="card tint"><span class="tag">${t("sim")}</span><h2>${t("cycle")}</h2><p>${t("cycleText")}</p><div class="actions">${button("demoReturn", "return")}${button("replay", "return", "secondary")}</div><p class="quiet">${t("rule")} · 10 ${t("demoPoints")}</p></section><div class="filters">${areaSelect()}</div>${state.view === "map" ? map() : ""}${placeList("reuse")}${source()}<p class="notice">${t("partnerNote")}</p>`;
}
function mobility() {
  const maximum = Math.max(1, ...state.catalog.hours.map((h) => h.requests));
  return `<div class="eyebrow">TRANSDEV + TRAFFIQ</div><h1>${t("rideTitle")}</h1><p class="lead">${t("rideIntro")}</p><section class="card tint"><span class="tag">Transdev · ${t("sim")}</span><h2>${t("ride")}</h2><p>${t("rideText")}</p><div class="actions">${button("demoRide", "ride")}${button("replay", "ride", "secondary")}</div></section><section class="card section-head"><span class="tag">traffiQ · ${t("legend")}</span><h2>${t("traffic")}</h2><p>${t("trafficText")}</p><div class="bar-chart" role="img" aria-label="${t("traffic")}">${state.catalog.hours.map((h) => `<div class="bar" style="height:${(h.requests / maximum) * 100}%" title="${h.hour}:00 · ${fmt(h.requests)}"></div>`).join("")}</div><div class="chart-labels"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div><p><strong>${fmt(state.catalog.hours.reduce((s, h) => s + h.requests, 0))}</strong> ${t("trafficTotal")}</p><p class="quiet">${t("trafficFoot")}</p><details><summary>${t("list")} / ${t("details")}</summary>${state.catalog.hours.map((h) => `<div class="row"><span>${h.hour}:00</span><span>${fmt(h.requests)}</span></div>`).join("")}<p>Mobilitätsdaten/tagesgang_avg.csv</p></details></section>`;
}
function render() {
  document.documentElement.lang = state.lang;
  const [accent, soft] = themes[state.tab];
  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--soft", soft);
  document.querySelector("#language").textContent =
    state.lang === "de" ? "EN" : "DE";
  document.querySelector("#profile").setAttribute("aria-label", t("profile"));
  document.querySelector("#content").innerHTML = {
    home,
    together,
    food,
    reuse,
    mobility,
  }[state.tab]();
  document.querySelector("#navigation").innerHTML = Object.keys(themes)
    .map(
      (key, i) =>
        `<button data-tab="${key}" class="${state.tab === key ? "active" : ""}" ${state.tab === key ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${["⌂", "♥", "♧", "↺", "↗"][i]}</span>${t(key)}</button>`,
    )
    .join("");
  document
    .querySelectorAll("#area, #action-area, #list-area")
    .forEach((select) => (select.value = state.area));
  document.querySelector("#close-dialog").textContent = t("close");
  document
    .querySelector("nav")
    .setAttribute(
      "aria-label",
      state.lang === "de" ? "Hauptnavigation" : "Main navigation",
    );
}
const actionName = (a) =>
  t(
    {
      "fes.quiz": "quiz",
      "fes.bin_bingo": "binBingo",
      "fes.bio_check": "bioCheck",
      "vytal.return": "returnAction",
      "transdev.journey": "rideAction",
      "foodsharing.basket_pickup": "pickupAction",
    }[a] ?? a,
  );
function account() {
  state.dialog = "account";
  const html = `<div class="eyebrow">LOCAL DEMO</div><h2>${t("profile")}</h2><p>${t("profileText")}</p>${stats()}<h3>${t("history")}</h3>${
    state.account.history.length
      ? state.account.history
          .map((r) => {
            const p = JSON.parse(r.payload);
            return `<article class="history-item"><div class="row"><b>${actionName(r.action)}</b><strong>${r.net_points > 0 ? "+" : ""}${r.net_points}</strong></div><p>${date(r.occurred_at)} · ${t(r.decision === "pending" ? "pendingStatus" : r.decision)}</p><p>${t("evidence")}: ${t(p.evidence_status === "plausible" ? "plausible" : "confirmed")} · ${t("sim")}</p><p>${r.reason === "partner_reward_eligibility_missing" ? t("eligibility") : t("demoPoints")}</p><p>${t("impactUnknown")}</p></article>`;
          })
          .join("")
      : `<p>${t("none")}</p>`
  }`;
  showDialog(html);
}
function showDialog(html) {
  document.querySelector("#account-content").innerHTML = html;
  const dialog = document.querySelector("#account");
  if (!dialog.open) dialog.showModal();
}
const QUIZ_QUESTIONS = {
  de: [
    {
      q: "Ein fettiger Pizzakarton mit Essensresten — wohin damit?",
      options: [
        { text: "In die Papiertonne, Pappe ist immer recycelbar", correct: false },
        { text: "In den Restmüll, wenn er stark verschmutzt ist", correct: true },
        { text: "In die Biotonne, weil Essensreste dran sind", correct: false },
      ],
      explain:
        "Stark fettverschmutzte Pappe stört den Papier-Recyclingkreislauf und gehört in den Restmüll. Saubere Teile lassen sich abreißen und separat entsorgen.",
    },
    {
      q: "Joghurtbecher mit Alu-Deckel — was machst du vor dem Wegwerfen?",
      options: [
        { text: "Becher mit Deckel dran in die gelbe Tonne", correct: false },
        { text: "Deckel abziehen und getrennt entsorgen", correct: true },
        { text: "Beides in den Restmüll", correct: false },
      ],
      explain:
        "Getrennt sortierte Materialien lassen sich hochwertiger recyceln als ein Materialmix im selben Teil.",
    },
    {
      q: "Fahrrad statt Auto für 2 km — wie viel CO₂e sparst du überschlägig?",
      options: [
        { text: "etwa 0,03 kg", correct: false },
        { text: "etwa 0,33 kg", correct: true },
        { text: "etwa 3,3 kg", correct: false },
      ],
      explain:
        "Nach dem UBA-Vergleichswert (≈164 g CO₂e/Pkm für Pkw) ergibt 2 km rechnerisch rund 0,33 kg CO₂e Differenz — eine Schätzung, keine Messung deiner konkreten Fahrt.",
    },
    {
      q: "Warum zählt eine ÖPNV-Fahrt nicht automatisch als 'vermiedene Autofahrt'?",
      options: [
        { text: "Weil Busse ohnehin meistens leer fahren", correct: false },
        { text: "Weil du sonst vielleicht zu Fuß gegangen wärst", correct: true },
        { text: "Weil ÖPNV grundsätzlich nicht nachhaltig ist", correct: false },
      ],
      explain:
        "Ohne bekannte Alternative ist unklar, was du sonst getan hättest. Eine Fahrt anzuerkennen heißt nicht, automatisch eine Autofahrt zu unterstellen.",
    },
    {
      q: "Du gibst einen Mehrwegbecher sofort zurück, ohne ihn benutzt zu haben, und leihst ihn gleich wieder aus. Bringt das der Umwelt etwas?",
      options: [
        { text: "Ja, mehr Ausleihen bedeuten mehr Ersparnis", correct: false },
        { text: "Nein, nur echte Nutzung vermeidet Einwegverpackung", correct: true },
        { text: "Ja, solange der Becher sauber bleibt", correct: false },
      ],
      explain:
        "Ohne tatsächliche Nutzung wird kein Einwegbecher vermieden. Punkte dafür würden nur Zählen belohnen, nicht Wirkung.",
    },
  ],
  en: [
    {
      q: "A greasy pizza box with food residue — where does it go?",
      options: [
        { text: "Paper bin, cardboard is always recyclable", correct: false },
        { text: "General waste, if it's heavily soiled", correct: true },
        { text: "Organic bin, because of the food residue", correct: false },
      ],
      explain:
        "Heavily grease-soiled cardboard disrupts paper recycling and belongs in general waste. Clean parts can be torn off and recycled separately.",
    },
    {
      q: "Yoghurt pot with a foil lid — what do you do before throwing it away?",
      options: [
        { text: "Bin the pot with the lid still on", correct: false },
        { text: "Remove the lid and dispose of it separately", correct: true },
        { text: "Both go in general waste", correct: false },
      ],
      explain:
        "Separated materials recycle at higher quality than a mixed-material item.",
    },
    {
      q: "Cycling instead of driving for 2 km — roughly how much CO₂e do you save?",
      options: [
        { text: "about 0.03 kg", correct: false },
        { text: "about 0.33 kg", correct: true },
        { text: "about 3.3 kg", correct: false },
      ],
      explain:
        "Using the UBA comparison figure (≈164 g CO₂e/pkm for cars), 2 km works out to roughly 0.33 kg CO₂e difference — an estimate, not a measurement of your actual trip.",
    },
    {
      q: "Why doesn't a public transport trip automatically count as an 'avoided car trip'?",
      options: [
        { text: "Because buses mostly run empty anyway", correct: false },
        { text: "Because you might have walked instead", correct: true },
        { text: "Because public transport isn't sustainable", correct: false },
      ],
      explain:
        "Without a known alternative, it's unclear what you'd have done otherwise. Recognising a trip doesn't mean assuming a car trip was avoided.",
    },
    {
      q: "You return a reusable cup immediately without using it, then borrow it again right away. Does that help the environment?",
      options: [
        { text: "Yes, more borrows mean more savings", correct: false },
        { text: "No, only actual use avoids disposable packaging", correct: true },
        { text: "Yes, as long as the cup stays clean", correct: false },
      ],
      explain:
        "Without actual use, no disposable cup is avoided. Rewarding this would only reward counting, not impact.",
    },
  ],
};
function quizQuestion() {
  const qs = QUIZ_QUESTIONS[state.lang];
  const q = qs[state.quizIndex];
  const answered = state.quizAnswered;
  const progress = t("quizProgress")
    .replace("{n}", state.quizIndex + 1)
    .replace("{total}", qs.length);
  return `<p class="quiet">${progress}</p><h2>${esc(q.q)}</h2><div class="quiz-options">${q.options
    .map(
      (o, i) =>
        `<button class="${answered ? (o.correct ? "correct" : i === state.quizPicked ? "incorrect" : "") : ""}" data-quiz-option="${i}" ${answered ? "disabled" : ""}>${esc(o.text)}</button>`,
    )
    .join(
      "",
    )}</div>${answered ? `<p class="quiet">${esc(q.explain)}</p>${button(state.quizIndex + 1 < qs.length ? "quizNext" : "quizSeeResult", "quiz_next")}` : ""}`;
}
function quizSummary() {
  const qs = QUIZ_QUESTIONS[state.lang];
  return `<h2>${t("quizDone")}</h2><p>${t("quizScoreLine").replace("{score}", state.quizScore).replace("{total}", qs.length)}</p>${button("quizClaim", "quiz_finish")}`;
}
function quizRender() {
  return state.quizIndex < QUIZ_QUESTIONS[state.lang].length
    ? quizQuestion()
    : quizSummary();
}
function quiz() {
  state.dialog = "quiz";
  state.quizIndex = 0;
  state.quizScore = 0;
  state.quizAnswered = false;
  state.quizPicked = null;
  showDialog(quizQuestion());
}
function celebrate() {
  const mascot = document.querySelector(".planet img");
  if (!mascot) return;
  mascot.classList.remove("celebrate");
  void mascot.offsetWidth;
  mascot.classList.add("celebrate");
  setTimeout(() => mascot.classList.remove("celebrate"), 1700);
}
let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  document.querySelector("#toast").textContent = message;
  toastTimer = setTimeout(
    () => (document.querySelector("#toast").textContent = ""),
    6000,
  );
}
async function submit(fixture, el) {
  el.disabled = true;
  try {
    const res = await fetch("/api/demo/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixture }),
    });
    if (!res.ok) throw Error();
    const result = await res.json();
    state.account = await (await fetch("/api/account")).json();
    toast(
      result.duplicate
        ? t("duplicate")
        : result.reason === "partner_reward_eligibility_missing"
          ? t("eligibility")
          : `+${result.points_added} ${t("added")}`,
    );
    if (fixture === "bin_bingo" && !result.duplicate) state.bingoPop = true;
    render();
    if (!result.duplicate && result.points_added > 0) celebrate();
    if (fixture === "bin_bingo" || fixture === "bio_check")
      document.querySelector("#account").close();
  } catch {
    toast(t("error"));
  } finally {
    el.disabled = false;
  }
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("button");
  if (!el) return;
  if (el.dataset.tab) {
    state.tab = el.dataset.tab;
    state.view = "list";
    state.mapPoint = null;
    render();
    window.scrollTo(0, 0);
    document.querySelector("h1").setAttribute("tabindex", "-1");
    document.querySelector("h1").focus();
  }
  if (el.dataset.view) {
    state.view = el.dataset.view;
    render();
  }
  if (el.dataset.map) {
    state.mapPoint = places(el.dataset.kind).find(
      (p) => String(p.id) === el.dataset.map,
    );
    state.view = "map";
    if (state.tab === "together") state.tab = "food";
    render();
    document.querySelector(".geo-map")?.scrollIntoView({ block: "center" });
  }
  const a = el.dataset.action;
  if (a === "food") {
    state.tab = "food";
    render();
    window.scrollTo(0, 0);
  }
  if (a === "quiz") quiz();
  if (a === "bin_bingo_open") binBingoDialog();
  if (a === "bin_bingo") {
    if (!document.querySelector("#bingo-confirm")?.checked) {
      document.querySelector("#bingo-error").textContent = t(
        "binBingoNeedConfirm",
      );
      return;
    }
  }
  if (el.dataset.quizOption !== undefined) {
    const i = Number(el.dataset.quizOption);
    const q = QUIZ_QUESTIONS[state.lang][state.quizIndex];
    state.quizPicked = i;
    state.quizAnswered = true;
    if (q.options[i].correct) state.quizScore++;
    showDialog(quizQuestion());
  }
  if (a === "quiz_next") {
    state.quizIndex++;
    state.quizAnswered = false;
    state.quizPicked = null;
    showDialog(quizRender());
  }
  if (a === "quiz_finish") submit("learn", el);
  if (a === "action_open") actionCreateDialog();
  if (a === "action_list") actionsListDialog();
  if (a === "action_join") {
    const id = el.dataset.id;
    if (state.joined.has(id)) state.joined.delete(id);
    else {
      state.joined.clear();
      state.joined.add(id);
    }
    saveActionState();
    render();
    if (state.dialog === "actionList") actionsListDialog();
  }
  if (a === "action_type") {
    state.newType = Number(el.dataset.index);
    actionCreateDialog();
  }
  if (a === "action_create") {
    const type = ACTION_TYPES[state.newType];
    const created = {
      id: `own-${Date.now()}`,
      area: document.querySelector("#new-area").value,
      icon: type.icon,
      title: type.title[state.lang],
      place: document.querySelector("#new-place").value,
      when: `${pickerDays()[state.pickDay]}, ${pickerTimes()[state.pickTime]}`,
      people: 1,
    };
    state.ownActions.unshift(created);
    state.joined.clear();
    state.joined.add(created.id);
    state.area = created.area;
    state.newArea = null;
    saveActionState();
    document.querySelector("#account").close();
    toast(t("actionSaved"));
    render();
  }
  if (a === "bio_open") bioDialog();
  if (a === "bio_reset") {
    document.querySelector("#bio-result").innerHTML = "";
    document.querySelector("#bio-photo").value = "";
    const preview = document.querySelector("#bio-preview");
    preview.hidden = true;
    preview.removeAttribute("src");
    preview.closest(".photo-tile")?.classList.remove("has-photo");
  }
  if (a === "bio_analyse") {
    const preview = document.querySelector("#bio-preview");
    const result = document.querySelector("#bio-result");
    if (preview.hidden || !preview.src) {
      result.innerHTML = `<p class="notice">${t("bioNoPhoto")}</p>`;
      return;
    }
    result.innerHTML = `<p class="quiet">${t("bioAnalyzing")}</p>`;
    setTimeout(() => {
      result.innerHTML = bioResultMarkup(analyseBinPhoto(preview));
    }, 600);
  }
  if (a === "bio_claim") submit("bio_check", el);
  if (["learn", "return", "ride", "pickup", "bin_bingo"].includes(a))
    submit(a, el);
});
document.addEventListener("change", (e) => {
  if (e.target.id === "area") {
    state.area = e.target.value;
    state.mapPoint = null;
    render();
  }
  if (e.target.id === "action-area") {
    state.area = e.target.value;
    render();
  }
  if (e.target.id === "list-area") {
    state.area = e.target.value;
    render();
    actionsListDialog();
  }
  if (e.target.id === "new-area") {
    state.newArea = e.target.value;
    actionCreateDialog();
  }
  if (e.target.type === "file" && e.target.dataset.preview) {
    const file = e.target.files[0];
    const img = document.querySelector("#" + e.target.dataset.preview);
    if (file && img) {
      img.src = URL.createObjectURL(file);
      img.hidden = false;
      e.target.closest(".photo-tile")?.classList.add("has-photo");
    }
  }
});
document.querySelector("#profile").onclick = () => account();
document.querySelector("#language").onclick = () => {
  state.lang = state.lang === "de" ? "en" : "de";
  localStorage.setItem("mainwandel-language", state.lang);
  render();
  if (document.querySelector("dialog").open) {
    if (state.dialog === "quiz") showDialog(quizRender());
    else if (state.dialog === "bin_bingo") binBingoDialog();
    else if (state.dialog === "bio") bioDialog();
    else if (state.dialog === "actions") actionCreateDialog();
    else if (state.dialog === "actionList") actionsListDialog();
    else account();
  }
};
document
  .querySelector("#account")
  .addEventListener("close", () => (state.dialog = null));
loadActionState();
render();
Promise.all([
  fetch("/api/account").then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  }),
  fetch("/api/catalog").then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  }),
])
  .then(([account, catalog]) => {
    state.account = account;
    state.catalog = catalog;
    render();
  })
  .catch(() => toast(t("error")));
