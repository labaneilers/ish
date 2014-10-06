var path = require("path");

var winRegex = /\\www\.[a-z\.]{2,7}\\/i;
var unixRegex = /\/www\.[a-z\.]{2,7}\//i;
var basenameRegex = /^www\.[a-z\.]{2,7}$/i;

exports.getWwwDir = function (filePath) {
    var sep = filePath.indexOf("/") >= 0 ? "/" : "\\";
    var regex = (sep == "/") ? unixRegex : winRegex;

    return filePath.replace(regex, sep + "www" + sep);
};

exports.isWwwRoot = function (filePath) {
    // TODO check if www is present at all
    var basename = path.basename(filePath);
    return basename == "www" || basenameRegex.test(path.basename(filePath));
};

// Given a list of images, combines entries for the same canonical path in multiple languages,
// favoring the US version.
exports.dedupeFavorUs = function (filePaths) {
    var hashSet = {};

    filePaths.forEach(function (filePath) {
        hashSet[filePath] = true;
    });

    return filePaths.filter(function (filePath) {
        var wwwVersion = exports.getWwwDir(filePath);
        if (wwwVersion == filePath) {
            return true;
        }

        var result = !hashSet[wwwVersion];
        hashSet[wwwVersion] = true;
        return result;
    });
};