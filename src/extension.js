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
	if (settings.get('--Enable') === true) {
		console.log('start cpp-check-lint extension!');
	}
	else {
		console.log('disable cpp-check-lint extension!');
		return;
	}
	console.log("context.asAbsolutePath : " + context.extensionPath);

	let disposable = vscode.commands.registerCommand('cpp-check-lint.cppcheck', (url) => { cppcheck_obj.activate(context, url, true); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-check-lint.cppcheckdir', (url) => { cppcheck_obj.activate(context, url, false); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-check-lint.cppcheckcmd', (url) => { cppcheck_obj.on_cmd(context, url); });
	context.subscriptions.push(disposable);


	disposable = vscode.commands.registerCommand('cpp-check-lint.cpplint', (url) => { cpplint_obj.activate(context, url, true); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-check-lint.cpplintdir', (url) => { cpplint_obj.activate(context, url, false); });
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('cpp-check-lint.cpplintcmd', (url) => { cpplint_obj.on_cmd(context, url); });
	context.subscriptions.push(disposable);

	if ("win32" != os.platform()) {
		let cmd = 'chmod +x ';
		let arg = path.join(path.join(path.join(context.extensionPath, "bin"), "Linux64"), "cppcheck");
		let res = common.runCmd_sync(cmd + arg);
		console.log(cmd + " " + arg + " -> ");
		console.log(res)
		arg = path.join(path.join(path.join(context.extensionPath, "bin"), "Linux64"), "cpplint.py");
		res = common.runCmd_sync(cmd + arg);
		console.log(cmd + " " + arg + " -> ");
		console.log(res)
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
