var xml = require("node-xml-lite");
var fs = require("fs");
var path = require("path");
var langDir = require("./lang-dir");

var endsWith = function(s, suffix) {
    return s.indexOf(suffix, s.length - suffix.length) !== -1;
};

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

var DEFAULT_IMAGESETTINGS = { type: "default", format: "jpg", fullPath: null };
var _imageSettingsCache = {};

var getImageSettingsForDirectory = function (dirPath) {

    // TODO case sensitivity for unix
    var imageSettings = _imageSettingsCache[dirPath];
    if (imageSettings !== null) {
        var imageSettingsPath = path.join(dirPath, "imagesettings.xml");
        imageSettings = null;
        
        if (fs.existsSync(imageSettingsPath)) {
            imageSettings = parseImageSettingsXml(imageSettingsPath);
            imageSettings.type = "dir";
        }
        _imageSettingsCache[dirPath] = imageSettings;
    }

    return imageSettings;
};

exports.isImageSettingsImage = function (fullPath) {
    return endsWith(fullPath, "-2x.png");
};

exports.getImageSettings = function (fullPath) {
    var imageSettings;

    // Get imagesettings.xml for this file
    var overrideImageSettingsPath = fullPath + ".imagesettings.xml";

    // Ensure that we're only looking in the www directory for image settings
    overrideImageSettingsPath = langDir.getWwwDir(overrideImageSettingsPath);

    if (fs.existsSync(overrideImageSettingsPath)) {
        imageSettings = parseImageSettingsXml(overrideImageSettingsPath);
        imageSettings.type = "file";
    } else {
        // Walk up the parent directories and look for imagesettings.xml
        //path.dirname
        var dirPath = langDir.getWwwDir(fullPath);
        while (!langDir.isWwwRoot(dirPath)) {

            dirPath = path.dirname(dirPath);
            
            imageSettings = getImageSettingsForDirectory(dirPath);

            if (imageSettings) {
                break;
            }
        } 
    }

    return imageSettings || DEFAULT_IMAGESETTINGS;
};