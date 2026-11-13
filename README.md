Ver el README de la raíz del repositorio para instalar y correr el backend.

## Docker (todo el stack con un comando)

Levanta Postgres, el API y el front (nginx) sin instalar nada más que Docker. El front vive en otro repo
(`ecommerce-norte-front`); clónalo **al lado** de este, como `../frontend`.

```bash
cp .env.docker.example .env.docker   # edita DB_PASSWORD y JWT_SECRET como mínimo
docker compose --env-file .env.docker up --build -d
```

- Tienda: http://localhost:8080 · Docs del API: http://localhost:8080/api/docs
- El backend corre `prisma migrate deploy` al arrancar, así que la base queda al día sola.
- nginx pasa `/api`, `/uploads` y `/sitemap.xml` al backend; el resto es la SPA.
- Las imágenes del admin viven en el volumen `uploads`; la base en `db_data`.
- Para producción cambia `PUBLIC_URL` por tu dominio (sirve para CORS, los links de Mercado Pago y el sitemap).
- Datos de prueba: corre `npm run prisma:seed` desde tu máquina con `DATABASE_URL` apuntando al contenedor
  (`postgresql://norte:<DB_PASSWORD>@localhost:5432/norte` si expones el puerto), o carga el catálogo desde el admin.

## Integración continua

`.github/workflows/ci.yml` corre en cada push y pull request: `prisma generate`, `tsc`, las pruebas con Jest y
el build de la imagen de Docker. Si algo truena, el commit sale en rojo en GitHub.
