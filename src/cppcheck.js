const vscode = require("vscode");
let common = require("./common");
let base = require("./base");
const { throws } = require("assert");

class cppcheck {
    constructor() {
        this.name = "cppcheck";
        this.base = new base.code_base(this.name);
        //"--template={file}:{line}:{column}: {severity}: {message}:[{id}]",
        this.regex = /^(.*):(\d+):(\d+):\s(\w+):\s(.*):\[([A-Za-z]+)\]$/gm;
        this.update_setting();
    }

    update_setting() {
        this.settings = vscode.workspace.getConfiguration('cpp-check-lint.cppcheck');
        this.quick_fix =  this.base.get_cfg(this.settings, "--quick_fix", false, false);
        this.onsave =  this.base.get_cfg(this.settings, "--onsave", true, false);
    }

    /**
     * @param {string} dest_path
     * @param {string} root_path
     */
    get_cfg(root_path, dest_path) {
        let res = new Array(this.base.get_cfg(this.settings, "--executable", "cppcheck", false),
            "--template={file}:{line}:{column}: {severity}: {message}:[{id}]",
            this.base.get_cfg(this.settings, "--enable=", "all", true),
            this.base.get_cfg(this.settings, "--inconclusive", false, false),
            this.base.get_cfg(this.settings, "-j", 4, true),
            this.base.get_cfg(this.settings, "--max-ctu-depth=", 2, true),
            this.base.get_cfg(this.settings, "--platform=", "unix64", true),
            this.base.get_cfg(this.settings, "--std_c=", "c89", true, "--std="),
            this.base.get_cfg(this.settings, "--std_c++=", "c++03", true, "--std="),
            this.base.get_cfg(this.settings, "--inline-suppr", true, true),
            this.base.get_cfg(this.settings, "--suppressions-list=", "", true),
            this.base.get_cfg(this.settings, "--report-progress", true, true)
        );
        if (this.name == res[0]) {
            res[0] = this.base.add_root_path(root_path, "cppcheck", "cppcheck")
        }

        let exclude = this.base.get_cfg(this.settings, "-i ", [], false);
        if (0 != exclude.length) {
            for (let index = 0; index < exclude.length; index++) {
                if (!common.is_empty(exclude[index])) {
                    res.push("-i" + this.base.to_full_name(exclude[index]))
                }
            }
        }

        let suppress = this.base.get_cfg(this.settings, "--suppress=", [], false);
        if (0 != suppress.length) {
            for (let index = 0; index < suppress.length; index++) {
                if (!common.is_empty(suppress[index])) {
                    res.push("--suppress=" + suppress[index]);
                }
            }
        }

        let D = this.base.get_cfg(this.settings, "-D", [], false);
        if (0 != D.length) {
            for (let index = 0; index < D.length; index++) {
                if (!common.is_empty(D[index])) {
                    res.push("-D" + D[index]);
                }
            }
        }

        let U = this.base.get_cfg(this.settings, "-U", [], false);
        if (0 != U.length) {
            for (let index = 0; index < U.length; index++) {
                if (!common.is_empty(U[index])) {
                    res.push("-U" + U[index]);
                }
            }
        }

        common.remove_empty(res);

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
        let severity = array[4];
        let message = array[5];
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
    provideCodeActions(document, range, context, token){

        if(0 == context.diagnostics.length){
            return null;
        }

        let my_diagnostics = []
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source == this.name){
                my_diagnostics.push(diagnostic);
            }
        }

        if ( 0 == my_diagnostics.length){
            return null;
        }

        const pos = range.start;
        const line = document.lineAt(pos.line);

        let actions = [];

        let suppress_set = new Set();
        for (const diagnostic of my_diagnostics) {
            let id =  diagnostic.code.toString().split(":")[1];
            if (!suppress_set.has(id)){
                suppress_set.add(id)
            }
        }

        if (suppress_set.size > 1){
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
        console.log("exit code is :" + code);
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
                    let diagnostic = this.to_diagnostics(array, l.text.length);
                    diagnostics.push(diagnostic);
                }
                console.log("diagnosticCollection set : " + doc.uri);
                this.base.diagnosticCollection.set(doc.uri, diagnostics);
            }, err => {
                for (let index = 0; index < file_dict[file_name].length; index++) {
                    let array = file_dict[file_name][index];
                    let column = Number(array[3]);
                    diagnostics.push(this.to_diagnostics(array, column));
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
            console.log(this.name + ' is enable!');
        }
        else {
            console.log(this.name + ' is disable!');
            return;
        }

        if (this.base.working) {
            vscode.window.showErrorMessage("please wait checking done !")
            return;
        }
        else {
            this.base.working = true;
            vscode.window.setStatusBarMessage(this.name + ' running...', 3000);
        }

        let dest_path = this.base.get_dest_path(isFile, url);
        let root_path = context.extensionPath;
        let cmmand_array = this.get_cfg(root_path, dest_path);
        console.log(cmmand_array);
        this.base.spawn = common.runCmd(this.base.channel, cmmand_array, this.on_stderror, null, this.on_exit, this);
        console.log("pid : " + this.base.spawn.pid);
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

