# migrations/ is a manually-synced copy

This directory is a duplicate of `../../database/migrations/`. It exists because this
service's Docker build context (both in `docker-compose.yml` and in the currently-deployed
Render service configuration) is `services/data-service/` itself, not the repo root — so its
Dockerfile's `COPY . .` cannot reach anything outside this directory.

`spatial_repository.py::_apply_migrations` reads from `/app/migrations` inside the container
(this directory, once copied in) to self-install the PostGIS schema/seed data on first boot
against a fresh database — see the class docstring for details.

**If you add or edit a migration in `../../database/migrations/`, copy the same file here.**
The self-hosted `docker-compose.yml` stack doesn't need this copy (it mounts
`../../database/migrations` directly into the Postgres container's init path), but a managed
database (e.g. Render's) has no equivalent mount point, so this service needs its own copy to
apply them at application boot instead.
