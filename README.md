# Deutsch Lernen — Avatar Methode 🇩🇪

Aplikacja do nauki niemieckiego przez oglądanie Avatara.  
Hostuj na GitHub Pages lub otwórz `index.html` w przeglądarce.

## Struktura projektu

```
deutsch-lernen/
├── index.html          ← główna strona
├── css/
│   └── style.css       ← wszystkie style
├── js/
│   └── app.js          ← logika aplikacji
├── data/
│   ├── decks.js        ← TUTAJ DODAJESZ NOWE ODCINKI
│   └── plan.js         ← plan nauki A2→B2
└── README.md
```

## Jak dodać nowy odcinek

Otwórz `data/decks.js` i dodaj nowy blok na końcu tablicy `DECKS`:

```javascript
{
  id: "avatar-2",
  title: "Avatar Odc. 2",
  subtitle: "Tytuł odcinka",
  icon: "🌊",
  color: "#42A5F5",
  words: [
    ["niemiecki", "polski"],
    ["das Haus", "dom"],
    // ... więcej słówek
  ]
},
```

To wszystko! Nowy zestaw pojawi się automatycznie na ekranie głównym.

## Jak wrzucić na GitHub Pages

1. Utwórz nowe repozytorium na GitHub
2. Wrzuć wszystkie pliki (lub `git push`)
3. Wejdź w Settings → Pages → Branch: main → Save
4. Po minucie strona będzie dostępna pod `https://twojnick.github.io/nazwa-repo/`

## Funkcje

- **4 tryby nauki**: fiszki, quiz, pisanie, dopasowywanie
- **Inteligentna nauka**: zaczyna od 5 słówek, dodaje nowe
- **Spaced repetition**: błędne wracają później, opanowane są sprawdzane ponownie
- **Zapis postępu**: w localStorage, przetrwa zamknięcie przeglądarki
- **Plan nauki A2→B2**: rozpisany na 24 tygodnie
- **Offline**: działa bez internetu (poza czcionkami)
