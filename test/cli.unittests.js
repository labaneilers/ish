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
            var relativePath = path.relative(_assetsRootPath, fileData.fullPath).replace(/\\/g, "/");
            map[relativePath] = fileData;
        });

        assertEntry(map, "www/abc/text-flat-opaque-2x.png", "file", "jpg");
        assertEntry(map, "www/abc/text-flat-opaque-2-2x.png", "file", "png");
        assertEntry(map, "www/abc/text-flat-opaque-3-2x.png", "dir", "jpg");
        assertEntry(map, "www.de/abc/text-flat-shouldchange-2x.png", "dir", "jpg");

        // If there is a non-US version of a file that also exists in the US,
        // exclude it explicitly.
        assert.isUndefined(map["www.de/abc/text-flat-opaque-2x.png"]);

        results.forEach(function (result) {
            assert.isTrue(result.fullPath.indexOf("-2x.png") >= 0, result.fullPath + " does not contain -2x.png");
        });
    };

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

        it("should use US version of file if exists", function () {
            var results = getFileDataList(null, path.join(_assetsRootPath, "www.de/abc/text-flat-opaque-2x.png"));

            assert.equal(results.length, 1);
            assert.equal(results[0].fullPath, path.join(_assetsRootPath, "www/abc/text-flat-opaque-2x.png"));
        });

        it("should use specified language version of file if no US version exists", function () {
            var results = getFileDataList(null, path.join(_assetsRootPath, "www.de/abc/text-flat-shouldchange-2x.png"));

            assert.equal(results.length, 1);
            assert.equal(results[0].fullPath, path.join(_assetsRootPath, "www.de/abc/text-flat-shouldchange-2x.png"));
        });
    });
});