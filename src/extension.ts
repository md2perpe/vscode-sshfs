
import * as fs from 'fs';
import * as vscode from 'vscode';
import { MemFs } from './fileSystemProvider';
import { Manager } from './manager';

const workspace = vscode.workspace;

export function activate(context: vscode.ExtensionContext) {
  const manager = new Manager(context);

  context.subscriptions.push(vscode.workspace.registerFileSystemProvider('ssh', manager, { isCaseSensitive: true }));

  context.subscriptions.push(vscode.commands.registerCommand('sshfs.new', async () => {
    const name = await vscode.window.showInputBox({ placeHolder: 'Name for the new SSH file system', validateInput: manager.invalidConfigName.bind(manager) });
    vscode.window.showTextDocument(vscode.Uri.parse(`ssh://<config>/${name}.json`));
  }));

  async function pickAndClick(func: (name: string) => void, activeOrNot: boolean) {
    const active = manager.getActive();
    const names = activeOrNot ? active : manager.loadConfigs().map(c => c.name).filter(n => active.indexOf(n) === -1);
    const pick = await vscode.window.showQuickPick(names, { placeHolder: 'SSH FS Configuration' });
    if (pick) func.call(manager, pick);
  }
  
  function registerCommand(name : string, handler : () => any) {
    context.subscriptions.push(vscode.commands.registerCommand(name, handler)); 
  }

  registerCommand('sshfs.connect',    () => pickAndClick(manager.commandConfigConnect,    false));
  registerCommand('sshfs.disconnect', () => pickAndClick(manager.commandConfigDisconnect, true));
  registerCommand('sshfs.reconnect',  () => pickAndClick(manager.commandConfigReconnect,  true));

  registerCommand('sshfs-configs.disconnect', manager.commandConfigDisconnect, manager);
  registerCommand('sshfs-configs.reconnect',  manager.commandConfigReconnect,  manager);
  registerCommand('sshfs-configs.connect',    manager.commandConfigConnect,    manager);
  registerCommand('sshfs-configs.configure',  manager.commandConfigure,        manager);
  registerCommand('sshfs-configs.delete',     manager.commandConfigDelete,     manager);

  vscode.window.createTreeView('sshfs-configs', { treeDataProvider: manager });
}
