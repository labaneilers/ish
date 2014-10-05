"use strict";

var assert = require("chai").assert;
var rewire = require("rewire");
var path = require("path");

var fsutil = require("../lib/file-system-util");
var cli = rewire("../lib/cli");

describe("cli", function () {

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

    var _assetsRootPath = path.resolve(__dirname, "../assets");

    var assertFromAssetsDir = function (results) {
        var map = {};
        results.forEach(function (fileData) {
            // console.log(path.relative(_assetsRootPath, fileData.fullPath));
            // console.log(fileData.imageSettings);

            var relativePath = path.relative(_assetsRootPath, fileData.fullPath).replace(/\\/g, "/");
            map[relativePath] = fileData;
        });

        assertEntry(map, "www/abc/text-flat-opaque-2x.png", "file", "jpeg");
        assertEntry(map, "www/abc/text-flat-opaque-2-2x.png", "file", "png");
        assertEntry(map, "www/abc/text-flat-opaque-3-2x.png", "dir", "jpeg");
        assertEntry(map, "www.de/abc/text-flat-opaque-2x.png", "file", "jpeg");
    }

    describe("#getFileDataList()", function () {

        var getFileDataList = cli.__get__("getFileDataList");

        it("should recurse through a dir structure", function () {
            var results = getFileDataList(null, _assetsRootPath);

           assertFromAssetsDir(results);
        });

        it("should process provided files", function () {
            var results = getFileDataList(fsutil.recurseDirSync(_assetsRootPath), null);

            assertFromAssetsDir(results);
        });
    });
});