var path = require("path");
var fs = require("fs");

var winRegex = /\\www(?:\.[a-z\.]{2,7}){0,1}\\/i;
var unixRegex = /\/www(?:\.[a-z\.]{2,7}){0,1}\//i;
var basenameRegex = /^www(?:\.[a-z\.]{2,7}){0,1}$/i;

var getMatchExp = function (filePath) {
    var sep = filePath.indexOf("/") >= 0 ? "/" : "\\";
    var regex = (sep == "/") ? unixRegex : winRegex;

    return {
        sep: sep,
        regex: regex
    };
};

exports.getWwwDir = function (filePath) {
    var matchExp = getMatchExp(filePath);

    return filePath.replace(matchExp.regex, matchExp.sep + "www" + matchExp.sep);
};

exports.isWwwRoot = function (filePath) {
    // TODO check if www is present at all
    var basename = path.basename(filePath);
    return basename == "www" || basenameRegex.test(path.basename(filePath));
};

exports.getAllMatchingWwwDirs = function (dirPath) {
    var matchExp = getMatchExp(dirPath);
    var wwwPos = dirPath.search(matchExp.regex);
    if (wwwPos < 0) {
        return [dirPath];
    }
    var basePath = dirPath.substr(0, wwwPos);

    return fs.readdirSync(basePath)
        .filter(function (dir) { return basenameRegex.test(dir); })
        .map(function (dir) { return dirPath.replace(matchExp.regex, matchExp.sep + dir + matchExp.sep); });
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