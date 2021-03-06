var path = require("path");
var os = require("os");

var async = require("async-q");
var nomnom = require("nomnom");
var chalk = require("chalk");

var stopwatch = require("./stopwatch");
var helper = require("./image-processor");
var imageSettingsWriter = require("./imagesettings-writer");
var imagesettings = require("./imagesettings");
var fileCollector = require("./file-collector");

// Parses the command line arguments into an object
var processArgs = function (argv, cwd) {

    var args = nomnom
        .script("ish <path>...")
        .option("verbose", {
            abbr: "v",
            flag: true,
            help: "Print verbose results"
        })
        .option("friendly", {
            flag: true,
            help: "Print results in a friendly, non-technical (less-parsable) form"
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
};

var renderResultParsable = function (imageProcResult, fileData, options) {
    var color = null;
    var output = fileData.fullPath + "\t";

    output += "CURRENT:" + fileData.imageSettings.format + "\t";

    output += "ALPHA:" + imageProcResult.alpha + "\t";

    output += "COLORS:" + (imageProcResult.colors === Infinity ? "full" : imageProcResult.colors)  + "\t";

    output += "QUANTERROR:" + (imageProcResult.equality || 0) + "\t";

    output += "SETTINGS:" + fileData.imageSettings.type + "\t";

    var action = "";

    if (imageProcResult.bestFormat == "unknown") {
        action = "NONE";
    } else if (fileData.imageSettings.format != imageProcResult.bestFormat) {

        if (fileData.imageSettings.type != "file" || options.force) {

            color = "green";

            // If the force option is on, overwrite existing files if they're in the wrong format
            if (fileData.imageSettings.type == "file" && options.force) {
                action += "FORCE ";
                color = "cyan";
            }

            action += "CHANGED TO:" + imageProcResult.bestFormat;
        } else {
            color = "yellow";
            action = "SHOULD BE:" + imageProcResult.bestFormat;                        
        }
    }
    else
    {
        color = "gray";
        action = "NONE";
    }

    output += action + "\t";

    output += "JPG:" + imageProcResult.jpg + "\t";
    output += "PNG:" + imageProcResult.png + "\t";
    output += "PNGQUANT:" + (imageProcResult.pngQuantized || "n/a");

    if (imageProcResult.transparencyMistake) {
        output += "\tTRANSPARENCY MISTAKE:" + imageProcResult.transparencyMistake;
        color = imageProcResult.transparencyMistake == "major" ? "red" : "magenta";
    }

    output += "\n";

    options.write(output, color);
};

var renderResultFriendly = function (imageProcResult, fileData, options) {
    options.write("------------------------------------------------\n", "white");
    options.write(fileData.fullPath + "\n", "white");
    options.write("------------------------------------------------\n", "white");

    options.write("Current format: " + fileData.imageSettings.format + "\n", "gray");
    options.write("Contains transparency: " + imageProcResult.alpha + "\n", "gray");
    options.write("Settings: " + (fileData.imageSettings.type == "file" ? "Specified for this file" : "Inherited") + "\n", "gray");
    options.write("Settings file: " + fileData.imageSettings.fullPath + "\n", "gray");
    options.write("Number of colors: " + (imageProcResult.colors === Infinity ? "(full color)" : imageProcResult.colors) + "\n", "gray");
    options.write("Size as JPG: " + imageProcResult.jpg + "\n", "gray");
    options.write("Size as PNG: " + imageProcResult.png + "\n", "gray");
    options.write("Size as PNG (64 colors): " + (imageProcResult.pngQuantized || "(color reduction looks bad)") + "\n", "gray");

    if (imageProcResult.bestFormat != "unknown" && fileData.imageSettings.format != imageProcResult.bestFormat) {
        options.write("Change this image to " + imageProcResult.bestFormat + "!\n", "green");
    }

    if (imageProcResult.transparencyMistake == "major") {
        options.write("Transparency problem: It looks like this image combines photographic elements with a transparent mask.\n", "red");
        options.write("Please remove the transparency or consider other ways to achieve the effect you want.\n", "red");
    } else if (imageProcResult.transparencyMistake == "minor") {
        options.write("Transparency problem: It looks like this image has a small number of transparent pixels.\n", "red");
        options.write("Try setting an opaque background color and re-saving the image.\n", "red");
    }

    options.write("\n");
};

// For each file, runs image processing logic and outputs results.
var processFile = function (fileData, options) {

    return helper.process(fileData.fullPath)
        .then(
            function (result) {
                var renderer = options.friendly ? renderResultFriendly : renderResultParsable;
                renderer(result, fileData, options);

                if (result.bestFormat != "unknown" && fileData.imageSettings.format != result.bestFormat) {

                    if (fileData.imageSettings.type != "file" || options.force) {

                        if (options.save) {
                            imageSettingsWriter.write(fileData.fullPath, options.sourcePath, result.bestFormat);
                        }
                    }
                }

                return result;
            });
};

// Given either a list of files, or a root directory in which to find files,
// gets a processed list of structs containing the file path and the coalesced imagesettings.
// Uses language directory logic, and will attempt to locate corresponding
// language files for each specified file. 
// The file list will then be deduped, such that corresponding files in different languages
// will be combined to the first specified, or the US version if it exists.
var getFileDataList = function (pathsFromStdIn, pathFromArgs) {
    var paths = pathsFromStdIn || [pathFromArgs];

    var files = fileCollector.expandPaths(paths, imagesettings.isImageSettingsImage);

    // Build a struct with the path and its coalesced imagesettings
    return files.map(function (fullPath) { 
        return {
            fullPath: fullPath,
            imageSettings: imagesettings.getImageSettings(fullPath)
        };
    });
};

exports.main = function (filePaths, stdout, stderr, argv, cwd, callback) {

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

    // Build a function to process each file and return a promise
    var fileProcessors = files.map(function (fileData) {
        return function () {
            return processFile(fileData, options, stdout, stderr);
        };
    });

    // Execute the fileProcessors with the specified concurrency
    // Since the image processor spawns ImageMagick processes,
    // this gives us real multi-processor support.
    async.parallelLimit(fileProcessors, options.concurrency)
        .done(
            function () {
                if (options.verbose) {
                    var endTime = new Date();
                   
                    options.write("Completed in " + stopwatch.renderTimeSpan(startTime, endTime) + ".\n");
                }
                callback(0);
            },
            function (err) {
                stderr.write("Completed with errors: " + err + "\n");
                stderr.write(err.stack + "\n");
                callback(-1);
            }
        );
};

