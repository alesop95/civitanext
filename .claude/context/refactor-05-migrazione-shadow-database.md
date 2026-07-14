# Refactor 05 — Migrazione Prisma locale: da `migrate dev` bloccato a una cronologia tracciata via `migrate diff` + `migrate deploy`

Riferimento: voce 5 di `studio-didattico-master.md`.

## Prima (primo tentativo, fallito)

```
npx prisma migrate dev --name init
```

```
Error: P1017
Server has closed the connection.
```

Con `DEBUG=prisma:*` si isola il punto esatto del fallimento:

```
prisma:schemaEngine:rpc SENDING RPC CALL {"id":1,"jsonrpc":"2.0","method":"devDiagnostic",...}
prisma:schemaEngine:stderr {"level":"ERROR","fields":{"message":"Error in PostgreSQL connection:
  Error { kind: UnexpectedMessage, cause: None }"},"target":"quaint::connector::postgres::native"}
```

`devDiagnostic` è la chiamata con cui lo schema-engine usa lo shadow database: un database
temporaneo, isolato dal database di sviluppo, che Prisma crea per rigiocare la cronologia delle
migrazioni esistenti e calcolare il diff verso lo schema dichiarato, oltre a rilevare un eventuale
scostamento (*drift*) tra lo stato reale del database e quello che i file di migrazione
raccontano. Una query singola sullo stesso database funziona invece regolarmente:

```
echo "SELECT 1;" | npx prisma db execute --stdin
```
```
Script executed successfully.
```

confermando che il problema è nella sequenza multi-round-trip di `devDiagnostic`, non nella
connessione di per sé.

## Indagine (tre agenti paralleli)

Ricerca esterna: issue GitHub `prisma/prisma#29366` ("Command prisma migrate dev gives P1017
against local PGlite"), firma d'errore identica, etichettata "bug/1-unconfirmed", nessun fix
noto nel changelog ufficiale.

Diagnostica chirurgica locale, sulle stesse porte del server dedicato a questo progetto
(51218 principale, 51219 shadow, senza mai toccare le porte 51213-51215 di un'istanza già
attiva su un altro progetto dell'utente): `migrate diff`, `db push`, `migrate status`,
`migrate deploy` funzionano tutti regolarmente contro lo shadow database; solo la sequenza
specifica di `devDiagnostic` fallisce. Rimuovere singolarmente i parametri di query string
(`connection_limit`, `pool_timeout`, `socket_timeout`) non cambia l'esito; rimuovere
`sslmode=disable` causa un hang, un sintomo diverso da quello osservato.

Verifica versioni: `7.8.0` (installata) è anche l'ultima versione stabile pubblicata; nessun
changelog di versioni successive (in sviluppo, non ancora stabili) menziona un fix per questo
bug.

## Dopo (workaround adottato)

```
npx prisma migrate diff --from-empty --to-schema=prisma/schema.prisma --script \
  > prisma/migrations/20260713000000_init/migration.sql
```

genera l'SQL confrontando uno schema vuoto con `schema.prisma`, senza mai interpellare lo shadow
database: `migrate diff` è dichiaratamente un comando di sola lettura, non scrive né diagnostica
nulla contro un database. Il file va nella struttura di cartella che Prisma Migrate si aspetta
(`prisma/migrations/<timestamp>_<nome>/migration.sql`), accompagnato da un
`prisma/migrations/migration_lock.toml` con `provider = "postgresql"`. Il database, già
sincronizzato in un primo tentativo diagnostico con `db push` (che non lascia alcuna cronologia),
va resettato prima di applicare la migrazione da zero:

```
printf 'DROP SCHEMA public CASCADE;\nCREATE SCHEMA public;\n' | npx prisma db execute --stdin
npx prisma migrate deploy
```

`migrate deploy` applica le migrazioni pendenti e le registra nella tabella
`_prisma_migrations`, verificabile con `prisma migrate status`:

```
Database schema is up to date!
```

Il compromesso dichiarato: questa sequenza sostituisce `migrate dev` per ogni futura modifica di
schema su questa macchina, finché il bug upstream non si risolve o non si verifica se persiste
anche contro un Postgres reale raggiunto in rete (Neon, non ancora provisionato in questo blocco
di lavoro).

## Come estendere il pattern

Quando un comando di tooling fallisce con un errore che sembra ambientale (connessione, timeout,
rete), la domanda utile non è "quale parametro cambio finché non sparisce" ma "a quale livello
esatto fallisce, e quel livello è davvero necessario per l'obiettivo che voglio raggiungere". Qui
l'obiettivo era una cronologia di migrazione tracciata, non la comodità di generarla
automaticamente diagnosticando drift: `devDiagnostic` serve a quella comodità, non è
indispensabile al risultato. Il comando più semplice che ottiene lo stesso risultato finale
(`migrate diff` + `migrate deploy`, entrambi a singolo round-trip) è quindi un workaround pieno,
non un compromesso al ribasso rispetto all'obiettivo originale.
