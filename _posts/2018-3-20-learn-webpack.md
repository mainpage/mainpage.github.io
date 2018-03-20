---
layout:     post
title:      "learn webpack step by step"
subtitle:   ""
show:       "true"
date:       2018-03-20
author:     "sch"
header-img: ""
catalog: true
tags:
    - 前端开发
    - webpack
---

# webpack预备知识
> webpack 是一个现代 JavaScript 应用程序的静态模块打包器(module bundler)。当 webpack 处理应用程序时，它会递归地构建一个依赖关系图(dependency graph)，其中包含应用程序需要的每个模块，然后将所有这些模块打包成一个或多个 bundle。

### webpack配置文件
webpack.config.js

### webpack的核心概念
- 入口(entry)
- 输出(output)
- loader
- 插件(plugins)

# demos
> webpack4刚刚发布，还没来得及看，以下demo仍然基于webpack3

下面我们通过一系列demo一步步学习和实践webpack的基本使用。
> 如何使用：切换到各个demo目录，使用`npm install`安装依赖，执行`npm run build`进行构建；部分demo（demo07以后）可以执行`npm run start`启动dev-server，在浏览器中查看应用

### demo01：入口和输出
webpack根据配置文件中的entry找到工程的入口文件，加载入口文件中定义的依赖进行打包，并将最终的文件输出到output配置项定义的位置。
```
entry: './index.js',
output: {
    filename: 'bundle.js'
}
```

### demo02：多入口
webpack支持配置多个入口，并对不同入口进行命名。
```
entry: {
    entry1: './entry1.js',
    entry2: './entry2.js'
},
output: {
    filename: '[name].bundle.js'  // name即为入口名
}
```

### demo03：调整目录结构
在demo2中，源文件和打包后的文件混杂在一起，看起来很乱。我们将源文件和输出文件分开，调整目录结构如下：
```
|-dist
|-src
    |-content.js
    |-index.js
|-package.json
|-webpack.config.js
```

### demo04：自动生成html入口文件
当前我们在dist目录下的index.html文件手动引入所有资源，当打包规则渐趋复杂后，这一过程将变得难以维护。实际上，html入口文件和其他输出文件一样，应该由webpack生成，并自动添加依赖的资源；HtmlWebpackPlugin插件可以完成这一自动化过程。

安装HtmlWebpackPlugin插件 `npm i html-webpack-plugin --save-dev`

修改webpack.config.js
```
const path = require('path');
// 引入HtmlWebpackPlugin插件
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports =  {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    plugins: [
        // 自动生成html文件到dist目录
        new HtmlWebpackPlugin({
            template: './src/index.html',   // 源文件
            filename: 'index.html'          // 生成文件名    
        })
    ]
};
```

### demo05：使用ES6和react
使用ES6和react进行开发，我们需要依赖babel进行代码的转换。

安装相应的npm依赖 `npm i babel-cli babel-loader babel-preset-es2015 babel-preset-react --save-dev`

添加loader配置
```
module: {
    rules: [{
        test: /\.jsx?$/, 
        use: [{
            loader: 'babel-loader',
            options: {
                presets: [
                    ["react"],
                    ["env"]
                ]
            }
        }],
        exclude: /node_modules/
    },
    ...
    ]
}
```

### demo06：加载静态资源
作为一个module bundle，webpack可以将所有类型的资源处理为模块。不过，webpack 本身只理解javaScript；对于非javascript模块，需要使用相应的loader进行转换。以最常用的css样式资源和图标资源为例：

安装css-loader/style-loader/file-loader `npm i css-loader style-loader file-loader --save-dev`

添加loader配置
```
module: {
    rules: [{
        // 处理css
        test: /\.css$/,
        use: [
            'style-loader',
            'css-loader'
        ]
    }, {
        // 处理文件资源
        test: /\.(png|svg|jpg|gif)$/,
        use: [
            'file-loader'
        ]
    }
    ...
    ]
}
```

### demo07：source-map和dev-server
当我们使用webpack打包后的文件时，代码的调试成为一件困难的事情；一旦代码出现错误和警告，我们很难追踪到它们的源代码中的具体位置。为了解决这一问题，可以使用source-map功能，将编译后的代码映射回原始代码
```
// sourc-map
devtool: 'inline-source-map'
```

webpack-dev-server提供了一个简单的web服务，能够监听源代码的变化进行实时编译，并自动刷新浏览器页面

安装npm依赖 `npm i webpack-dev-server --save-dev`

修改webpack.config.js，增加dev-server配置项
```
devServer: {
    contentBase: './dist'  // webpack-dev-server可访问文件目录
}
```
为了方便，我们在package.json添加一个npm脚本
```
"scripts": {
    "start": "webpack-dev-server --open"
    ...
}
```
执行npm run start，webpack-dev-server会自动打开浏览器，加载dist文件夹下的index.html文件；修改源文件并保存，服务器将重新编译源文件并刷新页面

### demo08：公共模块提取
假设我们正在开发一个多页面应用，该应用包含主页(index)和关于(about)两个页面。很自然的，我们会针对两个页面分别设置入口和html源文件：
```
entry: {
    index: './src/index.js',
    about: './src/about.js'
},
output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
}
```
```
plugins: [
    new HtmlWebpackPlugin({
        template: './src/index.html',   // 源文件
        filename: 'index.html'         // 生成文件名    
    }),
    new HtmlWebpackPlugin({
        template: './src/about.html',
        filename: 'about.html'
    })
]
```
在这种多入口场景下，不同的入口文件往往会依赖一些共同的模块；这些重复的模块会被打包到各个bundle，增大了输出文件的体积。CommonsChunkPlugin插件可以将公共的依赖模块提取到一个独立的bundle，供多个页面重用（如通过缓存）。
```
plugins: [
    new HtmlWebpackPlugin({
        template: './src/index.html',   // 源文件
        filename: 'index.html',         // 生成文件名    
        chunks: ['common', 'index']     // 引入的bundle(与entry命名对应)
    }),
    new HtmlWebpackPlugin({
        template: './src/about.html',
        filename: 'about.html',
        chunks: ['common', 'about']
    }),
    // 提取公共代码
    new webpack.optimize.CommonsChunkPlugin({
        name: 'common'    // 指定公共 bundle 的名称。
    })
]
```


### demo09：代码分割(CodeSplitting)
> 广义上说，设置多入口也属于代码分割的范畴，但这里我们特指代码的动态拆分，及动态加载。
   
对于大型web应用尤其是单页面应用而言，按需加载/异步加载是非常必要的。有些代码往往只在特定场景下才会被使用到，将其分离出来按需进行加载，无疑可以有效减少主文件的大小。
代码分割的具体做法是定义一个分离点，在分离点中依赖的模块会被打包到一起，可以异步加载。一个分离点会产生一个打包文件。
设置代码分割有两种方式，符合ECMAScript提案的import()语法及webpack特定的require.ensure。在分别介绍这两种方式之前，我们首先修改webpack.config.js：
```
entry: './src/index.js',
output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    chunkFilename: '[name].bundle.js'  // 代码分割生成的代码块
}
```
这里我们增加了chunkFilename配置，它决定非入口chunk的名称。

1.import（官方推荐方式）   
`src/component/App.js`
```
...
onClick() {
    let self = this;
    // 模块懒加载
    import(/* webpackChunkName: "detail" */ './Detail')
    .then(Detail => {
      ReactDOM.render(<Detail />, self.refs['intro']);
    })
  }
...
```
上述代码中，我们在组件内部的click事件回调中，动态加载Detail组件并在加载完成后插入当前组件。显然的，`/* webpackChunkName: "detail" */`语句用来指定该分离点生成代码块的文件名。

使用import方式需要注意的是，ES6 module（import/export语句）是静态的，无法用于按需加载，dynamic import仍处于提案阶段，因此必须额外安装babel的Syntax Dynamic Import插件： `npm i babel-plugin-syntax-dynamic-import --save-dev`

否则，你会看到这样的错误 `SyntaxError: ‘import’ and ‘export’ may only appear at the top level`

> 关于ES6 module的静态加载，可以参考[阮一峰的ES6教程](!http://es6.ruanyifeng.com/#docs/module)

2.require.ensure
```
require.ensure(['./Detail'], function (require) {
    var Detail = require('./Detail');
    ReactDOM.render(<Detail />, self.refs['intro']);
}, 'detail');
```
需要注意，require.ensure会保证所有的dependencies项加载完毕后，再执行回调

### demo10：数据mock
对于前后端分离开发来说，数据mock是必不可少的一环。通常我们会在本地运行一个mock server提供数据源，这时可以利用devServer的proxy设置将请求代理到mock server
```
devServer: {
    proxy: {
        "/api": "http://localhost:8080"
    },
    ...
}
```

### demo11：uglify和treeshaking
// todo

### demo12: 写一个loader
// todo