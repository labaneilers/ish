var normalize = require("./normalize");
var xml = require("node-xml-lite");
var extend = require("util")._extend;
var fs = require("fs");
var path = require("path");

var wwwDirRegex = /^www\.[a-z\.]{2,5}/i;

var endsWith = function(s, suffix) {
    return s.indexOf(suffix, s.length - suffix.length) !== -1;
};

var getWwwDir = function (baseDir, filePath) {
	if (normalize(filePath).indexOf(normalize(baseDir)) !== 0) {
		throw new Error(filePath + " is not in baseDir: " + baseDir); 
	}

	var sep = baseDir.indexOf("/") >= 0 ? "/" : "\\";

	if (!endsWith(baseDir, sep)) {
		baseDir += sep;
	}

	var pathFromBase = filePath.substr(baseDir.length);
	return baseDir + pathFromBase.replace(wwwDirRegex, "www");
};

exports.getWwwDir = getWwwDir;

var parseImageSettingsXml = function (xmlPath) {
	var doc = xml.parseFileSync(xmlPath);
	var attribs = doc.childs[0].attrib;

	var imageSettings = { 
		format: attribs.Format,
		fullPath: xmlPath
	};

	if (imageSettings.format == "png") {
		imageSettings.colors = parseInt(attribs.Colors);
	} else {
		imageSettings.quality = parseInt(attribs.Quality);
	}

	return imageSettings;
};

// Recurses a directory, executing processFile on each entry
var recurseDirSync = function (fileData) {
    if (fs.statSync(fileData.fullPath).isFile()) {
    	if (!endsWith(fileData.fullPath, "-2x.png")) {
    		return [];
    	}

    	// Get imagesettings.xml for this file
    	var overrideImageSettingsPath = fileData.fullPath + ".imagesettings.xml";

    	// Ensure that we're only looking in the www directory for image settings
    	overrideImageSettingsPath = getWwwDir(fileData.baseDir, overrideImageSettingsPath);

    	if (fs.existsSync(overrideImageSettingsPath)) {
    		var imageSettingsLocal = parseImageSettingsXml(overrideImageSettingsPath);
    		imageSettingsLocal.type = "file";
    		fileData = extend(fileData, { imageSettings: imageSettingsLocal });
    	}

        return [fileData];
    }

    // Get imagesettings for the directory
    var imageSettings = fileData.imageSettings;
    var imageSettingsPath = path.join(fileData.fullPath, "imagesettings.xml");

    // Ensure that we're only looking in the www directory for image settings
    imageSettingsPath = getWwwDir(fileData.baseDir, imageSettingsPath);

    if (fs.existsSync(imageSettingsPath)) {
    	imageSettings = parseImageSettingsXml(imageSettingsPath);
    	imageSettings.type = "dir";
    }

    var files = [];
    fs.readdirSync(fileData.fullPath).forEach(function (file) {
        var childFileData = {
        	fullPath: path.join(fileData.fullPath, file),
        	baseDir: fileData.baseDir,
        	imageSettings: imageSettings
        };

        recurseDirSync(childFileData).forEach(function (fileData) {
            files.push(fileData);
        });
    });

    return files;
};

exports.recurseDirSync = function (baseDir, fullPath) {
	return recurseDirSync({ fullPath: fullPath, baseDir: baseDir, imageSettings: { format: "jpeg", quality: "80", type: "default", fullPath: null } });
};
