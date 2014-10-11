var path = require("path");
var fs = require("fs");

var winRegex = /\\www(?:\.[a-z\.]{2,7}){0,1}\\/i;
var unixRegex = /\/www(?:\.[a-z\.]{2,7}){0,1}\//i;
var basenameRegex = /^www(?:\.[a-z\.]{2,7}){0,1}$/i;

// Gets a www* directory matching expression using the same path separator
// that the specified path does.
var getMatchExp = function (filePath) {
    var sep = filePath.indexOf("/") >= 0 ? "/" : "\\";
    var regex = (sep == "/") ? unixRegex : winRegex;

    return {
        sep: sep,
        regex: regex
    };
};

// Gets the corresponding www (US) path for the specified path
exports.getWwwDir = function (filePath) {
    var matchExp = getMatchExp(filePath);

    return filePath.replace(matchExp.regex, matchExp.sep + "www" + matchExp.sep);
};

// Indicates if the specified path is a www* directory
exports.isWwwRoot = function (filePath) {
    var basename = path.basename(filePath);
    return basename == "www" || basenameRegex.test(path.basename(filePath));
};

// Given a path, finds all existing corresponding file paths in 
// other language directories.
exports.getAllMatchingWwwPaths = function (filePath) {
    var matchExp = getMatchExp(filePath);
    var wwwPos = filePath.search(matchExp.regex);

    // If no www directory was found in the path, return the original path.
    if (wwwPos < 0) {
        return [filePath];
    }

    // Find all www* directories in the root path
    var basePath = filePath.substr(0, wwwPos);

    return fs.readdirSync(basePath)
        // Include only directories that look like www*
        .filter(function (dir) { return basenameRegex.test(dir); })
        // Rebuild the path with each language directory
        .map(function (dir) { return filePath.replace(matchExp.regex, matchExp.sep + dir + matchExp.sep); })
        // Only include paths that actually exist
        .filter(fs.existsSync);
};

// Given a list of images, combines entries for the same canonical path in multiple languages,
// favoring the US version. If there are multiple corresponding entries, and no US version,
// the first corresponding entry will win, and the others will be removed.
exports.dedupeFavorUs = function (filePaths) {
    var hashSet = {};
    var nonUsSet = {};

    filePaths.forEach(function (filePath) {
        hashSet[filePath] = true;
    });

    filePaths.forEach(function (filePath) {
        var wwwVersion = exports.getWwwDir(filePath);
        if (wwwVersion != filePath) {
            if (hashSet[wwwVersion] || nonUsSet[wwwVersion]) {
                delete hashSet[filePath];
            } else {
                nonUsSet[wwwVersion] = true;
            }
        }
    });

    return Object.keys(hashSet);
};