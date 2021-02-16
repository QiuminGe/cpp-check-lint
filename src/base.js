const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
const path = require('path');
let common = require("./common");

class code_base {
    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
        this.channel = vscode.window.createOutputChannel(name);
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection(name);
        this.working = false;
        this.spawn = null;
        this.check_files = new Set();
        console.log("new obj : " + this.name);
    }

    /**
     * @param {string} file
     */
    to_full_name(file) {
        let file2 = file.trim().toString();
        if (!fs.existsSync(file2)) {
            file2 = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, file2);
        }
        return file2;
    }

    /**
     * @param {string} severity
     */
    to_severity(severity) {
        switch (severity) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }

    /**
     * @param {{get: (arg0: any) => any;}} settings
     * @param {any} key
     * @param {any} default_value
     * @param {any} need_add_key
     */
    get_cfg(settings, key, default_value, need_add_key, real_key = null) {
        let res = settings.get(key);
        if (common.is_empty_obj(res)) {
            res = default_value
        }
        if ("boolean" === typeof (res)) {
            if (null != real_key) {
                key = real_key;
            }
            return res ? key : "";
        }

        if ("number" === typeof (res)) {
            res = res.toString();
        }
        else if ("string" === typeof (res)) {
            if (common.is_empty(res)) {
                res = default_value
            }
        }

        if (("string" === typeof (res)) && (common.is_empty(res))) {
            return ""
        }

        if (null != real_key) {
            key = real_key;
        }
        return need_add_key ? key + res : res;
    }

    /**
     * @param {string} root_path
     * @param {string} exe_name_win
     * @param {string} exe_name_linux
     */
    add_root_path(root_path, exe_name_win, exe_name_linux) {
        console.log(exe_name_win, exe_name_linux)
        let platform = os.platform();
        root_path = path.join(root_path, "bin")
        if (platform === 'win32') {
            root_path = path.join(root_path, "win64");
            return path.join(root_path, exe_name_win);
        }
        else {
            root_path = path.join(root_path, "Linux64");
            return path.join(root_path, exe_name_linux);
        }
    }

    /**
     * @param {boolean} isFile
     * @param {{ fsPath: any; }} url
     */
    get_dest_path(isFile, url) {
        let curdoc = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
        let dest_path = url ? url.fsPath : curdoc ? curdoc.fileName : null;
        if (null === dest_path) {
            console.log('cdest_path is null!');
            return;
        }

        if (!isFile && (url.fsPath === curdoc.fileName)) {
            dest_path = path.normalize(path.join(dest_path, ".."));
        }
        return dest_path;
    }

    /**
     * @param {string} file_name
     */
    clear_diagnosticCollection(file_name) {
        let old_diagnostics = this.diagnosticCollection.get(vscode.Uri.file(file_name));
        if (0 != old_diagnostics.length) {
            this.diagnosticCollection.set(vscode.Uri.file(file_name), [])
        }
    }

    /**
     * @param {string} file_name
     */
    check_diagnosticCollection(file_name) {
        if (!this.check_files.has(file_name)) {
            this.clear_diagnosticCollection(file_name);
            this.check_files.add(file_name);
        }
    }

    /**
     * @param {any} context
     * @param {{ fsPath: string; }} url
     * @param {any} select
     */
    do_cmd(context, url, select) {
        console.log(select);
        switch (select) {
            case "clear all": {
                this.diagnosticCollection.clear();
                this.channel.clear();
            } break;
            case "clear current": {
                this.clear_diagnosticCollection(url.fsPath);
            } break;
            case "stop": {
                if (this.spawn) {
                    common.kill(this.spawn);
                }
            } break;
        }
    }

    /**
     * @param {any} context
     * @param {any} url
     */
    on_cmd(context, url) {
        if (this.working) {
            vscode.window.showInformationMessage(this.name + " Select action:", "stop")
                .then(function (select) {
                    this.do_cmd(context, url, select);
                }.bind(this));
        }
        else if (url) {
            vscode.window.showInformationMessage(this.name + " Select action:", "clear all", "clear current")
                .then(function (select) {
                    this.do_cmd(context, url, select);
                }.bind(this));
        }
        else {
            vscode.window.showInformationMessage(this.name + " Select action:", "clear all")
                .then(function (select) {
                    this.do_cmd(context, url, select);
                }.bind(this));
        }
    }

    deactivate() {
        if (this.spawn) {
            common.kill(this.spawn);
        }
        this.diagnosticCollection.clear();
        this.channel.clear();
        vscode.window.setStatusBarMessage("this.name + ' running...'");
    }

}

exports.code_base = code_base



