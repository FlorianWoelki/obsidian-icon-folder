import { Plugin, MenuItem } from 'obsidian';
import IconPickerModal from './iconsPickerModal';
import { addToDOMWithElement, removeFromDOM, waitForDataNodes } from './util';

export default class IconFolderPlugin extends Plugin {
  private folderIconData: Record<string, string>;

  async onload() {
    console.log('loading plugin obsidian-icon-folder');

    await this.loadIconFolderData();

    const data = Object.entries(this.folderIconData) as [string, string];
    waitForDataNodes(data).then((foundNodes) => {
      foundNodes.forEach(({ node, value }) => {
        addToDOMWithElement(value, node);
      });
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        const addIconMenuItem = (item: MenuItem) => {
          item.setTitle('Change icon');
          item.setIcon('hashtag');
          item.onClick(() => {
            const modal = new IconPickerModal(this.app, this, file.path);
            modal.open();
          });
        };

        const removeIconMenuItem = (item: MenuItem) => {
          item.setTitle('Remove icon');
          item.setIcon('trash');
          item.onClick(() => {
            this.removeFolderIcon(file.path);
            removeFromDOM(file.path);
          });
        };

        menu.addItem(addIconMenuItem);
        menu.addItem(removeIconMenuItem);
      }),
    );

    // deleting event
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        const path = file.path;
        this.removeFolderIcon(path);
      }),
    );

    // renaming event
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        this.renameFolder(file.path, oldPath);
      }),
    );
  }

  onunload() {
    console.log('unloading plugin obsidian-icon-folder');
  }

  renameFolder(newPath: string, oldPath: string): void {
    if (!this.folderIconData[oldPath] || newPath === oldPath) {
      return;
    }

    Object.defineProperty(this.folderIconData, newPath, Object.getOwnPropertyDescriptor(this.folderIconData, oldPath));
    delete this.folderIconData[oldPath];
    this.saveIconFolderData();
  }

  removeFolderIcon(path: string): void {
    if (!this.folderIconData[path]) {
      return;
    }

    delete this.folderIconData[path];
    this.saveIconFolderData();
  }

  addFolderIcon(path: string, iconId: string): void {
    if (this.folderIconData[path]) {
      removeFromDOM(path);
    }

    this.folderIconData[path] = iconId;
    this.saveIconFolderData();
  }

  async loadIconFolderData(): Promise<void> {
    this.folderIconData = Object.assign({}, {}, await this.loadData());
  }

  async saveIconFolderData(): Promise<void> {
    await this.saveData(this.folderIconData);
  }
}
