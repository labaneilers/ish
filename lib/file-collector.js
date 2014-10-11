var fsutil = require("./file-system-util");
var langDir = require("./lang-dir");

Array.prototype.flatten = function () {
    return [].concat.apply([], this);
};

Array.prototype.transform = function (fn) {
    return fn(this);
};

var expandFileOrDir = function (fileOrDirPath, isValidFileFunc) {

    if (!fileOrDirPath) {
        return [];
    }

    // Ignore non-existent paths
    var stat = fsutil.statSync(fileOrDirPath);
    if (!stat) {
        return [];
    }

    if (stat.isFile()) {

        // Ensure the file is an imagesettings-controlled image
        if (isValidFileFunc(fileOrDirPath)) {

            // If the www version of the image exists, use it,
            // or else use the original
            var wwwVersion = langDir.getWwwDir(fileOrDirPath);
            if (wwwVersion != fileOrDirPath && fsutil.existsSync(wwwVersion)) {
                return [wwwVersion];
            }

            return [fileOrDirPath];
        }
        
        return [];
    }

    // The path is a directory
    // Get all the corresponding language directories
    return langDir.getAllMatchingWwwPaths(fileOrDirPath)

        // Recurse through the matched directories and gather files
        .map(fsutil.recurseDirSync)
        .flatten()

        // Then, dedupe corresponding www* paths, favoring the US versions
        .transform(langDir.dedupeFavorUs);
};

// Given either a list of files, or a root directory in which to find files,
// gets a processed list of structs containing the file path and the coalesced imagesettings.
// Uses language directory logic, and will attempt to locate corresponding
// language files for each specified file. 
// The file list will then be deduped, such that corresponding files in different languages
// will be combined to the first specified, or the US version if it exists.
exports.expandPaths = function (paths, isValidFileFunc) {
    return paths
        .map(function (filePath) { return expandFileOrDir(filePath, isValidFileFunc); })
        .flatten();
};