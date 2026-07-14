# Shrtn Database

Shrtn uses PostgreSQL hosted on Neon for persistent short-link storage.

## Environment variable

The backend requires:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require