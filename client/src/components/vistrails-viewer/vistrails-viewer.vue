<template>
  <div id="vistrails-viewer">
    <div class="header">
      <h1>VisTrails Workflow Viewer</h1>
      <a href="/" class="back-link">← Back to VisFlow</a>
    </div>

    <div class="container">
      <div class="sidebar">
        <h2>Available Workflows</h2>
        <div v-if="loading" class="loading">Loading workflows...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <ul v-else class="workflow-list">
          <li
            v-for="workflow in workflows"
            :key="workflow.id"
            @click="selectWorkflow(workflow)"
            :class="{ active: selectedWorkflow && selectedWorkflow.id === workflow.id }"
          >
            <div class="workflow-name">{{ workflow.name }}</div>
            <div class="workflow-info">{{ workflow.version_count }} versions</div>
          </li>
        </ul>
      </div>

      <div class="main-content">
        <div v-if="!selectedWorkflow" class="empty-state">
          <p>Select a workflow from the list to view it</p>
        </div>

        <div v-else class="workflow-viewer">
          <div class="tabs">
            <button
              @click="currentTab = 'version-tree'"
              :class="{ active: currentTab === 'version-tree' }"
            >
              Version Tree
            </button>
            <button
              @click="currentTab = 'workflow'"
              :class="{ active: currentTab === 'workflow' }"
            >
              Workflow View
            </button>
          </div>

          <div v-if="currentTab === 'version-tree'" class="version-tree-view">
            <h3>Version Tree for {{ selectedWorkflow.name }}</h3>
            <div class="version-selector">
              <label>Select Version:</label>
              <select v-model="selectedVersion" @change="loadWorkflowSVG">
                <option v-for="version in availableVersions" :key="version" :value="version">
                  Version {{ version }}
                </option>
              </select>
            </div>
            <div class="svg-container">
              <div v-if="loadingTree" class="loading">Loading version tree...</div>
              <div v-else-if="treeError" class="error">{{ treeError }}</div>
              <div v-else v-html="versionTreeSVG" class="svg-content"></div>
            </div>
          </div>

          <div v-if="currentTab === 'workflow'" class="workflow-view">
            <h3>Workflow: {{ selectedWorkflow.name }} (Version {{ selectedVersion }})</h3>
            <div class="svg-container">
              <div v-if="loadingWorkflow" class="loading">Loading workflow...</div>
              <div v-else-if="workflowError" class="error">{{ workflowError }}</div>
              <div v-else v-html="workflowSVG" class="svg-content"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
#vistrails-viewer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;

  .header {
    background: #2c3e50;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .back-link {
      color: #3498db;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    width: 300px;
    background: #ecf0f1;
    padding: 1rem;
    overflow-y: auto;
    border-right: 1px solid #bdc3c7;

    h2 {
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
    }

    .workflow-list {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #3498db;
          color: white;
        }

        &.active {
          background: #2980b9;
          color: white;
        }

        .workflow-name {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .workflow-info {
          font-size: 0.85rem;
          opacity: 0.8;
        }
      }
    }
  }

  .main-content {
    flex: 1;
    overflow: auto;
    padding: 2rem;
    background: white;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #7f8c8d;
    font-size: 1.1rem;
  }

  .workflow-viewer {
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #ecf0f1;

      button {
        padding: 0.75rem 1.5rem;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 1rem;
        color: #7f8c8d;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;

        &:hover {
          color: #2c3e50;
        }

        &.active {
          color: #3498db;
          border-bottom-color: #3498db;
        }
      }
    }

    h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .version-selector {
      margin-bottom: 1.5rem;

      label {
        margin-right: 0.5rem;
        font-weight: bold;
      }

      select {
        padding: 0.5rem;
        border: 1px solid #bdc3c7;
        border-radius: 4px;
        font-size: 1rem;
      }
    }

    .svg-container {
      border: 1px solid #ecf0f1;
      border-radius: 4px;
      padding: 2rem;
      background: #fafafa;
      min-height: 400px;
      display: flex;
      justify-content: center;
      align-items: center;

      .svg-content {
        width: 100%;

        ::v-deep svg {
          max-width: 100%;
          height: auto;
        }
      }
    }
  }

  .loading, .error {
    text-align: center;
    padding: 2rem;
    font-size: 1.1rem;
  }

  .loading {
    color: #3498db;
  }

  .error {
    color: #e74c3c;
  }
}
</style>

<script lang="ts" src="./vistrails-viewer.ts"></script>
