const child_process = require("child_process");
const log = require('./log');

/**
 * @param {string} str
 */
function is_empty_str(str) {
    if ("string" != typeof (str)) {
        return true;
    }
    if (str != null && str.trim().length > 0) {
        return false;
    }
    return true;
}

/**
 * @param {object} obj
 */
function is_empty_obj(obj) {
    if ((typeof (obj) === 'undefined' || obj === null || obj == "")) {
        return true;
    }

    if ((typeof (obj)) === "object") {
        for (const key in obj) {
            return false
        }
        return true;
    }

    if ((typeof (obj)) === "string") {
        return is_empty_str(obj);
    }

    return false;
}

/**
 * @param {any[]} arr
 */
function remove_empty(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == "" || typeof (arr[i]) == "undefined") {
            arr.splice(i, 1);
            i = i - 1; // i - 1 ,因为空元素在数组下标 2 位置，删除空之后，后面的元素要向前补位
        }
    }
    return arr;
}

/**
 * @param {{clear: () => void;appendLine: (arg0: string) => void;}} channel
 * @param {string[]} params
 * @param {{ (arg0: any): any; call: (arg0: any, arg1: any) => any; }} err_cb
 * @param {{ (arg0: any): any; call: (arg0: any, arg1: any) => any; }} out_cb
 * @param {{ (arg0: number): any; call: (arg0: any, arg1: number) => any; }} exit_cb
 */
function runCmd(channel, params, err_cb, out_cb, exit_cb, callbackobj = null) {
    let cmd = params.shift() || "echo";
    channel.appendLine('executing: ' + cmd + ' ' + params.join(' '));
    const spawn = child_process.spawn(cmd, params);

    spawn.stdout.on("data", (data) => {
        log.debug("stdout is:" + data);
        channel.appendLine(data.toString().trim());
        if (null != out_cb) {
            callbackobj ? out_cb.call(callbackobj, data) : out_cb(data);
        }
    });

    spawn.stderr.on("data", (data) => {
        log.debug("stderr is :" + data);
        if (null != err_cb) {
            callbackobj ? err_cb.call(callbackobj, data) : err_cb(data);
        }
    });

    spawn.on("close", (code) => {
        log.debug("close code is : " + code);
        channel.appendLine("close code is : " + code);
        if (null != exit_cb) {
            callbackobj ? exit_cb.call(callbackobj, code) : exit_cb(code);
        }
    });

    spawn.on("exit", (code) => {
        log.debug("exit code is : " + code);
        channel.appendLine("exit code is : " + code);
        if (null != exit_cb) {
            callbackobj ? exit_cb.call(callbackobj, code) : exit_cb(code);
        }
    });

    spawn.on("error", (err) => {
        log.debug("error : " + err);
        channel.appendLine("error : " + err);
    });
    return spawn;
}

/**
 * @param {string} cmd
 */
function runCmd_execSync(cmd) {
    return child_process.execSync(cmd);
}

/**
 * @param {string} cmd
 * @param {readonly string[]} params
 */
function runCmd_spawnSync(cmd, params) {
    return child_process.spawnSync(cmd, params, { timeout: 1000, encoding: 'utf8' });
}


/**
 * @param {{ kill: () => any; }} spawn
 */
function kill(spawn) {
    return spawn.kill();
}

module.exports = {
    is_empty_str,
    is_empty_obj,
    remove_empty,
    runCmd,
    runCmd_execSync,
    runCmd_spawnSync,
    kill
}