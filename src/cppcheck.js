const vscode = require("vscode");
let common = require("./common");
let base = require("./base")

class cppcheck {
    constructor() {
        this.name = "cppcheck";
        this.base = new base.code_base(this.name);
        this.settings = vscode.workspace.getConfiguration('cpp-check-lint.cppcheck');
        //"--template={file}:{line}:{column}: {severity}: {message}:[{id}]",
        this.regex = /^(.*):(\d+):(\d+):\s(\w+):\s(.*):\[([A-Za-z]+)\]$/gm;
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
            this.base.get_cfg(this.settings, "--suppressions-list=", "", true),
            this.base.get_cfg(this.settings, "--report-progress", true, true)
        );
        if (this.name == res[0]) {
            res[0] = this.base.add_root_path(root_path, "cppcheck", "cppcheck")
        }

        let exclude = this.base.get_cfg(this.settings, "-i ", [], false);
        if (0 != exclude.length) {
            for (let index = 0; index < exclude.length; index++) {
                res.push("-i" + this.base.to_full_name(exclude[index]))
            }
        }

        let suppress = this.base.get_cfg(this.settings, "--suppress=", [], false);
        if (0 != suppress.length) {
            for (let index = 0; index < suppress.length; index++) {
                res.push("--suppress=" + suppress[index]);
            }
        }

        let D = this.base.get_cfg(this.settings, "-D", [], false);
        if (0 != D.length) {
            for (let index = 0; index < D.length; index++) {
                res.push("-D" + D[index]);
            }
        }

        let U = this.base.get_cfg(this.settings, "-U", [], false);
        if (0 != U.length) {
            for (let index = 0; index < U.length; index++) {
                res.push("-U" + U[index]);
            }
        }

        common.remove_empty(res);
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
                    diagnostics.push(this.to_diagnostics(array, l.text.length));
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
        if (this.settings.get('--Enable') === true) {
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

