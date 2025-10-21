# VisTrails Viewer Setup Guide

Complete guide for running the VisTrails workflow viewer integrated with VisFlow.

## Overview

The VisTrails viewer is a web-based interface that displays VisTrails workflows (.vt files) with version history visualization. It consists of two components:

1. **VisTrails Backend** (Julia/HTTP.jl) - Serves workflow data and generates SVG visualizations
2. **VisFlow Frontend** (Vue.js) - Web UI for browsing and viewing workflows

## Architecture

```
Browser (http://localhost:8081/vistrails)
    ↓
VisFlow Frontend (webpack dev server, port 8081)
    ↓ /api/* proxied to →
VisTrails Backend (HTTP.jl, port 8000)
    ↓
.vt workflow files (VisTrailsJL reads and renders)
```

## Prerequisites

- **Node.js v22+** (for VisFlow)
- **Julia 1.12+** (for VisTrails backend)
- **Yarn** package manager

## Quick Start

### Terminal 1: Start VisTrails Backend

```bash
cd /Users/csilva/src/VisTrails/julia_starter/backend
./start.sh
```

**Output should show:**
```
Starting VisTrailsJL Backend Server (HTTP.jl)...
[ Info: Server configured
[ Info: API will be available at http://localhost:8000
[ Info: Listening on: 0.0.0.0:8000, thread id: 1
Server running. Press Ctrl+C to stop.
```

**Verify it's working:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"VisTrailsJL Backend","version":"0.1.0"}

curl http://localhost:8000/api/workflows
# Should return: JSON array of workflow files
```

### Terminal 2: Start VisFlow Frontend

```bash
cd /Users/csilva/github/visflow/client
NODE_OPTIONS=--openssl-legacy-provider yarn start
```

**Important:** The `NODE_OPTIONS=--openssl-legacy-provider` flag is required for Node v22+ due to legacy webpack dependencies.

**Output should show:**
```
✔ Compiled successfully

App running at:
  - Local:   http://localhost:8081
```

### Access the Viewer

Open your browser to: **http://localhost:8081/vistrails**

You should see:
- Left sidebar with list of available workflows
- Main area with tabs for "Version Tree" and "Workflow View"
- Click any workflow to load its version tree visualization

## Troubleshooting

### Backend Issues

**Problem:** Backend exits immediately after starting

**Solution:** The `http_server.jl` uses `wait(server)` to keep running. If it exits, check:
- Julia version is 1.12+
- Dependencies installed: `cd backend && julia --project=. -e 'using Pkg; Pkg.instantiate()'`

**Problem:** Empty workflow list

**Solution:** Check that .vt files exist in `/Users/csilva/src/VisTrails/examples/`
```bash
ls /Users/csilva/src/VisTrails/examples/*.vt
```

**Problem:** `curl http://localhost:8000/api/workflows` returns 404

**Solution:** The route pattern might not match. Check server terminal for errors.

### Frontend Issues

**Problem:** "Network Error" when accessing /vistrails

**Solution:**
1. Verify backend is running on port 8000
2. Test proxy: `curl http://localhost:8081/api/workflows`
3. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)

**Problem:** Shows regular VisFlow interface instead of VisTrails viewer

**Solution:** Check URL is exactly `http://localhost:8081/vistrails` (not /vistrail or other)

**Problem:** Frontend dev server won't start (port conflict)

**Solution:** If port 8080 or 8081 are in use, webpack will pick the next available port. Use whatever port it shows.

### Compilation Issues

**Problem:** TypeScript errors about catch clause type annotations

**Solution:** VisFlow uses TypeScript 2.9.2 which doesn't support `catch (err: any)`. Use `catch (err)` and cast inside: `(err as any).message`

**Problem:** `NODE_OPTIONS=--openssl-legacy-provider` not recognized

**Solution:** Use export instead:
```bash
export NODE_OPTIONS=--openssl-legacy-provider
yarn start
```

## API Endpoints

The VisTrails backend provides these endpoints (proxied through VisFlow frontend):

### GET /api/workflows
List all available .vt workflow files

**Response:**
```json
[
  {
    "id": "gcd",
    "name": "gcd",
    "path": "gcd.vt",
    "size": 12470,
    "modified": 1748320566.854,
    "version_count": 134
  }
]
```

### GET /api/workflow/:id
Get metadata for a specific workflow

**Example:** `/api/workflow/gcd`

**Response:**
```json
{
  "id": "gcd",
  "name": "gcd",
  "current_version": 134,
  "version_count": 134,
  "versions": [{"id": 1}, {"id": 2}, ...]
}
```

### GET /api/workflow/:id/tree/svg
Get version tree visualization as SVG

**Example:** `/api/workflow/gcd/tree/svg`

**Response:** SVG XML content

### GET /api/workflow/:id/version/:version_id/svg
Get workflow diagram for specific version as SVG

**Example:** `/api/workflow/gcd/version/1/svg`

**Response:** SVG XML content

## File Structure

### VisTrails Backend
```
/Users/csilva/src/VisTrails/julia_starter/
├── backend/
│   ├── start.sh              # Startup script
│   ├── http_server.jl        # HTTP.jl-based server (ACTIVE)
│   ├── server.jl             # Genie.jl server (DEPRECATED - had issues)
│   ├── routes.jl             # Genie routes (not used by http_server.jl)
│   ├── Project.toml          # Julia dependencies
│   └── Manifest.toml         # Locked dependency versions
├── examples/                 # .vt workflow files
│   ├── gcd.vt
│   ├── bikes.vt
│   └── ...
└── src/                      # VisTrailsJL source code
```

### VisFlow Frontend
```
/Users/csilva/github/visflow/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── vistrails-viewer/
│   │   │       ├── vistrails-viewer.vue      # Main component
│   │   │       ├── vistrails-viewer.ts       # Component logic
│   │   │       └── README.md                 # Component docs
│   │   ├── router.ts                         # Vue Router config
│   │   └── components/app/app.vue            # Main app (modified for router-view)
│   ├── vue.config.js                         # Webpack config with proxy
│   └── package.json
└── docs/
    ├── VISFLOW_VISTRAILS_INTEGRATION.md      # Original integration docs
    └── VISTRAILS_SETUP.md                    # This file
```

## Development Notes

### Why HTTP.jl Instead of Genie.jl?

The original implementation used Genie.jl, but we encountered issues where:
- Genie's `up()` command wasn't blocking properly
- Server would start but return empty replies to HTTP requests
- Issue appeared to be specific to Genie.jl 5.33.15 + Julia 1.12.0

HTTP.jl provides:
- ✅ Direct HTTP server without framework overhead
- ✅ Reliable blocking behavior with `wait(server)`
- ✅ Simpler routing with pattern matching
- ✅ Full control over responses (JSON, SVG)

### Webpack Dev Server Proxy

The VisFlow webpack dev server proxies `/api/*` requests to the VisTrails backend. This:
- Eliminates CORS issues during development
- Makes all requests appear from same origin
- Allows frontend and backend to run on different ports

Configuration in `client/vue.config.js`:
```javascript
devServer: {
  historyApiFallback: true,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### Router Configuration

The App component conditionally renders based on route:
- `/vistrails` → Shows VisTrails viewer (standalone, no VisFlow UI)
- All other routes → Shows normal VisFlow interface

```vue
<template>
<div id="app" @contextmenu.prevent>
  <router-view v-if="$route.path === '/vistrails'"></router-view>
  <template v-else>
    <!-- Regular VisFlow UI -->
  </template>
</div>
</template>
```

## Production Deployment

For production deployment, you'll need to:

1. **Build VisFlow frontend:**
   ```bash
   cd /Users/csilva/github/visflow/client
   yarn build
   ```

2. **Configure VisTrails backend for production:**
   - Update `http_server.jl` port if needed
   - Consider adding authentication
   - Set up systemd/supervisor to keep it running

3. **Handle CORS:**
   Without the webpack proxy, you'll need to either:
   - Serve both from same domain using reverse proxy (nginx)
   - Or add CORS headers to HTTP.jl responses (already included)

4. **Environment variables:**
   - Set `PORT` for backend if not using 8000
   - Configure `NODE_ENV=production` for frontend

## Known Limitations

1. **Read-only viewer:** Cannot edit or create workflows
2. **No authentication:** Anyone can view workflows
3. **Single user:** Not designed for multi-user concurrent access
4. **No VisFlow backend:** Main VisFlow features (saving diagrams, user accounts) require separate MongoDB setup

## Next Steps

Potential enhancements:
- Interactive workflow editing
- Version comparison/diff
- Execute workflows from browser
- Export workflows as PNG/PDF
- Search and filter workflows
- Integration with VisFlow's dataflow system

## Support

For issues:
- Check browser console (F12) for errors
- Check backend terminal for Julia errors
- Verify both servers are running
- Test API endpoints directly with curl
- Check that .vt files exist in examples directory

## Summary

**To run the VisTrails viewer:**

1. Terminal 1: `cd backend && ./start.sh`
2. Terminal 2: `cd client && NODE_OPTIONS=--openssl-legacy-provider yarn start`
3. Browser: `http://localhost:8081/vistrails`

That's it! You should see workflows and version trees.
