# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VisFlow is a web-based dataflow framework for visual data exploration. It enables users to create interactive visualization diagrams by connecting nodes (data sources, filters, transformations, visualizations) through a visual dataflow interface.

**Tech Stack:**
- **Client**: Vue.js 2.5, TypeScript, Vuex, Vue Router, Bootstrap-Vue, D3.js, jQuery UI (for drag-drop)
- **Server**: Node.js, Express, TypeScript, MongoDB (via Mongoose), Passport authentication
- **Build**: Webpack (via Vue CLI), Jest for testing, yarn workspaces

## Development Commands

### Setup & Installation
```bash
# Install all dependencies (uses yarn workspaces)
yarn install

# Ensure MongoDB is running (required for server)
mongod
```

### Client Development
```bash
# Start dev server (http://localhost:8080)
yarn --cwd client start

# For newer Node versions (v22+), use OpenSSL legacy provider:
NODE_OPTIONS=--openssl-legacy-provider yarn --cwd client start

# Build production client
yarn --cwd client build

# Run client tests
yarn --cwd client test

# Lint client code
yarn --cwd client lint
```

### Server Development
```bash
# Start dev server (watches and rebuilds automatically)
yarn --cwd server start

# Build server only
yarn --cwd server build

# Run production server (requires NODE_ENV=production)
yarn --cwd server serve

# Run server tests
yarn --cwd server test

# Lint server code
yarn --cwd server lint

# Watch mode (concurrent lint + build + nodemon)
yarn --cwd server watch
```

### Documentation
```bash
# Build VuePress documentation
yarn --cwd docs build

# Serve docs in dev mode
yarn --cwd docs dev
```

### Coverage
```bash
# Merge client and server coverage reports
bash coverage.sh
```

## Environment Configuration

### Client `.env` (`client/.env`)
```
BASE_URL=/
TIME_ZONE=America/New_York
```

### Server `.env` (`server/.env`)
```
DATA_PATH=/data/visflow              # Must be writable by Node.js
MONGODB_URI=mongodb://localhost:27017/visflow
ALLOW_ORIGIN=http://localhost:8080;http://localhost:3000;https://visflow.org
SESSION_SECRET=<random-secret>
PORT=3000
```

## Architecture

### Client Architecture

**Dataflow System** (`client/src/store/dataflow/`):
- Central Vuex module managing the node-edge graph
- **Nodes**: Visual components with inputs/outputs (ports), stored in `state.nodes[]`
- **Edges**: Connections between ports, enable data flow propagation
- **Propagation**: When a node's data changes, updates cascade through connected downstream nodes via `helper.propagatePort()` and `helper.propagateNode()`
- **History**: Undo/redo system tracks diagram mutations as reversible events

**Component Structure**:
- Each node type (e.g., `data-source`, `scatterplot`, `attribute-filter`) has its own component in `client/src/components/`
- Nodes inherit from base `Node` class (`client/src/components/node/node.ts`)
- Nodes define input/output ports and implement `inputChanged()` for propagation
- Visual nodes extend `Visualization` base class with D3.js rendering

**Key Client Patterns**:
- Vue class components with TypeScript decorators (`vue-class-component`, `vue-property-decorator`)
- Vuex namespaced modules: `dataflow`, `interaction`, `history`, `dataset`, `user`
- Components use `@Component` decorator with separate `.html` template files
- Global state via Vuex, local component state via Vue data properties
- jQuery UI for drag-and-drop (legacy, required for touch support via `jquery-ui-touch-punch`)

**Router** (`client/src/router.ts`):
- `/` - Main dataflow editor (default)
- `/vistrails` - VisTrails workflow viewer (new integration)

### Server Architecture

**API Structure** (`server/src/api/`):
- `user.ts` - Authentication, registration, profile management
- `diagram.ts` - Load/save diagram files, list user diagrams
- `dataset.ts` - Upload/download/list datasets
- `flowsense.ts` - FlowSense natural language interface (experimental)
- `log.ts` - Usage logging

**Data Models** (`server/src/models/`):
- User, Diagram, Dataset, FlowSense, Log
- MongoDB schemas defined with Mongoose
- Diagrams stored as JSON files in `DATA_PATH` directory

**Authentication**:
- Passport.js with local strategy
- Sessions stored in MongoDB via `connect-mongo`
- Express session middleware

**Server Entry** (`server/src/server.ts`):
- Express app configured in `server/src/app.ts`
- MongoDB connection in `server/src/mongo.ts`
- CORS configured for allowed origins from `.env`

### VisTrails Integration

**NEW**: VisFlow now integrates with VisTrailsJL backend to visualize VisTrails workflow files.

**Component**: `client/src/components/vistrails-viewer/`
- Displays .vt workflows and version trees as SVG
- Communicates with VisTrailsJL backend via `/api/*` endpoints
- Webpack dev server proxies `/api` → `http://localhost:8000` (see `client/vue.config.js`)

**Important**: In development, the webpack proxy eliminates CORS issues. In production, either:
1. Serve VisFlow and API from same domain, OR
2. Add CORS headers to VisTrailsJL backend

See `docs/VISFLOW_VISTRAILS_INTEGRATION.md` for complete details.

## Testing

### Client Tests
- Framework: Jest with `ts-jest` and `vue-jest`
- Location: `client/tests/unit/**/*.test.ts`
- Run: `yarn --cwd client test`
- Module alias: `@/` maps to `client/src/`

### Server Tests
- Framework: Jest with `ts-jest`
- Location: `server/tests/**/*.test.ts`
- Run: `yarn --cwd server test`
- Module alias: `@src/` maps to `server/src/`
- Uses `supertest` for HTTP endpoint testing

### Test Coverage
```bash
# Generate merged coverage report
bash coverage.sh
```

## Code Conventions

### TypeScript
- Strict mode enabled with `experimentalDecorators` (root `tsconfig.json`)
- Client uses `@Component`, `@Prop`, `@Watch` decorators from `vue-class-component` and `vue-property-decorator`
- Nodes use class-based architecture with TypeScript inheritance

### Vue Components
- Template: Separate `.html` file (e.g., `node.html`) imported into `.ts`
- Style: Scoped `.scss` files, use `::v-deep` for child component styling (NOT `/deep/`)
- Class-based components with `vue-class-component`

### Styling
- Bootstrap 4 via `bootstrap-vue`
- Stylelint configured in `client/.stylelintrc.json`
- Custom SCSS in `client/src/override/`
- `::v-deep` pseudo-element whitelisted in stylelint config

### Node.js Compatibility
- **Important**: Client requires `NODE_OPTIONS=--openssl-legacy-provider` for Node v22+ due to legacy webpack/crypto usage
- Consider this when running client commands in CI or new environments

## Key Files Reference

### Client
- `client/src/store/dataflow/index.ts` - Main dataflow Vuex module
- `client/src/store/dataflow/helper.ts` - Node/edge creation, propagation logic
- `client/src/store/dataflow/history.ts` - Undo/redo event system
- `client/src/components/node/node.ts` - Base node class (all nodes inherit from this)
- `client/src/components/dataflow-canvas/dataflow-canvas.ts` - Main canvas component
- `client/vue.config.js` - Webpack config, dev server proxy for VisTrails API

### Server
- `server/src/app.ts` - Express app configuration
- `server/src/server.ts` - Server entry point
- `server/src/api/*.ts` - RESTful API endpoints
- `server/src/models/*.ts` - Mongoose schemas

### Configuration
- `package.json` - Root workspace config
- `client/package.json` - Client dependencies and scripts
- `server/package.json` - Server dependencies and scripts
- `.travis.yml` - CI configuration

## Common Development Scenarios

### Adding a New Node Type
1. Create component in `client/src/components/<node-name>/`
2. Extend `Node` class (or `Visualization` for visual nodes)
3. Define ports in constructor via `this.createInputPort()` and `this.createOutputPort()`
4. Implement `inputChanged()` to handle propagation
5. Register in `client/src/store/dataflow/node-types.ts`
6. Add node icon to `client/src/imgs/`

### Modifying Dataflow Propagation
- Core logic in `client/src/store/dataflow/helper.ts`
- `propagatePort()` - Triggers when port data changes
- `propagateNode()` - Triggers node's `inputChanged()` and propagates to outputs
- Avoid propagation during deserialization (check `state.isDeserializing`)

### Adding Server API Endpoint
1. Define route handler in `server/src/api/<module>.ts`
2. Add route to Express app in `server/src/app.ts`
3. Update corresponding model in `server/src/models/` if needed
4. Test with `supertest` in `server/tests/`

### Working with Diagrams
- Diagrams serialize to JSON via `saveLoad.mutations.serializeDiagram()`
- Deserialization recreates nodes/edges from JSON, then propagates data
- Autosave timer in `state.autoSaveTimer` (if implemented)
- Diagram files stored in `DATA_PATH/<filename>.json`

## Known Issues & Quirks

1. **Node.js v22+ requires OpenSSL legacy provider** for client build due to webpack/crypto dependencies
2. **Vue 2.5 is legacy** - Modern Vue 3 features not available
3. **jQuery UI still required** for drag-drop with touch support
4. **Stylelint requires `::v-deep` whitelisting** for Vue scoped style penetration
5. **MongoDB must be running** before starting server
6. **FlowSense is experimental** and not fully documented

## Resources

- [VisFlow Documentation](https://visflow.org/docs)
- [VisTrails Integration Guide](docs/VISFLOW_VISTRAILS_INTEGRATION.md)
- [Original README](README.md)
