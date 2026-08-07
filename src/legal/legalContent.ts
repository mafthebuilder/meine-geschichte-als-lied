export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  sections: LegalSection[];
}

export const legalDocuments: Record<string, LegalDocument> = {
  "agb": {
    "title": "Allgemeine Geschäftsbedingungen (AGB)",
    "updated": "Letzte Aktualisierung: 1. August 2026",
    "sections": [
      {
        "heading": "1. Anbieter",
        "blocks": [
          {
            "type": "p",
            "text": "Diese Allgemeinen Geschäftsbedingungen werden angeboten von:"
          },
          {
            "type": "p",
            "text": "MON HISTOIRE CHANTEE LLC, mit Sitz in 1704 Llano Street, Santa Fé, Betreiberin der Marke Meine Geschichte als Lied."
          },
          {
            "type": "p",
            "text": "Kontakt: kontakt@meinegeschichtealslied.com"
          }
        ]
      },
      {
        "heading": "2. Gegenstand",
        "blocks": [
          {
            "type": "p",
            "text": "Diese Bedingungen regeln den Online-Verkauf personalisierter digitaler Lieder, die auf Grundlage der vom Kunden übermittelten Angaben erstellt werden."
          },
          {
            "type": "p",
            "text": "Das Lied wird als digitale Datei, in der Regel im MP3-Format, an die bei der Bestellung angegebene E-Mail-Adresse geliefert."
          }
        ]
      },
      {
        "heading": "3. Leistungsbeschreibung",
        "blocks": [
          {
            "type": "p",
            "text": "Der Kunde füllt einen Fragebogen aus und beschreibt dabei insbesondere die beschenkte Person, die Beziehung, gemeinsame Erinnerungen, Eigenschaften, die persönliche Botschaft, den gewünschten Musikstil und die gewünschte Stimmart."
          },
          {
            "type": "p",
            "text": "Die Erstellung kann mithilfe digitaler Werkzeuge und künstlicher Intelligenz erfolgen, unter Leitung, Auswahl und Kontrolle von Meine Geschichte als Lied."
          },
          {
            "type": "p",
            "text": "Musikalische Ausgestaltung, Stimme, Interpretation und künstlerische Entscheidungen enthalten subjektive Elemente. Vorschauen, Beispiele und Ausschnitte auf der Website veranschaulichen die angebotene Leistung, ohne eine identische Wiedergabe zu garantieren."
          }
        ]
      },
      {
        "heading": "4. Angebote",
        "blocks": [
          {
            "type": "p",
            "text": "Standard:"
          },
          {
            "type": "ul",
            "items": [
              "ein personalisiertes Lied;",
              "eine Überarbeitung im Rahmen der ursprünglichen Angaben;",
              "Lieferung innerhalb der bei der Bestellung angezeigten Frist."
            ]
          },
          {
            "type": "p",
            "text": "Premium:"
          },
          {
            "type": "ul",
            "items": [
              "ein personalisiertes Lied;",
              "unbegrenzte Überarbeitungen, soweit sie dazu dienen, die Erstellung mit den ursprünglichen Angaben in Einklang zu bringen;",
              "Lieferung innerhalb der bei der Bestellung angezeigten Frist."
            ]
          },
          {
            "type": "p",
            "text": "Eine Anfrage, die Musikstil, beschenkte Person, Geschichte, Botschaft oder ursprünglich übermittelte Angaben wesentlich verändert, kann als neue Bestellung behandelt werden."
          },
          {
            "type": "p",
            "text": "Die Option „24h-Lieferung“ ermöglicht eine priorisierte Bearbeitung nach den auf der Website angegebenen Bedingungen."
          }
        ]
      },
      {
        "heading": "5. Pflichten des Kunden",
        "blocks": [
          {
            "type": "p",
            "text": "Der Kunde verpflichtet sich, richtige, ausreichend vollständige und rechtmäßige Angaben zu machen."
          },
          {
            "type": "p",
            "text": "Der Kunde gewährleistet, dass er berechtigt ist, Vornamen, Erinnerungen, Nachrichten, Fotos, Aufnahmen oder sonstige Informationen über Dritte zu übermitteln, und dass deren Verwendung für die gewünschte Erstellung keine Rechte Dritter verletzt."
          },
          {
            "type": "p",
            "text": "Der Kunde darf keine Inhalte übermitteln, die:"
          },
          {
            "type": "ul",
            "items": [
              "rechtswidrig, hasserfüllt, verleumderisch, bedrohlich oder diskriminierend sind;",
              "Rechte Dritter verletzen;",
              "die Nachahmung eines geschützten Künstlers, Werkes oder einer geschützten Stimme verlangen;",
              "ohne Notwendigkeit besonders sensible Daten enthalten."
            ]
          },
          {
            "type": "p",
            "text": "Meine Geschichte als Lied kann eine offensichtlich rechtswidrige oder nicht ausführbare Bestellung ablehnen oder abbrechen. In diesem Fall werden Beträge für den nicht ausgeführten Teil der Leistung zurückerstattet."
          }
        ]
      },
      {
        "heading": "6. Preise",
        "blocks": [
          {
            "type": "p",
            "text": "Es gelten die zum Zeitpunkt der Bestellung angezeigten Preise. Sie werden in Euro angegeben, einschließlich Umsatzsteuer, soweit diese anfällt."
          },
          {
            "type": "p",
            "text": "Der Gesamtpreis wird vor der endgültigen Zahlungsbestätigung angezeigt. Zusätzliche Kosten werden nicht ohne vorherige Information des Kunden erhoben."
          }
        ]
      },
      {
        "heading": "7. Bestellung und Zahlung",
        "blocks": [
          {
            "type": "p",
            "text": "Die Bestellung wird verbindlich nach:"
          },
          {
            "type": "ul",
            "items": [
              "Bestätigung der übermittelten Angaben;",
              "Annahme dieser Bedingungen;",
              "erfolgreicher Bestätigung der Zahlung."
            ]
          },
          {
            "type": "p",
            "text": "Die Zahlung wird über Stripe und die von Stripe unterstützten Zahlungsdienstleister verarbeitet. Meine Geschichte als Lied speichert keine vollständigen Kreditkartendaten."
          },
          {
            "type": "p",
            "text": "Eine Bestellbestätigung wird per E-Mail versendet."
          }
        ]
      },
      {
        "heading": "8. Beginn der Ausführung und Personalisierung",
        "blocks": [
          {
            "type": "p",
            "text": "Jedes Lied wird speziell auf Grundlage der Angaben des Kunden erstellt."
          },
          {
            "type": "p",
            "text": "Wenn der Kunde verlangt, dass die Erstellung vor Ablauf einer gesetzlichen Widerrufsfrist beginnt, erklärt er ausdrücklich sein Einverständnis mit dem sofortigen Beginn der Leistung."
          },
          {
            "type": "p",
            "text": "Bei vollständig erbrachten Dienstleistungen erkennt der Kunde an, dass sein Widerrufsrecht erlischt, sobald die Leistung vollständig erbracht wurde, soweit die gesetzlichen Voraussetzungen erfüllt sind."
          },
          {
            "type": "p",
            "text": "Bei der Bereitstellung der personalisierten digitalen Datei ohne körperlichen Datenträger stimmt der Kunde der sofortigen Bereitstellung zu und erkennt die gesetzlich vorgesehenen Folgen für sein Widerrufsrecht an."
          }
        ]
      },
      {
        "heading": "9. Lieferung",
        "blocks": [
          {
            "type": "p",
            "text": "Das Lied wird elektronisch geliefert. Die Lieferfrist wird bei der Bestellung angegeben und beginnt, sobald die Zahlung eingegangen ist und ausreichend vollständige Angaben für die Erstellung vorliegen."
          },
          {
            "type": "p",
            "text": "Der Kunde muss die Richtigkeit seiner E-Mail-Adresse überprüfen und gegebenenfalls auch den Spam-Ordner kontrollieren."
          }
        ]
      },
      {
        "heading": "10. Überarbeitungen",
        "blocks": [
          {
            "type": "p",
            "text": "Eine Überarbeitung ist eine angemessene Änderungsanfrage, die sich auf die ursprünglichen Angaben bezieht, zum Beispiel:"
          },
          {
            "type": "ul",
            "items": [
              "Korrektur eines sachlichen Fehlers;",
              "Anpassung der Aussprache eines Vornamens;",
              "begrenzte Änderung einer Passage;",
              "angemessene Anpassung der Interpretation oder der Gesamtbalance."
            ]
          },
          {
            "type": "p",
            "text": "Ein vollständiger Wechsel der künstlerischen Richtung, der beschenkten Person, der Geschichte oder des Musikstils gilt nicht als einfache Überarbeitung."
          },
          {
            "type": "p",
            "text": "Anfragen sind unter Angabe der Bestellnummer und der gewünschten Änderungen an kontakt@meinegeschichtealslied.com zu senden."
          }
        ]
      },
      {
        "heading": "11. Widerrufsrecht",
        "blocks": [
          {
            "type": "p",
            "text": "Die angebotenen Lieder werden nach Kundenspezifikation angefertigt und eindeutig personalisiert."
          },
          {
            "type": "p",
            "text": "Die Einzelheiten zum Widerrufsrecht, zu gesetzlichen Ausnahmen und zu Erstattungsanfragen sind in der Widerrufs- und Erstattungsrichtlinie geregelt, die Bestandteil dieser Bedingungen ist."
          },
          {
            "type": "p",
            "text": "Ein ausgeschlossenes oder erloschenes Widerrufsrecht berührt nicht die gesetzlichen Rechte des Kunden bei mangelnder Vertragsmäßigkeit, einem Fehler von Meine Geschichte als Lied oder der Nichterfüllung der Bestellung."
          }
        ]
      },
      {
        "heading": "12. Gesetzliche Gewährleistung",
        "blocks": [
          {
            "type": "p",
            "text": "Meine Geschichte als Lied stellt digitale Inhalte bereit, die der bestätigten Bestellung entsprechen."
          },
          {
            "type": "p",
            "text": "Bei einer Vertragswidrigkeit kann der Kunde eine kostenfreie Herstellung des vertragsgemäßen Zustands verlangen. Ist dies unmöglich, unverhältnismäßig, wird sie verweigert oder erfolgt sie nicht innerhalb einer angemessenen Frist, stehen dem Kunden die gesetzlich vorgesehenen Rechtsbehelfe zu, insbesondere Preisminderung oder Vertragsbeendigung, sofern die gesetzlichen Voraussetzungen erfüllt sind."
          },
          {
            "type": "p",
            "text": "Reklamationen sind mit Bestellnummer und einer genauen Beschreibung des Problems an kontakt@meinegeschichtealslied.com zu richten."
          }
        ]
      },
      {
        "heading": "13. Urheberrecht und Nutzungsrecht",
        "blocks": [
          {
            "type": "p",
            "text": "Nach vollständiger Zahlung erhält der Kunde ein persönliches, nicht ausschließliches, weltweites und zeitlich unbeschränktes Nutzungsrecht, um:"
          },
          {
            "type": "ul",
            "items": [
              "das Lied herunterzuladen und aufzubewahren;",
              "es privat anzuhören;",
              "es der beschenkten Person zu schenken;",
              "es auf persönlichen, nicht kommerziellen Accounts zu teilen."
            ]
          },
          {
            "type": "p",
            "text": "Jede kommerzielle Nutzung, Weiterveräußerung, Monetarisierung, werbliche Synchronisation, Übertragung an einen professionellen Dritten oder Nutzung im Namen eines Unternehmens bedarf der vorherigen schriftlichen Zustimmung."
          },
          {
            "type": "p",
            "text": "Da bei der Erstellung Werkzeuge der künstlichen Intelligenz eingesetzt werden können, garantiert Meine Geschichte als Lied weder die absolute Exklusivität jedes musikalischen, stimmlichen oder stilistischen Elements noch das vollständige Ausbleiben zufälliger Ähnlichkeiten mit anderen Werken."
          }
        ]
      },
      {
        "heading": "14. Haftung",
        "blocks": [
          {
            "type": "p",
            "text": "Meine Geschichte als Lied haftet für die ordnungsgemäße Erfüllung seiner gesetzlichen und vertraglichen Pflichten."
          },
          {
            "type": "p",
            "text": "Eine Haftung ist insbesondere ausgeschlossen, soweit ein Schaden oder eine Verzögerung zurückzuführen ist auf:"
          },
          {
            "type": "ul",
            "items": [
              "falsche oder unvollständige Angaben des Kunden;",
              "eine Nutzung des Liedes entgegen diesen Bedingungen;",
              "eine Verzögerung infolge notwendiger Rückfragen, einer wesentlichen Änderungsanfrage oder eines vernünftigerweise nicht vorhersehbaren externen Ereignisses;",
              "eine Inkompatibilität mit einem veralteten Gerät oder einer veralteten Software, sofern die gelieferte Datei in einem gängigen Format lesbar ist."
            ]
          },
          {
            "type": "p",
            "text": "Keine Bestimmung dieser Bedingungen schränkt zwingende Verbraucherrechte ein."
          }
        ]
      },
      {
        "heading": "15. Personenbezogene Daten",
        "blocks": [
          {
            "type": "p",
            "text": "Personenbezogene Daten werden gemäß der Datenschutzerklärung verarbeitet."
          },
          {
            "type": "p",
            "text": "Angaben aus dem Fragebogen können, soweit erforderlich, an technische Dienstleister übermittelt werden, die an Erstellung, Hosting, Zahlung, Lieferung oder Kundenservice beteiligt sind."
          }
        ]
      },
      {
        "heading": "16. Verbraucherbeschwerden",
        "blocks": [
          {
            "type": "p",
            "text": "Bei einer Beschwerde soll der Kunde zunächst Kontakt aufnehmen unter:"
          },
          {
            "type": "p",
            "text": "kontakt@meinegeschichtealslied.com"
          }
        ]
      },
      {
        "heading": "17. Anwendbares Recht und Streitigkeiten",
        "blocks": [
          {
            "type": "p",
            "text": "Diese Bedingungen unterliegen französischem Recht, vorbehaltlich zwingender, für den Verbraucher günstigerer Vorschriften, die in seinem Wohnsitzstaat anwendbar sind."
          },
          {
            "type": "p",
            "text": "Kommt keine einvernehmliche Lösung zustande, sind die nach den anwendbaren gesetzlichen Vorschriften zuständigen Gerichte zuständig."
          }
        ]
      },
      {
        "heading": "18. Änderungen der Bedingungen",
        "blocks": [
          {
            "type": "p",
            "text": "Es gelten die Bedingungen, die der Kunde zum Zeitpunkt der Bestellung akzeptiert hat. Meine Geschichte als Lied kann diese Bedingungen für zukünftige Bestellungen ändern."
          }
        ]
      }
    ]
  },
  "impressum": {
    "title": "Impressum",
    "updated": "Letzte Aktualisierung: 1. August 2026",
    "sections": [
      {
        "heading": "1. Anbieter der Website",
        "blocks": [
          {
            "type": "p",
            "text": "Die Website meinegeschichtealslied.com wird betrieben von:"
          },
          {
            "type": "p",
            "text": "Unternehmensname: Mon Histoire Chantee LLC"
          },
          {
            "type": "p",
            "text": "Markenname: Meine Geschichte als Lied"
          },
          {
            "type": "p",
            "text": "Sitz: 1705 Llano street, Santa Fé"
          },
          {
            "type": "p",
            "text": "E-Mail: kontakt@meinegeschichtealslied.com"
          },
          {
            "type": "p",
            "text": "Verantwortlich für den Inhalt: Mon Histoire Chantee LLC"
          }
        ]
      },
      {
        "heading": "2. Hosting und technische Infrastruktur",
        "blocks": [
          {
            "type": "p",
            "text": "Die Website und ihre technischen Ressourcen werden insbesondere gehostet durch:"
          },
          {
            "type": "p",
            "text": "Cloudflare, Inc.\n101 Townsend Street\nSan Francisco, CA 94107\nUSA"
          },
          {
            "type": "p",
            "text": "Die Zahlungsabwicklung erfolgt über Stripe und die von Stripe unterstützten Zahlungsdienstleister."
          }
        ]
      },
      {
        "heading": "3. Geistiges Eigentum",
        "blocks": [
          {
            "type": "p",
            "text": "Struktur und Gestaltung der Website, Texte, Grafiken, Logos, Audio- und Videoelemente sowie sämtliche sonstigen Inhalte sind durch die jeweils anwendbaren Rechte des geistigen Eigentums geschützt."
          },
          {
            "type": "p",
            "text": "Jede nicht genehmigte Vervielfältigung, Darstellung, Bearbeitung, Verbreitung oder sonstige Nutzung der Website oder einzelner Teile davon ist ohne vorherige schriftliche Zustimmung des Betreibers untersagt."
          }
        ]
      },
      {
        "heading": "4. Kontakt",
        "blocks": [
          {
            "type": "p",
            "text": "Bei Fragen zur Website oder zu einer Bestellung:"
          },
          {
            "type": "p",
            "text": "kontakt@meinegeschichtealslied.com"
          }
        ]
      }
    ]
  },
  "widerruf": {
    "title": "Widerrufs- und Erstattungsrichtlinie",
    "updated": "Letzte Aktualisierung: 1. August 2026",
    "sections": [
      {
        "heading": "1. Personalisierter Charakter der Bestellung",
        "blocks": [
          {
            "type": "p",
            "text": "Jedes Lied von Meine Geschichte als Lied wird individuell auf Grundlage der vom Kunden übermittelten Angaben, Erinnerungen, Vornamen, Botschaften, musikalischen Wünsche und sonstigen Vorgaben erstellt."
          },
          {
            "type": "p",
            "text": "Es handelt sich nicht um ein Standardprodukt, das an eine andere Person weiterverkauft werden kann."
          }
        ]
      },
      {
        "heading": "2. Widerrufsrecht",
        "blocks": [
          {
            "type": "p",
            "text": "Für Fernabsatzverträge gilt grundsätzlich eine Widerrufsfrist von vierzehn Tagen."
          },
          {
            "type": "p",
            "text": "Das französische Verbraucherschutzrecht sieht in Artikel L.221-28 des Code de la consommation jedoch insbesondere Ausnahmen vom Widerrufsrecht vor für:"
          },
          {
            "type": "ul",
            "items": [
              "Waren, die nach Kundenspezifikation angefertigt oder eindeutig personalisiert sind;",
              "Dienstleistungen, die vor Ablauf der Widerrufsfrist vollständig erbracht wurden, wenn die Ausführung mit vorheriger ausdrücklicher Zustimmung des Verbrauchers begonnen hat und dieser den Verlust seines Widerrufsrechts nach vollständiger Erbringung anerkannt hat;",
              "digitale Inhalte, die nicht auf einem körperlichen Datenträger geliefert werden, wenn die Bereitstellung vor Ablauf der Widerrufsfrist nach ausdrücklicher Zustimmung des Verbrauchers und dessen Bestätigung der Folgen für das Widerrufsrecht begonnen hat."
            ]
          },
          {
            "type": "p",
            "text": "Aufgrund der eindeutigen Personalisierung des Liedes kann eine Bestellung, deren Erstellung bereits begonnen hat, nicht allein wegen eines Meinungswechsels storniert oder erstattet werden, soweit die gesetzlichen Voraussetzungen hierfür erfüllt sind."
          },
          {
            "type": "p",
            "text": "Wenn eine Dienstleistung oder ein digitaler Inhalt vor Ablauf der vierzehntägigen Frist bereitgestellt werden soll, erfolgt die sofortige Produktion auf Grundlage der ausdrücklichen Zustimmung des Kunden und seiner Bestätigung der damit verbundenen Folgen für das Widerrufsrecht."
          }
        ]
      },
      {
        "heading": "3. Stornierung vor Beginn der Erstellung",
        "blocks": [
          {
            "type": "p",
            "text": "Eine Stornierungsanfrage, die vor dem tatsächlichen Beginn der Erstellung eingeht, kann angenommen und vollständig erstattet werden."
          },
          {
            "type": "p",
            "text": "Die Anfrage muss unverzüglich mit Angabe der Bestellnummer an kontakt@meinegeschichtealslied.com gesendet werden."
          },
          {
            "type": "p",
            "text": "Das Absenden einer Anfrage garantiert nicht, dass die Produktion noch nicht begonnen hat, insbesondere bei Bestellungen mit 24h-Lieferung."
          }
        ]
      },
      {
        "heading": "4. Nicht vertragsgemäße Bestellung oder Fehler",
        "blocks": [
          {
            "type": "p",
            "text": "Ein ausgeschlossenes oder erloschenes Widerrufsrecht lässt die gesetzlichen Gewährleistungsrechte unberührt."
          },
          {
            "type": "p",
            "text": "Der Kunde soll Meine Geschichte als Lied kontaktieren, wenn:"
          },
          {
            "type": "ul",
            "items": [
              "die Datei nicht der bestätigten Bestellung entspricht;",
              "eine im Briefing korrekt angegebene Information offensichtlich falsch wiedergegeben wurde;",
              "die Datei nicht lesbar oder technisch fehlerhaft ist;",
              "die Bestellung nicht geliefert wurde;",
              "eine falsche Datei versendet wurde."
            ]
          },
          {
            "type": "p",
            "text": "Meine Geschichte als Lied bietet vorrangig eine Korrektur, eine neue Version oder eine kostenfreie Herstellung des vertragsgemäßen Zustands an."
          },
          {
            "type": "p",
            "text": "Ist eine Herstellung des vertragsgemäßen Zustands unmöglich oder kann sie nicht unter den gesetzlich vorgesehenen Bedingungen erfolgen, kann eine Preisminderung oder Erstattung gewährt werden."
          }
        ]
      },
      {
        "heading": "5. Künstlerische Präferenzen",
        "blocks": [
          {
            "type": "p",
            "text": "Eine subjektive Präferenz hinsichtlich Stimmklang, Interpretation, Melodie oder Stil stellt nicht automatisch einen Mangel dar, wenn die Erstellung den bestätigten Angaben entspricht."
          },
          {
            "type": "p",
            "text": "Die im gewählten Angebot enthaltenen Überarbeitungen ermöglichen jedoch angemessene Anpassungen im Rahmen der ursprünglichen Angaben."
          }
        ]
      },
      {
        "heading": "6. Frist und Angaben für Anfragen",
        "blocks": [
          {
            "type": "p",
            "text": "Jede Anfrage ist an kontakt@meinegeschichtealslied.com zu senden und muss folgende Angaben enthalten:"
          },
          {
            "type": "ul",
            "items": [
              "Bestellnummer;",
              "die beim Bezahlen verwendete E-Mail-Adresse;",
              "Beschreibung des Problems;",
              "gewünschte Korrektur oder Lösung."
            ]
          },
          {
            "type": "p",
            "text": "Wir antworten so schnell wie möglich."
          }
        ]
      },
      {
        "heading": "7. Art der Erstattung",
        "blocks": [
          {
            "type": "p",
            "text": "Ist eine Erstattung geschuldet, erfolgt sie auf das ursprünglich verwendete Zahlungsmittel, sofern nicht ausdrücklich etwas anderes vereinbart wurde."
          },
          {
            "type": "p",
            "text": "Wie schnell die Erstattung anschließend sichtbar wird, hängt von der Bank oder dem Zahlungsdienstleister ab."
          }
        ]
      },
      {
        "heading": "8. Keine missbräuchlichen Erstattungen",
        "blocks": [
          {
            "type": "p",
            "text": "Für ein vertragsgemäß geliefertes Lied wird keine Erstattung gewährt, wenn die Anfrage ausschließlich beruht auf:"
          },
          {
            "type": "ul",
            "items": [
              "einem Meinungswechsel;",
              "einer vollständigen Änderung des Briefings nach der Bestellung;",
              "einer Nutzung, die diesen Bedingungen widerspricht;",
              "einem Fehler, der aus unrichtigen Angaben des Kunden resultiert."
            ]
          },
          {
            "type": "p",
            "text": "Zwingende Verbraucherrechte bleiben hiervon unberührt."
          }
        ]
      }
    ]
  },
  "datenschutz": {
    "title": "Datenschutzerklärung",
    "updated": "Letzte Aktualisierung: 1. August 2026",
    "sections": [
      {
        "heading": "1. Allgemeines",
        "blocks": [
          {
            "type": "p",
            "text": "Meine Geschichte als Lied betreibt diese Website sowie die damit verbundenen Inhalte, Funktionen, Werkzeuge, Produkte und Dienstleistungen, um Kunden eine personalisierte Bestellerfahrung zu ermöglichen (nachfolgend „Dienste“). Diese Datenschutzerklärung beschreibt, wie wir personenbezogene Daten erheben, verwenden und weitergeben, wenn Sie auf die Dienste zugreifen, sie nutzen, einen Kauf oder eine andere Transaktion durchführen oder auf anderem Weg mit uns kommunizieren."
          },
          {
            "type": "p",
            "text": "Soweit diese Datenschutzerklärung und andere Bedingungen voneinander abweichen, gilt hinsichtlich der Erhebung, Verarbeitung und Weitergabe personenbezogener Daten diese Datenschutzerklärung."
          },
          {
            "type": "p",
            "text": "Bitte lesen Sie diese Datenschutzerklärung aufmerksam. Mit der Nutzung unserer Dienste bestätigen Sie, dass Sie diese Datenschutzerklärung gelesen haben und verstehen, wie Ihre Daten gemäß den nachstehenden Bestimmungen verarbeitet werden."
          }
        ]
      },
      {
        "heading": "2. Personenbezogene Daten, die wir erheben oder verarbeiten",
        "blocks": [
          {
            "type": "p",
            "text": "Personenbezogene Daten sind Informationen, die Sie identifizieren oder vernünftigerweise mit Ihnen oder einer anderen Person in Verbindung gebracht werden können. Anonyme oder so anonymisierte Daten, dass eine Identifizierung nicht mehr möglich ist, fallen nicht darunter."
          },
          {
            "type": "p",
            "text": "Je nach Nutzung der Dienste, Wohnsitz und anwendbarem Recht können wir insbesondere folgende Datenkategorien verarbeiten:"
          },
          {
            "type": "ul",
            "items": [
              "Kontaktdaten, insbesondere Name, Rechnungs- oder Lieferanschrift, Telefonnummer und E-Mail-Adresse;",
              "Angaben für die Erstellung des personalisierten Liedes, insbesondere Namen, Beziehung, Erinnerungen, persönliche Botschaften, gewünschter Musikstil, Stimmwunsch und sonstige Angaben aus dem Fragebogen;",
              "Zahlungs- und Transaktionsinformationen, insbesondere Zahlungsmethode, Zahlungsbestätigung, Betrag, Bestellnummer und weitere Transaktionsdaten. Vollständige Kartendaten werden von Stripe verarbeitet und nicht von uns gespeichert;",
              "Kommunikation mit uns, insbesondere Inhalte von Anfragen an den Kundenservice;",
              "Geräte- und Verbindungsdaten, insbesondere Informationen zu Gerät, Browser, Netzwerkverbindung, IP-Adresse und anderen technischen Kennungen;",
              "Nutzungsdaten, insbesondere Informationen darüber, wann und wie Sie auf unsere Website oder Dienste zugreifen und mit ihnen interagieren."
            ]
          }
        ]
      },
      {
        "heading": "3. Quellen personenbezogener Daten",
        "blocks": [
          {
            "type": "p",
            "text": "Wir können personenbezogene Daten aus folgenden Quellen erhalten:"
          },
          {
            "type": "ul",
            "items": [
              "direkt von Ihnen, wenn Sie unsere Dienste nutzen, eine Bestellung aufgeben, den Fragebogen ausfüllen oder mit uns kommunizieren;",
              "automatisch über unsere Dienste, Ihr Gerät sowie Cookies und ähnliche Technologien, soweit diese eingesetzt werden;",
              "von Dienstleistern, die technische Funktionen in unserem Auftrag bereitstellen oder Daten in unserem Auftrag verarbeiten;",
              "von Partnern oder anderen Dritten, soweit dies rechtlich zulässig ist."
            ]
          }
        ]
      },
      {
        "heading": "4. Wie wir personenbezogene Daten verwenden",
        "blocks": [
          {
            "type": "p",
            "text": "Je nach Ihrer Interaktion mit uns verwenden wir personenbezogene Daten insbesondere für folgende Zwecke:"
          },
          {
            "type": "ul",
            "items": [
              "Bereitstellung, Personalisierung und Verbesserung der Dienste: zur Vertragsdurchführung, Bearbeitung von Zahlungen und Bestellungen, Erstellung und Lieferung personalisierter Lieder, Bearbeitung von Überarbeitungen und Kundenanfragen sowie Verbesserung der Nutzererfahrung;",
              "Marketing und Werbung: zum Versand von Marketing- und Werbekommunikation und zur Messung oder Ausspielung von Online-Werbung, soweit hierfür eine gesetzliche Grundlage oder Ihre Einwilligung vorliegt;",
              "Sicherheit und Betrugsprävention: zur Absicherung von Zahlung und Bestellung, zur Erkennung und Untersuchung betrügerischer, rechtswidriger oder schädlicher Aktivitäten und zum Schutz unserer Dienste;",
              "Kommunikation: zur Beantwortung Ihrer Anfragen, Bereitstellung des Kundenservice und Pflege der Geschäftsbeziehung;",
              "Rechtliche Gründe: zur Erfüllung gesetzlicher Pflichten, Bearbeitung rechtmäßiger Behörden- oder Gerichtsanforderungen, Durchsetzung unserer Bedingungen und Wahrung unserer Rechte."
            ]
          }
        ]
      },
      {
        "heading": "5. Weitergabe personenbezogener Daten",
        "blocks": [
          {
            "type": "p",
            "text": "Unter bestimmten Umständen können wir personenbezogene Daten für legitime Zwecke und im Einklang mit dieser Datenschutzerklärung an Dritte weitergeben, insbesondere:"
          },
          {
            "type": "ul",
            "items": [
              "an technische Dienstleister und Auftragsverarbeiter, die Leistungen in unserem Auftrag erbringen, zum Beispiel Hosting, Cloud-Speicher, Zahlungsabwicklung, E-Mail-Versand, Analyse, Kundenservice und technische Infrastruktur;",
              "an Zahlungsdienstleister wie Stripe zur sicheren Abwicklung von Zahlungen;",
              "an Marketing- und Kommunikationsdienstleister wie Klaviyo sowie an Werbeplattformen wie Meta, soweit die jeweilige Verarbeitung rechtlich zulässig ist und erforderliche Einwilligungen vorliegen;",
              "wenn Sie uns ausdrücklich anweisen, eine Weitergabe verlangen oder in eine Weitergabe einwilligen;",
              "an verbundene Unternehmen oder innerhalb unserer Unternehmensgruppe, soweit dies erforderlich und rechtlich zulässig ist;",
              "im Rahmen einer Unternehmenstransaktion sowie zur Erfüllung gesetzlicher Verpflichtungen, zur Durchsetzung unserer Bedingungen oder zum Schutz unserer Rechte und der Rechte Dritter."
            ]
          }
        ]
      },
      {
        "heading": "6. Technische Dienstleister",
        "blocks": [
          {
            "type": "p",
            "text": "Unsere Website und technische Infrastruktur werden insbesondere über Cloudflare bereitgestellt. Zahlungen werden über Stripe verarbeitet. Für bestimmte E-Mail- und Marketingfunktionen kann Klaviyo eingesetzt werden. Für Werbemessung und Kampagnen können Dienste von Meta verwendet werden, soweit hierfür die erforderliche Rechtsgrundlage oder Einwilligung vorliegt."
          },
          {
            "type": "p",
            "text": "Diese Anbieter können personenbezogene Daten in unserem Auftrag oder für eigene, gesetzlich zulässige Zwecke verarbeiten. Dabei können Daten auch in Ländern außerhalb Ihres Wohnsitzstaates verarbeitet werden. Weitere Informationen finden Sie in den Datenschutzhinweisen der jeweiligen Anbieter."
          }
        ]
      },
      {
        "heading": "7. Websites und Links Dritter",
        "blocks": [
          {
            "type": "p",
            "text": "Unsere Dienste können Links zu Websites oder Online-Plattformen Dritter enthalten. Wenn Sie solchen Links folgen, gelten die Datenschutz- und Sicherheitsbedingungen des jeweiligen Drittanbieters. Wir sind nicht für Datenschutz, Sicherheit, Richtigkeit oder Zuverlässigkeit von Inhalten verantwortlich, die auf nicht von uns kontrollierten Websites angeboten werden."
          },
          {
            "type": "p",
            "text": "Informationen, die Sie in öffentlichen oder halböffentlichen Bereichen, insbesondere auf sozialen Netzwerken, teilen, können von anderen Nutzern eingesehen und unabhängig von uns weiterverwendet werden. Die Aufnahme eines Links stellt keine automatische Empfehlung des Inhalts oder des jeweiligen Anbieters dar."
          }
        ]
      },
      {
        "heading": "8. Daten von Kindern",
        "blocks": [
          {
            "type": "p",
            "text": "Unsere Dienste richten sich nicht an Kinder. Wir erheben wissentlich keine personenbezogenen Daten von Personen, die nach dem jeweils anwendbaren Recht noch nicht volljährig sind. Eltern oder gesetzliche Vertreter können uns kontaktieren, wenn ein Kind personenbezogene Daten übermittelt hat und deren Löschung verlangt werden soll."
          },
          {
            "type": "p",
            "text": "Zum Zeitpunkt des Inkrafttretens dieser Datenschutzerklärung ist uns nicht bekannt, dass wir personenbezogene Daten von Personen unter 16 Jahren im Sinne einschlägiger Datenschutzgesetze „verkaufen“ oder zu Zwecken zielgerichteter Werbung „teilen“."
          }
        ]
      },
      {
        "heading": "9. Sicherheit und Aufbewahrung",
        "blocks": [
          {
            "type": "p",
            "text": "Keine Sicherheitsmaßnahme ist vollkommen oder unfehlbar. Wir können daher keine absolute Sicherheit garantieren. Informationen können zudem während der Übertragung Risiken ausgesetzt sein. Bitte übermitteln Sie besonders sensible oder vertrauliche Informationen nicht über ungesicherte Kanäle."
          },
          {
            "type": "p",
            "text": "Wie lange wir personenbezogene Daten aufbewahren, hängt insbesondere davon ab, wie lange sie zur Vertragsabwicklung, Bereitstellung der Dienste, Erfüllung gesetzlicher Pflichten, Beilegung von Streitigkeiten oder Durchsetzung unserer Bedingungen erforderlich sind."
          }
        ]
      },
      {
        "heading": "10. Ihre Rechte und Wahlmöglichkeiten",
        "blocks": [
          {
            "type": "p",
            "text": "Je nach Wohnsitz und anwendbarem Recht können Ihnen insbesondere folgende Rechte zustehen. Diese Rechte sind nicht uneingeschränkt und können nur unter bestimmten gesetzlichen Voraussetzungen gelten:"
          },
          {
            "type": "ul",
            "items": [
              "Auskunft: Sie können Auskunft über die personenbezogenen Daten verlangen, die wir über Sie verarbeiten;",
              "Löschung: Sie können unter den gesetzlichen Voraussetzungen die Löschung personenbezogener Daten verlangen;",
              "Berichtigung: Sie können die Berichtigung unrichtiger personenbezogener Daten verlangen;",
              "Datenübertragbarkeit: Sie können unter bestimmten Voraussetzungen eine Kopie Ihrer Daten in einem übertragbaren Format oder deren Übermittlung an einen Dritten verlangen;",
              "Kommunikationspräferenzen: Sie können sich jederzeit über den in unseren Werbe-E-Mails enthaltenen Abmeldelink von Marketing-E-Mails abmelden. Auch nach einer Abmeldung können wir Ihnen nicht werbliche Nachrichten senden, insbesondere zu Bestellungen oder zur Vertragserfüllung."
            ]
          },
          {
            "type": "p",
            "text": "Wenn Sie im Europäischen Wirtschaftsraum oder im Vereinigten Königreich wohnen, können Ihnen zusätzlich insbesondere folgende Rechte zustehen:"
          },
          {
            "type": "ul",
            "items": [
              "Widerspruch und Einschränkung der Verarbeitung: Sie können unter den gesetzlichen Voraussetzungen verlangen, dass wir bestimmte Verarbeitungen einstellen oder einschränken;",
              "Widerruf einer Einwilligung: Soweit eine Verarbeitung auf Ihrer Einwilligung beruht, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt."
            ]
          },
          {
            "type": "p",
            "text": "Zur Ausübung Ihrer Rechte können Sie uns über die unten angegebenen Kontaktdaten erreichen. Wir benachteiligen Sie nicht, weil Sie ein Datenschutzrecht ausüben. Soweit rechtlich erforderlich oder zulässig, können wir Ihre Identität überprüfen, bevor wir eine Anfrage bearbeiten. Sie können unter den gesetzlichen Voraussetzungen auch einen Bevollmächtigten einsetzen."
          }
        ]
      },
      {
        "heading": "11. Beschwerden",
        "blocks": [
          {
            "type": "p",
            "text": "Wenn Sie sich über die Verarbeitung Ihrer personenbezogenen Daten beschweren möchten, kontaktieren Sie uns bitte über die unten angegebenen Kontaktdaten. Je nach Wohnsitz können Sie außerdem das Recht haben, sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren."
          }
        ]
      },
      {
        "heading": "12. Internationale Datenübermittlungen",
        "blocks": [
          {
            "type": "p",
            "text": "Wir können personenbezogene Daten außerhalb des Landes speichern oder verarbeiten, in dem Sie wohnen."
          },
          {
            "type": "p",
            "text": "Soweit personenbezogene Daten außerhalb des Europäischen Wirtschaftsraums oder des Vereinigten Königreichs übermittelt werden und kein Angemessenheitsbeschluss besteht, stützen wir uns – soweit erforderlich – auf anerkannte Übermittlungsmechanismen, zum Beispiel die Standardvertragsklauseln der Europäischen Kommission oder andere nach dem anwendbaren Recht zulässige Garantien."
          }
        ]
      },
      {
        "heading": "13. Änderungen dieser Datenschutzerklärung",
        "blocks": [
          {
            "type": "p",
            "text": "Wir können diese Datenschutzerklärung aktualisieren, insbesondere um Änderungen unserer Abläufe oder rechtliche, regulatorische oder betriebliche Entwicklungen abzubilden. Die aktualisierte Fassung wird auf dieser Website veröffentlicht und mit einem aktualisierten Stand versehen."
          }
        ]
      },
      {
        "heading": "14. Kontakt",
        "blocks": [
          {
            "type": "p",
            "text": "Bei Fragen zu unseren Datenschutzpraktiken, zu dieser Datenschutzerklärung oder zur Ausübung Ihrer Rechte erreichen Sie uns unter:"
          },
          {
            "type": "p",
            "text": "E-Mail: kontakt@meinegeschichtealslied.com"
          },
          {
            "type": "p",
            "text": "Adresse: Quickstert 5, Westenfeldmark, 33014 Bad Driburg, Deutschland"
          },
          {
            "type": "p",
            "text": "Für die Zwecke des anwendbaren Datenschutzrechts sind wir Verantwortlicher für die Verarbeitung Ihrer personenbezogenen Daten."
          }
        ]
      }
    ]
  }
};
