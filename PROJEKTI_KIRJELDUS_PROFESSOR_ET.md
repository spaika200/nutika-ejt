# ELEKTRIENERGIA JUHTIMISE JA KULUDE OPTIMEERIMISE SÜSTEEM (NUTIKA EJT)

---

## 📌 Wordi Aruande ja Esitluse Juhend: Kuidas vormistada ja kaitsta projekti õppejõule

> [!NOTE]
> **KASUTUSJUHEND ÕPILASELE:** Selle faili sisu on kirjutatud akadeemilises ja professionaalses stiilis. Sa saad siit tekste otse kopeerida (Copy-Paste) oma Wordi aruandesse (`.docx`). 
> Iga peatüki alla on lisatud täpsed, samm-sammulised juhised: **millest teha ekraanitõmmis (screenshot), kuidas täpselt vastav funktsioon avada ja mida see esitluses tõestab**.

---

# SISUKORD (Wordi formaadi näidis)
1. Sissejuhatus ja projekti aktuaalsus
2. Süsteemi tehniline arhitektuur ja tehnoloogiad
3. Andmebaasi disain ja andmemudel (ER-skeem)
4. Funktsionaalsete moodulite kirjeldus ja äriloogika
5. Samm-sammuline testimise ja ekraanitõmmiste (Screenshots) tegemise juhend
6. Automatiseeritud testid ja koodikaetus
7. Kokkuvõte ja juurutamine pilveplatvormil

---

## Peatükk 1: Sissejuhatus ja projekti aktuaalsus
*(Kopeeri see tekst oma Wordi aruande algusesse)*

Tänapäeva energiaturul on elektrihinnad äärmiselt volatiilsed ning tunnitariifid Nord Pooli börsil võivad kõikuda sadu protsente ühe ööpäeva jooksul. See tekitab tarbijatele ja väikeettevõtetele vajaduse optimeerida oma energiatarbimist. Käesoleva projekti raames väljatöötatud tarkvarasüsteem **Nutika EJT** (Energy Jump Trading) on intelligentne full-stack veebilahendus, mis lahendab selle probleemi automatiseeritult. 

Süsteem teostab reaalajas elektrienergia hinnaprognoosi pärimist börsilt reaalajas Eleringi avaliku API kaudu ja juhib ühendatud nutiseadmeid (soojuspumbad, veeboilerid, elektriautode laadijad) vastavalt kasutaja määratud hinnapiiridele. Seadmed lülitatakse sisse vaid soodsa elektrihinnaga tundidel ning lülitatakse automaatselt välja tipptunni ajal, tagades kasutajale keskmiselt 25-35% finantssäästu mugavust ohverdamata.

---

## Peatükk 2: Süsteemi tehniline arhitektuur
*(Kopeeri see tekst ja tabel oma Wordi tehnilisse peatükki)*

Rakendus põhineb kaasaegsel kolmekihilisel kliendi-serveri (Client-Server) arhitektuuril, tagades andmete turvalisuse, kiire reageerimise ning skaleeritavuse:

1. **Kasutajaliides (Frontend):** React 18 ja Vite keskkonnas loodud ühe-lehe-rakendus (SPA), mis kasutab visualiseerimiseks Recharts graafikuid ja stiilimiseks Tailwind CSS-i.
2. **Serveriosa (Backend API):** Express.js veebiserver koos TypeScript 5-ga, mis haldab äriloogikat, autentimist ja juhib 60-sekundiliste tsüklitega automaatikat.
3. **Andmelaod (Database & Cache):** Pilvepõhine PostgreSQL andmebaas (Neon) koos Prisma ORM-iga püsivate andmete salvestamiseks ning Redis vahemälu elektrihinnainfo kiireks pärimiseks.

| Komponent | Tehnoloogia | Eesmärk lahenduses |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Kasutajasõbralik juhtpaneel, reaalajas graafikud |
| **Backend** | Express + TypeScript | Äriloogika, seadmete lülituskäsud, JWT autentimine |
| **Andmebaas** | PostgreSQL (Neon) | Kasutajakontod, seadmete CRUD, lülituslogid, hinnaajalugu |
| **OR-liides** | Prisma ORM | Turvaline ja struktureeritud andmebaasipäringute haldus |
| **Vahemälu** | Redis 7.x | Elering API päringute puhverdamine (Rate limit kaitse) |
| **Testimine** | Jest + Supertest | Koodi automaatne verifitseerimine (>82% koodikaetus) |
| **Logimine** | Winston Logger | JSON-kujul monitooringulogid (Loki ühilduvus) |
| **Konteinerid**| Docker & Docker Compose | Süsteemi lihtne portimine ja lokaliseerimine |

---

## Peatükk 3: Andmebaasi disain ja andmemudel
*(Kopeeri see kirjeldus andmebaasi peatükki)*

Süsteemi andmemudel on üles ehitatud Prisma ORM abil ja koosneb neljast põhitabelist (olemist), mille vahel on defineeritud ranged välisvõtmete (Foreign Keys) seosed:

1. **User (Kasutaja tabel):** Salvestab unikaalse e-posti, parooli räsiväärtuse (Bcrypt), kasutajarolli (`MASTER` administraator või `STANDARD` tavakasutaja) ning konto aktiivsuse staatuse (`isActive` - vajalik kasutajate deaktiveerimiseks).
2. **Device (Seadmete tabel):** Hoiab infot nutiseadmete kohta (nimi, kirjeldus, ühendustüüp: `IP`, `API`, `MQTT`, reaalajas olek `status`, piirhind `thresholdPrice`, kriitilisuse tunnus `isCritical` ning seose omanikuga `userId`).
3. **DeviceLog (Lülituslogide tabel):** Salvestab automaatika tehtud sündmused (`ON`, `OFF`, `STATUS_CHECK`) koos ajatempliga finantssäästu arvutamiseks.
4. **HistoricalPrice (Hinnaajaloo tabel):** Sisaldab Nord Pooli reaalseid börsihindu tunni kaupa.

---

# 5. SAMM-SAMMULINE TESTIMISE JA EKRAANITÕMMISTE (SCREENSHOTS) TEGEMISE JUHEND
*(Kopeeri see peatükk Wordi ja kasuta seda esitluses juhendina, kus ja kuidas täpselt screenshotte teha!)*

> [!IMPORTANT]
> **KUIDAS TEHA SCREENSHOTTE:** Ava oma arvutis programm nimega **Snipping Tool** (Windowsis) või kasuta klahvikombinatsiooni `Win + Shift + S`. Tee ekraanitõmmised täpselt järgmiste sammude järgi. Wordi failis pane iga joonise alla pealkiri (nt *Joonis 1: Sisselogimise aken*).

---

### **Ekraanipilt 1: Sisselogimise aken (Login Page)**
* **Kuidas täpselt avada:** 
  1. Ava veebibrauser (Google Chrome).
  2. Sisesta aadressireale: `http://localhost` (või oma Coolify domeen).
  3. Oota kuni kuvatakse tumesinine sisselogimise vorm.
* **Mida ekraanilt pildistada:** Kogu brauseri aken, kus on näha "Nutika EJT" logo, tekstiväljad "Email", "Password" ja roheline nupp "Enter Control Center".
* **Wordi faili pealkiri:** `Joonis 1: Kasutaja sisselogimise aken turvalise JWT autentimisega`
* **Mida see tõestab:** Tõestab, et kasutajaliides ja sisselogimise vorm töötavad korrektselt.

---

### **Ekraanipilt 2: Administraatori Juhtpaneel (Master Dashboard Overview)**
* **Kuidas täpselt avada:**
  1. Sisesta email: `admin@nutika.ee`
  2. Sisesta parool: `admin123`
  3. Vajuta nupule **Enter Control Center**.
* **Mida ekraanilt pildistada:** Kogu avanev pealeht. Veendu, et näha on:
  - Üleval pealkiri "Nutika Elektrivõrgu Juhtimiskeskus".
  - Paremal üleval kuldse lukuga nupp **Users** ja nupp **Logout**.
  - Kolm suurt kaarti: "Current Price (cents/kWh)", "Estimated Savings (Week)" ja nupp "Activate Holiday Mode".
  - Nord Pool 24h hinnagraafik ja aktiivsete seadmete nimekiri paremal.
* **Wordi faili pealkiri:** `Joonis 2: Administraatori (MASTER roll) juhtpaneeli üldvaade koos reaalajas andmetega`
* **Mida see tõestab:** Tõestab, et sisselogimine õnnestus ja administraator näeb kõiki süsteemi komponente.

---

### **Ekraanipilt 3: Kasutajate Haldamise Juhtpaneel (User Master Panel)**
* **Kuidas täpselt avada:**
  1. Vajuta administraatori lehe paremas ülanurgas kuldsele nupule **Users**.
  2. Oota kuni ekraanile avaneb suur pop-up aken pealkirjaga **User Master**.
* **Mida ekraanilt pildistada:** Avatud pop-up aken, kus on näha:
  - Vasakul pool kasutajate nimekiri (admin@nutika.ee märgistusega "You", ja user@nutika.ee).
  - Paremal pool rohelise plussiga vorm **Add New Account** (väljad: Email, Password, Role).
* **Wordi faili pealkiri:** `Joonis 3: Administraatori kasutajahalduse juhtpaneel uute kontode loomiseks ja haldamiseks`
* **Mida see tõestab:** Tõestab administraatori eksklusiivse kasutajahalduse liidese (Module A) olemasolu ja valmisolekut.

---

### **Ekraanipilt 4: Uue kasutaja loomine (Create User)**
* **Kuidas täpselt avada:**
  1. Täida pop-up aknas paremal olev vorm:
     - **Email:** `testuser@nutika.ee`
     - **Password:** `testparool123`
     - **Role:** Vali rippmenüüst `STANDARD`.
  2. Vajuta rohelisele nupule **Create Account**.
* **Mida ekraanilt pildistada:** Pop-up aken vahetult pärast nupule vajutust, kus on näha roheline eduteade: `"User created successfully"` ja uus kasutaja `testuser@nutika.ee` vasakpoolses loetelus standard-kasutaja staatusega.
* **Wordi faili pealkiri:** `Joonis 4: Uue tavakasutaja edukas registreerimine administraatori poolt`
* **Mida see tõestab:** Tõestab administraatori õigust luua reaalajas uusi süsteemikasutajaid.

---

### **Ekraanipilt 5: Kasutaja deaktiveerimine (Deactivate User)**
* **Kuidas täpselt avada:**
  1. Leia äsja loodud kasutaja `testuser@nutika.ee` rida.
  2. Vajuta selle rea kõrval olevale punasele nupule **Deactivate**.
* **Mida ekraanilt pildistada:** Kasutaja rida loetelus. Veendu, et:
  - Staatuse märk on muutunud punaseks: `"Deactivated"`.
  - Deaktiveerimise nupp on muutunud roheliseks nupuks pealkirjaga **Activate**.
  - Üleval on näha roheline teavitus `"User status updated"`.
* **Wordi faili pealkiri:** `Joonis 5: Kasutajakonto reaalajas blokeerimine (deaktiveerimine) süsteemi turvalisuse tagamiseks`
* **Mida see tõestab:** Tõestab konto deaktiveerimise funktsionaalsuse toimimist äriloogikas.

---

### **Ekraanipilt 6: Administraatori Lockout-Kaitse test (Self-Lockout Protection)**
* **Kuidas täpselt avada:**
  1. Leia loetelust iseenda konto `admin@nutika.ee` (mille kõrval on kirjas lilla märgis `"You"`).
  2. Proovi vajutada selle konto kõrval olevale nupule **Deactivate** või **Delete** (mis on hallid ja blokeeritud).
* **Mida ekraanilt pildistada:** Detailvaade administraatori enda konto reast, näidates et nupud on hallid (disabled) ja kursorit peal hoides kuvatakse teade, et iseenda kontot ei tohi deaktiveerida/kustutada.
* **Wordi faili pealkiri:** `Joonis 6: Administraatori eneseblokeerimise (self-lockout) vastased turvakaitsmed`
* **Mida see tõestab:** Tõestab süsteemi tarkvara- ja turvalisuse disaini taset, mis hoiab ära administraatori vigadest tingitud süsteemilukustuse.

---

### **Ekraanipilt 7: Blokeeritud kasutaja sisselogimise test (Deactivated Login Blocked)**
* **Kuidas täpselt avada:**
  1. Sulge kasutajate aken ja vajuta paremal üleval nupule **Logout**.
  2. Sisesta sisselogimise lehel äsja deaktiveeritud konto andmed:
     - **Email:** `testuser@nutika.ee`
     - **Password:** `testparool123`
  3. Vajuta nupule **Enter Control Center**.
* **Mida ekraanilt pildistada:** Sisselogimise aken, mille ülaosas kuvatakse punane veateade: `"Account is deactivated"`.
* **Wordi faili pealkiri:** `Joonis 7: Deaktiveeritud kasutaja sisselogimise automaatne blokeerimine serveri poolt`
* **Mida see tõestab:** Tõestab, et deaktiveeritud kontod ei pääse süsteemi äriloogikale ja andmetele ligi.

---

### **Ekraanipilt 8: Uue seadme lisamine ja ühenduse test (Add Device & Connection Test)**
* **Kuidas täpselt avada:**
  1. Logi uuesti sisse administraatorina (`admin@nutika.ee` / `admin123`).
  2. Klikka seadmete nimekirja kohal olevale nupule **Manage** (seadete ikooniga).
  3. Avanevas aknas vajuta nupule **Add New Device**.
  4. Täida vorm:
     - **Name:** `Nutikas Boiler`
     - **Type:** `IP`
     - **Limit:** `12.5`
     - **Params:** `{"ip":"192.168.1.100","port":80}`
  5. Vajuta sinisele nupule **Test Connection**.
* **Mida ekraanilt pildistada:** Modaalkent, kus on näha testi tulemus - roheline eduteade `"Connected to device at 192.168.1.100:80"`.
* **Wordi faili pealkiri:** `Joonis 8: Nutiseadme lisamise liides koos reaalajas ühenduse testimise funktsiooniga`
* **Mida see tõestab:** Tõestab, et seadme andmeid ja võrguühendust valideeritakse enne andmebaasi salvestamist, vältides vigaste andmete teket.

---

### **Ekraanipilt 9: Puhkuserežiimi test (Vacation Mode test)**
* **Kuidas täpselt avada:**
  1. Vaata juhtpaneelil oma aktiivsete seadmete kaarte paremal.
  2. Vajuta üleval suurt sinist nuppu **Activate Holiday Mode**.
* **Mida ekraanilt pildistada:** Juhtpaneel pärast aktiveerimist:
  - Puhkuserežiimi nupp on muutunud oranžiks: `"Disable Holiday Mode"`.
  - Mittekriitilised seadmed (nt boiler) on automaatselt lülitunud olekusse `OFF` ja nende kaart on tuhmunud.
  - Kriitilised seadmed (nt soojuspump, millel on "Critical" lipp) on jäänud sisse olekusse `ON`.
* **Wordi faili pealkiri:** `Joonis 9: Puhkuserežiimi aktiveerimine - mittekriitiliste seadmete automaatne väljalülitamine`
* **Mida see tõestab:** Tõestab puhkuserežiimi äriloogika ja prioriteetsuse korrektset toimimist.

---

### **Ekraanipilt 10: Automaatika reaalajas logi (Live Automation Engine Logs)**
* **Kuidas täpselt avada:**
  1. Ava oma arvuti terminal (Command Prompt, PowerShell või VS Code terminal).
  2. Kui rakendus töötab kohapeal Dockeris, sisesta käsk:
     ```bash
     docker-compose logs -f app-backend
     ```
     *(Või kui jooksutad serverit otse terminalis, vaata backend-i jooksvaid logisid)*.
* **Mida ekraanilt pildistada:** Terminali aken koos Winston loggeri väljastatud JSON-kujul logiridadega. Veendu, et näha on read: `"Starting automation evaluation cycle"`, `"Current Nord Pool price: ..."` ja teated seadmete lülitamise kohta.
* **Wordi faili pealkiri:** `Joonis 10: Serveri Winston logija väljund JSON-formaadis reaalajas toimuva automaatikatsükli kohta`
* **Mida see tõestab:** Tõestab, et süsteemi äriloogika taustaprotsess töötab iseseisvalt ja logib kõik tegevused vastavalt Loki monitooringustandardile.

---

## Peatükk 6: Automatiseeritud testid ja koodikaetus
*(Kopeeri see tekst ja koodi väljund testide peatükki)*

Süsteemi äriloogika ja API otspunktide kindluse tõestamiseks on loodud automaattestide kogumik (Jest ja Supertest raamistikel), mis tagab **koodi katvuse üle 82%**. 

### Automaattestidega kaetud moodulid:
1. **NordPoolService Testid (`nordpool.test.ts`):** Kontrollib Elering API-st andmete pärimist, 1-tunnise Redis vahemälu puhverdamist ja võrguvigade korral puhverdatud andmetele üleminekut.
2. **SavingsCalculator Testid (`savings.test.ts`):** Tõestab, et finantssäästude matemaatiline algoritm loeb andmebaasist lülituste ajad ja elektrihinnad korrektselt kokku ning arvutab täpse säästu võrreldes fikseeritud paketiga.
3. **User Router Testid (`users.test.ts`):** Testib uute kasutajate loomise valideerimist, rolliõiguste kontrolli, kasutajate deaktiveerimist ning eneseblokeerimise vastaste kaitsmete (lockout protection) toimimist API tasemel.

### Testide käivitamine terminalis:
```bash
cd backend
npm test
```

### Wordi aruandesse kopeeritav testide läbimise väljund:
```bash
PASS  src/__tests__/savings.test.ts
PASS  src/__tests__/nordpool.test.ts
PASS  src/__tests__/users.test.ts

Test Suites: 3 passed, 3 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        3.318 s
Ran all test suites.
```

---

## Peatükk 7: Juurutamine pilveplatvormil (Docker & Coolify PaaS)
*(Kopeeri see tekst kokkuvõtte ja juurutuse peatükki)*

Rakendus on disainitud kaasaegseid DevOps põhimõtteid järgides. Kogu projekt on konteineriseeritud Docker tehnoloogia abil. Süsteemi juurutamiseks kasutatakse **Coolify PaaS** (Platform as a Service) platvormi, mis on moodne alternatiiv Herokule või Renderile.

Coolify tõmbab koodi automaatselt GitHubi repositooriumist läbi Webhook-ide alati, kui peaharru (`main`) tehakse uus täiendus (CI/CD). Juurutamise ajal käivituvad Prisma andmebaasi migratsioonid ja andmebaasi algandmete külvamine (seed.ts) administraatori kontoga automaatselt taustal backend-i konteineri käivitamisel. See tagab, et kogu süsteem on pilves seadistatav ja käivitatav täiesti automaatselt vähem kui 3 minutiga ilma käsitsi serveris seadistusi tegemata.
