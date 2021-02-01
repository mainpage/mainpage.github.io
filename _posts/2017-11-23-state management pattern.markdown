---
layout:     post
title:      "单页应用状态管理方案"
subtitle:   ""
show:       "true"
date:       2017-11-23
author:     "sch"
header-img: ""
catalog: true
tags:
    - 前端开发
    - 状态管理
---


# redux

![](https://codingthesmartway.com/wp-content/uploads/2017/05/01-1024x858.png)
![](https://camo.githubusercontent.com/e7921fdb62c3bab89005e090677a6cd07aceaa8c/68747470733a2f2f7062732e7477696d672e636f6d2f6d656469612f434e50336b5953577741455672544a2e6a70673a6c61726765)

### 流程
1. 通过store调用dispatch派发action   
2. store调用相应reducer函数，计算得到新的state并返回
3. store将新的state保存下来，触发绑定的订阅函数进行后续操作（如生成新的视图，这一步可以借助React Redux来简化）

### 特点
1. 状态数据只读，保存在store单例，所有的修改来自action
2. 不可变数据（immutable.js)，使用纯函数reducer修改状态，返回一个新的状态
3. store.subsribe订阅变动（react-redux通过mapStateToProps自动完成该订阅）


# vuex

![](https://vuex.vuejs.org/zh-cn/images/vuex.png)

### 流程
1. 触发action，执行同步或异步操作
2. 在 action 中提交所需的 mutation，在 mutation 函数中改变 state。
3. 通过 getter/setter 实现的双向绑定自动更新对应的视图

### 特点
1. 改进了Redux中的Action和Reducer函数，以mutations变化函数取代Reducer，
只需在对应的mutation函数里改变state值即可（直接改动原数据而不是产生新的数据）
2. mutations是唯一可以改变state的方式，且每次改变会被vuex记录，实现时间回溯等
3. 由于Vue自动重新渲染的特性，无需订阅store，只要改变state即可




# mobx

![](https://camo.githubusercontent.com/20705ede0bf83c38a187bd911ed417db69701237/687474703a2f2f636e2e6d6f62782e6a732e6f72672f666c6f772e706e67)

### 流程
1. 在state中定义可观察对象
2. 触发action修改state
3. state的变更自动触发计算属性的更新及Reactions的响应（如更新视图、打印log等副作用）

### 特点
1. 状态数据可以任意修改，严格模式需要定义action
2. 可变数据，即存在副作用
3. 可将数据定义为可观察数据，则其变动会触发依赖部分的更新(autorun, reation)
4. 原理与vue类似，也是通过defineProperty实现响应式
5. mobx会自动收集运行时依赖(即代码里真正用到的依赖)

>mobx的哲学：  
任何源自应用状态的东西都应该自动地获得。  
不应该通过手动订阅来同步状态。这将不可避免地导致超额订阅和遗漏订阅。  
只有运行时确定下来的订阅，才是最小的订阅集合。

vue.js官方说法：
>在有限程度上，React + Mobx 也可以被认为是更繁琐的 Vue


# rxjs


