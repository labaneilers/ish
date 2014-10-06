var path = require("path");
var os = require("os");

var async = require("async-q");
var nomnom = require("nomnom");

var stopwatch = require("./stopwatch");
var helper = require("./image-processor");
var imageSettingsWriter = require("./imagesettings-writer");
var fsutil = require("./file-system-util");
var imagesettings = require("./imagesettings");
var langDir = require("./lang-dir");

function readStdin(stdin, cwd, callback) {
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
}

function processArgs(argv, cwd) {

    var args = nomnom
        .script("ish")
        .option("verbose", {
            abbr: "v",
            flag: true,
            help: "Print verbose results"
        })
        .option("help", {
            abbr: "h",
            flag: true,
            help: "Show help"
        })
        .option("save", {
            abbr: "s",
            flag: true,
            help: "Saves imagesettings.xml for files that are not in the ideal format"
        })
        .option("force", {
            abbr: "f",
            flag: true,
            help: "Overwrites existing imagesettings.xml files that aren't in the correct format"
        })
        .option("concurrency", {
            abbr: "c",
            default: os.cpus().length,
            help: "Maximum number of ImageMagick processes to spawn at one time"
        })
        .option("nocolor", {
            abbr: "n",
            flag: true,
            help: "Disable color output"
        })
        .parse();

    var sourcePath = cwd;

    if (args._.length >= 1) {
        sourcePath = path.resolve(cwd, args._[0]);
    }

    args.sourcePath = sourcePath;

    return args;
}

var normalizeFormat = function (format) {
    format = format.toLowerCase();
    if (format == "jpeg") {
        return "jpg";
    }

    return format;
};

function processFile(fileData, options) {

    return helper.process(fileData.fullPath)
        .then(
            function (result) {

                var color = null;
                var output = fileData.fullPath + "\t";

                output += "CURRENT:" + fileData.imageSettings.format + "\t";

                output += "ALPHA:" + result.alpha + "\t";

                output += "COLORS:" + (result.colors === Infinity ? "full" : result.colors)  + "\t";

                output += "QUANTERROR:" + (result.equality || 0) + "\t";

                output += "SETTINGS:" + fileData.imageSettings.type + "\t";

                var action = "";

                if (result.bestFormat == "unknown") {
                    action = "NONE";
                } else if (normalizeFormat(fileData.imageSettings.format) != result.bestFormat) {

                    if (fileData.imageSettings.type != "file" || options.force) {

                        color = "green";

                        // If the force option is on, overwrite existing files if they're in the wrong format
                        if (fileData.imageSettings.type == "file" && options.force) {
                            action += "FORCE ";
                            color = "cyan";
                        }

                        action += "CHANGED TO:" + result.bestFormat;

                        if (options.save) {
                            imageSettingsWriter.write(fileData.fullPath, options.sourcePath, result.bestFormat);
                        }
                    } else {
                        color = "yellow";
                        action = "SHOULD BE:" + result.bestFormat;                        
                    }
                }
                else
                {
                    color = "gray";
                    action = "NONE";
                }

                output += action + "\t";

                output += "JPG:" + result.jpg + "\t";
                output += "PNG:" + result.png + "\t";
                output += "PNGQUANT:" + (result.pngQuantized || "n/a");

                if (result.transparencyMistake) {
                    output += "\tTRANSPARENCY MISTAKE:" + result.transparencyMistake;
                    color = result.transparencyMistake == "major" ? "red" : "magenta";
                }

                output += "\n";

                options.write(output, color);

                return result;
            });
}

var chalk = require("chalk");

var getFileDataList = function (filePaths, rootDir) {
    if (!filePaths || filePaths.length === 0) {
        filePaths = fsutil.recurseDirSync(rootDir);
    }

    // Array of file data with imagesettings
    var files = filePaths.filter(imagesettings.isImageSettingsImage);

    return langDir.dedupeFavorUs(files)
        .map(function (fullPath) { 
            return {
                fullPath: fullPath,
                imageSettings: imagesettings.getImageSettings(fullPath)
            };
        });
};

var main = function (filePaths, stdout, stderr, argv, cwd, callback) {

    var startTime = new Date();

    var options = processArgs(argv, cwd, stderr);

    options.write = function (message, color) {
        if (options.nocolor || !color) {
            stdout.write(message);
        } else {
            stdout.write(chalk[color](message));
        }
    };

    if (options.verbose) {
        options.write("Collecting files: " + options.sourcePath + "...\n");
    }

    // Array of file data with imagesettings
    var files = getFileDataList(filePaths, options.sourcePath);
       
    if (files.length === 0) {
        if (options.verbose) {
            options.write("No matching files found.\n");
        }
        return 0;
    }

    if (options.verbose) {
        options.write("Found " + files.length + " files...\n");
    }

    if (options.verbose) {
        options.write("Processing on " + options.concurrency + " cpus...\n");
    }

    var promises = files.map(function (fileData) {
        return function () {
            return processFile(fileData, options, stdout, stderr);
        };
    });

    async.parallelLimit(promises, options.concurrency)
        .then(
            function () {
                if (options.verbose) {
                    var endTime = new Date();
                   
                    options.write("Completed in " + stopwatch.renderTimeSpan(startTime, endTime) + ".\n");
                }
                callback(0);
            },
            function (err) {

                //throw err;
                stderr.write("Completed with errors: " + err + "\n");
                stderr.write(err.stack + "\n");
                callback(-1);
            }
        );
};

exports.execute = function (stdin, stdout, stderr, argv, cwd, callback) {
    readStdin(stdin, cwd, function (files) {
        main(files, stdout, stderr, argv, cwd, callback);
    });
};