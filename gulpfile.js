const fs = require("fs");
const gulp = require("gulp");
const yaml = require("js-yaml");
const less = require("gulp-less");
const gutil = require("gulp-util");
const postcss = require("gulp-postcss");
const responsive = require("gulp-responsive");
const rename = require("gulp-rename");
const data = require("gulp-data");
const merge = require("merge-stream");
const handlebarsHelpers = require("handlebars-helpers")();
const frontMatter = require("front-matter");
const handlebars = require("gulp-compile-handlebars");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const autoprefixer = require("autoprefixer");
const browserSync = require("browser-sync").create();

const SOURCE_DIR = "./frontend";
const DIST_DIR = "./web";
const LANGUAGES = ["it", "en"];
const NAVIGATION = require("./frontend/views/data/nav.json");

gulp.task("css", function() {
	return gulp
		.src(`${SOURCE_DIR}/css/*.less`)
		.pipe(
			less().on("error", function(err) {
				var displayErr = gutil.colors.red(err);
				gutil.log(displayErr);
				gutil.beep();
				this.emit("end");
			})
		)
		.pipe(
			postcss([
				autoprefixer({ browsers: ["last 2 version", "Safari 8"] })
			])
		)
		.pipe(gulp.dest(`${DIST_DIR}/css/`))
		.pipe(browserSync.stream());
});

gulp.task("images", function() {
	return gulp
		.src(`${SOURCE_DIR}/images/**/*`)
		.pipe(gulp.dest(`${DIST_DIR}/images/`));
});

gulp.task("js", function() {
	var b = browserify({
		entries: [`${SOURCE_DIR}/js/main.js`]
	});

	return b
		.bundle()
		.pipe(source("main.js"))
		.pipe(gulp.dest(`${DIST_DIR}/js/`));
});

gulp.task("html", function() {
	var languages = LANGUAGES.map(lang => {
		return merge(
			NAVIGATION[lang].map(page => {
				return gulp
					.src(`${SOURCE_DIR}/views/pages/${page.source}`)
					.pipe(
						data(function(file) {
							var content = frontMatter(String(file.contents));
							file.contents = new Buffer(content.body);

							var templateData = JSON.parse(
								fs.readFileSync(
									`${SOURCE_DIR}/views/data/site-${lang}.json`
								)
							);
							templateData = Object.assign(
								templateData,
								{
									navigation: NAVIGATION[lang]
								},
								content.attributes
							);

							return templateData;
						})
					)
					.pipe(
						handlebars(
							{},
							{
								ignorePartials: true,
								batch: [`${SOURCE_DIR}/views/partials`],
								helpers: handlebarsHelpers
							}
						).on("error", function(err) {
							var displayErr = gutil.colors.red(err);
							gutil.log(displayErr);
							gutil.beep();
							this.emit("end");
						})
					)
					.pipe(rename(page.itemLink))
					.pipe(gulp.dest(`${DIST_DIR}/${lang}`));
			})
		);
	});

	return merge(languages);
});

gulp.task("fonts", function() {
	return gulp
		.src(`${SOURCE_DIR}/fonts/**/*`)
		.pipe(gulp.dest(`${DIST_DIR}/fonts/`));
});

gulp.task("html-watch", ["html"], function(done) {
	browserSync.reload();
	done();
});
gulp.task("js-watch", ["js"], function(done) {
	browserSync.reload();
	done();
});

gulp.task("browser-sync", ["build"], function() {
	browserSync.init({
		server: {
			baseDir: DIST_DIR
		}
	});
});

gulp.task("watcher", ["build"], function() {
	gulp.watch(`${SOURCE_DIR}/css/**/*.less`, ["css"]);
	gulp.watch(`${SOURCE_DIR}/js/**/*.js`, ["js-watch"]);
	gulp.watch(`${SOURCE_DIR}/views/**/*.hbs`, ["html-watch"]);
	gulp.watch(`${SOURCE_DIR}/views/data/*`, ["html-watch", "js-watch"]);
});

gulp.task("build", ["css", "js-watch", "html-watch", "fonts"]);
gulp.task("watch", ["build", "browser-sync", "watcher"]);
