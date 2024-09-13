const vscode = require("vscode");
let common = require("./common");
let base = require("./base");
const log = require('./log');

class cppcheck {
    constructor() {
        this.name = "cppcheck";
        this.base = new base.code_base(this.name);
        //"--template={file}:{line}:{column}: {severity}: {message}:[{id}]",
        //this.regex = /^(.*):(\d+):(\d+|{column}):\s(\w+):\s(.*):\[([A-Za-z]+)\]$/gm;
        this.regex = /^(.*):(\d+):(\d+|{column}):\s(\w+):\s(.*):\[(.*)\]$/gm;
    }

    /**
    * @param {string} root_path
    */
    set_root_path(root_path) {
        this.root_path = root_path;
        this.update_setting();
    }

    get_cfg() {
        let res = new Array(this.base.get_cfg(this.settings, "--executable", false),
            this.base.get_cfg(this.settings, "--template=", true),
            this.base.get_cfg(this.settings, "--enable=", true),
            this.base.get_cfg(this.settings, "--inconclusive", false),
            this.base.get_cfg(this.settings, "-j", true),
            this.base.get_cfg(this.settings, "--max-ctu-depth=", true),
            this.base.get_cfg(this.settings, "--platform=", true),
            this.base.get_cfg(this.settings, "--std_c=", true, null, "--std="),
            this.base.get_cfg(this.settings, "--std_c++=", true, null, "--std="),
            this.base.get_cfg(this.settings, "--inline-suppr", true),
            this.base.get_cfg(this.settings, "--suppressions-list=", true),
            this.base.get_cfg(this.settings, "--report-progress", true),
            this.base.get_cfg(this.settings, "--customargs=", false),

        );

        let exclude = this.base.get_cfg(this.settings, "-i ", false, []);
        if (0 != exclude.length) {
            for (let value of exclude) {
                if (!common.is_empty_str(value)) {
                    res.push("-i" + this.base.to_full_name(value))
                }
            }
        }

        let include = this.base.get_cfg(this.settings, "-I ", false, []);
        if (0 != include.length) {
            for (let value of include) {
                if (!common.is_empty_str(value)) {
                    res.push("-I" + this.base.to_full_name(value))
                }
            }
        }

        let suppress = this.base.get_cfg(this.settings, "--suppress=", false, []);
        if (0 != suppress.length) {
            for (let value of suppress) {
                if (!common.is_empty_str(value)) {
                    res.push("--suppress=" + value);
                }
            }
        }

        let D = this.base.get_cfg(this.settings, "-D", false, []);
        if (0 != D.length) {
            for (let value of D) {
                if (!common.is_empty_str(value)) {
                    res.push("-D" + value);
                }
            }
        }

        let U = this.base.get_cfg(this.settings, "-U", false, []);
        if (0 != U.length) {
            for (let value of U) {
                if (!common.is_empty_str(value)) {
                    res.push("-U" + value);
                }
            }
        }

        if (common.is_empty_str(res[0])) {
            res[0] = this.base.add_root_path(this.root_path, "cppcheck", "cppcheck")
            log.info("use builtin binaries " + res[0]);
        }
        else {
            let params = ["--version"];
            let result = common.runCmd_spawnSync(res[0], params);
            if (result.error) {
                log.info("try run [" + res[0] + "] error name : [" + result.error.name + "], message [" + result.error.message + "]");
                res[0] = this.base.add_root_path(this.root_path, "cppcheck", "cppcheck")
                log.info("use builtin binaries " + res[0]);
            }
            else {
                log.info("try run [" + res[0] + "] stdout : [" + result.stdout + "], stderr [" + result.stderr + "]");
                let version = result.stdout;
                if ("string" == typeof (version)) {
                    if (!version.trim().toLowerCase().startsWith("cppcheck")) {
                        res[0] = this.base.add_root_path(this.root_path, "cppcheck", "cppcheck");
                        log.info("use builtin binaries " + res[0]);
                    }
                    else {
                        log.info("use [" + version.trim() + "]")
                    }
                }
            }
        }

        let addon = this.base.get_cfg(this.settings, "--addon=", false, []);
        if (0 != addon.length) {
            for (let value of addon) {
                if ("string" == typeof (value)) {
                    if (!common.is_empty_str(value)) {
                        res.push("--addon=" + value);
                    }
                }
                else {
                    let addon_json = JSON.stringify(value);
                    let workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
                    workspaceFolder = workspaceFolder.replace(/\\/g, "/")
                    addon_json = addon_json.replace("${workspaceFolder}", workspaceFolder)
                    res.push("--addon=" + addon_json);
                }
            }
        }

        let premium = this.base.get_cfg(this.settings, "--premium=", false, []);
        if (0 != premium.length) {
            for (let value of premium) {
                if ("string" == typeof (value)) {
                    if (!common.is_empty_str(value)) {
                        res.push("--premium=" + value);
                    }
                }
            }
        }

        common.remove_empty(res);
        return res;
    }

    update_setting() {
        this.settings = vscode.workspace.getConfiguration('cpp-check-lint.cppcheck');
        this.quick_fix = this.base.get_cfg_value(this.settings, "--quick_fix", false);
        this.onsave = this.base.get_cfg_value(this.settings, "--onsave", false);
        this.cmd_ary = this.get_cfg();
        log.debug(this);
    }

    get_full_cmd(dest_path) {
        let res = this.cmd_ary.slice(0);
        if (dest_path.endsWith(".hxx") || dest_path.endsWith(".h++") ||
            dest_path.endsWith(".hh") || dest_path.endsWith(".h") || dest_path.endsWith(".hpp")) {
            let language = this.base.get_cfg(this.settings, "--language=", "c++", true);
            res.push(language);
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
        let column = Number(array[3]);
        if (column != column) {
            column = 0;
        }
        let severity = array[4];
        let message = array[5].replace("CWE-{cwe} ", "");
        let source = array[6];
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

        let suppress_set = new Set();
        for (const diagnostic of my_diagnostics) {
            let id = diagnostic.code.toString().split(":")[1];
            if (!suppress_set.has(id)) {
                suppress_set.add(id)
            }
        }

        if (suppress_set.size > 1) {
            const fix = new vscode.CodeAction(`cppcheck-suppress all`, vscode.CodeActionKind.QuickFix);
            let suppress_str = "// cppcheck-suppress [";
            for (const suppress_id of suppress_set) {
                suppress_str = suppress_str + suppress_id + ",";
            }
            suppress_str = suppress_str.substr(0, suppress_str.length - 1);
            suppress_str = suppress_str + "]";
            suppress_str = suppress_str + "\r\n" + document.lineAt(pos.line).text;
            const startPos = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
            const endPos = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex + suppress_str.length);
            const edits = [new vscode.TextEdit(new vscode.Range(startPos, endPos), suppress_str)];
            fix.edit = new vscode.WorkspaceEdit();
            fix.edit.set(document.uri, edits);
            actions.push(fix);
        }

        for (const suppress_id of suppress_set) {
            const fix = new vscode.CodeAction(`cppcheck-suppress ${suppress_id}`, vscode.CodeActionKind.QuickFix);
            let suppress_str = "// cppcheck-suppress " + suppress_id;
            suppress_str = suppress_str + "\r\n" + document.lineAt(pos.line).text;
            const startPos = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
            const endPos = new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex + suppress_str.length);
            const edits = [new vscode.TextEdit(new vscode.Range(startPos, endPos), suppress_str)];
            fix.edit = new vscode.WorkspaceEdit();
            fix.edit.set(document.uri, edits);
            actions.push(fix);
        }
        return actions;
    }

    /**
     * @param {any} code
     */
    on_exit(code) {
        this.base.working = false;
        this.base.check_files.clear();
        log.info("exit code is :" + code);
    }

    /**
     * @param {string} result
     */
     exec_stderror_res(result) {
        let regexArray;
        let file_dict = {};
        while (regexArray = this.regex.exec(result)) {
            if (regexArray[1] === undefined || regexArray[2] === undefined
                || regexArray[3] === undefined || regexArray[4] === undefined
                || regexArray[5] === undefined || regexArray[6] === undefined) {
                continue;
            }
            let file_name = this.base.to_full_name(regexArray[1]);
            if (!(file_name in file_dict)) {
                file_dict[file_name] = [];
            }
            this.base.check_diagnosticCollection(file_name)
            file_dict[file_name].push(regexArray);
        }
        return file_dict;
    }

    /**
     * @param {string} result
     */
    on_stderror(result) {
        let file_dict = this.exec_stderror_res(result);

        for (let file_name in file_dict) {
            let diagnostics = [];
            let old_diagnostics = this.base.diagnosticCollection.get(vscode.Uri.file(file_name));
            if (0 != old_diagnostics.length) {
                diagnostics = diagnostics.concat(old_diagnostics);
            }

            vscode.workspace.openTextDocument(file_name).then((doc) => {
                for (let array of file_dict[file_name]) {
                    let line = Number(array[2]);
                    if (line > 0) {
                        line--;
                    }
                    let l = doc.lineAt(line);
                    let diagnostic = this.to_diagnostics(array, l.text.length);
                    diagnostics.push(diagnostic);
                }
                log.debug("diagnosticCollection set : " + doc.uri);
                this.base.diagnosticCollection.set(doc.uri, diagnostics);
            }, err => {
                for (let array of file_dict[file_name]) {
                    let column = Number(array[3]);
                    diagnostics.push(this.to_diagnostics(array, column));
                }
                this.base.diagnosticCollection.set(vscode.Uri.file(file_name), diagnostics);
            });
        }
    }

    /**
     * @param {string} result
     */
     on_stdout(result) {
        let stdout_regex = /^[0-9]*\/[0-9]* files checked [0-9]*% done$/gm;
        if(stdout_regex.test(result)){
            vscode.window.setStatusBarMessage(" " + result, 2000);
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
            vscode.window.setStatusBarMessage(this.name + ' running...',1000);
        }

        let dest_path = this.base.get_dest_path(isFile, url);
        let cmmand_array = this.get_full_cmd(dest_path);
        log.info(cmmand_array);
        this.base.spawn = common.runCmd(this.base.channel, cmmand_array, this.on_stderror, this.on_stdout, this.on_exit, this);
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

exports.cppcheck = cppcheck

