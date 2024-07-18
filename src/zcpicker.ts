import * as vscode from 'vscode';
import axios from 'axios';

interface ZoteroConfig {
  port: number;
}

async function showZoteroPicker(): Promise<void> {
  const config: ZoteroConfig = vscode.workspace.getConfiguration('zotero-citation-picker') as any;

  try {
    const response = await axios.get(`http://localhost:${config.port}`);
    const result: string = response.data;
    if (result) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit(editBuilder => {
          editor.selections.forEach(selection => {
            editBuilder.delete(selection);
            editBuilder.insert(selection.start, result);
          });
        });
      }
    }
  } catch (err: any) {
    console.log('Failed to fetch citation: %j', err.message);
    vscode.window.showErrorMessage('Zotero Citations: could not connect to Zotero. Are you sure it is running?');
  }
}

async function openPDFZotero(): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  let citeKey: string = '';

  if (editor.selection.isEmpty) {
    const range = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (range) {
      citeKey = editor.document.getText(range);
    }
  } else {
    citeKey = editor.document.getText(new vscode.Range(editor.selection.start, editor.selection.end));
  }

  console.log(`Opening ${citeKey} in Zotero`);

  const options = {
    method: 'POST',
    url: 'http://localhost:23119/better-bibtex/json-rpc',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'axios'
    },
    data: {
      'jsonrpc': '2.0',
      'method': 'item.attachments',
      'params': [citeKey]
    }
  };

  let uri = vscode.Uri.parse(`zotero://select/items/bbt:${citeKey}`);

  try {
    const response = await axios(options);
    const repos: any = response.data;
    console.log(repos['result']);
    console.log('User has %d repos', repos['result'].length);
    for (const elt of repos['result']) {
      if (elt['path'].endsWith('.pdf')) {
        uri = vscode.Uri.parse(elt['open']);
        break;
      }
    }
    console.log(uri);
    await vscode.env.openExternal(uri);
  } catch (err: any) {
    console.log('API open PDF in Zotero failed', err);
  }
}
