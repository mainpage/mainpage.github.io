---
layout:     post
title:      "使用Preload&Prefetch优化前端页面的资源加载"
subtitle:   ""
show:       "true"
date:       2019-12-23
author:     "sch"
header-img: ""
catalog: true
tags:
    - 前端开发
    - 性能优化
---

对于前端页面来说，静态资源的加载对页面性能起着至关重要的作用。本文将介绍浏览器提供的两个资源指令-preload/prefetch，它们能够辅助浏览器优化资源加载的顺序和时机，提升页面性能。

## 从一个实例开始

![beforePrefetch](https://gaia-vivofs.vivo.com.cn/qEiqKoT2I4DBQpyI/b9065030-732e-11ea-9110-7f3b8156be25.gif)

如上图所示，我们开发了一个简单的收银台，支付过程中可以展开优惠券列表选择相应的券。从动图可以看到，列表第一次展开时，优惠券背景有一个逐渐显示的过程，体验上不是很好。问题的原因也很明显，由于背景使用了视觉特意设计的图片，优惠券列表展开时需要去加载图片，背景渐显的过程实际上就是图片加载的过程；当网速慢的时候，这个问题会更加明显。    
那么，怎样解决这个问题呢？仔细分析一下，我们会发现问题的原因在于背景图的加载时机太晚。如果能在优惠券列表渲染前加载好背景图，这个问题就不会出现。从这个思路出发，我们可能想到以下两个方案：
1. 使用内联图片，也就是将图片转换为base64编码的data-url。这种方式，其实是将图片的信息集成到css文件中，避免了图片资源的单独加载。但图片内联会增加css文件的大小，增加首屏渲染的时间。
2. 使用js代码对图片进行预加载
```
preloadImage() {
    const imgList = [
        require('@/assets/imgs/error.png'),
        require('@/assets/imgs/ticket_bg.png')
    ];
    for (let i = 0; i < imgList.length; i++) {
        const newIMG = new Image();
        newIMG.src = imgList[i];
    }
}
```
这种方案主要是利用浏览器的缓存机制，由js代码在特定时机提前加载相应图片，优惠券列表渲染时就可以直接从缓存获取。不过，这种方案增加了额外的代码，需要自己控制好加载时机，并且将图片的url硬编码在了逻辑中。
可以看出，以上两种方案能够解决我们的问题，但都存在一些缺点。那么，有没有更好的解决方案呢？答案是prefetch—一种由浏览器原生提供的预加载方案。

## 什么是prefetch？
> prefetch(链接预取）是一种浏览器机制，其利用浏览器空闲时间来下载或预取用户在不久的将来可能访问的文档。网页向浏览器提供一组预取提示，并在浏览器完成当前页面的加载后开始静默地拉取指定的文档并将其存储在缓存中。当用户访问其中一个预取文档时，便可以快速的从浏览器缓存中得到。
--MDN

具体来说，浏览器通过`<link rel="prefetch" href="/library.js">`标签来实现预加载。其中`rel="prefetch"`被称为Resource-Hints（资源提示），也就是辅助浏览器进行资源优化的指令。类似的指令还有`rel="preload"`，我们会在后文提及。从prefetch的定义可以知道，设置了prefetch的资源会在浏览器空闲时进行加载，这恰恰可以解决我们的问题。
在入口html文件head加入prefetch标签
```
<head>
    ...
    <link rel="prefetch" href="static/img/ticket_bg.a5bb7c33.png">
    ...
</head>
```
查看现在优惠券列表的加载效果

![afterPrefetch](https://p4.ssl.qhimg.com/t01e0c4ed266fa5606e.gif)

果然，成功达成了我们期望的效果。那么浏览器是如何做的呢？我们打开Chrome的Network面板一探究竟：

<img width="742" alt="prefetch-network1" src="https://user-images.githubusercontent.com/4188471/78002053-310e4300-7369-11ea-93f2-1ed67624517f.png">

<img width="630" alt="prefetch-network2" src="https://user-images.githubusercontent.com/4188471/78002055-31a6d980-7369-11ea-8ae3-7d005109abce.png">

可以看到，在首屏的请求列表中已经出现了优惠券背景图ticket_bg.png的加载请求，请求本身看起来和普通请求没什么不同；展开优惠券列表后，network中增加了一次新的ticket_bg.png访问请求，我们很快发现，这个请求的status虽然也是200，但有一个特殊的标记—prefetch cache，表明这次请求的资源来自prefetch缓存。这个表现验证了上文中prefetch的定义，即浏览器在空闲时间预先加载资源，真正使用时直接从浏览器缓存中快速获取。

## Preload
从上面的案例，我们体会到了浏览器预加载资源的强大能力。实际上，预加载是一个广义的概念，prefetch只是具体实现方式之一，本节我们介绍下另外一种预加载方式preload。上文我们提到，preload与prefetch同属于浏览器的Resource-Hints，用于辅助浏览器进行资源优化。为了对两者进行区分，prefetch通常翻译为预提取，preload则翻译为预加载。

> <link>元素的rel属性的属性值preload能够让你在你的HTML页面中<head>元素内部书写一些声明式的资源获取请求，可以指明哪些资源是在页面加载完成后即刻需要的。对于这种即刻需要的资源，你可能希望在页面加载的生命周期的早期阶段就开始获取，在浏览器的主渲染机制介入前就进行预加载。这一机制使得资源可以更早的得到加载并可用，且更不易阻塞页面的初步渲染，进而提升性能。

简单来说，就是通过`<link rel="preload" href="xxx" as="xx">`标签显式声明一个高优先级资源，强制浏览器提前请求资源，同时不阻塞文档正常onload。我们同样用一个实际案例进行详细介绍。

![beforePreload](https://user-images.githubusercontent.com/4188471/77741421-d797d280-704f-11ea-9f81-c7b0f613b980.gif)

上图是我们开发的另外一个收银台，出于本地化的考虑，设计上使用了自定义字体。开发完成后我们发现，页面首次加载时文字会出现短暂的字体样式闪动（FOUT，Flash of Unstyled Text），在网络情况较差时比较明显（如动图所示）。究其原因，是字体文件由css引入，在css解析后才会进行加载，加载完成之前浏览器只能使用降级字体。也就是说，字体文件加载的时机太迟，需要告诉浏览器提前进行加载，这恰恰是preload的用武之地。

我们在入口html文件head加入preload标签:
```
<head>
    ...
    <link rel="preload" as="font" href="<%= require('/assets/fonts/AvenirNextLTPro-Demi.otf') %>" crossorigin>
    <link rel="preload" as="font" href="<%= require('/assets/fonts/AvenirNextLTPro-Regular.otf') %>" crossorigin>
    ...
</head>
```
再次查看页面首次加载的效果

![afterPreload](https://p0.ssl.qhimg.com/t015294d8aa4c5bfba4.gif)

字体样式闪动的现象没有了！我们对比下使用preload前后的network面板

使用前：

<img width="724" alt="beforePreload-network" src="https://p.ssl.qhimg.com/t01f98b5600f1bf6b85.jpg">

使用后：

<img width="701" alt="afterPreload-network" src="https://p.ssl.qhimg.com/t01fa75cf2b17271a5a.jpg">

可以发现字体文件的加载时机明显提前了，在浏览器接收到html后很快就进行了加载。

> 注意：preload link必须设置as属性来声明资源的类型（font/image/style/script等)，否则浏览器可能无法正确加载资源。


## Preload和Prefetch的具体实践
#### preload-webpack-plugin
前文中我们举的两个例子，都是在入口html手动添加相关代码
```
<head>
    ...
    <link rel="prefetch" href="static/img/ticket_bg.a5bb7c33.png">
    ...
</head>
```
```
<head>
    ...
    <link rel="preload" as="font" href="<%= require('/assets/fonts/AvenirNextLTPro-Demi.otf') %>" crossorigin>
    <link rel="preload" as="font" href="<%= require('/assets/fonts/AvenirNextLTPro-Regular.otf') %>" crossorigin>
    ...
</head>
```
这显然不够方便，而且将资源路径硬编码在了页面中（实际上，ticket_bg.a5bb7c33.png后缀中的hash是构建过程自动生成的，所以硬编码的方式很多场景下本身就行不通）。webpack插件[preload-webpack-plugin](https://github.com/GoogleChromeLabs/preload-webpack-plugin)可以帮助我们将该过程自动化，结合htmlWebpackPlugin在构建过程中插入link标签。

```
const PreloadWebpackPlugin = require('preload-webpack-plugin');
...
plugins: [
  new PreloadWebpackPlugin({
    rel: 'preload'，
    as(entry) {  //资源类型
      if (/\.css$/.test(entry)) return 'style';
      if (/\.woff$/.test(entry)) return 'font';
      if (/\.png$/.test(entry)) return 'image';
      return 'script';
    },
    include: 'asyncChunks', // preload模块范围，还可取值'initial'|'allChunks'|'allAssets',
    fileBlacklist: [/\.svg/] // 资源黑名单
    fileWhitelist: [/\.script/] // 资源白名单
  })
]
```
PreloadWebpackPlugin配置总体上比较简单，需要注意的是include属性。该属性默认取值'asyncChunks'，表示仅预加载异步js模块；如果需要预加载图片、字体等资源，则需要将其设置为'allAssets'，表示处理所有类型的资源。但一般情况下我们不希望把预加载范围扩得太大，所以需要通过fileBlacklist或fileWhitelist进行控制。对于异步加载的模块，还可以通过webpack内置的/* webpackPreload: true */标记进行更细粒度的控制。以下面的代码为例，webpack会生成`<link rel="preload" href="chunk-xxx.js" as="script">`标签添加到html页面头部。
```
import(/* webpackPreload: true */ 'AsyncModule');
```
> 备注：prefetch的配置与preload类似，但无需对as属性进行设置

#### 使用场景
从前文的介绍可知，preload的设计初衷是为了尽早加载首屏需要的关键资源，从而提升页面渲染性能。目前浏览器基本上都具备预测解析能力，可以提前解析入口html中外链的资源，因此入口脚本文件、样式文件等不需要特意进行preload。但是一些隐藏在CSS和JavaScript中的资源，如字体文件，本身是首屏关键资源，但当css文件解析之后才会被浏览器加载。这种场景适合使用preload进行声明，尽早进行资源加载，避免页面渲染延迟。
与preload不同，prefetch声明的是将来可能访问的资源，因此适合对异步加载的模块、可能跳转到的其他路由页面进行资源缓存；对于一些将来大概率会访问的资源，如上文案例中优惠券列表的背景图、常见的加载失败icon等，也较为适用。

#### 最佳实践
基于上面对使用场景的分享，我们可以总结出一个比较通用的最佳实践：
- 大部分场景下无需特意使用preload
- 类似字体文件这种隐藏在脚本、样式中的首屏关键资源，建议使用preload
- 异步加载的模块（典型的如单页系统中的非首页）建议使用prefetch
- 大概率即将被访问到的资源可以使用prefetch提升性能和体验

#### vue-cli3的默认配置
- preload   
默认情况下，一个Vue CLI应用会为所有初始化渲染需要的文件自动生成preload提示。   
这些提示会被@vue/preload-webpack-plugin注入，并且可以通过chainWebpack的config.plugin('preload')进行修改和删除。
- prefetch   
默认情况下，一个Vue CLI应用会为所有作为async chunk生成的JavaScript文件(通过动态import()按需code splitting的产物)自动生成prefetch提示。   
这些提示会被@vue/preload-webpack-plugin注入，并且可以通过chainWebpack的config.plugin('prefetch')进行修改和删除。


## 总结和踩坑
- preload和prefetch的本质都是预加载，即先加载、后执行，加载与执行解耦。
- preload和prefetch不会阻塞页面的onload。
- preload用来声明当前页面的关键资源，强制浏览器尽快加载；而prefetch用来声明将来可能用到的资源，在浏览器空闲时进行加载。
- 不要滥用preload和prefetch，需要在合适的场景中使用。
- preload的字体资源必须设置crossorigin属性，否则会导致重复加载。
原因是如果不指定crossorigin属性(即使同源)，浏览器会采用匿名模式的CORS去preload，导致两次请求无法共用缓存。
- 关于preload和prefetch资源的缓存，在Google开发者的[一篇文章](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf)中是这样说明的：如果资源可以被缓存（比如说存在有效的cache-control和max-age），它被存储在HTTP缓存（也就是disk cache)中，可以被现在或将来的任务使用；如果资源不能被缓存在HTTP缓存中，作为代替，它被放在内存缓存中直到被使用。

  然而我们在Chrome浏览器（版本号80）中进行测试，结果却并非如此。将服务器的缓存策略设置为no-store，观察下资源加载情况

  <img width="712" alt="nocache-network" src="https://user-images.githubusercontent.com/4188471/78002063-34093380-7369-11ea-8178-0cf1f32d2032.png">

  可以发现ticket_bg.png第二次加载并未从本地缓存获取，仍然是从服务器加载。因此，如果要使用prefetch，相应的资源必须做好合理的缓存控制。

- 没有合法https证书的站点无法使用prefetch，预提取的资源不会被缓存（实际使用过程中发现，原因未知）。
- 最后我们来看下preload和prefetch的浏览器兼容性

  <img width="1264" alt="preloadCMPT" src="https://user-images.githubusercontent.com/4188471/77751556-e76be280-7060-11ea-819c-84eb03815062.png">

  <img width="1266" alt="prefetchCMPT" src="https://user-images.githubusercontent.com/4188471/77751550-e33fc500-7060-11ea-8494-ada141740857.png">

  可以看到，两者的兼容性目前都还不是太好。好在不支持preload和prefetch的浏览器会自动忽略它，因此可以将它们作为一种渐进增强功能，优化我们页面的资源加载，提升性能和用户体验。
