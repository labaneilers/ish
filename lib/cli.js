var path = require("path");
var nomnom = require("nomnom");
var helper = require("./ish");
var fsutil = require("./file-system-util");
var Q = require("Q");

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
        .option("savetemp", {
            abbr: "s",
            flag: true,
            help: "Saves a temporary png and jpg file"
        })
        .parse();

    var sourcePath = cwd;

    if (args._.length >= 1) {
        sourcePath = path.resolve(cwd, args._[0]);
    }

    args.sourcePath = sourcePath;

    return args;
}

function processFile(filePath, options, stdout, stderr) {
    return helper.process(filePath, options.savetemp)
        .then(
            function (result) {
                if (!options.verbose) {
                    stdout.write(filePath + "\tformat:" + result.bestFormat + "\n");
                } else {
                    stdout.write(filePath + "\n");
                    stdout.write("\tBest format: " + result.bestFormat + "\n");
                    stdout.write("\tjpg: " + result.jpg + "\n");
                    stdout.write("\tpng: " + result.png + "\n");
                }
                return result;
            },
            function (err) {
                stderr.write(filePath + " ERROR:" + err + "\n");
                throw err;
            });
}

exports.execute = function (stdin, stdout, stderr, argv, cwd, callback) {
    var options = processArgs(argv, cwd, stderr);

    // Get a list of files based on command line arguments
    var files = fsutil.recurseDirSync(options.sourcePath)
        .filter(function (filePath) {
            return path.extname(filePath) == ".png";
        });

    if (files.length === 0) {
        if (options.verbose) {
            stdout.write("No matching files found.\n");
        }
        return 0;
    }

    // Process the files and return a list of promises for the processing.
    var promises = files.map(function (filePath) {
        return processFile(filePath, options, stdout, stderr);
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