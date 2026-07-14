# Refactor 06 — Ruolo e tesseramento come assi separati, sessione come punto intermedio calibrato sul rischio

Riferimento: voce 6 di `studio-didattico-master.md`.

## Prima (schema di Fase 0)

```prisma
enum Role {
  SOCIO
  ADMIN
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          Role     @default(SOCIO)
  tesseraNumero String?  @unique
  memberSince   DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Il default `SOCIO` sul ruolo implicava che ogni nuovo utente registrato fosse per definizione un
socio, anche se `tesseraNumero` restava nullo. Funzionava per caso finché l'unica popolazione
immaginata era "soci verificati"; smette di funzionare non appena esiste un utente pubblico non
tesserato, perché il suo ruolo di default lo etichetterebbe comunque come socio.

## Dopo (schema corrente)

```prisma
enum Role {
  SUPERADMIN
  ADMIN
  UTENTE
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String
  role          Role      @default(UTENTE)
  tesseraNumero String?   @unique
  memberSince   DateTime  @default(now())
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

`Role` non menziona più il tesseramento: `UTENTE` è il default per chiunque si registri,
tesserato o no. "Essere socio" si legge da `tesseraNumero !== null`, non dal ruolo. Un
`ADMIN`/`SUPERADMIN` può a sua volta essere tesserato o meno, senza che lo schema debba
rappresentare quella combinazione come un caso speciale: i due campi sono indipendenti per
costruzione.

`passwordHash` è diventato opzionale, ed `emailVerified`/`image` sono stati aggiunti, non per la
distinzione ruolo/tesseramento in sé, ma come conseguenza diretta di ammettere un secondo modo di
autenticarsi (OAuth) accanto alle credenziali: un dettaglio del punto successivo, non di questo.

## La sessione: perché non è rimasta un aut-aut

Le due opzioni da manuale per la sessione NextAuth sono JWT (nessuno stato lato server, il token
firmato si verifica localmente) o sessione su database (un record per sessione, verificato con
una query a ogni richiesta). Con soli soci a basso rischio, JWT a lunga scadenza (i 30 giorni di
default) era la scelta giusta senza compromessi degni di nota. Con `ADMIN`/`SUPERADMIN` nel
sistema, un token che resta valido per settimane dopo che un account è stato retrocesso o
compromesso è un rischio concreto, non teorico.

La risposta non è passare all'altro estremo (sessione su database per tutti e 10.000 gli utenti,
una query in più per ogni richiesta autenticata su un'infrastruttura serverless a risorse
gratuite), ma calibrare il punto intermedio sul rischio reale: sessione JWT con scadenza breve
(un'ora, indicativamente) e un ricontrollo del ruolo, letto dal database, nel callback `jwt` di
NextAuth a ogni rinnovo del token — non a ogni singola richiesta. Concettualmente (il file
`auth.ts` non è ancora scritto, questo è lo schema logico da implementare, non codice esistente):

```ts
// da implementare in auth.ts — schema logico, non ancora scritto
callbacks: {
  async jwt({ token, trigger }) {
    if (trigger === "update" || tokenIsStaleEnoughToRefresh(token)) {
      const user = await prisma.user.findUnique({ where: { id: token.sub } })
      token.role = user?.role
    }
    return token
  },
}
```

Il costo aggiuntivo (una query) si concentra sul momento del rinnovo, non su ogni richiesta;
il beneficio (finestra di esposizione ridotta da giorni a minuti/un'ora) riguarda esattamente il
rischio che gli account privilegiati introducono.

## Come estendere il pattern

Quando un modello dati o una scelta architetturale sembra binaria (JWT o database, ruolo o
attributo), vale la pena chiedersi se le due opzioni da manuale coprono davvero lo spettro dei
casi reali, o se sono solo i due estremi più facili da nominare. Un ruolo e un attributo di
dominio che gli somiglia vanno separati appena esiste un caso in cui smettono di coincidere,
anche se quel caso oggi è una minoranza dell'utenza; una scelta stateless-contro-stateful va
calibrata sul profilo di rischio specifico (chi ha il ruolo più sensibile, quanti sono, cosa
succederebbe se la revoca tardasse), non decisa una volta per tutte guardando solo al costo per
richiesta.
