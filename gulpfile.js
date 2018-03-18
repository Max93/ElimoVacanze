const fs = require('fs');
const gulp = require('gulp');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const data = require("gulp-data");
const handlebarsHelpers = require("handlebars-helpers")();
const frontMatter = require("front-matter");
const handlebars = require("gulp-compile-handlebars");
const rename = require("gulp-rename");

const SOURCE_DIR = 'src';
const DIST_DIR = 'dist';

gulp.task('css', function() {
	return gulp
		.src(`${SOURCE_DIR}/css/main.less`)
		.pipe(
			less().on('error', (err) => {
				console.error(err);
				this.emit('end');
			})
		)
		.pipe(
			postcss([
				autoprefixer({ browsers: ['last 2 version', 'Safari 8'] })
			])
		)
		.pipe(gulp.dest(`${DIST_DIR}/css/`));
});

gulp.task('html', function() {

	return gulp
		.src(`${SOURCE_DIR}/views/index.hbs`)
		.pipe(
			data(function(file) {
				var content = frontMatter(String(file.contents));
				file.contents = new Buffer(content.body);

				let templateData = JSON.parse(
					fs.readFileSync(
						`${SOURCE_DIR}/views/data/it.json`
					)
				);
				templateData = Object.assign(
					templateData,
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
					helpers: handlebarsHelpers
				}
			).on("error", (err) => {
				console.error(err);
				this.emit('end');
			})
		)
		.pipe(rename('index.html'))
		.pipe(gulp.dest(`${DIST_DIR}`));
});

gulp.task('build', ['css', 'html']);