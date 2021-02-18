const vscode = require("vscode");
let common = require("./common");
let base = require("./base")

class cpplint {
    constructor() {
        this.name = "cpplint";
        this.base = new base.code_base(this.name);
        this.settings = vscode.workspace.getConfiguration('cpp-check-lint.cpplint');
        // 1 = path, 2 = line, 3 = severity, 4 = message , 5 = filter, 6 = verbose
        this.regex = /^(.*):(\d+):\s(\w+):\s(.*)\[(.*)\]\s+\[([0-9]+)\]/gm;
    }

    update_setting() {
        this.settings = vscode.workspace.getConfiguration('cpp-check-lint.cpplint');
    }

    /**
     * @param {string} dest_path
     * @param {string} root_path
     * @param {boolean} isFile
     */
    get_cfg(root_path, dest_path, isFile) {
        let res = new Array(this.base.get_cfg(this.settings, "--executable", "cpplint", false),
            "--output=eclipse",
            isFile ? "" : "--recursive",
            this.base.get_cfg(this.settings, "--counting=", "detailed", true),
            this.base.get_cfg(this.settings, "--extensions=", "hxx,h++,cxx,cc,hh,h,cpp,cuh,c,hpp,c++,cu", true),
            this.base.get_cfg(this.settings, "--headers=", "hxx,h++,hh,h,cuh,hpp", true),
            this.base.get_cfg(this.settings, "--verbose=", 0, true),
            this.base.get_cfg(this.settings, "--filter=", "", true),
            this.base.get_cfg(this.settings, "--linelength=", 120, true)
        );

        if (this.name == res[0]) {
            res[0] = this.base.add_root_path(root_path, "cpplint", "cpplint.py")
        }

        let exclude = this.base.get_cfg(this.settings, "--exclude=", [], false);
        if (0 != exclude.length) {
            for (let index = 0; index < exclude.length; index++) {
                res.push("--exclude=" + this.base.to_full_name(exclude[index]))
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
                console.log("diagnosticCollection set : " + doc.uri);
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
            vscode.window.setStatusBarMessage(this.name + ' running...', 1000);
        }

        let dest_path = this.base.get_dest_path(isFile, url);
        let root_path = context.extensionPath;
        let cmmand_array = this.get_cfg(root_path, dest_path, isFile);
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

exports.cpplint = cpplint

