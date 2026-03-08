# PDF → JSON Prompt Template
# Verwendung: Seitenzahlen anpassen, Rest bleibt gleich
Lies das PDF paarweise: Seite 3 = Aufgabe, Seite 4 = Lösung.
Extrahiere alle Daten und gib ein JSON-Array mit genau 2 Objekten zurück.
## Parsing-Regeln
**Font-Erkennung:**
- LucidaMathExtension + \ue070 → \sqrt{...}
- LucidaMathExtension + \ue072 → \frac{oben}{unten} (y-Koordinate bestimmt oben/unten)
- LucidaSansUnicode → ℕ→\mathbb{N}, ℤ→\mathbb{Z}, ℚ→\mathbb{Q}, ℝ→\mathbb{R}, ℂ→\mathbb{C}
- Kursiv (LtIt) bei einzelnen Buchstaben → Variable → $a$
- Kleines size + höheres y → Superscript ^{...}
- Kleines size + niedrigeres y → Subscript _{...}
- ∙ mit y-Wert über Basistext → \overline{...}
- \u2009 + \ → \setminus
**Unicode-Mapping:**
∈→\in, ∉→\notin, ⊂→\subset, ⊆→\subseteq, ∙→\cdot, ·→\cdot, –→-
Alle mathematischen Ausdrücke als $...$. Plain text ohne Delimiter.
## JSON-Struktur
[siehe aufgabe_01_v2.json als Referenz]
Setze "needs_review": true falls eine Formel unsicher ist.

