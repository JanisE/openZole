// Disable OS pop-up notifications on each mixing process.
process.env.DISABLE_NOTIFIER = true;

const gulp = require('gulp');
//const pandoc = require('gulp-pandoc');
const jsdoc = require('gulp-jsdoc3');
const jshint = require('gulp-jshint');
const mocha = require('gulp-mocha');

gulp.task('default', ['doc']);
gulp.task('test', ['jshint', 'unit']);

gulp.task('doc', (cb) =>
{
	gulp
		.src(['README.md', './lib/*.js'], {read: false})
		.pipe(jsdoc(cb));
});

// gulp.task('doc', function ()
// {
// 	gulp.src('*.md')
// 		.pipe(pandoc({
// 			from: 'markdown_github+implicit_header_references',
// 			to: 'html',
// 			ext: '.html',
// 		  args: ['--standalone']
// 		}))
// 		.pipe(gulp.dest('doc/'));
// });

// TODO Not quite working. Errors are thrown, but on success "0 passed".
gulp.task('unit', () =>
{
	return gulp
		.src('test/*.js', {read: false})
		// `gulp-mocha` needs filepaths so you can't have any plugins before it
		.pipe(mocha({reporter: 'spec'}));
});

gulp.task('jshint', () =>
{
	return gulp
		.src(['*.js', 'lib/*.js', 'test/*.js'])
		.pipe(jshint({
			curly: true,
			esversion: 6,
			funcscope: true,
			latedef: true,
			laxbreak: true,	// TODO In the next JSHint release it will probably possible to get rid of this deprecated option (https://github.com/jshint/jshint/issues/2793).
			node: true,
			nonew: true,
			singleGroups: true,
			undef: true,
			unused: true
		}))
		.pipe(jshint.reporter('jshint-stylish'));
});
