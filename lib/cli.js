var path = require("path");
var nomnom = require("nomnom");
var helper = require("./image-processor");
var fs = require("fs");
var os = require("os");
var async = require("async-q");
var langWalker = require("./lang-dir-walker");

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

var PNG_FILE = "<imagesettings>\n" + 
    "  <compression format=\"png\" colors=\"64\" />\n" +
    "</imagesettings>";

var JPG_FILE = "<imagesettings>\n" + 
    "  <compression format=\"jpg\" quality=\"85\" />\n" +
    "</imagesettings>";

function processFile(fileData, options, stdout, stderr) {
    return helper.process(fileData.fullPath)
        .then(
            function (result) {

                stdout.write(fileData.fullPath + "\t");

                stdout.write("CURRENT:" + fileData.imageSettings.format + "\t");

                stdout.write("ALPHA:" + result.alpha + "\t");

                var action = "";

                if (result.bestFormat == "unknown") {
                    action = "NONE";
                } else if (normalizeFormat(fileData.imageSettings.format) != result.bestFormat) {

                    if (fileData.imageSettings.type != "file" || options.force) {

                        // If the force option is on, overwrite existing files if they're in the wrong format
                        if (fileData.imageSettings.type == "file" && options.force) {
                            action += "FORCE ";
                        }

                        action += "CHANGED TO:" + result.bestFormat;

                        if (options.save) {
                            var imageSettingsPath = langWalker.getWwwDir(options.sourcePath, fileData.fullPath + ".imagesettings.xml");
                            fs.writeFileSync(imageSettingsPath, result.bestFormat == "jpg" ? JPG_FILE : PNG_FILE);
                        }
                    } else {
                        action = "SHOULD BE:" + result.bestFormat;                        
                    }
                }
                else
                {
                    action = "NONE";
                }

                stdout.write(action + "\t");

                stdout.write("JPG:" + result.jpg + "\t");
                stdout.write("PNG:" + result.png);

                if (result.message) {
                    stdout.write("\t" + result.message);
                }

                stdout.write("\n");

                return result;
            },
            function (err) {
                stderr.write(fileData.fullPath + " ERROR:" + err + "\n");
                throw err;
            });
}

exports.execute = function (stdin, stdout, stderr, argv, cwd, callback) {
    var options = processArgs(argv, cwd, stderr);

    if (options.verbose) {
        stdout.write("Collecting files: " + options.sourcePath + "...\n");
    }

    var files = langWalker.recurseDirSync(options.sourcePath);

    if (files.length === 0) {
        if (options.verbose) {
            stdout.write("No matching files found.\n");
        }
        return 0;
    }

     if (options.verbose) {
        stdout.write("Found " + files.length + " files...\n");
    }

    if (options.verbose) {
        stdout.write("Processing on " + options.concurrency + " cpus...\n");
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
                    stdout.write("All done\n");
                }
                callback(0);
            },
            function (err) {

                throw err;
                // stderr.write("Completed with errors: " + err + "\n");
                // callback(-1);
            }
        );
};