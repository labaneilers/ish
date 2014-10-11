var gulp = require("gulp");
var jshint = require("gulp-jshint");
var mocha = require("gulp-mocha");
var runSequence = require("run-sequence");

gulp.task("default", function (callback) {
	return runSequence("jshint", "mocha", callback);
});

gulp.task("jshint", function () {
    return gulp.src(["./gulpfile.js", "./lib/**/*.js", "./bin/*.js"])
        .pipe(jshint())
        .pipe(jshint.reporter(require("jshint-stylish")))
        .pipe(jshint.reporter("fail"));
});

var testsTask = function (glob) {
	return function () {
		return gulp.src([glob], { read: false })
        	.pipe(mocha({ reporter: "spec" }));
	};
};

gulp.task("mocha", function (callback) {
	return runSequence("unittests", "integrationtests", callback);
});

gulp.task("unittests", testsTask("./test/**/*.unittests.js"));

gulp.task("integrationtests", testsTask("./test/**/*.integrationtests.js"));