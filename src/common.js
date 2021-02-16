const child_process = require("child_process");

/**
 * @param {object} obj
 */
function is_empty_obj(obj) {
    return (typeof obj === 'undefined' || obj === null || obj === "");
}

/**
 * @param {string} str
 */
function is_empty(str) {
    if (str != null && str.trim().length > 0) {
        return false;
    }
    return true;
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
};

/**
 * @param {{clear: () => void;appendLine: (arg0: string) => void;}} channel
 * @param {string[]} params
 */
function runCmd(channel, params, err_cb, out_cb, exit_cb, callbackobj = null) {
    // channel.clear();
    let cmd = params.shift() || "echo";
    channel.appendLine('executing: ' + cmd + ' ' + params.join(' '));
    const spawn = child_process.spawn(cmd, params);

    spawn.stdout.on("data", (data) => {
        console.log("stdout is:" + data);
        channel.appendLine(data.toString().trim());
        if (null != out_cb) {
            callbackobj ? out_cb.call(callbackobj, data) : out_cb(data);
        }
    });

    spawn.stderr.on("data", (data) => {
        console.log("stderr is :" + data);
        if (null != err_cb) {
            callbackobj ? err_cb.call(callbackobj, data) : err_cb(data);
        }
    });

    spawn.on("close", (code) => {
        console.log("close code is :" + code);
        channel.appendLine("close code is : " + code);
        if (null != exit_cb) {
            callbackobj ? exit_cb.call(callbackobj, code) : exit_cb(code);
        }
    });

    spawn.on("exit", (code) => {
        console.log("exit code is :" + code);
        channel.appendLine("exit code is : " + code);
        if (null != exit_cb) {
            callbackobj ? exit_cb.call(callbackobj, code) : exit_cb(code);
        }
    });

    spawn.on("error", (err) => {
        console.log("error : " + err);
        channel.appendLine("error : " + err);
    });
    return spawn;
}

/**
 * @param {string} cmd
 */
function runCmd_sync(cmd) {
    return child_process.execSync(cmd, { timeout: 1000 });
}

/**
 * @param {{ kill: () => any; }} spawn
 */
function kill(spawn) {
    return spawn.kill();
}

module.exports = {
    is_empty,
    is_empty_obj,
    remove_empty,
    runCmd,
    runCmd_sync,
    kill
}