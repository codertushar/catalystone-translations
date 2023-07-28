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
			'coLangXpert', // Unique identifier for the panel
			'CO LangXpert', // Title of the panel
			vscode.ViewColumn.One, // Column to show the panel in (One, Two, Three)
			{
				// Enable JavaScript in the webview content
				enableScripts: true,
			}
		);

		// Load the HTML content into the webview panel
		const content = fs.readFileSync( getWebviewPath( context ), 'utf8' );
		panel.webview.html = content;

		// Get the content of language.sql file and send it to the webview
		const languageFilePath = getLanguageFilePath();
		let data = await fs.promises.readFile( languageFilePath, 'utf8' );
		panel.webview.postMessage( { type: 'languageSqlContent', content: data } );

		panel.webview.onDidReceiveMessage( async ( message ) => {
			if ( message.command === 'dataFromPanel' ) {
				// Access the data sent from the webview
				const dataFromPanel = message.payload;
				if(dataFromPanel.addBit) {
					data += dataFromPanel.newString;
					await fs.promises.writeFile( languageFilePath, data, 'utf8' );
					vscode.window.showInformationMessage( `Successfully added new translation entry` );
				} else {
					searchAndModify( data, dataFromPanel, languageFilePath );
				}
			}
		} );
	} );

	context.subscriptions.push( disposable );
}

// This method is called when your extension is deactivated
function deactivate() { }


function getWebviewPath( context ) {
	return path.join( context.extensionPath, 'webviews', 'panel.html' );
}

function getLanguageFilePath() {
	const rootPath = vscode.workspace.rootPath;
	return path.join( rootPath, 'Database', 'language.sql' );
}

async function searchAndModify( data, dataFromPanel, languageFilePath ) {
	const sqlStatements = data.match( /insert into FUNCTIONTEXT.*?;/g );
	// Read the content of the language.sql file
	try {
		// Find the matching row based on <TextName> and modify it in place
		let modifiedContent = '';
		let isModified = false;
		for ( const sqlStatement of sqlStatements ) {
			if ( sqlStatement.includes( dataFromPanel.oldString ) ) {
				// Modify the row here based on your requirements
				// For example, you can extract and modify the translation values

				const modifiedStatement = data.replace( new RegExp( escapeRegExp( dataFromPanel.oldString ), 'g' ), dataFromPanel.newString );
				modifiedContent += modifiedStatement;
				isModified = true;
			}
		}

		if ( !isModified ) {
			vscode.window.showInformationMessage( `No entry found for the given <TextName>: ` );
			return;
		}

		// Write the modified content back to the language.sql file
		await fs.promises.writeFile( languageFilePath, modifiedContent, 'utf8' );
		vscode.window.showInformationMessage( `Successfully modified entries with <TextName>: ` );
	} catch ( err ) {
		vscode.window.showErrorMessage( `Error reading or modifying language.sql: ${err.message}` );
	}
}

function escapeRegExp( string ) {
	return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

module.exports = {
	activate,
	deactivate
};
