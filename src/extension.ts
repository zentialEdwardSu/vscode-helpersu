import * as vscode from 'vscode';
import * as path from 'path';
import {walker, WalkerResult,toString} from './dirwalker';
import { extratPath } from './utils';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {

	const config = vscode.workspace.getConfiguration('lassistantdesu.pathcomplete');
	
	const platform = os.platform();
	if (platform != 'linux') {
		vscode.window.showErrorMessage(`Plugin are running under ${platform}. Though all the provided functions are tested under linux platform.`);
	}

    const path_provider = vscode.languages.registerCompletionItemProvider(
        "*",
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				console.log(vscode.window.activeTextEditor?.document.fileName);
				const activate_file = vscode.window.activeTextEditor?.document.fileName;
				if (!activate_file) {
					vscode.window.showErrorMessage('Please open a file or save file first');
				}
				let currentpath = path.dirname(activate_file!);
				const linePrefix = document.lineAt(position).text.slice(0, position.character);
                const keyword = 'fs?';
				if (!linePrefix.endsWith(keyword)) {
					return undefined;
				}
				
				if (linePrefix.endsWith(`/${keyword}`)) {
					const _path = extratPath(linePrefix, keyword, currentpath);
					currentpath = _path ? path.resolve(currentpath,_path) : currentpath
					// console.log(`The current path is ${currentpa``th}`);
				}
				
				const construct_item = (p:WalkerResult) => {
					const item = new vscode.CompletionItem(p.path);
					item.insertText = p.kind == 'file' || p.path=="../"?p.path:'./'+p.path;
					const r = new vscode.Range(position.line, position.character-keyword.length, position.line, position.character);
					item.additionalTextEdits = [vscode.TextEdit.delete(r)];
					item.kind = p.kind == 'dir' ? vscode.CompletionItemKind.Folder : vscode.CompletionItemKind.File;
					return item;
				}

				const suggest_completion = walker(currentpath,undefined,{withParent:false}).then(items => {
					items.push({path:'../',kind:'dir'});
					console.log(`For ${currentpath}: found ${items.length} items, ${toString(items)}`);
					return items.map(construct_item);
				}).catch(err => {
					vscode.window.showErrorMessage(err.message);
					return undefined
				});	
                return suggest_completion;
            }
        },
        '?'
    );

	const activate_command = vscode.commands.registerCommand('extension.Helperactivate', () => {
		vscode.window.showInformationMessage('Helper activated!');
	});
	context.subscriptions.push(activate_command);
	context.subscriptions.push(path_provider);
}