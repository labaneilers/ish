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