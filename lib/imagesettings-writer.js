"use strict";

// Wrapper for path.normalize() that makes paths lowercase on Windows, because the filesystem is not case sensitive.

var fs = require("fs");
var langWalker = require("./lang-dir-walker");

var PNG_FILE = "<imagesettings>\n" + 
    "  <compression format=\"png\" colors=\"64\" />\n" +
    "</imagesettings>";

var JPG_FILE = "<imagesettings>\n" + 
    "  <compression format=\"jpg\" quality=\"85\" />\n" +
    "</imagesettings>";

var write = function (filePath, baseDir, format) {
	var imageSettingsPath = langWalker.getWwwDir(baseDir, filePath + ".imagesettings.xml");
	fs.writeFileSync(imageSettingsPath, format == "jpg" ? JPG_FILE : PNG_FILE);
};

exports.write = write;
