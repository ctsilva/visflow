# VisTrails Viewer for VisFlow

A Vue.js component that integrates VisTrails workflow visualization into VisFlow, connecting to the VisTrailsJL backend API.

## Overview

This component provides a web-based interface for viewing and exploring VisTrails workflows (.vt files) with full version history support.

## Features

- **Workflow Browser**: List all available .vt files from the VisTrailsJL backend
- **Version Tree Visualization**: SVG rendering of complete version history with tags
- **Workflow Visualization**: SVG rendering of individual workflow versions
- **Version Navigation**: Dropdown selector to switch between workflow versions
- **Dual View Tabs**: Toggle between version tree and workflow views

## Files

- `vistrails-viewer.vue` - Vue component template with UI layout
- `vistrails-viewer.ts` - TypeScript component logic with API integration

## Usage

### Accessing the Viewer

Navigate to: **http://localhost:8080/vistrails**

### Development Setup

1. **Start VisTrailsJL Backend** (from `/Users/csilva/src/VisTrails/julia_starter/backend`):
   ```bash
   ./start.sh
   # Server runs on http://localhost:8000
   ```

2. **Start VisFlow Dev Server** (from `/Users/csilva/github/visflow/client`):
   ```bash
   NODE_OPTIONS=--openssl-legacy-provider yarn start
   # Dev server runs on http://localhost:8080
   ```

3. **Access the viewer**:
   - Open browser to http://localhost:8080/vistrails
   - Select a workflow from the sidebar
   - View version tree or individual workflow versions

## API Integration

The component connects to the VisTrailsJL backend through a webpack proxy configured in `vue.config.js`:

```javascript
devServer: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

This proxy forwards all `/api/*` requests from the VisFlow dev server to the VisTrailsJL backend, eliminating CORS issues during development.

### API Endpoints Used

- `GET /api/workflows` - List all available .vt files
- `GET /api/workflow/:id` - Get workflow metadata
- `GET /api/workflow/:id/version/:version_id/svg` - Get SVG for specific version
- `GET /api/workflow/:id/tree/svg` - Get version tree SVG

## Component Structure

### Template

- **Header**: Title and back link to VisFlow main page
- **Sidebar**: Scrollable list of available workflows
- **Main Content Area**:
  - Empty state when no workflow selected
  - Tabs for "Version Tree" and "Workflow View"
  - Version selector dropdown
  - SVG rendering area

### TypeScript Class

```typescript
class VisTrailsViewer extends Vue {
  // State
  private workflows: Workflow[]
  private selectedWorkflow: Workflow | null
  private selectedVersion: number
  private availableVersions: number[]
  private currentTab: 'version-tree' | 'workflow'

  // Loading states
  private loading: boolean
  private loadingTree: boolean
  private loadingWorkflow: boolean

  // Methods
  public mounted(): void
  private async loadWorkflows(): Promise<void>
  private async selectWorkflow(workflow: Workflow): Promise<void>
  private async loadVersionTreeSVG(): Promise<void>
  private async loadWorkflowSVG(): Promise<void>
}
```

## Styling

The component uses scoped SCSS with:
- Clean, modern design
- Responsive layout with sidebar and main content
- Tab navigation
- Hover states for interactive elements
- SVG container with centered rendering

## Integration with VisTrailsJL

### Backend Requirements

The VisTrailsJL backend must be running and serving:
- Workflow list from `examples/` directory
- SVG generation for workflows and version trees
- Metadata about workflow versions

### Workflow Data Flow

1. Component mounts → Load workflow list from `/api/workflows`
2. User selects workflow → Load metadata from `/api/workflow/:id`
3. Component loads both:
   - Version tree SVG from `/api/workflow/:id/tree/svg`
   - Workflow SVG from `/api/workflow/:id/version/:version_id/svg`
4. User switches versions → Reload workflow SVG with new version ID

## Troubleshooting

### Network Error on Load

**Cause**: Browser cache using old JavaScript before proxy configuration.

**Solution**: Hard refresh the browser:
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + R`

### Empty Workflow List

**Check**:
1. VisTrailsJL backend is running: `curl http://localhost:8000/api/workflows`
2. Proxy is working: `curl http://localhost:8080/api/workflows`
3. .vt files exist in `julia_starter/examples/` directory

### SVG Not Rendering

**Check**:
1. Workflow version can be reconstructed (check backend logs)
2. SVG endpoint returns valid SVG: `curl http://localhost:8000/api/workflow/gcd/version/1/svg`
3. Browser console for JavaScript errors

## Development Notes

### Adding New Features

To add new features:
1. Update the TypeScript interface in `vistrails-viewer.ts`
2. Add UI elements in `vistrails-viewer.vue`
3. Style in the scoped `<style>` section
4. Ensure new API endpoints are proxied through vue.config.js

### Browser Compatibility

- Requires modern browser with ES6 support
- Tested on Chrome, Firefox, Safari
- Uses Axios for HTTP requests
- Vue 2.5 compatible

## Related Documentation

- [VisTrailsJL Backend API](../../../src/VisTrails/julia_starter/backend/README.md)
- [VisFlow Architecture](../../README.md)
- [Vue Router Configuration](../../router.ts)
