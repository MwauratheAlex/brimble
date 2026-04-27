# Brimble

Brimble is a small deployment platform that builds and runs containerized apps from
either a public Git repository or an uploaded project archive.
(Uploaded project archive is not fully implemented yet)

It provides a single-page deployment console where users can
create deployments, watch build/runtime logs in real time,
inspect deployment status, view the generated image tag,
and access the app through Caddy.

## Features

- Create deployments from a public Git URL
- Create deployments from an uploaded project archive
- Build apps into container images with Railpack
- Run built images locally with Docker
- Route traffic through Caddy as the single ingress point
- Persist deployment metadata and logs in SQLite
- Stream live deployment logs over Server-Sent Events
- View deployment status, image tag, live URL, and Caddy route from the UI

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, TanStack Query
- Backend: Node.js, Express, TypeScript
- Database: SQLite
- Builder: Railpack
- Runtime: Docker
- Ingress: Caddy
- Live logs: Server-Sent Events

## Project Structure

```txt
brimble/
  docker-compose.yml

  caddy/
    Caddyfile

  backend/
    Dockerfile
    package.json
    src/
      controllers/
      db/
      repositories/
      services/

  frontend/
    Dockerfile
    package.json
    src/
      api/
      components/
      hooks/
      types/
````

## Prerequisites

You need:

- Docker
- Docker Compose
- Internet access for cloning public repositories and downloading build dependencies

The app can be tested with any public GitHub repository.

## Running the App

From the project root:

```bash
docker compose up --build
```

Then open:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:6492
Caddy:    http://localhost:8080
```

The frontend should load the deployment console.

The Caddy URL should initially return a simple ready message.
Once a deployment succeeds, Caddy routes traffic to the running container.

## Testing a Git Deployment

1. Open the frontend at:

```txt
http://localhost:5173
```

2. Choose **Git URL**.

3. Enter a public GitHub repository URL.

4. Select or enter a branch.

5. Enter the container port the app should listen on.

6. Click **Start deployment**.

The backend will:

```txt
clone the repository
build it with Railpack
run the image with Docker
write a Caddy route
reload Caddy
stream logs to the UI
```

## Testing an Upload Deployment

Not fully implemented

## Environment Variables

The Docker Compose setup provides sensible defaults.

### Backend

| Variable               |                       Default | Purpose                                          |
| ---------------------- | ----------------------------: | ------------------------------------------------ |
| `PORT`                 |                        `6492` | Express server port                              |
| `BUILDKIT_HOST`        | `docker-container://buildkit` | BuildKit target used by Railpack                 |
| `DEPLOY_NETWORK`       |                     `brimble` | Docker network used by Caddy and app containers  |
| `CADDY_CONTAINER_NAME` |               `brimble-caddy` | Caddy container to reload after route changes    |
| `CADDYFILE_PATH`       |           `/shared/Caddyfile` | Writable Caddyfile path inside backend container |
| `DATABASE_PATH`        |        `/app/data/brimble.db` | SQLite database path                             |
| `PUBLIC_BASE_URL`      |       `http://localhost:8080` | Public base URL used for generated live URLs     |

### Frontend

| Variable           |                 Default | Purpose                              |
| ------------------ | ----------------------: | ------------------------------------ |
| `VITE_BACKEND_URL` | `http://localhost:6492` | Backend API URL used by the frontend |

## API Overview

### Create Git Deployment

```http
POST /api/deployments/git
```

Example body:

```json
{
  "gitUrl": "https://github.com/example/app",
  "branch": "main",
  "port": "3000"
}
```

### Create Upload Deployment

```http
POST /api/deployments/upload
```

Uses `multipart/form-data`.

Expected fields:

```txt
file=<archive>
port=3000
```

### List Deployments

```http
GET /api/deployments
```

Returns:

```json
{
  "deployments": []
}
```

### Fetch Persisted Logs

```http
GET /api/deployments/:id/logs
```

Returns logs stored in SQLite.

### Stream Live Logs

```http
GET /api/deployments/:id/logs/stream
```

Streams live logs with Server-Sent Events while the deployment is active.

Example events:

```txt
event: connected
event: log
event: status
```

## Deployment Lifecycle

Deployments move through these states:

```txt
pending → building → deploying → running
```

If something fails:

```txt
pending → building/deploying → failed
```

The frontend uses this status to show the current deployment state,
pipeline progress, and whether logs should stream live or be loaded from the database.

## Caddy Routing

Caddy is the single ingress point.

Generated routes look like:

```caddy
:80 {
  handle_path /d/<deployment-id>/* {
    reverse_proxy <container-name>:<port>
  }
}
```

The backend writes the Caddyfile and reloads the running Caddy container
after each successful deployment.

## Docker Notes

The backend mounts the Docker socket:

```yaml
/var/run/docker.sock:/var/run/docker.sock
```

This lets the backend run Docker commands from inside the backend container.

Deployment containers are created on the host Docker daemon and attached to the
shared `brimble` network so Caddy can reach them by container name.

## Useful Commands

Start everything:

```bash
docker compose up --build
```

Stop everything:

```bash
docker compose down
```

Rebuild only the backend:

```bash
docker compose build --no-cache backend
docker compose up
```

View backend logs:

```bash
docker logs -f brimble-backend
```

View Caddy logs:

```bash
docker logs -f brimble-caddy
```

Inspect generated Caddyfile:

```bash
cat caddy/Caddyfile
```

Check deployment containers:

```bash
docker ps --filter "name=brimble-"
```

## Troubleshooting

### `network brimble already exists`

If the `brimble` network was created manually before using Compose, remove it:

```bash
docker compose down --remove-orphans
docker network rm brimble
docker compose up --build
```

If Docker says the network is still in use, remove old containers first:

```bash
docker ps -a --format '{{.Names}}' | grep '^brimble-' | xargs -r docker rm -f
docker network rm brimble
```

### `BUILDKIT_HOST environment variable is not set`

Make sure the backend receives:

```txt
BUILDKIT_HOST=docker-container://buildkit
```

This is already configured in `docker-compose.yml`.

### Caddy reload fails

Check that Caddy is running:

```bash
docker ps | grep brimble-caddy
```

Validate the current Caddyfile:

```bash
docker exec brimble-caddy caddy validate --config /etc/caddy/Caddyfile
```

View Caddy logs:

```bash
docker logs brimble-caddy
```

### Live URL does not load

Check if the deployment container is running:

```bash
docker ps -a | grep brimble-
```

Check app logs:

```bash
docker logs <container-name>
```

Make sure the app listens on the port entered in the UI.

For Vite-style apps, the app often needs to bind to:

```txt
0.0.0.0
```

instead of:

```txt
localhost
```

The backend passes these environment variables to deployed containers:

```txt
PORT=<selected-port>
HOST=0.0.0.0
HOSTNAME=0.0.0.0
```

### SQLite native binding errors

If using `better-sqlite3`, make sure the backend Docker image rebuilds the
native binding during build.

A clean rebuild usually fixes it:

```bash
docker compose build --no-cache backend
docker compose up
```

## Development

Frontend development server:

```bash
cd frontend
pnpm install
pnpm dev
```

Backend development server:

```bash
cd backend
pnpm install
pnpm dev
```

When running outside Docker, you may need to start BuildKit manually:

```bash
docker run --rm --privileged -d --name buildkit moby/buildkit
export BUILDKIT_HOST=docker-container://buildkit
```
