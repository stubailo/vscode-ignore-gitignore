'use strict';

import { dirname } from 'path';
import { commands, ExtensionContext, window, workspace } from 'vscode';

export function activate(context: ExtensionContext) {
  let disposable = commands.registerCommand('extension.ignoreGitignore', async () => {

    // Get a list of all .gitignore files in the project
    const gitignores = await workspace.findFiles('**/.gitignore');

    if (!gitignores) {
      window.showInformationMessage('No .gitignore files found in current workspace.');
      return;
    }

    const gitignoreDocumentPromises = gitignores.map((file) => {
      return workspace.openTextDocument(file.path);
    });

    const gitignoreDocuments = await Promise.all(gitignoreDocumentPromises);

    const excludeObj: { [glob: string]: boolean } = {};

    gitignoreDocuments.forEach((doc) => {
      const relativePath = workspace.asRelativePath(doc.fileName);
      const dir = dirname(relativePath);

      // Let's do search for now
      for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        let lineText = doc.lineAt(lineIndex).text;

        if (lineText.length && !lineText.startsWith('#')) {
          const negated = lineText.startsWith('!');
          if (negated) {
            lineText = lineText.substr(1);
          }

          // pattern starts at project root
          let glob = lineText.startsWith('/')
            ? lineText.substr(1)
            : `**/${lineText}`;

          // prefix the glob if the .gitignore was not found in the project root
          if (dir !== '.') {
            glob = `${dir}/${glob}`;
          }

          excludeObj[glob] = !negated;
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

export function deactivate() {
}