var path = require("path");
var nomnom = require("nomnom");
var helper = require("./image-processor");
var Q = require("Q");
var fs = require("fs");

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

var PNG_FILE = "<ImageSettings>\n" + 
    "  <Compression Format=\"png\" Colors=\"64\" />\n" +
    "</ImageSettings>";

var JPG_FILE = "<ImageSettings>\n" + 
    "  <Compression Format=\"jpg\" Quality=\"85\" />\n" +
    "</ImageSettings>";

function processFile(fileData, options, stdout, stderr) {
    return helper.process(fileData.fullPath)
        .then(
            function (result) {
                // if (!options.verbose) {
                //     stdout.write(fileData.fullPath + "\tformat:" + result.bestFormat + "\n");
                // } else {
                //     stdout.write(fileData.fullPath + "\n");
                //     stdout.write("\tBest format: " + result.bestFormat + "\n");
                //     stdout.write("\tjpg: " + result.jpg + "\n");
                //     stdout.write("\tpng: " + result.png + "\n");
                // }

                stdout.write(fileData.fullPath + "\t");

                if (normalizeFormat(fileData.imageSettings.format) != result.bestFormat) {

                    if (fileData.imageSettings.type != "file" || options.force) {

                        if (fileData.imageSettings.type == "file" && options.force) {
                            stdout.write("FORCE ");
                        }
                        
                        stdout.write("CHANGED TO: " + result.bestFormat);

                        var imageSettingsPath = fileData.fullPath + ".imagesettings.xml";
                        fs.writeFileSync(imageSettingsPath, result.bestFormat == "jpg" ? JPG_FILE : PNG_FILE);
                    } else {
                        stdout.write("SHOULD BE: " + result.bestFormat + " but already has imagesettings.xml");                        
                    }
                }

                stdout.write("\n");

                return result;
            },
            function (err) {
                stderr.write(fileData.fullPath + " ERROR:" + err + "\n");
                throw err;
            });
}

var langWalker = require("./lang-dir-walker");

exports.execute = function (stdin, stdout, stderr, argv, cwd, callback) {
    var options = processArgs(argv, cwd, stderr);

    var files = langWalker.recurseDirSync(options.sourcePath);

    if (files.length === 0) {
        if (options.verbose) {
            stdout.write("No matching files found.\n");
        }
        return 0;
    }

    // Process the files and return a list of promises for the processing.
    var promises = files.map(function (fileData) {
        return processFile(fileData, options, stdout, stderr);
    });

    Q.all(promises)
        .then(
            function () {
                if (options.verbose) {
                    stdout.write("All done\n");
                }
                callback(0);
            },
            function (err) {
                stderr.write("Completed with errors: " + err + "\n");
                callback(-1);
            }
    );
};