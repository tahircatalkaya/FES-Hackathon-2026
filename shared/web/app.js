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
    mission: "Eine kleine Entscheidung",
    missionText:
      "Du gehst einkaufen. Wie vermeidest du eine zusätzliche Einwegtasche?",
    learn: "Lernmission öffnen",
    week: "Deine Wochenroutine",
    weekText:
      "Ein sinnvoller Schritt genügt für den Anfang. Auch Lernen zählt. Pausen sind in Ordnung.",
    weekFoot:
      "Diese lokale Demo zeigt deinen Fortschritt, keine echte Stadtstatistik.",
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
    quizTitle: "Was nimmst du zum Einkauf mit?",
    quizGood: "Eine Tasche, die ich schon habe",
    quizBad: "Für Punkte jedes Mal eine neue Tasche",
    quizReason:
      "Vorhandenes weiterzuverwenden vermeidet eine zusätzliche Tasche. Lernpunkte sind Anerkennung und keine gemessene CO₂-Einsparung.",
    tryAgain:
      "Versuche es noch einmal. Punkte sollen keinen zusätzlichen Verbrauch fördern.",
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
    communityText:
      "Chamis kleine Welt wächst mit deinem anerkannten Fortschritt. Sie steht als Spielsymbol für Dranbleiben, nicht für reale Aufforstung.",
    social: "Freunde, Top 100 und Stadtteilvergleich",
    socialText:
      "Für den Ausbau vorgesehen: freiwillige Teilnahme, gegenseitige Zustimmung und Schutz kleiner Gruppen. In dieser Demo gibt es keine erfundenen Mitspielenden.",
    reward: "Belohnungen im Ausbau",
    rewardText:
      "Deutschlandticket und Kino sind gewünschte Beispiele. Finanzierung, Verfügbarkeit und Bedingungen sind offen; es besteht kein Anspruch.",
    noPlaces: "Keine passenden Orte in diesem Gebiet.",
    cached: "API-Snapshot · kein Livebestand",
    refill: "Nicht erneut belohnt",
    rule: "Regel demo-v1",
    homeTitle: "Dein Alltag kann etwas bewegen.",
    homeIntro: "Ein Ort, vier Wege: Gemeinsam, Essen retten, Mehrweg, Mobilität.",
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
    mission: "A small decision",
    missionText:
      "You are going shopping. How can you avoid another disposable bag?",
    learn: "Open learning mission",
    week: "Your weekly routine",
    weekText:
      "One useful step is a start. Learning counts too. Taking a break is fine.",
    weekFoot: "This local demo shows your progress, not real city statistics.",
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
    quizTitle: "What will you take shopping?",
    quizGood: "A bag I already have",
    quizBad: "A new bag every time to collect points",
    quizReason:
      "Reusing an existing bag avoids another bag. Learning points recognise progress, not measured CO₂ savings.",
    tryAgain: "Try again. Points should not encourage extra consumption.",
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
    communityText:
      "Chami’s small world grows with recognised progress. It symbolises your routine, not real reforestation.",
    social: "Friends, Top 100 and neighbourhood comparison",
    socialText:
      "Planned: voluntary participation, mutual consent and small-group privacy. This demo contains no invented participants.",
    reward: "Rewards planned",
    rewardText:
      "Deutschlandticket and cinema visits are requested examples. Funding, availability and terms remain open; there is no entitlement.",
    noPlaces: "No matching places in this area.",
    cached: "API snapshot · no live stock",
    refill: "Not rewarded again",
    rule: "Rule demo-v1",
    homeTitle: "Your everyday choices can make a difference.",
    homeIntro: "One place, four paths: Together, Save food, Reuse, Mobility.",
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
  quiz: false,
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
const areaSelect = () =>
  `<label>${t("area")} <select id="area"><option value="centre">Frankfurt · Innenstadt</option><option value="bockenheim">Bockenheim</option><option value="sachsenhausen">Sachsenhausen</option><option value="bornheim">Bornheim</option></select></label>`;
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
function home() {
  return `<div class="eyebrow">MAINWANDEL</div><h1>${t("homeTitle")}</h1><p class="lead">${t("homeIntro")}</p><section class="hero"><div><div class="eyebrow">MAINWANDEL × CHAMI</div><h2>${t("hero")}</h2><p>${t("heroText")}</p>${button("start", "food")}</div><div class="world"><div class="planet"><img src="/chameleon.svg" alt="Chami"></div><small>${t("symbol")}</small></div></section>${stats()}<div class="section-head"><h2>${t("next")}</h2></div><div class="twocol"><section class="card"><span class="tag">${t("together")}</span><h3>${t("hello")}</h3><p>${t("intro")}</p><button class="secondary" data-tab="together">${t("together")}</button></section><section class="card"><span class="tag">${t("mobility")}</span><h3>${t("rideTitle")}</h3><p>${t("rideIntro")}</p><button class="secondary" data-tab="mobility">${t("mobility")}</button></section></div>`;
}
function together() {
  return `<div class="eyebrow">${t("region")}</div><h1>${t("hello")}</h1><p class="lead">${t("intro")}</p><section class="hero"><div><div class="eyebrow">MAINWANDEL × CHAMI</div><h2>${t("hero")}</h2><p>${t("heroText")}</p>${button("start", "food")}</div><div class="world"><div class="planet"><img src="/chameleon.svg" alt="Chami"></div><small>${t("symbol")}</small></div></section>${stats()}<div class="section-head"><h2>${t("next")}</h2></div><div class="twocol"><section class="card tint"><span class="tag">FES · ${t("sim")}</span><h3>${t("mission")}</h3><p>${t("missionText")}</p>${button("learn", "quiz")}</section><section class="card"><span class="tag">${t("community")}</span><h3>${t("week")}</h3><p>${t("weekText")}</p><div class="progress"><span style="width:${Math.min(100, (state.account.earned / 30) * 100)}%"></span></div><p class="quiet">${fmt(state.account.earned)} / 30 ${t("demoPoints")}</p></section></div><p class="quiet">${t("weekFoot")}</p><div class="section-head row"><h2>${t("near")}</h2>${button("all", "food", "secondary")}</div>${placeList("food", 3)}${source()}<details><summary>${t("social")}</summary><p>${t("socialText")}</p></details><details><summary>${t("reward")}</summary><p>${t("rewardText")}</p></details><details><summary>${t("symbol")}</summary><p>${t("communityText")}</p></details>`;
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
  const select = document.querySelector("#area");
  if (select) select.value = state.area;
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
      "vytal.return": "returnAction",
      "transdev.journey": "rideAction",
      "foodsharing.basket_pickup": "pickupAction",
    }[a] ?? a,
  );
function account() {
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
function quiz() {
  state.quiz = true;
  showDialog(
    `<span class="eyebrow">FES · ${t("sim")}</span><h2>${t("quizTitle")}</h2><div class="quiz-options">${button("quizGood", "learn")}${button("quizBad", "wrong", "secondary")}</div><p id="quiz-result" class="quiet"></p>`,
  );
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
    render();
    if (fixture === "learn") {
      document.querySelector("#quiz-result").textContent = t("quizReason");
    }
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
  if (a === "wrong")
    document.querySelector("#quiz-result").textContent = t("tryAgain");
  if (["learn", "return", "ride", "pickup"].includes(a)) submit(a, el);
});
document.addEventListener("change", (e) => {
  if (e.target.id === "area") {
    state.area = e.target.value;
    state.mapPoint = null;
    render();
  }
});
document.querySelector("#profile").onclick = () => {
  state.quiz = false;
  account();
};
document.querySelector("#language").onclick = () => {
  state.lang = state.lang === "de" ? "en" : "de";
  localStorage.setItem("mainwandel-language", state.lang);
  render();
  if (document.querySelector("dialog").open) {
    state.quiz ? quiz() : account();
  }
};
document
  .querySelector("#account")
  .addEventListener("close", () => (state.quiz = false));
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
