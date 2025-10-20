import { Component, Vue } from 'vue-property-decorator';
import axios from 'axios';

interface Workflow {
  id: string;
  name: string;
  version_count: number;
}

@Component
export default class VisTrailsViewer extends Vue {
  private workflows: Workflow[] = [];
  private selectedWorkflow: Workflow | null = null;
  private selectedVersion: number = 1;
  private availableVersions: number[] = [];
  private currentTab: string = 'version-tree';

  private loading: boolean = false;
  private error: string = '';

  private loadingTree: boolean = false;
  private treeError: string = '';
  private versionTreeSVG: string = '';

  private loadingWorkflow: boolean = false;
  private workflowError: string = '';
  private workflowSVG: string = '';

  private apiBase: string = '/api';

  public mounted() {
    this.loadWorkflows();
  }

  private async loadWorkflows() {
    this.loading = true;
    this.error = '';

    try {
      const response = await axios.get(`${this.apiBase}/workflows`);
      this.workflows = response.data;
    } catch (err: any) {
      this.error = `Failed to load workflows: ${err.message}`;
      console.error('Error loading workflows:', err);
    } finally {
      this.loading = false;
    }
  }

  private async selectWorkflow(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.selectedVersion = 1;

    // Load workflow metadata to get available versions
    try {
      const response = await axios.get(`${this.apiBase}/workflow/${workflow.id}`);
      const metadata = response.data;

      // Get available versions from metadata
      if (metadata.versions && Array.isArray(metadata.versions)) {
        this.availableVersions = metadata.versions.map((v: any) => v.id);
      } else {
        // Generate version list based on count
        this.availableVersions = Array.from(
          { length: workflow.version_count },
          (_, i) => i + 1
        );
      }

      // Load version tree and workflow SVG
      await Promise.all([
        this.loadVersionTreeSVG(),
        this.loadWorkflowSVG(),
      ]);
    } catch (err: any) {
      this.error = `Failed to load workflow metadata: ${err.message}`;
      console.error('Error loading workflow metadata:', err);
    }
  }

  private async loadVersionTreeSVG() {
    if (!this.selectedWorkflow) {
      return;
    }

    this.loadingTree = true;
    this.treeError = '';

    try {
      const response = await axios.get(
        `${this.apiBase}/workflow/${this.selectedWorkflow.id}/tree/svg`,
        { responseType: 'text' }
      );
      this.versionTreeSVG = response.data;
    } catch (err: any) {
      this.treeError = `Failed to load version tree: ${err.message}`;
      console.error('Error loading version tree:', err);
    } finally {
      this.loadingTree = false;
    }
  }

  private async loadWorkflowSVG() {
    if (!this.selectedWorkflow) {
      return;
    }

    this.loadingWorkflow = true;
    this.workflowError = '';

    try {
      const response = await axios.get(
        `${this.apiBase}/workflow/${this.selectedWorkflow.id}/version/${this.selectedVersion}/svg`,
        { responseType: 'text' }
      );
      this.workflowSVG = response.data;
    } catch (err: any) {
      this.workflowError = `Failed to load workflow SVG: ${err.message}`;
      console.error('Error loading workflow SVG:', err);
    } finally {
      this.loadingWorkflow = false;
    }
  }
}
