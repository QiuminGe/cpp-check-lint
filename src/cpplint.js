const vscode = require("vscode");
let common = require("./common");
let base = require("./base")
const log = require('./log');

class cpplint {
    constructor() {
        this.name = "cpplint";
        this.base = new base.code_base(this.name);
        // 1 = path, 2 = line, 3 = severity, 4 = message , 5 = filter, 6 = verbose
        this.regex = /^(.*):(\d+):\s(\w+):\s(.*)\[(.*)\]\s+\[([0-9]+)\]/gm;
    }

    /**
    * @param {string} root_path
    */
    set_root_path(root_path) {
        this.root_path = root_path;
        this.update_setting();
    }

    get_cfg(root_path) {
        let res = new Array(this.base.get_cfg(this.settings, "--executable", false),
            "--output=eclipse",
            this.base.get_cfg(this.settings, "--counting=", true),
            this.base.get_cfg(this.settings, "--extensions=", true),
            this.base.get_cfg(this.settings, "--headers=", true),
            this.base.get_cfg(this.settings, "--verbose=", true),
            this.base.get_cfg(this.settings, "--filter=", true),
            this.base.get_cfg(this.settings, "--linelength=", true)
        );

        let exclude = this.base.get_cfg(this.settings, "--exclude=", false, []);
        if (0 != exclude.length) {
            for (let index = 0; index < exclude.length; index++) {
                if (!common.is_empty_str(exclude[index])) {
                    res.push("--exclude=" + this.base.to_full_name(exclude[index]))
                }
            }
        }

        if (common.is_empty_str(res[0])) {
            res[0] = this.base.add_root_path(this.root_path, "cpplint", "cpplint.py")
            log.info("use builtin binaries " + res[0]);
        }
        else {
            let params = ["--version"];
            let result = common.runCmd_spawnSync(res[0], params);
            if (result.error) {
                log.info("try run [" + res[0] + "] error name : [" + result.error.name + "], message [" + result.error.message + "]");
                res[0] = this.base.add_root_path(this.root_path, "cpplint", "cpplint.py")
                log.info("use builtin binaries " + res[0]);
            } else {
                log.info("try run [" + res[0] + "] stdout : [" + result.stdout + "], stderr [" + result.stderr + "]");
                let version = result.stdout
                if (!common.is_empty_str(version)) {
                    log.info("use [" + version.trim() + "]")
                } else {
                    log.info("use [" + res[0] + "]")
                }
            }
        }

        common.remove_empty(res);
        return res;
    }

    update_setting() {
        this.settings = vscode.workspace.getConfiguration('cpp-check-lint.cpplint');
        this.quick_fix = this.base.get_cfg(this.settings, "--quick_fix", false, true);
        this.onsave = this.base.get_cfg(this.settings, "--onsave", false, true);
        this.cmd_ary = this.get_cfg();
    }

    get_full_cmd(dest_path, isFile) {
        let res = this.cmd_ary.slice(0);
        if (!isFile) {
            res.push("--recursive");
        }
        res.push(dest_path);
        return res;
    }

    /**
     * @param {any[]} array
     * @param {number} length
     */
    to_diagnostics(array, length) {
        let line = Number(array[2]);
        let column = 0;
        let severity = array[3];
        let message = array[4];
        let source = array[5];
        if (line > 0) {
            line--;
        }
        if (column > 0) {
            column--;
        }

        let r = new vscode.Range(line, column, line, length);
        let d = new vscode.Diagnostic(r, `${message}`, this.base.to_severity(severity));
        d.code = severity + ":" + source;
        d.source = this.name;
        return d;
    }

    /**
     * @param {vscode.TextDocument} document
     * @param {vscode.Range | vscode.Selection} range
     * @param {vscode.CodeActionContext} context
     * @param {vscode.CancellationToken} token
     */
    provideCodeActions(document, range, context, token) {

        if (0 == context.diagnostics.length) {
            return null;
        }

        let my_diagnostics = []
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source == this.name) {
                my_diagnostics.push(diagnostic);
            }
        }

        if (0 == my_diagnostics.length) {
            return null;
        }

        const pos = range.start;
        const line = document.lineAt(pos.line);

        let actions = [];
        const fix = new vscode.CodeAction(`cpplint-suppress`, vscode.CodeActionKind.QuickFix);
        let suppress_str = "  // NOLINT";
        const startPos = document.lineAt(pos.line).range.end;
        const endPos = new vscode.Position(line.lineNumber, startPos.character + suppress_str.length);
        const edits = [new vscode.TextEdit(new vscode.Range(startPos, endPos), suppress_str)];
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.set(document.uri, edits);
        actions.push(fix);
        return actions;
    }

    /**
     * @param {any} code
     */
    on_exit(code) {
        this.base.working = false;
        this.base.check_files.clear();
        log.info("exit code is : " + code);
    }

    /**
     * @param {string} result
     */
    exec_res(result) {
        let regexArray;
        let file_dict = {};
        while (regexArray = this.regex.exec(result)) {
            if (regexArray[1] === undefined || regexArray[2] === undefined
                || regexArray[3] === undefined || regexArray[4] === undefined
                || regexArray[5] === undefined || regexArray[6] === undefined) {
                continue;
            }
            let file_name = this.base.to_full_name(regexArray[1]);
            this.base.check_diagnosticCollection(file_name)
            if (!(file_name in file_dict)) {
                file_dict[file_name] = [];
            }
            file_dict[file_name].push(regexArray);
        }
        return file_dict;
    }

    /**
     * @param {string} result
     */
    on_stderror(result) {
        let file_dict = this.exec_res(result);

        for (let file_name in file_dict) {
            let diagnostics = [];
            let old_diagnostics = this.base.diagnosticCollection.get(vscode.Uri.file(file_name));
            if (0 != old_diagnostics.length) {
                diagnostics = diagnostics.concat(old_diagnostics);
            }

            vscode.workspace.openTextDocument(file_name).then((doc) => {
                for (let index = 0; index < file_dict[file_name].length; index++) {
                    let array = file_dict[file_name][index];
                    let line = Number(array[2]);
                    if (line > 0) {
                        line--;
                    }
                    let l = doc.lineAt(line);
                    diagnostics.push(this.to_diagnostics(array, l.text.length));
                }
                this.base.diagnosticCollection.set(doc.uri, diagnostics);
                log.debug("diagnosticCollection set : " + doc.uri);
            }, err => {
                for (let index = 0; index < file_dict[file_name].length; index++) {
                    let array = file_dict[file_name][index];
                    diagnostics.push(this.to_diagnostics(array, 0));
                }
                this.base.diagnosticCollection.set(vscode.Uri.file(file_name), diagnostics);
            });
        }
    }

    /**
     * @param {boolean} isFile
     * @param {{ extensionPath: any; }} context
     * @param {{ fsPath: any; path: string; }} url
     */
    activate(context, url, isFile) {
        if (this.settings.get('--enable') === true) {
            log.info(this.name + ' is enable!');
        }
        else {
            log.info(this.name + ' is disable!');
            return;
        }

        if (this.base.working) {
            vscode.window.showErrorMessage("please wait checking done !")
            return;
        }
        else {
            this.base.working = true;
            vscode.window.setStatusBarMessage(this.name + ' running...', 1000);
        }

        let dest_path = this.base.get_dest_path(isFile, url);
        let cmmand_array = this.get_full_cmd(dest_path, isFile);
        log.info(cmmand_array);
        this.base.spawn = common.runCmd(this.base.channel, cmmand_array, this.on_stderror, null, this.on_exit, this);
        log.info("pid : " + this.base.spawn.pid);
    }

    /**
     * @param {vscode.ExtensionContext} context
     */
    on_cmd(context, url) {
        return this.base.on_cmd(context, url);
    }

    deactivate() {
        return this.base.deactivate();
    }
}

exports.cpplint = cpplint

