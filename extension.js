// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require( 'vscode' );
const path = require( 'path' );
const fs = require( 'fs' );

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate( context ) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log( 'Congratulations, your extension "catalystone-translations" is now active!' );

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand( 'catalystone-translations.loadTranslations', async function () {
		// The code you place here will be executed every time your command is executed
		// Create a new webview panel
		const panel = vscode.window.createWebviewPanel(
			'myWebview', // Unique identifier for the panel
			'My Webview', // Title of the panel
			vscode.ViewColumn.One, // Column to show the panel in (One, Two, Three)
			{
				// Enable JavaScript in the webview content
				enableScripts: true,
			}
		);

		// Load the HTML content into the webview panel
		const content = fs.readFileSync(getWebviewPath(context), 'utf8');
		panel.webview.html = content;

		// Get the content of language.sql file and send it to the webview
		const languageFilePath = getLanguageFilePath(context);
		const data = await fs.promises.readFile(languageFilePath, 'utf8');
		panel.webview.postMessage({ type: 'languageSqlContent', content: data });
	} );

	context.subscriptions.push( disposable );
}

// This method is called when your extension is deactivated
function deactivate() { }

async function showLanguageFile() {
	const languageFilePattern = 'Database/language.sql';
	const languageFiles = await vscode.workspace.findFiles(languageFilePattern);

	if (languageFiles.length === 0) {
			vscode.window.showErrorMessage("No language.sql file found in the workspace.");
			return;
	}

	// If multiple language.sql files are found, open the first one
	const languageFilePath = languageFiles[0].fsPath;

	try {
			const data = await fs.promises.readFile(languageFilePath, 'utf8');

			// Create a new webview panel
			const panel = vscode.window.createWebviewPanel(
					'languageSqlPanel', // Identifies the type of the webview, used internally
					'Language SQL Table', // Title displayed in the webview
					vscode.ViewColumn.One, // Editor column to show the webview panel
					{}
			);

			// Send the content of the language.sql file to the webview
			panel.webview.html = getWebviewContent(data);
	} catch (err) {
			vscode.window.showErrorMessage(`Error reading language.sql: ${err.message}`);
	}
}

function getWebviewContent( context ) {
	const content = fs.readFileSync(getWebviewPath(context), 'utf8');

	return content;
}

function getWebviewPath(context) {
	return path.join(context.extensionPath, 'webviews', 'panel.html');
}

function getLanguageFilePath(context) {
	const rootPath = vscode.workspace.rootPath;
	return path.join(rootPath, 'Database', 'language.sql');
}

async function searchAndModify(context) {
	const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace is opened.");
        return;
    }

    const languageFilePattern = 'Database/language.sql';
    const languageFiles = await vscode.workspace.findFiles(languageFilePattern);

    if (languageFiles.length === 0) {
        vscode.window.showErrorMessage("No language.sql file found in the workspace.");
        return;
    }

    // If multiple language.sql files are found, open the first one
    const languageFilePath = languageFiles[0].fsPath;

    // Read the content of the language.sql file
    try {
        const data = await fs.promises.readFile(languageFilePath, 'utf8');

        // Extract individual SQL statements (rows) from the file content
        const sqlStatements = data.split(';');



        // // Get the <TextName> from the user
        // const textName = await vscode.window.showInputBox({
        //     prompt: "Enter the <TextName> to search and modify in language.sql",
        // });

        // if (!textName) {
        //     return; // User canceled the input
        // }

        // Find the matching row based on <TextName> and modify it in place
        let modifiedContent = '';
        let isModified = false;
        for (const sqlStatement of sqlStatements) {
            if (sqlStatement.includes('insert into FUNCTIONTEXT')) {
                // Modify the row here based on your requirements
                // For example, you can extract and modify the translation values

                // Sample modification: Replace 'Print' with 'ModifiedText' for all languages
                const modifiedStatement = sqlStatement.replace(/'Print'/g, `'ModifiedText'`);
                modifiedContent += modifiedStatement + ';';
                isModified = true;
            } else {
                modifiedContent += sqlStatement + ';';
            }
        }

        if (!isModified) {
            vscode.window.showInformationMessage(`No entry found for the given <TextName>: ${textName}`);
            return;
        }

        // Write the modified content back to the language.sql file
        await fs.promises.writeFile(languageFilePath, modifiedContent, 'utf8');
        vscode.window.showInformationMessage(`Successfully modified entries with <TextName>: ${textName}`);
    } catch (err) {
        vscode.window.showErrorMessage(`Error reading or modifying language.sql: ${err.message}`);
    }
}


module.exports = {
	activate,
	deactivate
};
