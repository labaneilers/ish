var xml = require("node-xml-lite");
var extend = require("util")._extend;
var fs = require("fs");
var path = require("path");

var endsWith = function(s, suffix) {
    return s.indexOf(suffix, s.length - suffix.length) !== -1;
};

var winRegex = /\\www\.[a-z\.]{2,5}\\/i;
var unixRegex = /\/www\.[a-z\.]{2,5}\//i;

var getWwwDir = function (filePath) {
    var sep = filePath.indexOf("/") >= 0 ? "/" : "\\";
    var regex = (sep == "/") ? unixRegex : winRegex;

    return filePath.replace(regex, sep + "www" + sep);
};

exports.getWwwDir = getWwwDir;

var parseImageSettingsXml = function (xmlPath) {
	var doc = xml.parseFileSync(xmlPath);
	var attribs = doc.childs[0].attrib;

	var imageSettings = { 
		format: attribs.format,
		fullPath: xmlPath
	};

	if (imageSettings.format == "png") {
		imageSettings.colors = parseInt(attribs.colors);
	} else {
		imageSettings.quality = parseInt(attribs.quality);
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
    	overrideImageSettingsPath = getWwwDir(overrideImageSettingsPath);

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
    imageSettingsPath = getWwwDir(imageSettingsPath);

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
    if (!fullPath) {
        fullPath = baseDir;
    }
	return recurseDirSync({ fullPath: fullPath, baseDir: baseDir, imageSettings: { format: "jpeg", quality: "80", type: "default", fullPath: null } });
};
