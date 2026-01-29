import { Plugin, WorkspaceLeaf, TFile } from 'obsidian';

export default class ProseModePlugin extends Plugin {
  private readonly PROSE_MODE_CLASS = 'prose-mode';
  private readonly PROSE_PATH_PATTERN = /\/prose\//i;

  async onload() {
    console.log('Loading Prose Mode plugin');

    // Wait for workspace to be ready before applying prose mode
    this.app.workspace.onLayoutReady(() => {
      this.applyProseModeToActiveLeaf();
    });

    // Watch for file opens and tab switches
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        this.applyProseModeToActiveLeaf();
      })
    );

    // Watch for file changes (rename, move)
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        this.applyProseModeToActiveLeaf();
      })
    );
  }

  onunload() {
    console.log('Unloading Prose Mode plugin');
    // Clean up all prose-mode classes
    this.removeAllProseModeClasses();
  }

  private applyProseModeToActiveLeaf() {
    // First, remove prose-mode from all leaves
    this.removeAllProseModeClasses();

    // Get the active leaf
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf) return;

    // Check if the active file is in a prose directory
    const file = this.app.workspace.getActiveFile();
    if (!file) return;

    if (this.isProsePath(file.path)) {
      this.addProseModeClass(activeLeaf);
    }
  }

  private isProsePath(path: string): boolean {
    return this.PROSE_PATH_PATTERN.test(path);
  }

  private addProseModeClass(leaf: WorkspaceLeaf) {
    const container = leaf.view.containerEl;
    if (container && !container.classList.contains(this.PROSE_MODE_CLASS)) {
      container.classList.add(this.PROSE_MODE_CLASS);
      console.log('Prose mode enabled for:', this.app.workspace.getActiveFile()?.path);
    }
  }

  private removeAllProseModeClasses() {
    // Remove prose-mode class from all workspace leaves
    document.querySelectorAll(`.${this.PROSE_MODE_CLASS}`).forEach((el) => {
      el.classList.remove(this.PROSE_MODE_CLASS);
    });
  }
}
