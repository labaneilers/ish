var path = require("path");
var os = require("os");

var async = require("async-q");
var nomnom = require("nomnom");

var helper = require("./image-processor");
var langWalker = require("./lang-dir-walker");
var imageSettingsWriter = require("./imagesettings-writer");

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

function processFile(fileData, options, stdout, stderr) {

    return helper.process(fileData.fullPath)
        .then(
            function (result) {

                var color = null;
                var output = fileData.fullPath + "\t";

                output += "CURRENT:" + fileData.imageSettings.format + "\t";

                output += "ALPHA:" + result.alpha + "\t";

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
                output += "PNG:" + result.png;

                if (result.transparencyMistake) {
                    output += "\tTRANSPARENCY MISTAKE:" + result.transparencyMistake;
                    color = result.transparencyMistake == "major" ? "red" : "magenta";
                }

                output += "\n";

                options.write(output, color);

                return result;
            },
            function (err) {
                stderr.write(fileData.fullPath + " ERROR:" + err + "\n");
                throw err;
            });
}

var chalk = require("chalk");

exports.execute = function (stdin, stdout, stderr, argv, cwd, callback) {
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

    var files = langWalker.recurseDirSync(options.sourcePath);

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
                    options.write("All done\n");
                }
                callback(0);
            },
            function (err) {

                //throw err;
                stderr.write("Completed with errors: " + err + "\n");
                callback(-1);
            }
        );
};