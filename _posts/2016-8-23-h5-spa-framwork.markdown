---
layout:     keynote
title:      "移动端单页框架简单调研"
subtitle:   ""
show:       "true"
iframe:     "/2016/08/23/h5-spa-framwork-slide/"
date:       2015-08-23
author:     "sch"
header-img: ""
catalog: true
tags:
    - 前端开发
    - 移动应用
    - SPA
---


当前移动互联网应用的开发模式主要有三种：Native、Webapp和Hybrid，关于它们的区别和优劣，相信大家已经比较熟悉了。对于web前端来说，与我们相关的是webapp和hybrid app这两种应用形态，其中又以hybrid应用更为广泛。随着近年来前端技术的发展，基于web技术的移动端应用的体验逐步向原生靠近，涌现出一批优秀的移动端web开发框架。本文结合自己在mini项目中的调研和实践，对移动端web开发的一些代表性框架做一个简单的介绍。

#移动端开发模式

Native、Webapp和Hybrid

![](/img/in-post/post-h5-spa-framwork/webapp.png)

## 单页应用(SPA)
对于移动端web应用来说，为了达到媲美原生应用的效果，单页架构几乎是不可或缺的。传统的多页面的应用在页面跳转时需要从服务器加载html并重新渲染，会出现明显的“白屏”现象，对于一个移动端“应用”来说这是不可忍受的。因此，大部分移动端框架选择或支持了单页的开发方式。那么，单页应用都有哪些优点呢？

## 单页应用的优势
 * 页面无刷新切换
 * 页面切换速度快，体验流畅
 * 动画转场效果
 * 前后端分离

## 单页应用必须具备的功能

 * 能够管理页面状态的路由系统
 * 子页面调度模块
 * 数据管理模块
 * 页面切换的转场效果

## 具有代表性的移动端单页框架

 * Angular.js
 * React Native
 * Vue.js
 * MobileBone.js

## Angular.js

 * 大而全的MVC框架
 * $routeProvider提供前端路由支持
 * controller实现模块调度
 * ng-view进行局部渲染
 * ngAnimate创建动画效果

##demo

`html`

```
<body ng-app="myApp">
    <div class="header">header</div>
    <div ng-view></div>
    <div class="footer">footer</span>
</body>
```

`js`

```
angular.module('myApp', ['ngRoute'])
.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'views/main.html',
      controller: 'MainCtrl'
    })
    .when('/detail/:id', {
      templateUrl: 'views/detail.html',
      controller: 'DayCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });
})
```


## 优缺点

优点：

 * 功能完善，提供了一整套解决方案
 * 数据绑定、依赖注入、单页路由、自定义指令
 * MVC架构，分层清晰

缺点：
 * 框架过重，对移动端而言体积过大
 * “脏检查”效率低下
 * 没有明确的组件化概念
 * 动画转场效果实现较为困难

## React Native

 * 基于React.js的组件化机制
 * js编写的React组件渲染为原生组件 
 * Navigator组件实现页面导航和路由
 * 路由模块通过实例化不同组件实现模块调度
 * Flux架构的数据和状态管理
 * 基于原生UI的动画效果

## demo

```
// 主模块
class MainView extends Component {
  // ...
  render() {
    return (
        <Navigator
            //样式
            style={{flex:1}}
            //初始化路由
            initialRoute={{component: FirstPage}}
            //配置场景动画
            configureScene={this.configureScene}
            //根据路由渲染组件
            renderScene={this.renderScene}
        />
    );
  }
}

//renderScene方法
renderScene(route, navigator) {
    if (route.name == 'Home') {
      return <Home navigator={navigator} {...route.passProps}/>
    } else if (route.name == 'Detail') {
      return <Detail navigator={navigator} {...route.passProps}/>
    }
    ...
}
```

## 优缺点

优点

* 完善的组件化机制
* 基于Virtual Dom的数据绑定效率很高
* javascript组件最终渲染为原生组件
* 可以达到接近原生应用的体验
* learn once，write anywhere

缺点：

* 依赖原生组件暴露出来的组件和方法
* 一定程度上牺牲了web的灵活性和扩展性

## Vue.js

* 新兴的轻量级MVVM框架
* vue-router提供路由支持
* 路由模块通过实例化不同组件实现模块调度
* Flux架构的数据和状态管理
* 基于transition特性的CSS/动画过渡系统

## demo

`demo.vue`

```
//模板
<template>
    <nav>
      <li><a v-link="/home">首页</a></li>
      <li><a v-link="/detail">详情</a></li>
    </nav>
    <div class="container">
        <router-view></router-view>
    </div>
  </div>
</template>


<script>
    ...
    //路由
    const router = new VueRouter()

    router.map({
      '/home': {
        component: Home
      },
      '/detail': {
        component: Detail
      }
    })

    router.redirect({
      '*': '/home'
    })
</script>
```

## 优缺点

优点：

* 完善的组件化机制
* 轻量，~24kb min+gzip
* 高效，基于defineProperty的数据绑定
* 快速，异步批量DOM更新

缺点：

* 新兴框架，资料较少
* 社区规模较小，影响力有限
* 框架不够成熟
