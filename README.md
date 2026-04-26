# Halloween Alzare 2026

Aplicacion web para organizar el Halloween de la colonia Alzare.

## Desarrollo

```bash
npm.cmd install
npm.cmd run dev
```

Abre `http://localhost:3000`.

## MongoDB

La app usa MongoDB si existe `MONGODB_URI`. Si no existe, guarda datos en `data/halloween-data.json` para desarrollo local.

Variables recomendadas:

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=halloween_alzare
AUTH_SECRET=una-cadena-larga-y-secreta
```

Estructura creada en MongoDB:

- `participant_houses`: casas participantes.
  - `locationId`: identificador unico de calle y numero.
  - `street`: calle del croquis, por ejemplo `Calle 57B`.
  - `houseNumber`: numero de casa.
  - `participantCount`: numero de participantes de esa casa.
  - `note`: nota opcional.
  - `createdAt` y `updatedAt`.
- `site_content`: noticias y reglas publicas.
  - Documento `_id: "main"` con `news`, `rules` y `updatedAt`.
- `house_locations`: catalogo inicial de ubicaciones disponibles.
  - `locationId`, `street`, `houseNumber` y `label`.

Si existe la coleccion vieja `site_data`, la app migra esos datos automaticamente a las nuevas colecciones cuando MongoDB este disponible.

Para inicializar o reparar la estructura en Mongo Atlas desde local:

```bash
npm.cmd run db:init
```

El script usa `MONGODB_URI` y `DB_NAME` desde `.env.local` o desde el entorno.

## Administradores iniciales

Los usuarios iniciales son `Adminstrador1`, `Adminstrador2` y `Adminstrador3`. Tambien se aceptan `Administrador1`, `Administrador2` y `Administrador3`. Sus contrasenas estan hasheadas con PBKDF2 en el codigo; cambia estas credenciales antes de publicar en produccion.

## Despliegue en Vercel

El proyecto esta preparado para Vercel como una app Next.js. Configura estas variables en Vercel Project Settings antes del primer despliegue:

```env
MONGODB_URI=mongodb+srv://...
DB_NAME=halloween_alzare
MONGODB_DB=halloween_alzare
AUTH_SECRET=una-cadena-larga-y-secreta
```

No subas `.env.local`; esta ignorado por git. Vercel usara `npm install` y `npm run build` segun `vercel.json`.

En Vercel el filesystem del despliegue es de solo lectura. Si MongoDB no esta configurado o falla, la app usara `/tmp/halloween-data.json` solo como respaldo temporal para evitar errores, pero esos datos no son persistentes entre invocaciones. Para persistencia real configura `MONGODB_URI` y `DB_NAME` en Vercel.
