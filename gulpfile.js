const { pipeline } = require('stream/promises')
const del = require('del')
const { src, dest, parallel, series, watch } = require('gulp')
const plugins = require('gulp-load-plugins')()
const sass = require('gulp-sass')(require('sass'))
const bs = require('browser-sync').create()

const data = {
    menus: [
        {
            name: 'Home',
            icon: 'aperture',
            link: 'index.html'
        },
        {
            name: 'Features',
            link: 'features.html'
        },
        {
            name: 'About',
            link: 'about.html'
        },
        {
            name: 'Contact',
            link: '#',
            children: [
                {
                    name: 'Twitter',
                    link: 'https://twitter.com/w_zce'
                },
                {
                    name: 'About',
                    link: 'https://weibo.com/zceme'
                },
                {
                    name: 'divider'
                },
                {
                    name: 'About',
                    link: 'https://github.com/zce'
                }
            ]
        }
    ],
    pkg: require('./package.json'),
    date: new Date()
}
const clean = () => {
    return del(['dist', 'temp'])
}
const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
        .pipe(sass())
        //.pipe(plugins.cleanCss())
        //.pipe(plugins.rename({ extname: '.min.css' }))
        .pipe(dest('temp'))
}
const script = () => {
    return pipeline(
        src('src/assets/scripts/*.js', { base: 'src' })
        , plugins.babel({ presets: ['@babel/preset-env'] })
        //, plugins.uglify()
        , dest('temp')
    )
}
const page = () => {
    return pipeline(
        src('src/*.html', { base: 'src' })
        , plugins.swig({ data, defaults: { cache: false } }) // 防止模板缓存导致页面不能及时更新
        , dest('temp')
    )
}
const image = () => {
    return pipeline(
        src('src/assets/images/**', { base: 'src' })
        , plugins.imagemin()
        , dest('dist')
    )
}
const font = () => {
    return pipeline(
        src('src/assets/fonts/**', { base: 'src' })
        , plugins.imagemin()
        , dest('dist')
    )
}
const extra = () => {
    return src('public/**', { base: 'public' }).pipe(dest('dist'))
}
const serve = () => {
    watch('src/assets/styles/*.scss', style)
    watch('src/assets/scripts/*.js', script)
    watch('src/*.html', page)
    // watch('src/assets/images/**', image)
    // watch('src/assets/fonts/**', font)
    // watch('public/**', extra)
    watch([
        './src/assets/images/**',
        './src/assets/fonts/**',
        './public/**'
    ], bs.reload)
    bs.init({
        notify: false
        , port: '2080'
        , files: 'dist/**'
        , server: {
            baseDir: ['temp', 'src', 'public']
            , routes: {
                '/node_modules': 'node_modules'
            }
        }
    })
}
const useref = () => {
    return pipeline(
        src('temp/*.html', { base: 'temp' })
        , plugins.useref({ searchPath: ['temp', '.'] })
        //html js css
        , plugins.if(/\.js$/, plugins.uglify())
        , plugins.if(/\.css$/, plugins.cleanCss())
        , plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true, //压缩html的换行
            minifyCSS: true,//压缩html行内css代码
            minifyJS: true//压缩html行内js代码
        }))
        , dest('dist')
    )
}
const compile = parallel(style, script, page)
const build = series(
    clean,
    parallel(
        series(compile, useref),
        image,
        font,
        extra
    )
)
const develop = series(compile, serve)
module.exports = {
    clean,
    build,
    develop
}