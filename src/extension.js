const vscode = require('vscode');
const os = require('os');
const path = require('path');
const common = require("./common");
const cppcheck = require("./cppcheck");
let cppcheck_obj = new cppcheck.cppcheck();
const cpplint = require("./cpplint");
let cpplint_obj = new cpplint.cpplint();

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Congratulations, your extension "cpp-check-lint" is now active!');
	let settings = vscode.workspace.getConfiguration('cpp-check-lint');
	if (settings.get('--enable') === true) {
		console.log('start cpp-check-lint extension!');
	}
	else {
		console.log('disable cpp-check-lint extension!');
		return;
	}
	console.log("context.asAbsolutePath : " + context.extensionPath);

	let support_language = ["cpp","c","h","hh","hpp","h++"]

	let disposable = vscode.commands.registerCommand('cpp-check-lint.cppcheck', (url) => { cppcheck_obj.activate(context, url, true); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-check-lint.cppcheckdir', (url) => { cppcheck_obj.activate(context, url, false); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-check-lint.cppcheckcmd', (url) => { cppcheck_obj.on_cmd(context, url); });
	context.subscriptions.push(disposable);
	disposable = vscode.languages.registerCodeActionsProvider(support_language, cppcheck_obj);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('cpp-check-lint.cpplint', (url) => { cpplint_obj.activate(context, url, true); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-check-lint.cpplintdir', (url) => { cpplint_obj.activate(context, url, false); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-check-lint.cpplintcmd', (url) => { cpplint_obj.on_cmd(context, url); });
	context.subscriptions.push(disposable);
	disposable = vscode.languages.registerCodeActionsProvider(support_language, cpplint_obj);
	context.subscriptions.push(disposable);

	disposable = vscode.workspace.onDidChangeConfiguration(function (event) {
		console.log("onDidChangeConfiguration");
		cppcheck_obj.update_setting();
		cpplint_obj.update_setting();
	})
	context.subscriptions.push(disposable);

	disposable = vscode.workspace.onDidSaveTextDocument(function (event) {
		console.log("onDidSaveTextDocument" + event.uri.fsPath);
		if (cppcheck_obj.onsave){
			cppcheck_obj.activate(context, event.uri, true);
		}
		if (cpplint_obj.onsave){
			cpplint_obj.activate(context, event.uri, true);
		}
	})
	context.subscriptions.push(disposable);

	if ("win32" != os.platform()) {
		let cmd = 'chmod +x ';
		let arg = path.join(path.join(path.join(context.extensionPath, "bin"), "linux64"), "cppcheck");
		let res = common.runCmd_sync(cmd + arg);
		console.log(cmd + " " + arg + " -> "+ res);
		arg = path.join(path.join(path.join(context.extensionPath, "bin"), "linux64"), "cpplint.py");
		res = common.runCmd_sync(cmd + arg);
		console.log(cmd + " " + arg + " -> "+ res);
		cmd = 'pwd';
		res = common.runCmd_sync(cmd);
		console.log(cmd + "->" + res);
	}

}

// this method is called when your extension is deactivated
function deactivate() {
	cppcheck_obj.deactivate();
	cpplint_obj.deactivate();
	console.log('a oh, your extension "cpp-check-lint" is now deactivate!');
}

module.exports = {
	activate,
	deactivate
}
