# Marine Tech — research instrukcji i sposobów uczenia klientów

Przegląd tego, jak branża marine tech komunikuje obsługę sprzętu: PDF-y, portale, wideo,
aplikacje, e-learning, AR. Linki do przeklikania + krótkie obserwacje per kategoria
i ogólne wnioski o trendach na końcu.

Stan na: czerwiec 2026.

---

## 1. Napęd elektryczny (najbliżej Twojego ICP)


| Producent   | Zasób                                                                 | Link                                                                                                                                                                     |
| ----------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Torqeedo    | Operating manual Travel 401/801 (PDF)                                 | [https://media.torqeedo.com/downloads/manuals/torqeedo-travel-401-801-manual-EN.pdf](https://media.torqeedo.com/downloads/manuals/torqeedo-travel-401-801-manual-EN.pdf) |
| Torqeedo    | Operating manual Cruise 2.0 (PDF)                                     | [https://media.torqeedo.com/downloads/manuals/torqeedo-cruise-20-manual-EN.pdf](https://media.torqeedo.com/downloads/manuals/torqeedo-cruise-20-manual-EN.pdf)           |
| Torqeedo    | Manual Travel XP — z sekcją "Digital operating manual" (QR → app/web) | [https://media.torqeedo.com/downloads/manuals/torqeedo-travel-xp-manual-EN.pdf](https://media.torqeedo.com/downloads/manuals/torqeedo-travel-xp-manual-EN.pdf)           |
| Torqeedo    | TorqTrac (aplikacja BT do monitoringu) — manual modułu                | [https://media.torqeedo.com/downloads/manuals/torqeedo-torqtrac-manual.pdf](https://media.torqeedo.com/downloads/manuals/torqeedo-torqtrac-manual.pdf)                   |
| ePropulsion | X12 Quick Start Guide (PDF, z onboardingiem do platformy Link)        | [https://mackboring.com/wp-content/uploads/2024/11/Quick-start-Manual-_X12.pdf](https://mackboring.com/wp-content/uploads/2024/11/Quick-start-Manual-_X12.pdf)           |
| ePropulsion | Platforma ePropulsion Link (rejestracja łodzi, QR z wyświetlacza)     | [https://link.epropulsion.com](https://link.epropulsion.com)                                                                                                             |
| Oceanvolt   | Download Center — manuale, rysunki wymiarowe, whitepapers             | [https://oceanvolt.com/download-center/](https://oceanvolt.com/download-center/)                                                                                         |


**Obserwacje:**

- Torqeedo jest najdalej w digitalizacji: nowe manuale (Travel XP) wprost zachęcają do
wersji cyfrowej przez QR i aplikację; starsze (Cruise 2.0) to klasyczne PDF-y
z gęstymi sekcjami o podłączaniu baterii — dokładnie ten typ treści, który użytkownicy
psują w praktyce.
- ePropulsion robi onboarding hybrydowy: papierowy quick start → konto web → QR z ekranu
sterownika → telemetria w chmurze. Ale sama nauka obsługi nadal siedzi w "full manual" (PDF).
- Oceanvolt celuje w segment pro/stoczniowy: whitepapers ("Can my boat be retrofitted?")
jako edukacja przedsprzedażowa — content marketing zamiast szkolenia produktowego.
- **Luka:** procedury typu hydrogeneracja/regeneracja, kalibracja, zarządzanie energią są
opisane tekstem w PDF — zero interaktywnych przewodników krok po kroku dla końcowego użytkownika.

---

## 2. Energia i instalacje elektryczne


| Firma                      | Zasób                                                         | Link                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Victron Energy             | Centrum manuali (HTML + PDF per produkt)                      | [https://www.victronenergy.com/support-and-downloads/manuals](https://www.victronenergy.com/support-and-downloads/manuals)                                                     |
| Victron Energy             | Victron Professional — kursy online, egzaminy, certyfikaty    | [https://www.victronenergy.com/information/training](https://www.victronenergy.com/information/training)                                                                       |
| Victron Energy             | Strona supportu (manual jako pierwsza linia wsparcia)         | [https://www.victronenergy.com/support/technical-support](https://www.victronenergy.com/support/technical-support)                                                             |
| Victron Energy             | Przykład zaawansowanego manuala (systemy 3-fazowe/równoległe) | [https://www.victronenergy.com/live/ve.bus:manual_parallel_and_three_phase_systems](https://www.victronenergy.com/live/ve.bus:manual_parallel_and_three_phase_systems)         |
| CZone (BEP/Power Products) | Artykuł o digital switching i upraszczaniu instalacji         | [https://www.pysystems.com/how-to/articles/czone-simplifies-electrical-installlations/](https://www.pysystems.com/how-to/articles/czone-simplifies-electrical-installlations/) |


**Obserwacje:**

- **Victron to benchmark całej branży**: dokumentacja w HTML (nie tylko PDF), wiki-style,
plus pełnoprawna platforma e-learningowa z egzaminami i certyfikatami — ale skierowana
do **instalatorów/dealerów**, nie do końcowych użytkowników. Trening końcowego klienta
nadal spada na dealera albo YouTube.
- Victron wprost pisze w manualach "nie rób tego bez treningu" i kieruje na kursy —
dokumentacja i szkolenie są zintegrowane w jeden lejek.
- Digital switching (CZone, Maretron) przenosi złożoność z okablowania do konfiguracji
softwarowej — czyli rośnie potrzeba uczenia obsługi UI, nie śrubokręta.

---

## 3. Elektronika nawigacyjna (plotery, instrumenty)


| Firma     | Zasób                                                                           | Link                                                                                                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Garmin    | Marine Support — portal manuali, FAQ, wideo                                     | [https://support.garmin.com/en-US/marine/ql/manuals/](https://support.garmin.com/en-US/marine/ql/manuals/)                                                                                                                                                                       |
| Garmin    | GPSMAP — manual webowy (webhelp HTML + PDF na żądanie)                          | [https://www8.garmin.com/manuals/webhelp/GUID-413FE004-9D7D-474E-8423-3B787BC4A5BF/EN-US/GPSMAP_Touch_x2Plus_x3_OM_EN-US.pdf](https://www8.garmin.com/manuals/webhelp/GUID-413FE004-9D7D-474E-8423-3B787BC4A5BF/EN-US/GPSMAP_Touch_x2Plus_x3_OM_EN-US.pdf)                       |
| Garmin    | Przykład onboardingu app↔hardware (ActiveCaptain + Force Pro)                   | [https://www8.garmin.com/manuals/webhelp/GUID-A7668193-255A-4F7A-AAEC-C153FB825CB4/EN-US/GUID-52D1F775-4046-448D-A119-BDEFCEE542AE.html](https://www8.garmin.com/manuals/webhelp/GUID-A7668193-255A-4F7A-AAEC-C153FB825CB4/EN-US/GUID-52D1F775-4046-448D-A119-BDEFCEE542AE.html) |
| Raymarine | Document Library — nowa platforma HTML5 "mobile-optimized" + pełne archiwum PDF | [https://www.raymarine.com/en-us/support/document-library](https://www.raymarine.com/en-us/support/document-library)                                                                                                                                                             |
| Yanmar    | YD42 display — operation manual (PDF, klasyka stylu Navico)                     | [https://www.yanmar.com/marine/wp-content/uploads/2020/01/YANMAR-YD42_Operation_Manual_EN_988-12234-002_w.pdf](https://www.yanmar.com/marine/wp-content/uploads/2020/01/YANMAR-YD42_Operation_Manual_EN_988-12234-002_w.pdf)                                                     |


**Obserwacje:**

- Garmin i Raymarine przeszły z PDF-first na **web-first**: manuale jako strony HTML
(responsywne, linkowalne), PDF tylko jako eksport. Raymarine otwarcie komunikuje
"nową platformę zoptymalizowaną pod mobile".
- Manuale są też **wgrane w sam ploter** (Info → Owner's Manual) — dokumentacja
na urządzeniu, na którym wykonujesz procedurę. To proto-wersja kontekstowej pomocy.
- Raymarine prowadzi Print Shop (płatne drukowane manuale przez Lulu.com) — papier
stał się produktem premium, nie domyślnym.
- Mimo to: treść nadal jest **referencyjna** (opis funkcji po kolei), nie **zadaniowa**
("jak ustawić alarm kotwiczny w 5 krokach").

---

## 4. Silniki spalinowe (legacy, ale wzorce ważne)


| Firma                | Zasób                                                             | Link                                                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Volvo Penta          | Portal supportu — manuale, harmonogramy serwisowe per silnik      | [https://www.volvopenta.com/en-us/support/](https://www.volvopenta.com/en-us/support/)                                                                                                                                                               |
| Mercury Marine       | Owner's Manuals — manual wydawany po numerze seryjnym (formularz) | [https://www.mercurymarine.com/an/en/parts-and-service/service-and-support/owners-manual](https://www.mercurymarine.com/an/en/parts-and-service/service-and-support/owners-manual)                                                                   |
| Mercury Marine       | Artykuł "jak dostać cyfrowy manual" (komunikacja do klienta)      | [https://www.mercurymarine.com/us/en/lifestyle/dockline/quick-tip-how-to-get-a-digital-copy-of-your-mercury-owners-manual](https://www.mercurymarine.com/us/en/lifestyle/dockline/quick-tip-how-to-get-a-digital-copy-of-your-mercury-owners-manual) |
| Yanmar (społeczność) | Marine Diesel Basics — niezależne archiwum manuali Yanmar         | [https://marinedieselbasics.com/diesel-engine-manuals/yanmar-diesel-engine-manuals/](https://marinedieselbasics.com/diesel-engine-manuals/yanmar-diesel-engine-manuals/)                                                                             |


**Obserwacje:**

- Wzorzec "**manual po numerze seryjnym**" (Mercury, Volvo Penta): dokumentacja przypięta
do konkretnego egzemplarza silnika, nie do modelu. To samo robią stocznie z HIN.
- Volvo Penta rozdziela "Operator's manual" (lekki, codzienna obsługa) od "Owner's manual"
(pełny) — świadoma warstwowość treści.
- Fakt, że społeczność (Marine Diesel Basics) buduje własne archiwa manuali, bo oficjalna
dystrybucja jest niewygodna, to symptom: **dostępność dokumentacji jest realnym bólem**.

---

## 5. Osprzęt pokładowy i systemy komfortu


| Firma               | Zasób                                                                                             | Link                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Harken              | Installation & Maintenance Manual — winch (PDF, "destined exclusively for specialised personnel") | [https://gallery.harken.com/gallery/9e9f944d-de85-4fc9-b8fb-f2941080ea18.pdf](https://gallery.harken.com/gallery/9e9f944d-de85-4fc9-b8fb-f2941080ea18.pdf)                                             |
| Harken              | Radial 35.2 ST — manual serwisowy                                                                 | [https://us.binnacle.com/pdf/Harken%2035%20Radial%20Manual.pdf](https://us.binnacle.com/pdf/Harken%2035%20Radial%20Manual.pdf)                                                                         |
| Lewmar              | Pro-Series windlass — owner/installation manual                                                   | [https://images.carid.com/lewmar/items/pdf/6656011967-310-owner-installation.pdf](https://images.carid.com/lewmar/items/pdf/6656011967-310-owner-installation.pdf)                                     |
| Spectra Watermakers | Newport 700c/1000c — installation & operating manual (z QR do bazy manuali)                       | [https://spectrawatermakers.com/cdn/shop/files/MAN_Newport_700C-1000C_24V_48V_110V_220V_250307.pdf](https://spectrawatermakers.com/cdn/shop/files/MAN_Newport_700C-1000C_24V_48V_110V_220V_250307.pdf) |
| Spectra/Katadyn     | Baza manuali online (helpdesk)                                                                    | [http://katadyngroup.ladesk.com/206595-Spectra-Manuals](http://katadyngroup.ladesk.com/206595-Spectra-Manuals)                                                                                         |


**Obserwacje:**

- Sprzęt mechaniczny (winches, windlassy) = najbardziej konserwatywna dokumentacja:
PDF, rysunki techniczne, ostrzeżenia prawne. Harken wprost pisze, że manual jest
"wyłącznie dla specjalistów" — odcinają końcowego użytkownika zamiast go edukować.
- Spectra (watermakery) ciekawie: w papierowym manualu QR prowadzący do zawsze aktualnej
wersji online + commissioning checklist jako warunek gwarancji. Checklisty
uruchomieniowe to naturalny kandydat na interaktywną appkę.
- Systemy komfortu (watermakery, ogrzewanie) mają wysoki współczynnik "zniszczę przez
niewiedzę" (membrany, zimowanie, płukanie) — duży potencjał na guided procedures.

---

## 6. Stocznie — dokumentacja właścicielska i aftersales


| Firma                  | Zasób                                                                           | Link                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beneteau               | Helpdesk — sekcja Owner's manuals (CE manual po HIN, przez dealera)             | [https://help.beneteau.com/hc/en-us/sections/360005594658-Owner-s-manuals](https://help.beneteau.com/hc/en-us/sections/360005594658-Owner-s-manuals) |
| Beneteau               | Komunikacja aftersales ("ponad 50 specjalistów wsparcia")                       | [https://www.beneteau.com/become-beneteau-boat-owner](https://www.beneteau.com/become-beneteau-boat-owner)                                           |
| Jeanneau               | Helpdesk (Zendesk) — manuale na życzenie po HIN                                 | [https://help.jeanneau.com/hc/en-gb/sections/360007844411-Owners-manual](https://help.jeanneau.com/hc/en-gb/sections/360007844411-Owners-manual)     |
| Jeanneau (społeczność) | Jeanneau Owners Network — własne archiwum manuali właścicieli                   | [https://www.jeanneau-owners.com/technicalmanuals.html](https://www.jeanneau-owners.com/technicalmanuals.html)                                       |
| Sentinel Marine        | White-label owner app dla stoczni (monitoring, eService book, digital handover) | [https://www.sentinelmarine.net/boat-builder](https://www.sentinelmarine.net/boat-builder)                                                           |
| Yacht Sentinel         | Partner Platform — zdalna diagnostyka, dokumenty w appce                        | [https://yacht-sentinel.com/boat-builder/](https://yacht-sentinel.com/boat-builder/)                                                                 |


**Obserwacje:**

- Stocznie są **najsłabszym ogniwem dokumentacyjnym**: manual właścicielski to często
generyczny dokument CE wydawany przez dealera po HIN; społeczności właścicieli
(Jeanneau Owners Network) same archiwizują PDF-y, bo oficjalny kanał jest słaby.
- Jednocześnie stocznie kupują gotowe **white-label owner apps** (Sentinel) — czyli
rozumieją, że cyfrowa relacja z właścicielem ma wartość, ale zaczynają od telemetrii
i monitoringu, nie od edukacji obsługi. Sekcja "dokumenty w appce" to nadal repozytorium PDF.
- Digital handover / check-in-check-out (czartery) to rosnący wzorzec — moment przekazania
łodzi jest naturalnym punktem wejścia dla onboardingu.

---

## 7. E-learning, wideo i certyfikacje


| Kto                   | Zasób                                                                     | Link                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Victron               | Online Training — kursy z egzaminami i certyfikatami (konto Professional) | [https://www.victronenergy.com/information/training](https://www.victronenergy.com/information/training)                                                 |
| Pacific Yacht Systems | Biblioteka 500+ wideo o systemach jachtowych (seminaria, serie how-to)    | [https://www.pysystems.com/how-to/videos/](https://www.pysystems.com/how-to/videos/)                                                                     |
| Pacific Yacht Systems | Przykład: seminarium projektowania instalacji (219k wyświetleń)           | [https://www.youtube.com/watch?v=tdur_Ln-9cE](https://www.youtube.com/watch?v=tdur_Ln-9cE)                                                               |
| Digital Yacht         | Tutoriale "How to create an NMEA 2000 network"                            | [https://digitalyacht.support/tutorials/how-to-create-an-nmea-2000-network/](https://digitalyacht.support/tutorials/how-to-create-an-nmea-2000-network/) |
| Digital Yacht         | "How to interface NMEA 2000" (różne standardy złączy)                     | [https://digitalyacht.support/tutorials/how-to-interface-nmea-2000/](https://digitalyacht.support/tutorials/how-to-interface-nmea-2000/)                 |
| SVB (retailer)        | Guide + wideo o sieciach NMEA 2000                                        | [https://www.svb24.com/en/guide/nmea2000-networks.html](https://www.svb24.com/en/guide/nmea2000-networks.html)                                           |
| Tweeds Marine         | 8-częściowa seria edukacyjna o sieciach instrumentów                      | [https://tweedsmarine.nz/master-nmea-2000-networking-on-your-boat/](https://tweedsmarine.nz/master-nmea-2000-networking-on-your-boat/)                   |


**Obserwacje:**

- Najlepsza edukacja użytkownika końcowego pochodzi **nie od producentów**, tylko od
instalatorów (PYS), retailerów (SVB) i integratorów (Digital Yacht) — robią content
marketing, który de facto łata lukę szkoleniową producentów.
- Model Victron (kurs → egzamin → certyfikat) działa, ale jest B2B (instalator).
Nikt nie robi odpowiednika dla właściciela łodzi.
- Wideo na YT jest długie (50+ min seminaria) — wiedza jest, ale w formacie
nieprzeszukiwalnym i niekontekstowym; zero micro-learningu.

---

## 8. AR / XR i interaktywne manuale (frontier)


| Kto              | Zasób                                                                        | Link                                                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Trident Virtual  | QR-code SOPs + assisted reality headsets na jachtach (procedury, logi)       | [https://trident-virtual.com/qr-code-based-sops-and-maintenance/](https://trident-virtual.com/qr-code-based-sops-and-maintenance/)                                                                     |
| ARSOFT / EyeFlow | "PDF → interaktywny manual 3D w godziny", używane przez Navantia i marynarkę | [https://arsoft-company.com/en/noticia/extended-reality-in-naval-sector/](https://arsoft-company.com/en/noticia/extended-reality-in-naval-sector/)                                                     |
| ARSOFT           | Przegląd VR/AR/MR w przemyśle morskim                                        | [https://arsoft-company.com/en/noticia/virtual-augmented-and-mixed-reality-in-the-marine-industry/](https://arsoft-company.com/en/noticia/virtual-augmented-and-mixed-reality-in-the-marine-industry/) |
| ARSOFT           | XR na targach Navalia 2026 — sygnał dojrzewania rynku                        | [https://arsoft-company.com/en/noticia/xr-solutions-naval-sector-navalia-2026/](https://arsoft-company.com/en/noticia/xr-solutions-naval-sector-navalia-2026/)                                         |
| Zea              | Web-based interactive 3D technical illustrations (exploded views, BOM)       | [https://www.zeaengine.com/illustrations/](https://www.zeaengine.com/illustrations/)                                                                                                                   |


**Obserwacje:**

- AR/interaktywne manuale są już realne w sektorze **commercial/naval/defense**
(stocznie wojskowe, superjachty 55 m+, załogi zawodowe) — ROI liczony czasem
przestoju i błędami serwisowymi.
- Wzorzec: QR na fizycznym urządzeniu → procedura krok po kroku na tablecie/headsecie
→ automatyczny log wykonania. To jest dokładnie "interactive micro-learning UI",
tylko w wersji enterprise.
- Do segmentu **leisure marine (producenci osprzętu, stocznie rekreacyjne) to jeszcze
nie zeszło** — bariera kosztowa i mentalna. To jest Twoja luka rynkowa: ta sama idea,
lżejszy format (web/mobile zamiast headsetów), cena dostępna dla działu aftersales.

---

## 9. Aplikacje producenckie (hardware ↔ telefon)


| Aplikacja            | Co robi                                                                | Link                                                                                                                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Garmin ActiveCaptain | Pairing z hardware przez Wi-Fi, update softu, interakcja z urządzeniem | [https://www8.garmin.com/manuals/webhelp/GUID-A7668193-255A-4F7A-AAEC-C153FB825CB4/EN-US/GUID-52D1F775-4046-448D-A119-BDEFCEE542AE.html](https://www8.garmin.com/manuals/webhelp/GUID-A7668193-255A-4F7A-AAEC-C153FB825CB4/EN-US/GUID-52D1F775-4046-448D-A119-BDEFCEE542AE.html) |
| Torqeedo TorqTrac    | BT monitoring silnika (zasięg, bateria) na telefonie                   | [https://media.torqeedo.com/downloads/manuals/torqeedo-torqtrac-manual.pdf](https://media.torqeedo.com/downloads/manuals/torqeedo-torqtrac-manual.pdf)                                                                                                                           |
| ePropulsion Link     | Konto web + rejestracja łodzi przez QR, telemetria w chmurze           | [https://link.epropulsion.com](https://link.epropulsion.com)                                                                                                                                                                                                                     |
| Sentinel App         | Owner app: checklisty, eService book, messaging z serwisem, monitoring | [https://www.sentinelmarine.net/](https://www.sentinelmarine.net/)                                                                                                                                                                                                               |


**Obserwacje:**

- Każdy liczący się producent ma już appkę — ale to są appki **telemetryczne**
(pokaż dane, zaktualizuj soft), nie **edukacyjne**. Onboarding w appce dotyczy
sparowania z urządzeniem, nie nauki obsługi sprzętu.
- Sam proces parowania bywa absurdalnie skomplikowany (ActiveCaptain: ustaw sieć
Wi-Fi na pilocie silnika → wpisz hasło → wyjdź do ustawień telefonu...) — instrukcja
do appki, która miała upraszczać, sama wymaga instrukcji.

---

## 10. Główne trendy — synteza

1. **PDF nadal rządzi, ale umiera powoli.** Rdzeń komunikacji to wciąż 50–150-stronicowy
  PDF (bezpieczeństwo prawne, CE, gwarancja). Liderzy (Garmin, Raymarine, Victron)
   przeszli na HTML/web-first z PDF jako eksportem.
2. **Dokumentacja przypięta do egzemplarza, nie modelu.** Numer seryjny (Mercury),
  HIN (stocznie), QR z wyświetlacza (ePropulsion) — trend "twój sprzęt, twój manual".
3. **Warstwa pierwsza: quick start + QR.** Papier kurczy się do quick start guide'a,
  QR prowadzi do treści cyfrowej. Spectra wiąże checklistę uruchomieniową z gwarancją.
4. **Manual wchodzi na urządzenie.** Plotery mają wbudowane manuale; digital switching
  przenosi obsługę do UI — pomoc kontekstowa "w miejscu wykonywania zadania" to naturalny
   następny krok, którego prawie nikt jeszcze nie robi.
5. **Edukacja jest B2B, nie B2C.** Jedyne dojrzałe systemy szkoleniowe (Victron Professional,
  kursy NMEA) celują w instalatorów i dealerów. Końcowy użytkownik dostaje PDF i YouTube.
   Lukę łatają retailerzy i instalatorzy contentem (PYS, SVB, Digital Yacht).
6. **Appki producenckie = telemetria, nie nauka.** Wszyscy mają apps, nikt nie uczy w nich
  obsługi. Najbliżej są owner-appki white-label (Sentinel) — ale "dokumenty" to tam
   nadal folder z PDF-ami.
7. **AR/interactive 3D działa już w naval/commercial, nie w leisure.** QR-SOPs na
  superjachtach, EyeFlow w Navantii. Technologia dojrzała, do rekreacyjnego marine
   jeszcze nie zeszła — kwestia ceny i formatu, nie możliwości.
8. **Forma treści: referencyjna, nie zadaniowa.** Manuale opisują funkcje po kolei
  ("rozdział 9: Operation"), a użytkownik myśli zadaniami ("jak przełączyć w tryb
   hydrogeneracji bez zniszczenia sprzętu"). Nikt w leisure marine nie robi
   task-based micro-learningu.

### Wniosek pod Twój biznes

Luka jest dokładnie tam, gdzie celujesz: między **PDF-em producenta** (prawnie konieczny,
edukacyjnie martwy) a **enterprise AR** (skuteczne, za drogie dla działu aftersales
producenta osprzętu). Brakujący produkt to lekkie, webowe/mobilne, zadaniowe przewodniki
interaktywne dla końcowego użytkownika — i najlepszy materiał wyjściowy do prototypu
to procedury wysokiego ryzyka z sekcji 1 i 5 (hydrogeneracja, zarządzanie energią,
commissioning watermakera, zimowanie).

---

## 11. Plan eksperymentu

### Założenia

- **Nie zastępujemy manuali — dokładamy warstwę zadaniową.** Manual PDF zostaje
(CE, gwarancja, odpowiedzialność). My przerabiamy 1 procedurę wysokiego ryzyka
na interaktywny, mobilny przewodnik krok po kroku.
- **Jeden artefakt, trzy kanały.** Buduje się raz, pitchuje trzy razy: do platform
owner-app (Sentinel i podobni), do producenta sprzętu, publicznie (LinkedIn/fora).
- **Showpiece to nie produkt — to otwieracz drzwi.** Celem eksperymentu nie jest
zbudowanie czegoś kompletnego, tylko zmierzenie, czy ktokolwiek po drugiej stronie
ma budżet i wolę. Mierzy się to liczbą odpowiedzi i calli, nie jakością kodu.
- **Bez 3D w wersji 1.** Tezę "interaktywna procedura > PDF" udowadnia flow 2D
z dobrą ilustracją. 3D (Three.js, modele producentów) to mnożnik na później,
gdy ktoś już rozmawia o pieniądzach.

### Ramy czasowe i budżet energii


| Faza                                       | Czas                                     | Output                                         |
| ------------------------------------------ | ---------------------------------------- | ---------------------------------------------- |
| Wybór procedury + scenariusz krok po kroku | 2–3 dni                                  | Rozpisany flow (ekrany, decyzje, stany błędów) |
| Build showpiece (web, mobile-first)        | 5–8 dni                                  | Działające demo pod publicznym URL-em          |
| Materiały pitchowe                         | 1–2 dni                                  | Loom 2 min + 3 warianty wiadomości + 1 post    |
| Outreach fala 1                            | 2 tygodnie (równolegle z normalną pracą) | 30 wiadomości, pomiar odpowiedzi               |
| Decyzja                                    | 1 dzień                                  | Kontynuacja / pivot segmentu / stop            |


Twardy limit: **maks. 2 tygodnie pracy nad samym demo.** Każdy dzień powyżej to
optymalizowanie artefaktu, którego nikt jeszcze nie chciał zobaczyć.

### Kryteria wyboru procedury (dlaczego te trzy poniżej)

1. Wysoki koszt błędu — użytkownik realnie niszczy sprzęt albo traci gwarancję.
2. Sezonowy szczyt ticketów — ból działu supportu jest policzalny.
3. Materiał źródłowy publicznie dostępny (manual PDF) — zero zależności od nikogo.
4. Procedura ma strukturę decyzyjną (if/else), której PDF nie umie pokazać,
  a interaktywny flow tak — czyli kontrast demo vs PDF jest maksymalny.

---

## 12. Trzy procedury pod showpiece

### EDUBOAT — design system do prevek UI (wspólny dla wszystkich promptów)

Nazwa projektu: **eduboat**. Kierunek: dark mode, "noc na kotwicy" jako naturalna
sceneria energetyki. Jachty żaglowe (low-poly przekrój sloopa 10–12 m), nie motorówki.

**Paleta (dark):**
- Tło: głęboki granat atramentowy `#0A141F` (noc na wodzie)
- Panele: ciemne matowe szkło (slate `#16222E` ~70% przezroczystości, delikatna
  jasna krawędź 1px, mocno zaokrąglone rogi)
- Tekst: `#F1F1F1` (primary), `#8FA3B0` (secondary)
- **Energia zużywana (out): bursztyn `#F0A35E`** — strumienie/cząstki do odbiorników
- **Energia ładowana (in): cyjan-teal `#5FD4C4`** — strumienie od źródeł do banku
- Sukces: `#6FBF9A` · Ostrzeżenie: `#E8B25A` · Alarm: `#E2654E`
- Kadłub low-poly: stonowane grafitowo-niebieskie płaszczyzny, księżycowe refleksy;
  woda: ciemny teal, spokojna

**Typografia:** wyłącznie Google Sans Flex (cyfry tabularyczne w odczytach).
Semantyka kolorów jest częścią edukacji: bursztyn = prąd wypływa, cyjan = prąd wpływa —
ta sama logika we wszystkich widokach i procedurach.

Każdy prompt poniżej jest samowystarczalny (styl wklejony w treść) — kopiuj-wklej
do generatora bez sklejania.

### Procedura A: Hydrogeneracja Torqeedo Cruise (rekomendowana na start)

**Dlaczego ta:** flagowy przykład z Twojego własnego VSL hooka; procedura, którą
żeglarze realnie psują (załączanie regeneracji przy złych obrotach/prędkości,
niezrozumienie stanów ładowania); Torqeedo już inwestuje w digital (QR w manualach,
TorqTrac) — kulturowo gotowi na taki pitch.

**Źródło właściwe (UWAGA):** hydrogeneracja występuje TYLKO w silnikach pod **Cruise FP**
(pod do żaglówek), nie w zaburtowych Cruise/Travel. Procedura jest opisana w:

- **Cruise 12.0 FP TorqLink — manual DE/EN, sekcja 6.3.3 "Charging the batteries through
hydrogeneration during the trip"** (angielska wersja w drugiej połowie pliku):
[https://media.torqeedo.com/downloads/manuals/torqeedo-cruise-120-fp-manual-DE-EN.pdf](https://media.torqeedo.com/downloads/manuals/torqeedo-cruise-120-fp-manual-DE-EN.pdf)
- Wariant starszy Cruise 2.0/4.0 FP (sekcja 6.3.3, inne wymagania sprzętowe):
[https://destilleboot.nl/wp-content/uploads/2018/07/torqeedo-cruise-20-40-fp-manual-DA-NL.pdf](https://destilleboot.nl/wp-content/uploads/2018/07/torqeedo-cruise-20-40-fp-manual-DA-NL.pdf)
- Wszystkie manuale Cruise FP (wybierz model): [https://www.torqeedo.com/us/en-us/service-center/manuals.html](https://www.torqeedo.com/us/en-us/service-center/manuals.html)

**Wyciągnięta procedura (z manuala 12.0 FP, sekcja 6.3.3 — gotowy materiał na flow):**

Warunki wstępne (bramki na ekran 1–2):

- Prędkość pod żaglami ≥ 4 węzły.
- Główny wyłącznik (main switch) włączony.
- Tylko bateria Power 48-5000 — z AGM/żel/ołów hydrogeneracja NIEMOŻLIWA.
- Zalecenie: używać tylko przy SOC < 95%.

Kroki aktywacji (1 krok = 1 ekran):

1. Załóż magnetyczny pin (kill switch).
2. Włącz system.
3. Sprawdź sygnał GPS (prędkość liczona z GPS!).
4. Ustaw manetkę w zakresie 1–30%.
5. Weryfikacja: na wyświetlaczu manetki pojawia się "Charging".

Automatyczne wyłączenia (ścieżki błędów do flow):

- Prędkość < 4 kn przez > 30 s → auto-off, trzeba RESTARTOWAĆ ręcznie.
- Prędkość > 16 kn → auto-off.
- SOC 98% → auto-stop ("Charging" znika).
- Pułapka UX wprost z manuala: podczas regeneracji wyświetlacz pokazuje moc ładowania,
ale NIE pokazuje poziomu naładowania — użytkownik jest ślepy na SOC. Idealny
argument za lepszym interfejsem.

Wyłączenie: manetka w pozycję neutralną → "Charging" gaśnie.

Różnice w starszym wariancie 2.0/4.0 FP (pokazują, że flow musi być per-model —
argument za systemem, nie jednorazowym PDF-em): wymagana składana śruba (1932-00),
zdalna manetka (1918-00) i bateria Power 26-104; okno prędkości 4–12 kn (2.0 FP)
lub 4–14 kn (4.0 FP); auto-stop przy napięciu > 28,8 V zamiast 98% SOC.

**Flow do rozpisania (szkielet ekranów):**

1. *Kontekst wejścia* — "Płyniesz pod żaglami? Prędkość powyżej X kn?" (bramka warunków,
  której PDF nie egzekwuje, a która chroni sprzęt).
2. *Stan systemu* — wizualna weryfikacja: poziom baterii, temperatura, czy silnik
  w pozycji roboczej. Każdy warunek jako odhaczalny check z ilustracją "gdzie to widzę".
3. *Aktywacja* — krok po kroku z ilustracją throttle'a/wyświetlacza, jeden krok = jeden ekran.
4. *Stan pracy* — co jest normalne (zakresy mocy ładowania), co jest alarmujące;
  "jeśli widzisz X → przejdź do Y" zamiast tabeli error-codes na stronie 26.
5. *Wyjście z trybu* — kiedy i jak bezpiecznie wyłączyć; najczęstszy błąd jako
  wyróżniony anty-wzorzec.

**Stany błędów do pokrycia:** za niska prędkość, przegrzanie, pełna bateria,
nagła zmiana warunków. Każdy jako osobna ścieżka "co teraz", nie przypis.

**Miara sukcesu demo:** osoba nieżeglująca przechodzi flow w < 3 min i umie
powiedzieć, kiedy NIE wolno włączyć regeneracji.

**Interfejs eduboat (opis):** mobilny, pionowy ekran-krok. Górna połowa: low-poly
jacht żaglowy w przechyle pod żaglami (noc/zmierzch), pod kadłubem widoczny pod
z obracającą się śrubą, cyjanowy strumień energii płynie od śruby do podświetlonego
banku baterii w kadłubie. Dolna połowa: panel z ciemnego szkła — duży łukowy
prędkościomierz z zieloną strefą 4–16 kn (igła w strefie), pod nim trzy chipy
warunków z ikonami stanu (bateria Li ✓, main switch ✓, GPS ✓), poziomy wskaźnik
manetki z podświetlonym zakresem 1–30%, badge "CHARGING" w cyjanie, pasek SOC 78%.
Na dole pigułka postępu "Step 4 of 5" i przycisk dalej.

**Prompt (EN, do generatora):**

> Dark-mode mobile UI design for "eduboat", an interactive marine micro-learning app, portrait smartphone screen. A stylized low-poly 3D sailing yacht heels under full sails on a calm night sea, deep ink-navy background (#0A141F), moonlit cinematic lighting; beneath the hull a small electric pod drive with a spinning propeller emits a glowing cyan-teal energy stream (#5FD4C4) flowing along the hull into a highlighted battery bank inside a subtle cutaway. The lower half is a matte frosted dark-glass panel with deeply rounded corners (#16222E, soft 1px light edge) containing: a large arc speed gauge labeled "4–16 kn" with a green safe zone and needle at 6.2 kn; three condition chips with green checkmarks ("Li battery", "Main switch", "GPS"); a horizontal throttle indicator highlighting the 1–30% range; a glowing "CHARGING" badge in cyan; a battery SOC bar at 78%. Typography exclusively Google Sans Flex, off-white text (#F1F1F1), tabular numerals. Progress pill "Step 4 of 5". Calm, task-focused, pro-consumer feel; serene guided procedure, premium clean-tech aesthetic.

### Procedura B: Commissioning watermakera Spectra Newport

**Dlaczego ta:** Spectra już wiąże checklistę uruchomieniową z gwarancją (gotowy
business case — każdy błąd commissioning = roszczenie gwarancyjne, które można było
wyeliminować); procedura jest długa, wieloetapowa i pełna nieodwracalnych błędów
(membrana zniszczona chlorowaną wodą, brak fresh water flush).

**Źródła:**

- Manual Newport 700c/1000c — sekcja **"New Systems Start Up and Testing" (str. 30)**
to właściwy materiał na flow; do tego "Newport Installation Quick Start" (str. 6)
i "Warranty, Product Registration, Installation & Commissioning Reports" (str. 108):
[https://spectrawatermakers.com/cdn/shop/files/MAN_Newport_700C-1000C_24V_48V_110V_220V_250307.pdf](https://spectrawatermakers.com/cdn/shop/files/MAN_Newport_700C-1000C_24V_48V_110V_220V_250307.pdf)
- Baza wszystkich manuali Spectra (helpdesk Katadyn): [http://katadyngroup.ladesk.com/206595-Spectra-Manuals](http://katadyngroup.ladesk.com/206595-Spectra-Manuals)
- **Istniejący webowy formularz commissioning report Spectry** (To, co oni już mają —
Twój flow to jego upgrade): [https://spectrawarranty.formstack.com/forms/spectra_install_commissioning_report](https://spectrawarranty.formstack.com/forms/spectra_install_commissioning_report)
- Formularz rejestracji produktu (drugi krok warunkujący extended warranty):
[https://spectrawarranty.formstack.com/forms/product_registration](https://spectrawarranty.formstack.com/forms/product_registration)

**Wyciągnięte fakty z manuala (gotowy business case do flow):**

- System przy pierwszym uruchomieniu wyświetla ostrzeżenie: jeśli był pickled/zimowany/
pierwszy start/stan nieznany → "go to COMMISSIONING on page 30 **or serious damage
may occur**" — dosłowny cytat, mocny do pitcha.
- Extended warranty (2 lata + lifetime na Clark Pump) jest warunkowana: instalacja przez
autoryzowany serwis + wypełnienie web-form rejestracji + web-form commissioning report.
Czyli Spectra JUŻ zbudowała proces, tylko w formie płaskiego formularza Formstack —
Twój interaktywny flow z walidacjami i raportem to naturalna ewolucja, którą łatwo
pokazać obok ich obecnego narzędzia.
- Fresh water flush: po flushu system sam wchodzi w Auto Store; timer odlicza do
następnego flushu; wymaga ciśnienia w instalacji słodkiej wody i ~27 l wody na flush —
gotowe warunki/walidacje do checklisty.

**Flow:** interaktywna checklista commissioningu — każdy punkt z ilustracją "co i gdzie",
walidacją ("zmierzona wartość mieści się w zakresie?"), rozgałęzieniami przy odchyłkach
i **generowanym na końcu raportem zgodności** (PDF/link) — czyli artefakt, który dealer
może podpiąć pod gwarancję. To jest feature, którego nie da się zrobić w papierze.

**Miara sukcesu demo:** raport końcowy wygląda jak dokument, który dział aftersales
chciałby dostawać od każdego instalatora.

**Interfejs eduboat (opis):** tablet poziomo, układ dwukolumnowy. Lewa wąska kolumna:
pionowa lista kroków commissioningu (zrobione — teal, aktywny — podświetlony,
przyszłe — wygaszone) z paskiem postępu "7 of 12". Prawa kolumna: aktywny krok —
ilustrowany przekrój modułu Clark pump/membrany w kadłubie jachta (low-poly, miejsce
montażu podświetlone), pole wpisu zmierzonej wartości (ciśnienie) z widełkami
poprawnego zakresu i walidacją na żywo (wartość w zakresie = zielona ramka),
ostrzeżenie bursztynowe "If pickled/winterized → run COMMISSIONING first or serious
damage may occur". Na dole pasek: podgląd generowanego raportu zgodności (mini-dokument
z pieczątką ✓) i przycisk "Next step".

**Prompt (EN, do generatora):**

> Dark-mode tablet UI design for "eduboat", a guided marine commissioning app, landscape orientation. Background: deep ink-navy (#0A141F) with a stylized low-poly 3D cutaway of a sailing yacht hull at dock, night scene, soft cinematic moonlight; inside the hull a watermaker module (high-pressure pump and membrane vessel) is highlighted with a gentle cyan glow showing its mounting location. Left side: a narrow frosted dark-glass sidebar (#16222E, deeply rounded corners) with a vertical checklist of 12 commissioning steps — completed steps in teal-green (#6FBF9A) with checkmarks, the active step glowing, future steps dimmed — and a progress label "7 of 12". Right side: a large matte glass card with the active step: a measured-value input field showing "Feed pressure" with a valid range scale and a live validation state in green; an amber warning banner (#E8B25A) reading "System pickled or winterized? Run commissioning first"; below, a small preview of an auto-generated compliance report document with a checkmark seal and a primary "Next step" button. Typography exclusively Google Sans Flex, off-white text (#F1F1F1), tabular numerals. Professional, trustworthy, calm clean-tech aesthetic for guided micro-learning.

### Procedura C: Zimowanie baterii litowych napędu elektrycznego

**Dlaczego ta:** najbardziej sezonowy ból w całej kategorii (jesień = fala ticketów,
wiosna = fala martwych baterii poza gwarancją); dotyczy każdego producenta napędu
(Torqeedo, ePropulsion, Oceanvolt) — jeden showpiece pitchowalny do wszystkich;
koszt błędu brutalnie policzalny (bateria = 30–50% ceny systemu).

**Źródła:**

- **Manual Travel XP — rozdział 8 "Storage and transport", sekcja 8.3 "Storage of the
battery"** (najlepszy, najnowszy materiał): [https://media.torqeedo.com/downloads/manuals/torqeedo-travel-xp-manual-EN.pdf](https://media.torqeedo.com/downloads/manuals/torqeedo-travel-xp-manual-EN.pdf)
- Manual Travel 401/801 (rozdz. 11 "Storage and care instructions", starsza generacja): [https://media.torqeedo.com/downloads/manuals/torqeedo-travel-401-801-manual-EN.pdf](https://media.torqeedo.com/downloads/manuals/torqeedo-travel-401-801-manual-EN.pdf)
- Manual Cruise 2.0 (rozdz. 11 — korozja/pielęgnacja silnika, uzupełnienie): [https://media.torqeedo.com/downloads/manuals/torqeedo-cruise-20-manual-EN.pdf](https://media.torqeedo.com/downloads/manuals/torqeedo-cruise-20-manual-EN.pdf)
- ePropulsion X12 Quick Start (porównanie podejścia konkurencji do baterii): [https://mackboring.com/wp-content/uploads/2024/11/Quick-start-Manual-_X12.pdf](https://mackboring.com/wp-content/uploads/2024/11/Quick-start-Manual-_X12.pdf)

**Wyciągnięta procedura (Travel XP, sekcja 8.3 — gotowy materiał na kreator):**

- Naładuj lub rozładuj baterię do **50% SOC** przed przechowywaniem (to samo przy transporcie).
- Optymalna temperatura przechowywania: **+5°C do +15°C** (dopuszczalny zakres
-20°C do +55°C wg sekcji 5.3.3, ale optimum jest wąskie — dobry materiał na suwak/wizualizację).
- Nie przechowywać w gorących miejscach (np. samochód latem) — ryzyko pożaru (DANGER w manualu).
- Ładowanie z 50% do 100% dopiero bezpośrednio przed użyciem.
- Po pływaniu doładuj — nie odstawiać z niskim SOC.
- **Sprawdzaj poziom naładowania co 3 miesiące** i doładowuj w razie potrzeby —
to jest dokładnie ten krok, który ludzie pomijają i z którego robisz harmonogram
przypomnień (feature niemożliwy w PDF).
- Bonus do flow (sekcja 8.2): transport = bateria odłączona, 50% SOC, rumpel w pozycji
parkingowej, tilt lock, steering lock 0°.

**Flow:** kreator zimowania — data odstawienia → docelowy poziom naładowania →
warunki przechowywania (temperatura, wilgotność) → harmonogram doładowań w sezonie
zimowym (z opcją przypomnień mailowych — drugi feature niemożliwy w PDF).

**Miara sukcesu demo:** flow kończy się spersonalizowanym "planem zimowania" do
zapisania/wydrukowania.

**Interfejs eduboat (opis):** mobilny kreator, ekran podsumowania planu. Góra:
low-poly jacht żaglowy na lądowych podporach (hala/plandeka sugerowana mgiełką),
zdjęta bateria "wyjęta" z kadłuba i położona obok na półce, połączona cienką
przerywaną linią ze swoim miejscem w łodzi. Środek: panel ze szkła — duży okrągły
dial SOC ustawiony na 50% (połowa pierścienia w cyjanie), pod nim poziomy pasek
temperatury z podświetloną strefą optymalną +5…+15°C (suwak w strefie), ostrzeżenie
bursztynowe "never store hot". Dół: oś czasu zimy (Nov–Apr) z trzema przypomnieniami
"check charge" co 3 miesiące jako cyjanowe punkty, karta "Your winter plan" z
przyciskami zapisu/przypomnień.

**Prompt (EN, do generatora):**

> Dark-mode mobile UI design for "eduboat", a marine battery winterization wizard, portrait smartphone screen. Top: a stylized low-poly 3D sailing yacht stored on land stands (winter storage, hinted hall in soft fog), deep ink-navy background (#0A141F), calm cinematic lighting; the lithium battery is shown removed from the hull, resting on a shelf beside the boat, connected to its original location by a thin dashed guide line. Middle: a matte frosted dark-glass panel (#16222E, deeply rounded corners) with a large circular SOC dial set to exactly 50% (half-ring glowing cyan-teal #5FD4C4); below it a horizontal temperature bar from -20°C to +55°C with a highlighted optimal zone "+5…+15°C" and a slider inside the zone; a small amber warning chip (#E8B25A) "Never store in hot places". Bottom: a winter timeline from November to April with three glowing cyan reminder dots labeled "Check charge" every 3 months, and a summary card "Your winter plan" with save and reminder buttons. Typography exclusively Google Sans Flex, off-white text (#F1F1F1), tabular numerals. Friendly, precise, serene guided micro-learning aesthetic.

---

### Procedury uniwersalne (D–F): koncept + procedura, brand-agnostyczne

Procedury A–B są mocno produktowe (konkretny sprzęt, konkretny producent). Poniższe trzy
są **uniwersalne**: każda wymaga zrozumienia modelu myślowego, bez którego sama procedura
jest bezmyślnym klikaniem — i właśnie dlatego tekst w PDF zawodzi, a interaktywny
onboarding "najpierw koncept, potem kroki" daje nieproporcjonalnie dużą wartość.
Są też pitchowalne szeroko: do platform, wielu producentów naraz i czarterów.

### Procedura D: Kalibracja i commissioning autopilota

**Koncept do nauczenia (bez niego procedura nie ma sensu):** autopilot nie zna Twojej
łodzi. Musi się nauczyć trzech rzeczy: (1) jak działa Twój ster (typ napędu, limity
wychylenia, czas burta–burta), (2) gdzie jest północ — a kompas na pokładzie kłamie,
bo otaczają go pola magnetyczne łodzi (stąd "linearization" — autopilot sam mapuje
zakłócenia podczas kręcenia ósemek), (3) jak Twoja łódź reaguje. Użytkownik, który
tego nie rozumie, przerywa kalibrację w połowie i potem zgłasza "autopilot źle trzyma kurs".

**Dlaczego uniwersalna:** każda nowoczesna łódź ma autopilota; każdy producent
(Raymarine, Garmin, B&G/Simrad) wymaga analogicznego commissioningu (dockside + sea
trial); to klasyka ticketów posezonowych i po każdej wymianie sprzętu.

**Źródła:**

- **Raymarine Evolution — "Set-up and commissioning" (dokument 82285), kompletna
procedura na ~12 stronach**: [https://www.brommeland.no/file/standardmappe-uni/evolution-autopilot-set-up-and-commissioning-with-p70s-p70rs-p70-p70r-82285-7-en.pdf](https://www.brommeland.no/file/standardmappe-uni/evolution-autopilot-set-up-and-commissioning-with-p70s-p70rs-p70-p70r-82285-7-en.pdf)
- Wersja wcześniejsza (porównanie ewolucji procedury): [https://ca.binnacle.com/pdf/Raymarine%20Evolution%20autopilot%20Set-up%20and%20Commissioning%20with%20p70%20and%20p70R%2082285-5-EN.pdf](https://ca.binnacle.com/pdf/Raymarine%20Evolution%20autopilot%20Set-up%20and%20Commissioning%20with%20p70%20and%20p70R%2082285-5-EN.pdf)

**Wyciągnięta procedura (z dokumentu 82285 — gotowy materiał na flow):**

Faza 1 — Dockside wizard (przy kei, silnik wyłączony):

1. Wybór typu napędu steru (Drive Type).
2. Wyrównanie steru (Align Rudder — tylko z czujnikiem wychylenia steru).
3. Ustawienie limitów wychylenia (Rudder Limit).
4. Hard Over Time — czas przełożenia burta–burta (jeśli nieznany: pomiń w wizardzie,
  zmierz, wpisz ręcznie — gotowe rozgałęzienie do flow).
5. Rudder Drive check — system sam sprawdza połączenie napędu (pyta o zgodę przed
  ruszeniem sterem — moment bezpieczeństwa do wyróżnienia).

Faza 2 — Linearizacja kompasu (w ruchu, automatyczna):

- Startuje sama po skręcie ~100° przy prędkości 3–15 kn.
- Wymaga łącznie ≥ 270° skrętu; pełne 360° przyspiesza proces.
- Pasek postępu na wyświetlaczu; przerwanie = trzeba kontynuować później.
- Deviation ≥ 25° po linearizacji → jednostka EV stoi w złym miejscu (za blisko
magnetyzmu), trzeba ją przenieść — najczęstszy nierozpoznany błąd instalacji.
- Po uzyskaniu dobrej dokładności: Compass Lock (zablokowanie dalszej auto-kalibracji).

**Miara sukcesu demo:** użytkownik rozumie, DLACZEGO musi kręcić kółka po zatoce
(a nie tylko że musi) i wie, co oznacza deviation 25°.

**Interfejs eduboat (opis):** ekran fazy sea-trial (linearizacja). Widok z góry
jak ciemna mapa: zatoka nocą, mały low-poly jacht żaglowy widziany z lotu ptaka
zostawia za sobą świetlisty cyjanowy ślad zakręcający w pętlę; wokół łodzi
duży pierścień postępu 270°/360° wypełniony w ~70%, z podziałką stopni. Boczny
panel ze szkła: róża kompasowa z dwiema igłami (surowa vs skorygowana — wizualizacja
"kompas kłamie"), odczyt prędkości "5.4 kn" z zieloną adnotacją zakresu 3–15 kn,
wskaźnik "Deviation: 7°" w zieleni (z zaznaczonym progiem alarmu 25° na skali),
status "Linearizing… keep turning" i podpowiedź "a full 360° speeds this up".
Mały przełącznik faz u góry: "Dockside ✓ → Sea trial".

**Prompt (EN, do generatora):**

> Dark-mode UI design for "eduboat", a marine autopilot calibration guide, landscape screen. The scene is a top-down night chart view of a calm bay, deep ink-navy water (#0A141F) with subtle depth shading; a small low-poly sailing yacht seen from above leaves a glowing cyan-teal wake (#5FD4C4) curving into a wide circle; around the boat a large 360-degree progress ring with degree ticks is filled to about 70%, indicating compass linearization progress. On the right, a matte frosted dark-glass panel (#16222E, deeply rounded corners) contains: a compass rose with two needles slightly apart, labeled "raw" and "corrected", visualizing magnetic deviation; a speed readout "5.4 kn" with a green annotation "3–15 kn required"; a deviation indicator "7°" in green on a small scale with an alarm threshold marked at 25°; a status line "Linearizing — keep turning" with a hint "A full 360° turn speeds this up". At the top a phase switch pill: "Dockside ✓ → Sea trial". Typography exclusively Google Sans Flex, off-white text (#F1F1F1), tabular numerals. Cinematic, calm, instrument-like precision; premium clean-tech aesthetic for guided learning.

### Procedura E: Sieć NMEA 2000 — projektowanie, podłączenie, diagnoza

**Koncept do nauczenia:** "instalacja elektroniki to jedna magistrala, nie pajęczyna
kabli" — backbone z dwoma terminatorami, urządzenia na drop-kablach, wspólne zasilanie
z budżetem mocy (LEN). Kto tego nie rozumie, buduje sieć, która "czasem działa"
(brak terminatora, za długi drop, przeciążone zasilanie) — a potem obwinia urządzenia.

**Dlaczego uniwersalna:** to JEDYNY standard łączący sprzęt wszystkich producentów
(Garmin, Raymarine, B&G, Victron, Yanmar...); ogromna scena DIY; awarie sieci generują
tickety u WSZYSTKICH producentów naraz, choć winna jest zwykle sieć, nie produkt —
idealny pitch "jedna procedura, korzyść dla każdego vendora".

**Źródła (wszystkie darmowe, brand-agnostyczne):**

- Digital Yacht — "How to create an NMEA 2000 network" (zawiera 8 twardych reguł sieci):
[https://digitalyacht.support/tutorials/how-to-create-an-nmea-2000-network/](https://digitalyacht.support/tutorials/how-to-create-an-nmea-2000-network/)
- Digital Yacht — "How to interface NMEA 2000" (SeaTalkNG/SimNet/Micro-C — mapa złączy):
[https://digitalyacht.support/tutorials/how-to-interface-nmea-2000/](https://digitalyacht.support/tutorials/how-to-interface-nmea-2000/)
- SVB — przewodnik + wideo + tabela złączy per producent: [https://www.svb24.com/en/guide/nmea2000-networks.html](https://www.svb24.com/en/guide/nmea2000-networks.html)
- Tweeds Marine — 8-częściowa seria (część 2 = NMEA 2000): [https://tweedsmarine.nz/master-nmea-2000-networking-on-your-boat/](https://tweedsmarine.nz/master-nmea-2000-networking-on-your-boat/)

**Wyciągnięte reguły (z tutoriala Digital Yacht — gotowe walidacje do flow):**

1. Dokładnie 2 terminatory, po jednym na każdym końcu backbone'u.
2. Zasilanie sieci 9–16 V.
3. Prąd zasilania < 3 A (60 LEN) — każde urządzenie ma wartość LEN, flow je sumuje.
4. Maks. 50 urządzeń fizycznych.
5. Backbone < 100 m.
6. Pojedynczy drop ≤ 6 m.
7. Suma dropów < 76 m.
8. Spadek napięcia między końcami < 1,5 V.

Idealny format: **interaktywny kreator sieci** — użytkownik dodaje urządzenia
(z bazą LEN i typów złączy per producent), flow na bieżąco waliduje reguły 1–8
i rysuje schemat. Diagnoza: drzewko "co nie działa" → brak zasilania / brak
terminatora / złe złącze → jak sprawdzić.

**Miara sukcesu demo:** osoba bez wiedzy projektuje poprawną sieć z 5 urządzeń
i umie wyjaśnić, po co są terminatory.

**Interfejs eduboat (opis):** desktopowy kreator, styl "blueprint na ciemnym szkle".
Tło: delikatna sylwetka jachta żaglowego z boku (linia konturowa), nad nią główny
kanwas: pozioma magistrala (backbone) jako gruba świecąca linia z dwoma terminatorami
na końcach (oba zielone ✓), trójniki w równych odstępach, od nich pionowe drop-kable
do kart urządzeń (ploter, wiatromierz, GPS, silnik, czujnik baterii) — każda karta
to małe ciemne szkło z ikoną i wartością LEN. Jedna karta przeciągana kursorem
(stan "dragging", cień). Prawy panel walidacji: lista reguł na żywo — "Terminators 2/2 ✓",
pasek budżetu mocy "23/60 LEN", "Drop length 4.2/6 m ✓", "Voltage drop 0.8/1.5 V ✓",
jedna reguła złamana na bursztynowo ("Backbone power: not connected") z podpowiedzią.

**Prompt (EN, do generatora):**

> Dark-mode desktop UI design for "eduboat", an interactive NMEA 2000 marine network builder, wide landscape screen. Background: deep ink-navy (#0A141F) with a faint outline silhouette of a sailing yacht in side profile, blueprint style. Center canvas: a horizontal glowing backbone cable line with two terminator caps at both ends marked with green checkmarks; evenly spaced T-connectors with vertical drop cables leading to floating device cards — chartplotter, wind sensor, GPS, engine gateway, battery monitor — each card a small matte frosted dark-glass tile (#16222E, deeply rounded corners) with a device icon and a "LEN" value; one card is being dragged by a cursor with a soft shadow, showing a drag state. Right side: a frosted glass validation panel with live rule checks — "Terminators 2/2 ✓" in teal-green (#6FBF9A), a power budget bar "23/60 LEN", "Drop length 4.2/6 m ✓", "Voltage drop 0.8/1.5 V ✓", and one violated rule in amber (#E8B25A): "Backbone power: not connected" with a hint tooltip. Typography exclusively Google Sans Flex, off-white text (#F1F1F1), tabular numerals. Precise, schematic, calm engineering aesthetic — a friendly dark blueprint for guided learning.

### Procedura F: Zarządzanie energią na pokładzie (bank baterii + ładowanie)

**Koncept do nauczenia:** bateria to zbiornik, którego nie widać — SOC, pojemność
w Ah, budżet energetyczny doby oraz trzy fazy ładowania (bulk → absorption → float)
i dlaczego bateria "naładowana do 80% w godzinę" potrzebuje kolejnych godzin na
resztę. Bez tego modelu użytkownik systematycznie zabija bank baterii (najdroższy
materiał eksploatacyjny na łodzi) i nie rozumie, czemu lodówka "rozładowała" mu silnik.

**Dlaczego uniwersalna:** każda łódź z kabiną ma ten problem; dotyczy wszystkich
producentów (Victron, Mastervolt, baterie każdej marki); czarterowi klienci niszczą
banki notorycznie — czyli pitch działa też na floty czarterowe, nie tylko producentów.

**Źródła (Victron udostępnia za darmo całe podręczniki — gotowa, autoryzowana wiedza):**

- **"Energy Unlimited"** (Reinout Vader, założyciel Victrona) — rozdz. 4 "Battery
charging": bulk/absorption/float wyjaśnione od podstaw:
[https://www.victronenergy.com/upload/documents/Book-Energy-Unlimited-EN.pdf](https://www.victronenergy.com/upload/documents/Book-Energy-Unlimited-EN.pdf)
- **"Wiring Unlimited"** — bank baterii, okablowanie, spadki napięć, korozja galwaniczna:
[https://www.victronenergy.com/upload/documents/The_Wiring_Unlimited_book/43562-Wiring_Unlimited-pdf-en.pdf](https://www.victronenergy.com/upload/documents/The_Wiring_Unlimited_book/43562-Wiring_Unlimited-pdf-en.pdf)
- Strona książki (inne języki + darmowy hardcopy): [https://www.victronenergy.com/orderbook](https://www.victronenergy.com/orderbook)

**Wyciągnięty materiał (Energy Unlimited, rozdz. 4 — szkielet konceptu do flow):**

- Bulk: pełny prąd ładowania do ~80% naładowania (do osiągnięcia napięcia absorpcji).
- Absorption: stałe napięcie, prąd spada w miarę dochodzenia do pełna — to TU użytkownicy
przerywają ładowanie, myśląc że "już prawie pełna, wystarczy".
- Float: obniżone napięcie podtrzymujące 100% bez przeładowania.
- Do tego z praktyki czarterowej: poranny rytuał sprawdzenia SOC, planowanie zużycia
(lodówka/autopilot/ploter w Ah na dobę), kiedy odpalić silnik/agregat.

### F — SPEC SYMULATORA "Doba na kotwicy" (wybrany showpiece — plan budowy)

**Decyzja:** F jest pierwszym showpiece. Jeden komunikat, jedna procedura, symulator
jako forma. Ambitnie wizualnie (3D), ale wąsko tematycznie.

**One-liner (test klarowności — wszystko, co nie służy temu zdaniu, wylatuje):**

> "Zobacz, dokąd idzie Twój prąd przez dobę na kotwicy — i czemu bateria pada szybciej, niż myślisz."

**Stan rynku (czemu to ma sens):** dziś istnieją tylko arkusze Excela (West Marine
Electrical Budget Worksheet), statyczne kalkulatory HTML (eMarine) i blogi (Pier du Sud).
Victron ma telemetrię PO zakupie (VRM) i teorię w PDF (Energy Unlimited), ale nic
pomiędzy: zero narzędzi planowania/symulacji/nauki. Nikt nie łączy symulacji,
wizualizacji i edukacji.

#### Procedura, której uczymy (jedna!)

**"Dobowy rytuał energetyczny na kotwicy"** — kompetencja, którą powinien mieć każdy,
kto nocuje poza mariną (w tym każdy klient czarteru):

1. **Wieczór (kotwiczenie):** sprawdź SOC startowy → świadomie zdecyduj, co zostaje
  włączone na noc (lodówka TAK, światło kotwiczne TAK — obowiązek; reszta to wybór).
2. **Noc:** zrozum pobór nocny (lodówka cykluje, światło kotwiczne świeci — bank
  pracuje, gdy śpisz).
3. **Rano:** rytuał sprawdzenia SOC → ocena "ile zużyłem vs ile planowałem".
4. **Decyzja ładowania:** kiedy odpalić silnik/agregat, ile to realnie da
  (bulk szybki, absorption wolna — tu jest lekcja z Energy Unlimited)
   i czemu "godzina silnika" NIE ładuje do pełna.
5. **Reguła bezpieczeństwa banku:** ołów/AGM nie schodzi poniżej 50% SOC
  (LiFePO4 — inna zasada, to różnica do pokazania przełącznikiem).

#### Dwa widoki, jedna prawda (rdzeń designu)

Każdy element systemu ma jedno ID i istnieje w obu widokach; klik w jednym
podświetla w drugim:

- **Widok 3D (przestrzenny):** łódka 3D (generyczny 10–12 m cruiser, przekrój/cutaway).
Pokazuje GDZIE: bank baterii pod koją, lodówka w kambuzie, panel solarny na pokładzie,
alternator przy silniku. Przepływ energii animowany (cząstki/strumienie wzdłuż
instalacji — czytelne na social media, "wow" w 3 sekundy).
- **Widok schematu (systemowy):** diagram przepływu — źródła (alternator, solar,
shore) → bank (SOC jako "zbiornik") → odbiorniki. Pokazuje ILE: liczby Ah/W na
żywo, suma poboru, bilans doby. To widok "prawdy inżynierskiej" — wiarygodność
dla profesjonalistów i producentów.

Stack: React + Three.js (R3F) dla 3D, SVG dla schematu, wspólny store stanu symulacji.
Model łodzi: generyczny (kupiony/własny low-poly), nie brandowany.

#### Model symulacji (encje i liczby do kalibracji)

**Bank baterii:** pojemność 200/300/400 Ah do wyboru; chemia AGM vs LiFePO4
(przełącznik zmienia: usable capacity 50% vs 80–90%, krzywą ładowania, komunikat
o regule SOC). Krzywe i zasady: Energy Unlimited rozdz. 4 (cytować jako źródło).

**Odbiorniki (na start 6–8, wartości z arkusza West Marine / kalkulatora eMarine —
każda liczba z przypisem źródła w UI):**


| Odbiornik                  | Pobór           | Profil dobowy                                       |
| -------------------------- | --------------- | --------------------------------------------------- |
| Lodówka                    | ~4 A przy pracy | cykl ~40% (auto) — główny "cichy zjadacz", ~40 Ah/d |
| Światło kotwiczne LED      | ~0,4 A          | zmierzch–świt (auto, obowiązkowe)                   |
| Oświetlenie kabiny LED     | ~1,5 A          | wieczór, sterowane przez użytkownika                |
| Ploter + instrumenty       | ~1,5 A          | opcjonalnie (kotwicowy alarm)                       |
| VHF standby                | ~0,5 A          | całą dobę                                           |
| Pompa wody                 | ~4 A            | krótkie impulsy przy użyciu                         |
| Ładowanie telefonów/USB    | ~1,5 A          | wieczór/rano                                        |
| Webasto/ogrzewanie (opcja) | ~2–4 A          | noc, jeśli włączone — "pożeracz" do odkrycia        |


**Źródła ładowania:** alternator (60–80 A nominalnie, ALE prąd akceptacji banku
ogranicza realne ładowanie — kluczowa lekcja), solar 200 W (~50–60 Ah/d, zależnie
od pogody — suwak zachmurzenia jako element zabawy).

**Czas:** symulacja doby 18:00 → 18:00, przyspieszona (~2–3 min realne), z pauzą
i przewijaniem. Zdarzenia: zmierzch, noc, świt, poranny rytuał, decyzja ładowania.

#### Beaty edukacyjne (wplecione w symulację, nie osobne slajdy)

1. Po pierwszej nocy: "Spałeś. Bank oddał X Ah. Oto kto je zjadł" (ranking odbiorników).
2. Przy odpaleniu silnika: wykres bulk→absorption na żywo + "dlaczego ostatnie 20%
  trwa godzinami" (Energy Unlimited, rozdz. 4.2).
3. Przy SOC < 50% (ołów/AGM): ostrzeżenie + wyjaśnienie, co głębokie rozładowania
  robią z żywotnością.
4. Finał doby: bilans (zużyte/wyprodukowane/stan banku) + pytanie-hak pod plaster 2:
  "Chcesz dołożyć lodówkę 12 V? Sprawdź, czy Twój bank to udźwignie" → CTA.

#### Plan plastrów (każdy = publiczny URL + post)

- **Plaster 1 (timebox: 5 dni roboczych do publikacji):** symulacja doby, 1 łódź,
bank AGM 300 Ah, 6 odbiorników, oba widoki, beaty 1–2. BEZ kont, BEZ backendu,
BEZ wyboru łodzi. EN-only. Disclaimer + sekcja "Sources".
- **Plaster 2:** kreator decyzyjny "czy mogę dokupić X?" (konfiguracja własnego
banku i odbiorników → werdykt z marginesem) + przełącznik AGM/LiFePO4.
- **Plaster 3:** warstwa procedur — zimowanie baterii (procedura C wraca tutaj),
ładowanie z brzegu; ewentualnie moduł NMEA (procedura E) jako kolejna warstwa
tego samego modelu łodzi.

Timebox to detektor scope'u: jeśli plaster 1 nie wychodzi w 5 dni, problemem
jest zakres, nie czas — tnij, nie przedłużaj.

#### Wiarygodność (pancerz przed forami)

- Każda liczba z przypisem: Energy Unlimited (rozdz./strona), arkusz West Marine,
dane producenta. Widoczna sekcja "Sources & assumptions".
- Jawne założenia uproszczeń (temperatura pominięta w v1, sprawności przybliżone).
- Disclaimer: koncept edukacyjny, nie porada instalacyjna; instalacje elektryczne —
do certyfikowanego instalatora.
- Brand-agnostycznie: zero logotypów producentów w v1 (białe etykiety "200 W solar",
nie "Victron MPPT").

**Miary sukcesu plastra 1:**

- Użytkownik po 5 minutach umie powiedzieć, czemu nie wolno przerywać ładowania
w fazie absorpcji i ile godzin lodówki ma w swoim banku.
- Post z demo zbiera komentarze merytoryczne (nie tylko lajki) — fora/grupy reagują
na liczby, nie tylko na wizualia.
- Min. 1 wiadomość inbound ALBO materiał wystarczający, by wysłać 10 wiadomości
  outbound z sekcji 13 (outreach NIE czeka na plaster 2).

#### Interfejs eduboat — flagowy ekran (widok 3D)

**Opis:** pełnoekranowy symulator, noc na kotwicy. Centrum: low-poly jacht żaglowy
(sloop, żagle zrzucone, światło kotwiczne na topie masztu świeci) na spokojnej ciemnej
wodzie z księżycową poświatą; kadłub w przekroju (cutaway) — widać wnętrza: bank
baterii na śródokręciu (świecący cyjanowo zbiornik z poziomem 64%), lodówkę w kambuzie,
panel na rufie, ploter przy zejściówce. Strumienie energii: bursztynowe cząstki płyną
z banku do włączonych odbiorników (lodówka pulsująca cyklicznie, światło kotwiczne),
nic nie płynie do wyłączonych. Lewy panel ze szkła: pionowa lista 6 odbiorników
z przełącznikami i poborami ("Fridge 4.0 A · cycling", "Anchor light 0.4 A"...),
suma na dole "Tonight: −38 Ah". Prawy górny róg: duży wskaźnik SOC jako pionowy
zbiornik 64% z prognozą "Morning: 52%". Dół: oś czasu 18:00→18:00 ze scrubberem
na 02:30, ikony zdarzeń (zmierzch, świt, rytuał poranny), przyciski play/pauza,
przełącznik widoku "3D / Schematic" jako pigułka u góry.

**Prompt (EN, do generatora):**

> Dark-mode full-screen UI design for "eduboat", an interactive 3D boat energy simulator called "A night at anchor", wide landscape screen. Center: a stylized low-poly 3D sailing yacht (sloop, sails furled, glowing anchor light at masthead) floating on calm dark water with subtle moonlit reflections, deep ink-navy scene (#0A141F), soft cinematic lighting. The hull is a cutaway revealing interior systems: a battery bank glowing cyan-teal (#5FD4C4) shown as a tank filled to 64%, a fridge in the galley, a chartplotter at the companionway. Warm amber energy particles (#F0A35E) stream from the battery along the hull to the devices that are ON — the fridge pulses in cycles, the anchor light glows — while OFF devices stay dark. Left: a matte frosted dark-glass panel (#16222E, deeply rounded corners) listing 6 devices with toggle switches and live draws: "Fridge 4.0 A — cycling", "Anchor light 0.4 A", "VHF standby 0.5 A", "Cabin lights", "Phone charging", "Water pump", with a total "Tonight: −38 Ah". Top right: a large vertical SOC tank gauge at 64% with forecast "Morning: 52%". Bottom: a timeline scrubber from 18:00 to 18:00 positioned at 02:30 with event icons (dusk, dawn, morning check), play/pause, and a "3D / Schematic" view toggle pill at top. Typography exclusively Google Sans Flex, off-white (#F1F1F1), tabular numerals. Serene, premium clean-tech, quietly cinematic.

#### Interfejs eduboat — widok schematu + ładowanie (drugi prompt)

**Opis:** ten sam moment symulacji, przełączony na widok systemowy. Lewa strona:
diagram przepływu — u góry źródła (alternator z ikoną silnika, panel solarny
z suwakiem zachmurzenia, shore power wygaszone), pośrodku bank jako duży poziomy
zbiornik SOC 52% z zaznaczoną linią 50% ("lead-acid floor"), na dole rząd odbiorników
z bieżącymi poborami; połączenia: cyjanowe linie od działającego alternatora do banku
(grube, z animowanymi strzałkami i wartością "+42 A"), bursztynowe cienkie do
odbiorników. Prawa strona: karta lekcji — wykres krzywej ładowania bulk→absorption→float
(oś czasu, oś prądu/napięcia), aktualny punkt na granicy bulk/absorption, adnotacja
"Why the last 20% takes hours" i przypis źródła "Energy Unlimited, ch. 4.2".
U góry pigułka "3D / Schematic" z aktywnym "Schematic"; elementy mają te same ID
co w 3D (np. podświetlona lodówka).

**Prompt (EN, do generatora):**

> Dark-mode UI design for "eduboat", schematic view of a boat energy simulator, wide landscape screen, deep ink-navy background (#0A141F) with a faint sailing yacht outline watermark. Left two-thirds: a clean energy-flow diagram on matte frosted dark-glass tiles (#16222E, deeply rounded corners): at top three sources — engine alternator (active), solar panel with a cloud-cover slider, shore power (dimmed off); in the middle a large horizontal battery tank showing SOC 52% with a marked red-line at 50% labeled "lead-acid floor"; at bottom a row of consumer tiles (fridge, anchor light, VHF, lights) with live amp readouts. Connections: a thick cyan-teal line (#5FD4C4) with animated arrowheads flows from alternator to battery labeled "+42 A"; thin warm amber lines (#F0A35E) flow from battery to active consumers. Right third: a lesson card with a charging-curve chart showing bulk, absorption and float phases over time, the current point sitting at the bulk-to-absorption transition, annotation "Why the last 20% takes hours" and a small source footnote "Energy Unlimited, ch. 4.2". Top center: a "3D / Schematic" toggle pill with "Schematic" active. Typography exclusively Google Sans Flex, off-white text (#F1F1F1), tabular numerals. Precise, calm, engineering-grade clean-tech aesthetic.

---

**Kolejność (zaktualizowana po dodaniu D–F):**

- **Najszerszy zasięg pitchu:** E (NMEA 2000) — dotyczy wszystkich producentów naraz,
idealna dla platform i retailerów (SVB robi z tego content, Ty robisz z tego produkt).
- **Najlepszy pokaz umiejętności symulacyjnych:** F (energia) — symulator SOC to
showpiece, którego nikt inny nie zrobi tak dobrze jak osoba po zbudowaniu Sally.
- **Najbliżej bólu konkretnego działu aftersales:** D (autopilot) albo A (hydrogeneracja),
jeśli pitch idzie do jednego producenta.
- **Argument gwarancyjny:** B (Spectra). **Timing sezonowy:** C (zimowanie,
okno sierpień–październik).
- **DECYZJA (12.06.2026): pierwszym showpiece jest F** — symulator "Doba na kotwicy"
(pełny spec powyżej). E i C wracają jako kolejne plastry tego samego narzędzia;
A/B/D zostają w zanadrzu pod pitch do konkretnego producenta.

---

## 13. Jak to pitchować — dokładne komunikaty per kanał

Zasada nadrzędna: **nikt nie kupuje "interaktywnych manuali"**. Platforma kupuje
feature różnicujący do sprzedaży stoczniom. Producent kupuje mniej ticketów
i roszczeń gwarancyjnych. Publika kupuje historię "ktoś w końcu to naprawił".
Ten sam artefakt, trzy różne języki.

### Kanał A — platformy owner-app (Sentinel i podobni)

Adresat: CEO/Head of Product (firmy są małe, decydent jest blisko).
Forma: LinkedIn DM, potem follow-up mailem z Loomem.

> Hi [Name], I noticed the documents section in [Platform] still serves owner
> manuals as static PDFs. I design interactive, task-based guides for marine
> hardware — here's a 2-minute video showing what [a Torqeedo hydrogeneration
> guide / a watermaker commissioning flow] could look like inside your app,
> in your branding: [Loom link]
>
> For your shipyard partners this is a differentiating feature — owners actually
> complete procedures instead of calling support. Worth a 20-minute call?

Follow-up (po 5–7 dniach, jeśli cisza):

> Quick follow-up — I've also published the live demo here: [URL]. If interactive
> guides aren't on your roadmap, no worries; happy to hear what is.

Kluczowe słowa do używania: *differentiating feature, white-label, owners complete
procedures, reduce support load for your shipyard partners*. Unikać: "replace
manuals", "redesign", "AI".

### Kanał B — producent sprzętu (Head of Aftersales / Product Manager)

Adresat: Head of Aftersales, Customer Support Manager, Product Manager danej linii.
Forma: LinkedIn DM; krótko, liczbowo, z konkretem ich produktu.

> Hi [Name], every [autumn/season], support teams at electric propulsion companies
> drown in tickets about [regeneration mode / battery storage] — and most of those
> tickets exist because the procedure lives on page [26] of a PDF.
>
> I took the [hydrogeneration] procedure from the [Cruise] manual and rebuilt it
> as an interactive, step-by-step mobile guide — here's a 2-minute walkthrough:
> [Loom link]. Guides like this typically cut repeat "how do I" tickets and
> prevent the equipment damage that turns into warranty claims.
>
> Would it be useful to see this with your actual support-ticket top 5?

Kluczowe słowa: *seasonal support tickets, warranty claims, equipment damage from
user error, page 26 of a PDF, step-by-step mobile guide*. Liczby zawsze ich:
"your support-ticket top 5", nie wymyślone procenty. Unikać: obiecywania "40% redukcji"
w pierwszej wiadomości (to teza na call, nie na cold DM).

### Kanał C — publicznie (LinkedIn post + fora żeglarskie)

Forma: post z wideo/gifem demo + link. Ton: pokazuję, nie sprzedaję.

> Marine hardware manuals contain everything — except a way to actually learn from them.
>
> I took one high-risk procedure from a [Torqeedo] manual (hydrogeneration —
> the one people get wrong) and rebuilt it as an interactive guide:
> condition gates, visual checks, error paths. One step per screen.
>
> Live demo: [URL]
>
> The manual stays — it's a legal document. But the 5 procedures that generate
> 80% of support tickets deserve a better format. Curious what the industry thinks.

Na fora (SailingAnarchy, Cruisers Forum, polskie grupy żeglarskie) — wersja bez
żargonu sprzedażowego: "zbudowałem interaktywną wersję procedury X, przetestujcie,
czego brakuje". Forum daje feedback merytoryczny i wiarygodność (link do wątku
można potem pokazać producentowi jako walidację).

Disclaimer na demo (prawnie i wizerunkowo konieczny):

> Independent design concept. Not affiliated with [Brand]. Always follow the
> official manual.

### Higiena outreachu

- Personalizacja minimum: nazwa produktu adresata + jeden konkret z ich materiałów.
- Maks. 2 follow-upy, potem stop — lista jest mała, nie wolno jej wypalić.
- Wszystko po angielsku; do polskich stoczni (Galeon, Delphia, Parker Poland) po polsku.
- Loom zawsze < 2:30 min: 20 s problem → 90 s klikanie po demo → 20 s "co dalej".

---

## 14. Algorytm eksperymentu — sygnały, interpretacje, decyzje

### Etap 0 — Build (maks. 2 tyg.)

- **Cel:** działające demo pod publicznym URL-em + Loom + 3 szablony wiadomości.
- **Kryterium wyjścia:** osoba spoza żeglarstwa przechodzi flow bez pomocy w < 3 min.
- **Pułapka:** dopieszczanie. Demo ma być piękne wizualnie (to Twoja przewaga),
ale jedna procedura, jeden język (EN), zero backendu, zero kont użytkowników.

### Etap 1 — Outreach fala 1 (2 tyg., 30 wiadomości)

10 × kanał A (platformy), 15 × kanał B (producenci), 1 post LinkedIn + 2 wątki forum.


| Sygnał                                                               | Co komunikuje                                               | Akcja                                                                                                          |
| -------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Brak odczytań / brak odpowiedzi (< 10% reply rate)                   | Problem z dotarciem lub komunikatem, NIE z produktem        | Przepisz wiadomość, zmień adresatów (inne stanowiska), nie ruszaj demo                                         |
| "Looks great, but no budget / not a priority"                        | Ból istnieje, ale nie jest wyceniony — segment może być zły | Zanotuj KTO tak mówi; jeśli to wzorzec u producentów, przesuń ciężar na platformy (oni monetyzują feature'ami) |
| "Send more info" bez calla                                           | Grzecznościowe spławienie                                   | Jeden follow-up z konkretnym pytaniem ("which procedure generates most tickets for you?"), potem stop          |
| Pytania techniczne ("does it integrate with…", "can it do offline…") | Realne rozważanie wdrożenia                                 | Priorytet na call; pytania zapisuj — to jest spec produktu pisany przez rynek                                  |
| Call umówiony                                                        | Jedyny sygnał, który się liczy w fazie 1                    | Cel calla: nie sprzedać, tylko wyciągnąć top 5 ticketów i kto ma budżet                                        |
| Feedback z forów ("brakuje X", "u mnie wygląda to inaczej")          | Walidacja merytoryczna + materiał dowodowy                  | Wpleć w demo lub w pitch ("sailors on [forum] flagged exactly this")                                           |


**Próg decyzyjny po fali 1:** ≥ 3 calle z 30 wiadomości → Etap 2.
1–2 calle → popraw komunikat, fala 2 do nowych 30 adresatów (inny kanał ciężarowo).
0 calli przy dobrym reply rate → teza o budżecie pada dla tego segmentu; pivot
(np. czartery/szkoły żeglarskie zamiast producentów) albo świadomy stop.

### Etap 2 — Calle (cel: diagnoza, nie sprzedaż)

- **Cel:** dowiedzieć się (a) które procedury generują tickety, (b) kto jest właścicielem
tego kosztu w organizacji, (c) czy kiedykolwiek płacili komuś zewnętrznemu za content/UX.
- **Sygnał pozytywny:** rozmówca sam zaczyna mówić "moglibyśmy to użyć do X" —
produkt definiuje się sam.
- **Sygnał ostrzegawczy:** entuzjazm bez konkretu ("love it, let's stay in touch") —
licz tylko rozmowy, które kończą się następnym krokiem z datą.
- **Wyjście z etapu:** propozycja płatnego pilota: jedna procedura z ICH materiałów,
stała cena, 2–3 tygodnie, mierzalny cel (np. podpięcie pod QR na produkcie).

### Etap 3 — Płatny pilot

- **Cel:** pierwszy przychód = jedyny twardy dowód tezy "to znajdzie budżet".
- **Sygnał:** negocjowanie ceny to sygnał POZYTYWNY (chcą kupić); cisza po wycenie
to wynik, nie porażka — wraca do Etapu 2 z następnym prospectem.
- **Dopiero tutaj** wchodzą inwestycje typu 3D/Three.js, integracje z platformami,
drugi język — finansowane z projektu, nie z nadziei.

### Meta-reguła całego eksperymentu

Każdą wątpliwość rozstrzygaj wysyłką, nie budowaniem. Jeśli wahasz się między
"dodać jeszcze feature do demo" a "wysłać 5 kolejnych wiadomości" — wysyłaj.
Demo, które widziało 0 decydentów, ma wartość 0 niezależnie od jakości.

---

## 15. Wycena płatnych pilotów — co liczyć i ile

### Co tak naprawdę sprzedajesz (i co musi być w wycenie)

Pilot to NIE "zaprojektowanie ekranów". W jednej usłudze składasz pięć kompetencji,
które klient normalnie kupowałby osobno — i wycena ma to odzwierciedlać:


| Składnik             | Co obejmuje                                                                                                                                                       | Udział w pracy |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Discovery / analiza  | Analiza ticketów supportu, wywiad z serwisem, wybór procedury, task analysis                                                                                      | ~15%           |
| Instructional design | Rozbicie procedury na kroki i decyzje, bramki warunków, ścieżki błędów, walidacje — myślenie systemowe, którego nie ma ani w UX-agencji, ani w technical writerze | ~25%           |
| UX/UI + ilustracja   | Flow mobile-first, ilustracje sprzętu ("gdzie to jest na urządzeniu"), branding klienta                                                                           | ~30%           |
| Development          | Działający webowy przewodnik (embed/standalone/QR), responsywność, offline-friendly                                                                               | ~20%           |
| PM + QA + handoff    | Koordynacja z ich zespołem, test na realnych użytkownikach, dokumentacja wdrożenia                                                                                | ~10%           |


Argument cenowy na call: *"You'd need an instructional designer, a UX studio and
a developer to get this — I'm one person, one contract, three weeks."* To uzasadnia
stawkę wyższą niż freelancer-wykonawca, bo sprzedajesz zintegrowany rezultat,
nie roboczogodziny.

### Widełki per grupa docelowa

Punkt odniesienia: senior product designer/developer w EU B2B to realnie
500–800 EUR/dzień. Pilot = 12–18 dni pracy. Stąd widełki:


| Grupa docelowa                                                           | Pilot (1 procedura)     | Komentarz                                                                                                                                                       |
| ------------------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Producent osprzętu, SME premium** (Torqeedo-class, Spectra, Oceanvolt) | **6 000 – 10 000 EUR**  | Sweet spot eksperymentu. Poniżej progu, przy którym Head of Aftersales potrzebuje zgody zarządu/procurementu (zwykle ~10k) — decyzja zapada na jednym szczeblu. |
| **Platforma owner-app** (Sentinel-class, małe zespoły)                   | **4 000 – 7 000 EUR**   | Mniejsze budżety, ale krótsza ścieżka decyzyjna i potencjał na model licencyjny (niżej). Tu cena kupuje Ci referencję i dystrybucję.                            |
| **Duża stocznia / korporacja** (Beneteau-class, Brunswick, Navico)       | **12 000 – 25 000 EUR** | Dłuższy cykl (procurement, legal), więcej interesariuszy — cena musi pokryć narzut komunikacyjny. Nie zaczynaj eksperymentu od nich.                            |
| **Polski rynek** (Galeon, Parker Poland, Delphia, czartery)              | **20 000 – 40 000 PLN** | Niższe budżety, ale łatwiejsza relacja i szybka referencja. Dobre na pierwszy pilot "na rozruch", jeśli kanały EN milczą.                                       |


### Pakiety po pilocie (gdzie jest prawdziwy biznes)

Pilot otwiera drzwi — marża jest w kontynuacji:

- **Biblioteka procedur** (top 5 ticketów): 18 000 – 35 000 EUR — koszt jednostkowy
procedury spada (design system i komponenty już są), cena jednostkowa spada wolniej.
- **Retainer** (aktualizacje przy zmianach produktu, nowe warianty, tłumaczenia):
800 – 2 000 EUR/mies.
- **Model licencyjny dla platform**: setup 5 000 – 10 000 EUR + opłata za stocznię/markę
(np. 200 – 500 EUR/mies. per brand w ich white-labelu). Tylko jeśli platforma
zostaje partnerem dystrybucyjnym, nie jednorazowym klientem.
- **Rozszerzenia 3D / integracje** (Three.js, modele producenta, API platformy):
wyceniane osobno, dopiero po udanym pilocie — nigdy w cenie pilota.

### Zasady adekwatności ceny

1. **Dolna granica: 4 000 EUR.** Poniżej tego sygnalizujesz hobby, nie usługę —
  a paradoksalnie obniżasz zaufanie kupującego B2B ("czemu tak tanio?").
   Jeśli ktoś nie ma 4k, nie ma też budżetu na wdrożenie i utrzymanie.
2. **Górna granica pilota: próg samodzielnej decyzji menedżera (~10k EUR).**
  Pilot ma być kupowalny bez procurementu. Drogo będzie w fazie skali, nie w fazie dowodu.
3. **Fixed price, nie stawka godzinowa.** Klient kupuje rezultat ("działający
  przewodnik dla procedury X w 3 tygodnie"), nie Twoje godziny. Stawka dzienna
   tylko dla discovery, jeśli klient chce zacząć od analizy (800 EUR/dzień, 2–3 dni).
4. **Discovery zawsze płatne albo wliczone — nigdy darmowe osobno.** Darmowa analiza
  ticketów to konsulting za zero. Można za to odjąć koszt discovery od ceny pilota
   przy kontynuacji ("credited towards the pilot").
5. **Pierwszy pilot w ogóle: można zejść do dolnej granicy w zamian za twarde warunki** —
  case study z nazwą i logo, mierzalne dane (tickety przed/po), zgoda na publiczne
   demo. Rabat zawsze ZA coś, nigdy "bo początek".
6. **Kotwiczenie w wartości, nie w koszcie pracy:** jedna zniszczona membrana watermakera
  to 2–4k EUR roszczenia; jedna bateria po złym zimowaniu to 3–8k EUR. Pilot zwraca się
   po kilku unikniętych przypadkach — ten rachunek otwiera rozmowę o cenie, nie cennik.

---

## 16. Lista celów outreachu (pod symulator "Doba na kotwicy")

Strategia: zacznij obserwować i sensownie komentować TERAZ (2–3 tygodnie przed
publikacją plastra 1), żeby w momencie wysyłki nie być zimnym kontaktem.
LinkedIn = kanał B2B; YouTube/Instagram/fora = kanał publiczny.
Osoby zweryfikowane na czerwiec 2026 — przed wysyłką sprawdź, czy nadal pełnią rolę.

### Tier 1 — Media i wzmacniacze (darmowa dystrybucja, najpierw oni)


| Kto                                       | Rola / dlaczego                                                                                                                                                                                       | Gdzie                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Ben Stein**                             | Editor/publisher **Panbo** (panbo.com) + electronics editor PassageMaker, Power & Motoryacht, Soundings. Regularnie pisze o LiFePO4, monitoringu, energii. Jeden artykuł na Panbo = cała branża widzi | panbo.com/about-panbo, LinkedIn             |
| Ben Ellison                               | Senior editor Panbo (założycielska postać bloga)                                                                                                                                                      | panbo.com                                   |
| **Steve Mitchell**                        | Editor **SeaBits** (seabits.com); razem z Panbo prowadzi Marine Electronics Forums                                                                                                                    | seabits.com/forums                          |
| **Jeff Cote**                             | **Pacific Yacht Systems** — 500+ wideo o systemach, seminaria o energii z setkami tysięcy wyświetleń; jego widownia to dokładnie Twoi użytkownicy                                                     | pysystems.com, YouTube @PacificYachtSystems |
| Practical Sailor / PBO / Yachting Monthly | Działy techniczne magazynów — piszą o budżetach energetycznych co sezon                                                                                                                               | redakcje przez LinkedIn                     |


### Tier 2 — Ekosystem Victron (największa społeczność energetyczna w marine)


| Kto                                                     | Rola / dlaczego                                                                                                                         | Gdzie                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Guy Stewart**                                         | Community Manager Victron — zarządza forum (160k użytkowników/mies.)                                                                    | community.victronenergy.com (Discourse) |
| Victron blog                                            | Publikują projekty społeczności i gościnne wpisy; symulator oparty o ich książkę (Energy Unlimited, z cytowaniem) to naturalny materiał | victronenergy.com/blog                  |
| Kategoria "Show us your system" / "Modifications"       | Miejsce na pokazanie symulatora społeczności bez pitchowania                                                                            | community.victronenergy.com             |
| Aktywni dealerzy-twórcy treści (np. Sun Powered Yachts) | Robią content edukacyjny o Victronie — chętnie podlinkują narzędzie                                                                     | ich blogi/IG                            |


Uwaga strategiczna: Victron to jednocześnie największy sojusznik (społeczność,
autorytet źródła) i ryzyko (mogą zrobić in-house). Graj z nimi przez społeczność
i cytowanie źródeł, nie przez cold pitch do centrali.

### Tier 3 — Producenci monitoringu/energii (najbliżsi produktowo, kupcy pilota)


| Firma                            | Dlaczego                                                                                                                                                                                              | Do kogo                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Simarine** (Maribor, Słowenia) | Battery monitor PICO, design-first (nagroda METSTRADE), 150+ OEM-ów, mała firma = decydent blisko; kulturowo/geograficznie blisko PL. Twój symulator to ich kategoria produktowa w wersji edukacyjnej | dyrektor: **Igor Kocman**; LinkedIn firmy |
| Mastervolt (grupa Brunswick)     | Energia marine, CZone digital switching                                                                                                                                                               | PM/marketing przez LinkedIn               |
| Philippi, Votronic (DE)          | Monitoring/dystrybucja DC, silni w EU                                                                                                                                                                 | jw.                                       |
| Balmar, Wakespeed (US)           | Alternatory/regulatory — sekcja "alternator nie ładuje do pełna" to ich lekcja                                                                                                                        | jw.                                       |
| Battle Born, Epoch, Super B      | LiFePO4 — przełącznik AGM/LiFePO4 w symulatorze to ich argument sprzedażowy                                                                                                                           | jw.                                       |


### Tier 4 — Platformy owner-app (kanał A z sekcji 13)


| Firma                         | Dlaczego                                                                 | Do kogo                       |
| ----------------------------- | ------------------------------------------------------------------------ | ----------------------------- |
| **Sentinel Marine** (Lublana) | 45k użytkowników, 40 stoczni, white-label; sekcja dokumentów = PDF-y     | CEO/Head of Product, LinkedIn |
| Yacht Sentinel                | Partner Platform dla stoczni, "manuale w appce"                          | jw.                           |
| Vanemar                       | Boat monitor, świeżo recenzowany na Panbo — szukają widoczności          | jw.                           |
| Siren Marine (Yamaha)         | Monitoring/connected boat w korporacji — dłuższa ścieżka, ale budżety są | PM przez LinkedIn             |


### Tier 5 — Retailerzy i czartery (dystrybucja + walidacja)

- **SVB24** (DE) — robią guide'y i wideo (sekcja 7); symulator jako embed przy
kategorii "energia" = ich konwersja. Kontakt: content/marketing team.
- **eMarine** (US) — mają statyczny kalkulator energii; pitch "wasz kalkulator, 10 lat później".
- West Marine — West Advisor (treści poradnikowe) + arkusz budżetu energii.
- Floty czarterowe (Chorwacja przede wszystkim; Dream Yacht, Navigare) — symulator
jako szkolenie klienta przed odbiorem łodzi; wejście przez managerów baz.

### Gdzie szukać ludzi (metody, nie tylko nazwiska)

1. **METSTRADE** (Amsterdam, listopad) — katalog wystawców online = pełny spis firm
  marine-tech z kategoriami; kategoria DAME Award = firmy wrażliwe na design.
   boot Düsseldorf (styczeń) — to samo dla EU.
2. **LinkedIn search:** `"head of aftersales" marine`, `"product manager" [firma]`,
  `"customer support manager" marine electronics` — po publikacji plastra 1
   filtruj po "commented on" w postach branżowych.
3. **Panbo + SeaBits + Marine Electronics Forums** — komentujący tam to mieszanka
  dealerów, integratorów i product managerów pod prawdziwymi nazwiskami.
4. **Grupy FB:** "Victron Energy Owners", grupy LiFePO4/boat electrical DIY —
  tam mieszka Twój użytkownik testowy (i niejeden pracownik producenta po godzinach).
5. **Reddit:** r/sailing, r/liveaboard, r/boatbuilding — dobre na publiczny launch
  plastra 1, słabe na B2B.

### Rytm działania (od dziś do wysyłki)

1. Tydzień 1–2: zafollowuj Tier 1 + 5–10 firm z Tier 3/4 na LinkedIn; włącz
  powiadomienia dla Panbo/SeaBits; dołącz do Victron Community i 2 grup FB.
2. Komentuj merytorycznie 2–3 razy w tygodniu (bez wzmianki o projekcie) —
  budujesz rozpoznawalność nicku/nazwiska.
3. Dzień publikacji plastra 1: post LinkedIn + wątek na Victron Community
  ("Show us your system"/Modifications) + Reddit.
4. Dzień +1 do +3: DM-y wg sekcji 13 — najpierw Tier 1 (media), potem Tier 3/4
  (B2B). Media najpierw, bo artykuł na Panbo to dowód społeczny do DM-ów B2B.

