var path = require("path");

// Reads from stdin, and calls back when all file paths have been received.
// If no file paths are passed on stdin, the callback is invoked immediately.
var readStdin = function (stdin, cwd, callback) {
    stdin.setEncoding("utf8");

    var data = "";

    stdin.on("readable", function () {
        var chunk = this.read();
        if (chunk === null) {
            if (data) {
                return;
            } else {
                callback(null);
            }
        } else {
            data += chunk;
        }
    });

    stdin.on("end", function () {
        var files = data.split("\n")
            .filter(function (f) {
                return !!f.trim();
            })
            .map(function (f) {
                return path.resolve(cwd, f).trim();
            });

        callback(files);
    });
};

exports.execute = function (main, callback) {
    var cwd = process.cwd();

    readStdin(process.stdin, cwd, function (files) {
        main(files, process.stdout, process.stderr, process.argv, cwd, callback);
    });
};