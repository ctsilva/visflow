# VisFlow + VisTrails Integration Guide

Complete guide for the VisFlow and VisTrailsJL integration that enables web-based visualization of VisTrails workflows.

## Overview

This integration connects the VisFlow web framework with the VisTrailsJL backend to provide:
- Web-based workflow visualization
- Interactive version history exploration
- SVG rendering of workflows and version trees
- RESTful API access to .vt files

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  VisFlow (Vue.js) - http://localhost:8080/vistrails  │  │
│  │  - Workflow browser UI                                 │  │
│  │  - Version tree viewer                                 │  │
│  │  - Workflow SVG viewer                                 │  │
│  └─────────────────┬─────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────┘
                     │ HTTP /api/* requests
                     │ (proxied by webpack dev server)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Webpack Dev Server Proxy                                   │
│  - Forwards /api/* → http://localhost:8000/api/*           │
│  - Eliminates CORS issues                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  VisTrailsJL Backend - http://localhost:8000                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Genie.jl REST API                                   │   │
│  │  - GET /api/workflows                                │   │
│  │  - GET /api/workflow/:id                             │   │
│  │  - GET /api/workflow/:id/version/:version_id/svg     │   │
│  │  - GET /api/workflow/:id/tree/svg                    │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │                                         │
│  ┌─────────────────┴───────────────────────────────────┐   │
│  │  VisTrailsJL (Julia)                                 │   │
│  │  - Load .vt files                                    │   │
│  │  - Reconstruct versions from action history          │   │
│  │  - Render SVG (workflows and version trees)          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Prerequisites

- Node.js v22+ (for VisFlow)
- Julia 1.12+ (for VisTrailsJL)
- Yarn package manager

### 1. Start VisTrailsJL Backend

```bash
cd /Users/csilva/src/VisTrails/julia_starter/backend
./start.sh
```

This starts the Genie.jl server on port 8000.

**Verify it's running:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"VisTrailsJL Backend","version":"0.1.0"}
```

### 2. Start VisFlow Dev Server

```bash
cd /Users/csilva/github/visflow/client
NODE_OPTIONS=--openssl-legacy-provider yarn start
```

This starts the webpack dev server on port 8080 with the OpenSSL legacy provider (required for old webpack version).

**Verify it's running:**
```bash
curl http://localhost:8080
# Should return HTML for VisFlow
```

### 3. Access the Integration

Open browser to: **http://localhost:8080/vistrails**

**If you see "Network Error":**
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows/Linux)
- This clears the browser cache and loads the updated JavaScript

## Key Implementation Details

### 1. Webpack Proxy Configuration

File: `/Users/csilva/github/visflow/client/vue.config.js`

```javascript
module.exports = {
  baseUrl,
  devServer: {
    historyApiFallback: true,  // Support Vue Router history mode
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Forward to VisTrailsJL
        changeOrigin: true,
      },
    },
  },
  // ... rest of config
}
```

**Why?** Eliminates CORS (Cross-Origin Resource Sharing) issues during development by making all requests appear to come from the same origin (localhost:8080).

### 2. Vue Router Configuration

File: `/Users/csilva/github/visflow/client/src/router.ts`

```typescript
import VisTrailsViewer from '@/components/vistrails-viewer/vistrails-viewer.vue';

const routes = [
  { path: '/vistrails', name: 'vistrails', component: VisTrailsViewer },
  // ... other routes
];
```

### 3. Component API Integration

File: `/Users/csilva/github/visflow/client/src/components/vistrails-viewer/vistrails-viewer.ts`

```typescript
private apiBase: string = '/api';  // Relative URL (proxied to localhost:8000)

async loadWorkflows() {
  const response = await axios.get(`${this.apiBase}/workflows`);
  this.workflows = response.data;
}
```

## Compatibility Fixes Applied

### 1. Sass Compiler Migration

**Problem:** `node-sass` doesn't support ARM64 architecture + Node 22.

**Solution:**
- Removed `node-sass`
- Added modern `sass` package
- Configured `vue.config.js` to use new implementation

### 2. Vue Deep Selector Syntax

**Problem:** Modern Sass doesn't recognize `/deep/` syntax.

**Solution:** Replaced `/deep/` with `::v-deep` in 13 files:
- 11 `.scss` files
- 2 `.vue` files with scoped styles

### 3. Stylelint Configuration

**Problem:** Stylelint flagged `::v-deep` as unknown.

**Solution:** Updated `.stylelintrc.json`:
```json
{
  "rules": {
    "selector-pseudo-element-no-unknown": [
      true,
      { "ignorePseudoElements": ["v-deep"] }
    ]
  }
}
```

### 4. Webpack History Mode

**Problem:** Direct navigation to `/vistrails` returned 404.

**Solution:** Enabled `historyApiFallback` in webpack dev server config.

## API Endpoints

### GET /api/workflows

Returns list of all .vt files in the examples directory.

**Response:**
```json
{
  "workflows": [
    {
      "id": "gcd",
      "name": "gcd",
      "path": "gcd.vt",
      "size": 12470,
      "modified": 1748320566854.8121
    }
  ],
  "count": 31
}
```

### GET /api/workflow/:id

Returns metadata for a specific workflow.

**Example:** `/api/workflow/gcd`

### GET /api/workflow/:id/version/:version_id/svg

Returns SVG rendering of a specific workflow version.

**Example:** `/api/workflow/gcd/version/1/svg`

**Response:** SVG XML content

### GET /api/workflow/:id/tree/svg

Returns SVG rendering of the complete version tree.

**Example:** `/api/workflow/gcd/tree/svg`

**Response:** SVG XML with version tree layout

## Component Features

### Workflow Browser

- Sidebar with list of all available .vt files
- Shows workflow name and version count
- Click to select and load workflow

### Version Tree View

- SVG visualization of version history
- Shows parent-child relationships between versions
- Displays version tags
- Ellipses sized based on content

### Workflow View

- SVG rendering of individual workflow versions
- Module boxes with dynamic sizing based on labels
- Connection routing between modules
- Version selector dropdown

### User Interaction

1. **Select Workflow**: Click workflow in sidebar
2. **View Version Tree**: Default tab shows complete history
3. **View Workflow**: Switch to "Workflow View" tab
4. **Change Version**: Use dropdown to select different version
5. **Navigate Back**: Click "← Back to VisFlow" link

## Development Workflow

### Making Changes to the Component

1. Edit files in `/Users/csilva/github/visflow/client/src/components/vistrails-viewer/`
2. Webpack dev server automatically recompiles
3. Browser hot-reloads the changes
4. Test in browser at http://localhost:8080/vistrails

### Adding New API Endpoints

1. Add route in `/Users/csilva/src/VisTrails/julia_starter/backend/routes.jl`
2. Implement in VisTrailsJL if needed
3. Update component to call new endpoint
4. No proxy config changes needed (all `/api/*` already proxied)

### Debugging

**Browser Console:**
- Network tab: Check API requests/responses
- Console tab: Check JavaScript errors
- Vue DevTools: Inspect component state

**Backend Logs:**
- VisTrailsJL backend outputs to terminal
- Check for Julia errors or warnings

**Proxy Issues:**
```bash
# Test proxy is working
curl http://localhost:8080/api/workflows

# Test backend directly
curl http://localhost:8000/api/workflows
```

## Production Deployment Considerations

### CORS Configuration

In production, you'll need to add CORS headers to the VisTrailsJL backend since there won't be a webpack proxy.

Options:
1. Add CORS middleware to Genie.jl server
2. Use a reverse proxy (nginx) to handle CORS
3. Serve VisFlow static files from the same domain as the API

### Build Process

```bash
cd /Users/csilva/github/visflow/client
yarn build
```

This creates a production build in `dist/` directory.

### Environment Configuration

Update `apiBase` in production:
```typescript
private apiBase: string = process.env.NODE_ENV === 'production'
  ? 'https://api.example.com/api'  // Production API
  : '/api';  // Development proxy
```

## File Reference

### VisFlow Files
- `/Users/csilva/github/visflow/client/vue.config.js` - Webpack and proxy config
- `/Users/csilva/github/visflow/client/src/router.ts` - Vue Router routes
- `/Users/csilva/github/visflow/client/src/components/vistrails-viewer/` - Component files
- `/Users/csilva/github/visflow/client/.stylelintrc.json` - Stylelint configuration

### VisTrailsJL Files
- `/Users/csilva/src/VisTrails/julia_starter/backend/server.jl` - Genie.jl server
- `/Users/csilva/src/VisTrails/julia_starter/backend/routes.jl` - API routes
- `/Users/csilva/src/VisTrails/julia_starter/backend/start.sh` - Server start script
- `/Users/csilva/src/VisTrails/julia_starter/src/rendering/` - SVG rendering code

## Troubleshooting

### Problem: "Network Error" in browser

**Cause:** Browser cache using old JavaScript before proxy was added.

**Solution:** Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### Problem: Empty workflow list

**Check:**
1. VisTrailsJL backend is running
2. .vt files exist in `julia_starter/examples/`
3. Proxy is configured correctly

### Problem: SVG not rendering

**Check:**
1. Workflow version can be reconstructed (check backend logs)
2. SVG endpoint returns valid XML
3. Browser console for errors

### Problem: Webpack compilation errors

**Check:**
1. All dependencies installed: `yarn install`
2. Node version compatibility (v22+)
3. OpenSSL legacy provider flag set

## Future Enhancements

Potential improvements to the integration:

1. **Interactive Workflow Editing**: Allow editing workflows in the browser
2. **Version Comparison**: Side-by-side diff of two workflow versions
3. **Execution Support**: Run workflows directly from the web interface
4. **Real-time Collaboration**: Multiple users viewing/editing same workflow
5. **Search and Filter**: Search workflows by name, tags, or content
6. **Export Options**: Download workflows as PNG, PDF, or JSON

## Related Documentation

- [VisFlow README](/Users/csilva/github/visflow/README.md)
- [VisTrailsJL Backend API](/Users/csilva/src/VisTrails/julia_starter/backend/README.md)
- [Component README](/Users/csilva/github/visflow/client/src/components/vistrails-viewer/README.md)
- [Vue.js Documentation](https://v2.vuejs.org/)
- [Genie.jl Documentation](https://genieframework.com/)
