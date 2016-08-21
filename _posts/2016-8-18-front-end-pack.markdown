---
layout:     post
title:      "Hybrid应用中前端资源的打包和发布"
subtitle:   ""
date:       2015-08-18
author:     "sch"
header-img: ""
catalog: true
tags:
    - 前端开发
    - 打包
---

随着互联网的发展，web应用的规模越来越大，前端再也不仅仅是写写页面特效这么简单了。前端工程变得越来越复杂，项目文件的规模也急剧扩大，手工管理静态资源的方式已经不再适用，需要一套完整的机制来实现前端的工程化。对于Hybrid应用来说，由于带宽的限制，对静态资源的管理和优化就更为重要。在mini项目的开发中，我对前端资源的管理和发布进行了一些探索和实验，在这里做一个简单的总结。

# 基于webpack+gulp的通用方案

## webpack

webpack近年来风头正劲，对类似react这种组件化开发框架来说堪称神器。webpack是一款模块管理器和打包工具，虽然也可以完成诸如代码压缩、代码转换等工作，但它的定位仍是module bundler。webpack将所有的资源都看作模块，模块之间可以定义依赖关系，由webpack对其进行整合。在实际应用中，我们只需要webpack的配置文件里定义一定的规则，剩下的工作都由webpack自动完成，我们无须关心代码整合的中间过程。

### 基本概念

下面我们通过一个基本的webpack配置文件来介绍webpack的几个重要概念：

`webpack.config.js`

```
module.exports = {
    //入口文件配置
    entry: {
        index : './src/js/entry.js',
    },
    //输出文件配置
    output: {
        path: './dist'
        filename: 'bundle.js'
    },
    module: {
        //加载器
        loaders: [
            //.css 文件使用 style-loader 和 css-loader 来处理
            { test: /\.css$/, loader: 'style-loader!css-loader' },
            //.js 文件使用 jsx-loader 来编译处理
            { test: /\.js$/, loader: 'jsx-loader?harmony' },
            //.scss 文件使用 style-loader、css-loader 和 sass-loader 来编译处理
            { test: /\.scss$/, loader: 'style!css!sass?sourceMap'},
            //图片文件使用 url-loader 来处理
            { test: /\.(png|jpg)$/, loader: 'url-loader'},
        ],
    }
    //插件
    plugins: []
}
```

#### 入口和输出
webpack根据配置文件中的`entry`找到工程的入口文件，加载入口文件中定义的依赖进行打包，并将最终的文件输出到output配置项定义的位置；在示例文件中，webpack会根据`./src/js/entry.js`生成bundle.js并输出到`./dist`路径下。

#### 依赖定义
webpack兼容AMD和CommonJs风格的依赖定义。（添加了babel支持的话，也可以使用ES6的import风格，具体见后文）
你可以这样：

```
//AMD
define(['someModule'], function(someModule){
    //dosomething
    return {
        output: output
    };
});
```

也可以这样

```
//CommonJs
var someModule = require("someModule");   
    //dosomething
    module.exports = {
        output: output
    }
};
```

#### 加载器loader

loaders配置项定义了不同文件的处理器，webpack通过这些loader来处理各种类型的文件，如sass/less编译、图片转base64等。假如我们想使用ES6进行开发，只需要使用`babel`加载器来处理js文件即可(当然，首先要安装相应的npm包`npm install babel-loader babel-preset-es2015 --save-dev`):

```
module: {
  loaders: [
    {
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        presets: ['es2015']
      }
    }
  ]
}
```

这样就可以随心所欲使用ES6的最新特性了，比如上文提到的依赖定义可以直接使用ES6的模块机制：

```
//ES6 module
var someModule = import("someModule");   
    //dosomething
    export default {output: output}
};
```

#### 插件plugins

webpack有着强大的插件系统和生态圈，我们可以在`plugins`配置项添加需要的插件来实现定制化的需求

### 一些有用的技巧和高级特性

#### 公共代码提取

在上一节我们介绍了webpack中入口文件的概念，webpack将入口文件及其所有依赖模块打包成一个文件。对于多页面应用来说，则会存在多个入口文件(通常每个页面对应一个入口文件)。这时我们面临这样一个问题：不同入口文件的依赖模块可能存在重叠，这些重叠的依赖会被重复打包到每个入口文件的输出中，每个页面载入时都会下载一次，浪费了资源。webpack的`CommonsChunkPlugin`插件可以自动提取这些公共模块并将它们打包为一个独立的commons文件，从而实现多个页面共享同一份缓存，提升页面加载速度。`CommonsChunkPlugin`的示例配置如下：

```
var webpack = require('webpack');
module.exports = {
    entry: {
        page1: "./page1",
        page2: "./page2",
    },
    output: {
        filename: "[name].bundler.js"
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin("commons.js", ["page1", "page2"])
    ]
};
```

page1、page2两个模块的公共代码会被提取到commons.js，我们需要在page1.html引入commons.js和page1.bundler.js，在page2.html引入commons.js和page2.bundler.js。

#### 样式文件单独打包

webpack将所有资源当作模块来处理，样式文件也不例外，通过`require('./css/index.css')`方式引入。打包后的样式文件以内联方式嵌入html页面，但有时候我们可能希望样式文件独立出来，在页面中以<link>标签引入。这时候我们需要extract-text-webpack-plugin来帮忙：

```
var ExtractTextPlugin = require("extract-text-webpack-plugin");
module.exports = {
    //...
    module: {
        loaders: [
            { 
                test: /\.css$/, 
                loader: ExtractTextPlugin.extract('style-loader!css-loader') 
            }
        ]
    plugins: [new ExtractTextPlugin("[name].css")],
}
```
webpack会把模块里包含的样式文件提取出来，并命名为[模块名].css

#### 异步加载/代码分割(CodeSplitting)
> 对于大型的web应用而言，把所有的代码放到一个文件的做法效率很差，特别是在加载了一些只有在特定环境下才会使用到的阻塞的代码的时候。Webpack有个功能会把你的代码分离成Chunk，后者可以按需加载。这个功能就是Code Spliiting。

> Code Spliting的具体做法就是一个分离点，在分离点中依赖的模块会被打包到一起，可以异步加载。一个分离点会产生一个打包文件。

对于大型web应用尤其是单页面应用而言，按需加载/异步加载是非常必要的。假设一个单页应用有index、detail、about三个子页面（即三个路由），我们可能希望用户进入特定页面时只加载公共代码和该页面需要的代码，而不是一次性加载所有代码。webpack通过require.ensure方法提供了这一功能：

```
//定义一个分离点
require.ensure(dependencies, callback)
```

ensure保证了在所有的dependencies项加载完毕后，再执行回调 。

```
require.ensure(["module-a", "module-b"], function(require) {
    var a = require("module-a");
    // ...
});
```

ensure仅仅会加载dependencies数组内的依赖模块但，并不会执行，真正执行的位置是回调中的`require`方法。
下面我们通过一个简单示例来看看codesplitting是如何做到按需加载的：

`entry.js`

```
//index子页面加载module1
if(location.hash.indexOf('index') > -1){
    //ensure保证了在所有的依赖项加载完毕后，再执行回调 。
    require.ensure(['./module1.js'], function(require) {
        var module = require('./module1.js');
        // todo ...
    });
//index子页面加载module2
}else if(location.hash.indexOf('detail') > -1){
    require.ensure(['./module2.js'], function(require) {
        var module = require('./module2.js');
        // todo ...
    });
}
...
```

`webpack.config.js`

```
module.exports = {
    //页面入口文件配置
    entry: {
        index : './entry.js',
    },
    //入口文件输出配置
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[chunkhash:8].chunk.js'
    }
    ...
}
```

通过上述配置打包出来的文件是这样的：

![](/img/in-post/post-front-end-pack/code-splitting.png)

可以看到webpack将两个分离点单独打包成了两个chunk文件。打开浏览器开发工具的network查看器可以看到资源文件的加载情况：

当进入`index`页面时

![](/img/in-post/post-front-end-pack/index-load-network.png)

当进入`detail`页面时

![](/img/in-post/post-front-end-pack/detail-load-network.png)

果然实现了模块按需加载！

### 缺点和不足

1.webpack是为模块化而生的，专业处理模块一百年，对于一些不符合模块规范的第三方库就有些力不从心了；


## gulp