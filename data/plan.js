var STUDY_PLAN = {
  title: "Plan Nauki A2 → B2",
  duration: "24 tygodnie",
  phases: [
    {
      id: 1, icon: "🧱", title: "Fundament", weeks: "Tyg. 1–4", hours: "1–1.5h/dzień",
      color: "#2D6A4F",
      tip: "Nie przejmuj się, że nie rozumiesz wszystkiego. Celem jest osłuchanie się z językiem.",
      sections: [
        { title: "Cele", items: ["Utrwalenie gramatyki A2 (Perfekt, Modalverben, Wechselpräpositionen)", "Słownictwo ~2500 słów", "Zrozumienie prostych dialogów (Avatar odc. 1–5)"] },
        { title: "Avatar", items: ["Odcinki 1–5 z napisami DE", "Wyciąganie słówek z transkryptu", "Codziennie 15 min fiszek"] },
        { title: "Gramatyka", items: ["Perfekt — regularne i nieregularne", "Modalverben: können, müssen, sollen, wollen, dürfen, mögen", "Wechselpräpositionen: in, an, auf, unter, über...", "Nebensätze z weil, dass, wenn"] },
      ]
    },
    {
      id: 2, icon: "🌱", title: "Rozbudowa", weeks: "Tyg. 5–10", hours: "1.5–2h/dzień",
      color: "#1B4332",
      tip: "Zacznij mówić! Opisuj co widzisz w odcinku po niemiecku. Błędy są OK.",
      sections: [
        { title: "Cele", items: ["Gramatyka B1: Konjunktiv II, Passiv, Relativsätze", "Słownictwo ~3500 słów", "Rozumienie 60–70% Avatara bez pauz"] },
        { title: "Avatar", items: ["Odcinki 6–15 z napisami DE", "Notuj nowe zwroty i idiomy", "Streszczaj odcinki po niemiecku (pisemnie)"] },
        { title: "Gramatyka", items: ["Konjunktiv II: würde, wäre, hätte, könnte", "Passiv: Das Dorf wird angegriffen", "Relativsätze: Der Junge, der...", "Konnektoren: obwohl, trotzdem, deshalb"] },
      ]
    },
    {
      id: 3, icon: "⚡", title: "Intensyfikacja", weeks: "Tyg. 11–18", hours: "2h/dzień",
      color: "#081C15",
      tip: "Najtrudniejszy etap — ale też najbardziej satysfakcjonujący!",
      sections: [
        { title: "Cele", items: ["Gramatyka B2: Konjunktiv I, Partizipialattribute", "Słownictwo ~5000 słów", "Rozumienie 80–90% BEZ napisów"] },
        { title: "Avatar", items: ["Odc. 16–40 — najpierw BEZ napisów, potem z", "Powtórz wcześniejsze odcinki bez napisów", "Pisz recenzje po niemiecku"] },
        { title: "Gramatyka", items: ["Konjunktiv I: Er sagte, er sei... (mowa zależna)", "Partizip I & II: der fliegende Bison", "Doppelkonnektoren: je...desto, sowohl...als auch"] },
      ]
    },
    {
      id: 4, icon: "💎", title: "Szlifowanie", weeks: "Tyg. 19–24", hours: "1.5–2h/dzień",
      color: "#3C096C",
      tip: "Język powinien już płynąć. Skup się na naturalności i pewności siebie.",
      sections: [
        { title: "Cele", items: ["Pewne B2 — rozumienie, mówienie, pisanie", "Słownictwo 5000+", "Gotowość do egzaminu B2 (Goethe / telc)"] },
        { title: "Avatar", items: ["Cały serial jeszcze raz BEZ napisów", "Drugi serial (Dark, Bibi Blocksberg...)", "Podcasty: Easy German, Slow German"] },
        { title: "Gramatyka", items: ["Powtórka i utrwalenie całości", "Styl pisemny: Erörterung, Stellungnahme", "Redewendungen: auf keinen Fall, es liegt daran..."] },
      ]
    },
  ],
  daily: [
    { time: "15 min", task: "Powtórka fiszek", icon: "🔄" },
    { time: "20 min", task: "Gramatyka — jedna reguła + ćwiczenia", icon: "📖" },
    { time: "25 min", task: "Avatar — oglądanie + słówka", icon: "🎬" },
    { time: "15 min", task: "Pisanie / mówienie", icon: "✍️" },
    { time: "15 min", task: "Słuchanie (podcast / YT)", icon: "🎧" },
  ]
};
