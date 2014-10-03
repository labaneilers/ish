"use strict";

var assert = require("chai").assert;
// var rewire = require("rewire");
// var util = require("util");
var langDirWalker = require("../lib/lang-dir-walker");
// var fs = require("fs");
var path = require("path");

describe("lang-dir-walker", function () {

    describe("#getWwwDir()", function () {

        it("should replace a path with www at the root of the basepath", function () {
            var result = langDirWalker.getWwwDir("/root/a/b/c/", "/root/a/b/c/www.de/foo/bar/baz.png");

            assert.equal(result, "/root/a/b/c/www/foo/bar/baz.png");
        });

        it("should replace a path with www at the root of the basepath, specific", function () {
            var result = langDirWalker.getWwwDir("/Library/WebServer/Documents/ish/assets", "/Library/WebServer/Documents/ish/assets/www.de/abc/image1-2x.png.imagesettings.xml");

            assert.equal(result, "/Library/WebServer/Documents/ish/assets/www/abc/image1-2x.png.imagesettings.xml");
        });

        it("should replace a path with www at the root of the basepath, even if it has another www dir", function () {
            var result = langDirWalker.getWwwDir("/root/a/b/c/", "/root/a/b/c/www.de/foo/www.fr/bar/baz.png");

            assert.equal(result, "/root/a/b/c/www/foo/www.fr/bar/baz.png");
        });

        it("should replace a path with www at the root of the basepath, using windows format", function () {
            var result = langDirWalker.getWwwDir("C:\\root\\a\\b\\c\\", "C:\\root\\a\\b\\c\\www.de\\foo\\bar\\baz.png");

            assert.equal(result, "C:\\root\\a\\b\\c\\www\\foo\\bar\\baz.png");
        });

        it("should throw exception if path isn't in baseDir", function () {

            try {
                langDirWalker.getWwwDir("/root/a/b/c/", "/root/a/b/d/www.de/foo/bar/baz.png");
            } catch (ex) {
                assert.equal(ex.message, "/root/a/b/d/www.de/foo/bar/baz.png is not in baseDir: /root/a/b/c/");
                return;
            }

            assert.fail("No execption was thrown");
        });
    });

    var assertEntry = function (map, filePath, expectedImageSettingsType, expectedImageSettingsFormat) {
        var fileData = map[filePath];
        if (!fileData) {
            assert.fail(null, filePath, filePath + " not found");
        }

        try {
            assert.equal(fileData.imageSettings.type, expectedImageSettingsType);
            assert.equal(fileData.imageSettings.format, expectedImageSettingsFormat); 
        } catch (ex) {
            ex.message += " " + filePath;
            throw ex;
        }
    };

    describe("#recurseDirSync()", function () {

        it("should recurse through a dir structure", function () {

            var assetsRootPath = path.resolve(__dirname, "../assets");
            var results = langDirWalker.recurseDirSync(assetsRootPath, assetsRootPath);

            var map = {};
            results.forEach(function (fileData) {
                // console.log(path.relative(assetsRootPath, fileData.fullPath));
                // console.log(fileData.imageSettings);

                var relativePath = path.relative(assetsRootPath, fileData.fullPath).replace(/\\/g, "/");
                map[relativePath] = fileData;
            });

            assertEntry(map, "www/abc/text-flat-opaque-2x.png", "file", "jpeg");
            assertEntry(map, "www/abc/text-flat-opaque-2-2x.png", "file", "png");
            assertEntry(map, "www/abc/text-flat-opaque-3-2x.png", "dir", "jpeg");
            assertEntry(map, "www.de/abc/text-flat-opaque-2x.png", "file", "jpeg");

        });
    });
});