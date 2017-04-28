'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { workspace, commands, ExtensionContext, window } from 'vscode';
import { dirname } from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = commands.registerCommand('extension.ignoreGitignore', async () => {
    // The code you place here will be executed every time your command is executed

    // Just use the root one for now
    const gitignores = await workspace.findFiles('**/.gitignore')

    let path;
    if (!gitignores.length) {
      window.showInformationMessage('No .gitignore files found in current workspace.');
      return;
    }

    const excludeObj: { [glob: string]: boolean } = {};
    const gitignoreDocumentPromises = gitignores.map((file) => {
      return workspace.openTextDocument(file.path);
    });

    const gitignoreDocuments = await Promise.all(gitignoreDocumentPromises);

    gitignoreDocuments.forEach((doc) => {
      const relativePath = workspace.asRelativePath(doc.fileName);
      const dir = dirname(relativePath);

      // Let's do search for now
      for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        const lineText: string = doc.lineAt(lineIndex).text;

        if (lineText.length && lineText.charAt(0) !== '#') {
          let lineTextWithPath = lineText;
          if (dir !== '.') {
            lineTextWithPath = dir + '/' + lineText;
          }

          excludeObj[lineTextWithPath] = true;
        }
      }
    })

    const config = await workspace.getConfiguration();
    config.update('search.exclude', excludeObj, false);
    config.update('files.exclude', excludeObj, false);

    window.showInformationMessage(
      `Successfully overwrote search.exclude and files.exclude from \
${gitignoreDocuments.length} .gitignore files.`);
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
