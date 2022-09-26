const vscode = require('vscode');
const os = require('os');
const path = require('path');
const log = require('./log');
const common = require("./common");
const cppcheck = require("./cppcheck");
let cppcheck_obj = new cppcheck.cppcheck();
const cpplint = require("./cpplint");
let cpplint_obj = new cpplint.cpplint();

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	log.info('Congratulations, your extension "cpp-checker" is now active!');
	let settings = vscode.workspace.getConfiguration('cpp-checker');
	log.setLogLevel(settings.get('--log'));
	if (settings.get('--enable') === true) {
		log.info('start cpp-checker extension!');
	} else {
		log.info('disable cpp-checker extension!');
		return;
	}
	log.info("context.asAbsolutePath : " + context.extensionPath);

	let support_language = ["cpp", "c", "h", "hh", "hpp", "h++", "cc"];

	cppcheck_obj.set_root_path(context.extensionPath);

	cpplint_obj.set_root_path(context.extensionPath);

	let disposable = vscode.commands.registerCommand('cpp-checker.cppcheck', (url) => { cppcheck_obj.activate(context, url, true); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-checker.cppcheckdir', (url) => { cppcheck_obj.activate(context, url, false); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-checker.cppcheckcmd', (url) => { cppcheck_obj.on_cmd(context, url); });
	context.subscriptions.push(disposable);
	disposable = vscode.languages.registerCodeActionsProvider(support_language, cppcheck_obj);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('cpp-checker.cpplint', (url) => { cpplint_obj.activate(context, url, true); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-checker.cpplintdir', (url) => { cpplint_obj.activate(context, url, false); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-checker.cpplintcmd', (url) => { cpplint_obj.on_cmd(context, url); });
	context.subscriptions.push(disposable);
	disposable = vscode.languages.registerCodeActionsProvider(support_language, cpplint_obj);
	context.subscriptions.push(disposable);

	disposable = vscode.workspace.onDidChangeConfiguration(function (event) {
		let new_settings = vscode.workspace.getConfiguration('cpp-checker');
		log.setLogLevel(new_settings.get('--log'));
		log.info("onDidChangeConfiguration");
		cppcheck_obj.update_setting();
		cpplint_obj.update_setting();
	})
	context.subscriptions.push(disposable);

	disposable = vscode.workspace.onDidSaveTextDocument(function (event) {

		log.info("onDidSaveTextDocument : " + event.uri.fsPath);
		if (cppcheck_obj.onsave) {
			for (let value of support_language) {
				if (event.uri.fsPath.endsWith("." + value)) {
					cppcheck_obj.activate(context, event.uri, true);
					break;
				}
			}

		}
		if (cpplint_obj.onsave) {
			for (let value of support_language) {
				if (event.uri.fsPath.endsWith("." + value)) {
					cpplint_obj.activate(context, event.uri, true);
					break;
				}
			}
		}
	})
	context.subscriptions.push(disposable);

	if ("win32" != os.platform()) {
		let cmd = 'chmod +x ';
		let arg = path.join(path.join(path.join(context.extensionPath, "bin"), "linux64"), "cppcheck");
		let res = common.runCmd_execSync(cmd + arg);
		log.info(cmd + " " + arg + " -> " + res);
		arg = path.join(path.join(path.join(context.extensionPath, "bin"), "linux64"), "cpplint.py");
		res = common.runCmd_execSync(cmd + arg);
		log.info(cmd + " " + arg + " -> " + res);
		cmd = 'pwd';
		res = common.runCmd_execSync(cmd);
		log.info(cmd + "->" + res);
	}

}

// this method is called when your extension is deactivated
function deactivate() {
	cppcheck_obj.deactivate();
	cpplint_obj.deactivate();
	console.log('a oh, your extension "cpp-checker" is now deactivate!');
}

module.exports = {
	activate,
	deactivate
}
