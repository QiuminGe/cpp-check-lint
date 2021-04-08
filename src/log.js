
const L_DEBUG = 4;
const L_INFO = 3;
const L_WARN = 2;
const L_ERR = 1;
const L_OFF = 0;

var g_level = L_OFF;

function debug(fmt, ...extras) {
    if (g_level >= L_DEBUG) {
        console.log(fmt, ...extras);
    }
}

function info(fmt, ...extras) {
    if (g_level >= L_INFO) {
        console.log(fmt, ...extras);
    }
}

function warn(fmt, ...extras) {
    if (g_level >= L_WARN) {
        console.log(fmt, ...extras);
    }
}

function error(fmt, ...extras) {
    if (g_level >= L_ERR) {
        console.log(fmt, ...extras);
    }
}

function setLogLevel(level) {
    g_level = level;
    console.log("now log level is " + g_level);
}

module.exports = {
    setLogLevel,
    debug,
    info,
    warn,
    error,
}