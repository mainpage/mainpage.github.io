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
    //插件
    plugins: []
}
```

#### 入口和输出
webpack根据配置文件中的entry找到工程的入口文件，加载入口文件中定义的依赖进行打包，并将最终的文件输出到output配置项定义的位置；在示例文件中，webpack会根据`./src/js/entry.js`生成bundle.js并输出到`./dist`路径下。

#### 依赖定义
webpack兼容AMD、CommonJs以及ES6的import风格的依赖定义。
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

还可以这样

```
//ES6
var someModule = import("someModule");   
    //dosomething
    export default {output: output}
};
```

#### 加载器loader

loaders配置项定义了不同文件的处理器，webpack通过这些loader来处理各种类型的文件，如sass/less编译、图片转base64等。

#### 插件plugins

webpack有着强大的插件系统和生态圈，我们可以在plugins配置项添加需要的插件来实现定制化的需求

### 一些有用的技巧和高级特性

#### 公共代码提取

#### 样式文件单独打包

#### 异步加载/代码分割(CodeSplitting)

### 缺点和不足
