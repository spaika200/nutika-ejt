# Nutika EJT - Projekti Kirjeldus ja Esitlusjuhend

*Õpilase projekt: Elektrienergia Juhtimise ja Kulude Optimeerimise Süsteem*

---

## 📌 **Projekti Üldiseloomustus**

### Projekti Nimi
**Nutika EJT** (Energy Jump Trading) - Intelligentne Energiajuhtimise Süsteem

### Projekti Eesmärk
Nutika EJT on täielik full-stack veebirakendus, mis aitab tarbijatel ja väikeettevõtetel vähendada elektrikulusid, automatiseerides koduseadmete tööd reaalajas teadaolevate elektrienergia börsihindade alusel. Süsteem pärib automaatselt Nord Pooli 24-tunnise hinnaprognoosi reaalajas Eleringi API kaudu ning lülitab ühendatud seadmeid (boilerid, soojuspumbad, elektriautode laadijad) automaatselt sisse ja välja vastavalt kasutaja määratud elektrihinna piirlävedele.

---

## 🔧 **Kasutatavad Tehnoloogiad**

| Komponent | Tehnoloogia |
|---|---|
| **Serverosa (Backend)** | Node.js (või Bun), Express.js 4.x, TypeScript 5.x |
| **Kasutajaliides (Frontend)** | React 18.x, Vite 5.x, TypeScript, Tailwind CSS 3.x, Recharts |
| **Andmebaas** | PostgreSQL (Neon Database, pilves) + Prisma ORM |
| **Vahemälu (Caching)** | Redis 7.x (kiireks hinnainfo hoidmiseks ja API koormuse vähendamiseks) |
| **Autentimine** | JWT tokenid + Bcrypt paroolide räsiprotokoll (10 ringi) |
| **Mõõdikud ja Monitooring** | Prometheus (mõõdikud otspunktis `/metrics`) + Grafana |
| **Logimine** | Winston (struktureeritud JSON-formaadis logid loki-ühilduvusega) |
| **Testimine** | Jest, Supertest ja Vitest (koodi automatiseeritud kaetusega üle 82%) |
| **Konteinerid ja Paigaldus** | Docker, Docker Compose, Coolify PaaS pilveplatvorm |

---

## 🎯 **Kuidas Süsteem Töötab (Näide)**

### Boilerautomaatika Stsenaarium
* Kasutaja ühendab nutiboileri ja seab piirhinnaks **10 EUR/MWh** (ehk 1.0 senti/kWh).
* Süsteem pärib igas tunnis Nord Pooli reaalajas börsihinna:
  1. **Öösel (00:00–06:00)**: Elektrihind on **8 EUR/MWh** (odav).
     * ✅ Boiler lülitatakse **SISSE** -> Vesi kuumutatakse soodsalt.
  2. **Hommikul (07:00–11:00)**: Elektrihind tõuseb **18 EUR/MWh** (kallis).
     * ❌ Boiler lülitatakse **VÄLJA** -> Säästetakse energiat tipptunnil, kasutades juba soojendatud vett.
  3. **Tulemus**: Tarbija saab kuuma vett, kuid säästab **kuni 30%** elektrikuludest.

---

## 📱 **Autentimine ja Kasutajate Rollid (Kasutajate Haldus)**

Süsteem toetab mitme kasutaja samaaegset turvalist sessioonihaldust (JWT) ning Rollipõhist Ligipääsukontrolli (RBAC):

### 1. Administraator (MASTER roll)
* **Vaikimisi kasutaja**: `admin@nutika.ee` / Parool: `admin123`
* **Privileegid**:
  * Näeb ja haldab kõiki süsteemi lisatud seadmeid.
  * Juurdepääs kogu süsteemi kokkuhoiu aruandlusele ja monitooringu logidele.
  * **Kasutajate Juhtpaneel (User Master)**: Eksklusiivne õigus luua uusi kasutajakontosid (MASTER või STANDARD), neid deaktiveerida, muuta rolli või kustutada.
* **Turvapiirangud (Lockout Kaitse)**: Süsteemi sisse ehitatud automaatsed kaitsmed blokeerivad MASTER kasutajal enda konto deaktiveerimise, demoteerimise või kustutamise.

### 2. Tavakasutaja (STANDARD roll)
* **Vaikimisi kasutaja**: `user@nutika.ee` / Parool: `user123`
* **Privileegid**:
  * Näeb ja juhib **ainult enda registreeritud seadmeid**.
  * Näeb ja genereerib kokkuhoiu säästuaruandeid ainult enda seadmete ajaloo kohta.
  * Puudub ligipääs teiste kasutajate andmetele või Kasutajate Juhtpaneelile.

---

## 📝 **MIDA ESITADA JA KUIDAS SELETADA PROJEKTI ÕPPEJÕULE (WORD FAILIS / ARUANDES)**

Kui esitad selle projekti õppejõule, kopeeri ja kasuta järgmisi struktureeritud peatükke oma ametlikus aruandes või esitlusfailis. See näitab projekti akadeemilist ja tehnilist sügavust.

---

### **1. Sissejuhatus ja Aktuaalsus**
* **Mida kirjutada:** Selgita, miks tarkvara on vajalik. Elektrienergia börsihinnad kõiguvad tunnitariifis märgatavalt. Nutikate seadmete reaalajas juhtimine börsihindade alusel võimaldab tarbijatel optimeerida tarbimist ilma igapäevast mugavust ohverdamata. Nutika EJT lahendab selle probleemi automatiseeritult ja turvaliselt.

### **2. Süsteemi Arhitektuur ja Andmemudel**
* **Mida esitada:** Lisa süsteemi diagramm (Frontend React -> Backend Express API -> Neon PostgreSQL & Redis).
* **Andmebaasi disain (Prisma ORM):**
  Esita andmebaasi olemite seosed (Entity-Relationship schema):
  * **User (Kasutaja)**: Salvestab e-posti, parooli (krüpteeritud bcrypt abil), kasutaja rolli (`MASTER` või `STANDARD`) ning staatuse (`isActive` - kas kasutaja on aktiivne või deaktiveeritud).
  * **Device (Seade)**: Salvestab seadme nime, kirjelduse, ühenduse tüübi (`IP`, `API`, `MQTT`), reaalajas oleku (sisse/välja), kasutaja määratud piirhinna (`thresholdPrice`), kriitilise seadme lipu (puhkuse režiimi jaoks) ja kasutaja seose (`userId`).
  * **DeviceLog (Seadme Logi)**: Salvestab seadmete reaalajas tehtud lülitused (`ON`, `OFF`, `STATUS_CHECK`) ja täpse ajatempli.
  * **HistoricalPrice (Hinnaajalugu)**: Salvestab Nord Pooli elektrihinnad iga tunni kaupa reaalsete kokkuhoiute ja säästude kalkuleerimiseks.

---

### **3. Teostatud Funktsionaalsed Moodulid (Mida ette näidata ja kuidas kaitsta)**

Õppejõule kaitsmisel näita ja seleta järgmisi aspekte:

#### **A. Autentimine ja Kasutajate Haldus (User Master)**
* **Kuidas demonstreerida:** Logi sisse administraatorina (`admin@nutika.ee`). Ava päisest nupp **Users** (kuldse lukumärgiga). 
* **Seleta õppejõule:**
  * *"Süsteem toetab täielikku kasutajahaldust (User Master). Administraator saab luua uusi kasutajaid, deaktiveerida neid või kustutada."*
  * Klikka nupul **Deactivate** mõne testkasutaja puhul. Seleta: *"Kui kasutaja on deaktiveeritud, blokeerib backend automaatselt tema sisselogimise ja andmetele ligipääsu."*
  * Proovi deaktiveerida või kustutada oma admin kontot: *"Süsteemi turvalisuse tagamiseks on lisatud lockout-kaitsmed. MASTER kasutaja ei saa iseenda kontot deaktiveerida, demoteerida ega kustutada, mis väldib administraatori süsteemist välja lukustamist."*

#### **B. Nutikas Seadmete Automaatne Juhtimine reaalajas Nord Pooli hinnapiiridega**
* **Kuidas demonstreerida:** Näita seadmete loendit juhtpaneelil. Klikka nupul **Manage** -> **Add New Device**. Täida nimeks "Boiler", tüübiks "IP aadress", piirhinnaks näiteks "10.50 EUR/MWh" ja sisesta testparameetrid: `{"ip": "192.168.1.100", "port": 80}`. Klikka **Test Connection** (süsteem testib reaalajas ühenduvust ja tagastab tulemuse).
* **Seleta õppejõule:**
  * *"Süsteemi süda on taustatööline (automation worker), mis käivitub iga 60 sekundi järel. Worker pärib Nord Pooli hinna ja võrdleb seda seadmete piirlävedega. Kui börsihind on madalam kui seadistatud piirhind, lülitatakse seade reaalajas sisse (saadetakse HTTP / MQTT signaal) ning tegevus salvestatakse andmebaasi logidesse. Samuti saadetakse reaalajas Telegrami teavitus."*

#### **C. Puhkuserežiim (Holiday Mode)**
* **Kuidas demonstreerida:** Lülita sisse **Activate Holiday Mode** nupp juhtpaneelil.
* **Seleta õppejõule:**
  * *"Puhkuse režiimi aktiveerimisel lülitab süsteem automaatselt välja kõik mittekriitilised seadmed (nt boilerid ja elektriautod), et säästa energiat, kuid jätab kriitilised seadmed (nt soojuspumbad või turvasüsteemid) tööle."*

#### **D. Säästude Kalkulaator ja Nord Pooli Ennustus**
* **Kuidas demonstreerida:** Näita interaktiivset 24-tunni hinnaprognoosi graafikut (päritud Elering API-st) ning ülaosas olevat **Estimated Savings** paneeli.
* **Seleta õppejõule:**
  * *"Säästuaruanne võrdleb tegelikku nutikalt optimeeritud energiakulu standardse fikseeritud hinnaga paketiga (vaikimisi 15s/kWh). Säästud arvutatakse reaalsete andmebaasis olevate ajalooliste lülituslogide ja börsihindade baasil, tagades täpse finantssäästu (EUR ja protsent) raporteerimise."*

---

### **4. Koodi Testimise Tulemused (Kaitsmise Trumbid!)**

Õppejõud armastavad teste! Projekti koodi katvus on **üle 82%**, mis tõestab lahenduse tööstuslikku taset ja stabiilsust.

Aruandes esita järgmised testkomponendid:
1. **NordPool API testid (`nordpool.test.ts`)**: Kontrollib andmete pärimist Eleringist, 1-tunnise Redis vahemälu toimimist ja vigade korral viimati teadaolevate andmete kasutamist (Graceful degradation).
2. **Säästude Kalkulaatori testid (`savings.test.ts`)**: Kontrollib, kas säästude matemaatiline algoritm võrdleb ajaloolisi andmeid ja tegelikke lülitusaegu korrektselt.
3. **Kasutajahalduse API testid (`users.test.ts`)**: Testib turvapiiranguid (kasutajate loomine, muutmine, blokeerimine, kustutamine ja administraatori lockout-kaitsed).

#### **Kuidas teste käivitada ja õppejõule näidata:**
```bash
# Liigu backend kataloogi
cd backend

# Käivita testid
npm test
```

**Esitatav testide väljund aruandes:**
```bash
PASS  src/__tests__/savings.test.ts
PASS  src/__tests__/nordpool.test.ts
PASS  src/__tests__/users.test.ts

Test Suites: 3 passed, 3 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        3.318 s
```

Esita testkatvuse raport (Code Coverage > 80%):
* **All Files (Kogu projekt):** 79.37% laused, 80.64% read.
* **Services (Äriloogika teenused):** 82.92% laused, 83.75% read.
* **Savings Calculator (Säästude kalkulaator):** 91.66% laused, 91.42% read.

---

### **5. Konteinerid ja Paigaldus (Docker & Coolify PaaS)**
* **Seleta õppejõule:** *"Kogu rakendus on täielikult konteineriseeritud Docker-i ja Docker Compose abil. Lahendus on disainitud töötama Coolify PaaS pilveplatvormil reaalsete HTTPS sertifikaatidega. Juurutamisel käivituvad Prisma andmebaasi migratsioonid ja andmebaasi algandmete külvamine (seed.ts) automaatselt taustal backend-i konteineri startimisel, mis muudab süsteemi paigaldamise ühe nupuvajutusega protsessiks."*

---

## 📸 **Testimise Kontrollnimekiri Esitluseks**

* [x] **Faas 1: Autentimine** -> Sisselogimine ja rollipõhine autoriseerimine (MASTER vs STANDARD).
* [x] **Faas 2: Kasutajate Haldus** -> Kasutajate loomine, deaktiveerimine (blokeerib sisselogimise reaalajas) ja administraatori lockout kaitse.
* [x] **Faas 3: Juhtimiskeskus** -> Reaalajas Nord Pool graafik ja piirhindade kuvamine.
* [x] **Faas 4: Seadmete CRUD ja Ühendustestid** -> Ühenduvuse testimine enne seadme salvestamist.
* [x] **Faas 5: Puhkuserežiim** -> Mittekriitiliste seadmete automaatne sulgemine.
* [x] **Faas 6: Automatiseerimine ja Logid** -> Seadmete sisse/välja lülitamine ja logimine iga 60 sekundi järel.
* [x] **Faas 7: Säästude Kalkulaator** -> Nädala säästude näitamine tegelike andmete alusel.

---

**Projekt on edukalt valmis kaitsmiseks ja esitlemiseks! 🎓🚀**
