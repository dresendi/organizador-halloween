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
  - `houseNumber`: numero de casa, con indice unico.
  - `participantCount`: numero de participantes de esa casa.
  - `note`: nota opcional.
  - `createdAt` y `updatedAt`.
- `site_content`: noticias y reglas publicas.
  - Documento `_id: "main"` con `news`, `rules` y `updatedAt`.

Si existe la coleccion vieja `site_data`, la app migra esos datos automaticamente a las nuevas colecciones cuando MongoDB este disponible.

## Administradores iniciales

Los usuarios iniciales son `Adminstrador1`, `Adminstrador2` y `Adminstrador3`. Tambien se aceptan `Administrador1`, `Administrador2` y `Administrador3`. Sus contrasenas estan hasheadas con PBKDF2 en el codigo; cambia estas credenciales antes de publicar en produccion.
