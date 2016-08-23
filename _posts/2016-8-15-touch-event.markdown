---
layout:     post
title:      "移动web触摸事件总结"
subtitle:   ""
show:       "true"
date:       2015-08-15
author:     "sch"
header-img: ""
catalog: true
tags:
    - 前端开发
    - touch
---

## 触摸事件TouchEvent
> TouchEvent 是一类描述手指在触摸平面（触摸屏、触摸板等）的状态变化的事件。这类事件用于描述一个或多个触点，使开发者可以检测触点的移动，触点的增加和减少，等等。

首先来看看touch事件的支持情况（图片来自can i use），可以看到touch事件在移动端浏览器得到了很好的支持（opera-mini什么鬼），可以放心大胆地使用。

![](/img/in-post/post-touch-event/touch-support.png)

## 触摸事件类型
当触摸点（通常是手指或触摸笔）接触触摸平面、在触摸平面上移动或离开触摸平面时，将会触发触摸事件。W3C标准指定了如下触摸事件：

 * touchstart<br/>
  触摸点开始接触触摸平面时触发
 * touchmove<br/>
  触摸点在触摸平面上移动时，连续地触发。
  当触点的半径、旋转角度以及压力大小发生变化时，也将触发此事件。
【注意：不同设备、不同浏览器上 touchmove 事件的触发频率并不相同】
 * touchend<br/>
  触摸点离开触摸平面时触发
 * touchcancel<br/>
  触摸被系统取消或打断时触发
 * touchenter<br/>
  `已废弃`
 * touchleave<br/> 
 `已废弃`

 在以上事件中，touchstart、touchmove和touchend是最常用的三个事件，touchcancel虽然也是标准事件，但其触发条件的定义并不明确，在不同移动设备上的表现也不尽相同。W3C提供了一些会触发touchcancel事件的场景：

 > 1. 由于同步事件，或者UA(用户代理)取消了touch事件。
 > 2. 由于某个事件取消了触摸，例如触摸过程被一个模态的弹出框打断。
 > 3. 触点离开了文档，而进入了浏览器的界面元素，插件或其他非文档区域。
 > 4. 当产生的触点超过了设备支持的个数时，从而导致TouchList中最早的Touch对象被取消。

## 触摸事件对象
触摸事件对象即触摸发生时传递给回调函数的事件对象event。除了一般DOM事件中event对象具备的属性，该对象还包含如下重要属性：

 * target<br/>
本次触摸事件的目标元素
 * type<br/>
触摸事件类型，包括touchstart、touchmove、touchend、touchcancel等
 * touches<br/>
  一个 TouchList 对象，表示当前位于触摸平面上所有触摸点的列表
 * targetTouches<br/>
 一个 TouchList 对象，表示当前位于目标元素上所有触摸点的列表
 * changedTouches<br/>
关于这个属性，我在网上看到了两种解释：

	1.一个 TouchList 对象，包含了所有从上一次触摸事件到此次事件过程中，状态发生了改变的触摸点对象；

	2.一个 TouchList 对象，表示涉及当前事件的触摸点列表。  
是不是觉得这两种解释都不是那么好理解？这里还有一个更通俗易懂的版本：<br/> 
__一个 TouchList 对象，对于 touchstart 事件, 这个 TouchList 对象列出在此次事件中新增加的触点；对于 touchmove 事件，列出和上一次事件相比较，发生了变化的触点；对于 touchend，列出离开触摸平面的触点。__

在编程过程中，targetTouches和changedTouches更有用一些。需要注意的是，在touchend事件中，由于触摸点已经离开屏幕，因此只能通过changedTouches来获取触摸点离开时的状态信息。

## TouchList和Touch对象

ToucheList是由Touch对象构成的数组，每个Touch对象代表一个触摸点，当有多个触摸点时ToucheList即会存储多个Touch对象。Touch对象具有如下属性：

 * identifier<br/>
Touch对象的唯一标识符， 一次触摸动作的整个过程中, 该标识符不变。这个属性非常重要，我们需要根据它来判断跟踪的是否是同一次触摸过程；在多点触控场景下，我们根据它来区分不同的触摸点。identifier的取值是一个从0开始的流水号，但它并不是一个每次自增1的数字，而是设置为最小的且与当前已有identifier不重复的一个正整数。<br/>
_举个栗子：<br/>
1、新增触摸点a，该对象的identifier为0；<br/>
2、新增触摸点b，其identifier为1；<br/>
3、新增触摸点c，其identifier为2；<br/>
4、移开触摸点a，新增触摸点d，d的identifier为0；<br/>
5、移开触摸点c，新增触摸点e，e的identifier为2。<br/>
 * target<br/>
本次触摸事件的目标元素
 * clientX/clientY<br/>
触摸点相对于视口的位置，不包含滚动偏移
 * pageX/pageY<br/>
触摸点相对于页面的位置，包含滚动偏移
 * screenX/screenY<br/>
触摸点相对于屏幕的位置
 * force<br/>
触摸点挤压触摸平面的压力大小, 从0.0(没有压力)到1.0(最大压力)的浮点数

有了这些属性，我们就可以利用触摸事件实现各种各样的效果了。

## demo—在canvas上绘制曲线
前面介绍了touch事件相关的各种对象和属性，是时候实战一下了。下面我们来实现一个在canvas上绘制曲线的demo(来自MDN，虽然简单但很有代表性)，
这个demo的唯一难点在于，由于多点触摸的存在，绘制曲线时我们需要知道每个触摸点当前的位置以及上一次发生触摸事件的位置，并根据identifier来区分不同的触摸点。因此，我们需要一个数组来保存触摸点的信息，并在每次触摸事件发生时对其进行更新。

```
//创建触摸点数组
var ongoingTouches = [];
```
同时，我们需要一个函数来根据触摸点的identifier找到它在ongoingTouches数组里的位置： 

```js
function ongoingTouchIndexById(idToFind) {
  for (var i=0; i<ongoingTouches.length; i++) {
    var id = ongoingTouches[i].identifier;
    //找到了，返回位置
    if (id == idToFind) {
      return i;
    }
  }
  //没找到，返回-1
  return -1;
}
```

#### 初始化
首先创建一个canvas画布，并在初始化函数里绑定触摸事件：

```<canvas width="300px" height="500px"></canvas>```

```js
var el = document.getElementsByTagName("canvas")[0];
var ctx = el.getContext("2d");
function init() {
  el.addEventListener("touchstart", handleStart);
  el.addEventListener("touchend", handleEnd, false);
  el.addEventListener("touchcancel", handleCancel, false);
  el.addEventListener("touchmove", handleMove, false);
} 
```

#### touchstart回调函数

在touchstart事件中我们通过changedTouches获取触摸点列表(在实验中该列表长度始终为1，`猜测`是因为多个触摸点不可能精确地同时接触屏幕，因此每个触摸点都会触发一次touchstart事件，changedTouches列表中唯一的touch对象即为该触摸点本身)。以触摸点为圆心绘制圆形，并将触摸点对象压入ongoingTouches数组中。

注意： 在touch事件中通常执行`e.preventDefault()`来阻止触摸发生时浏览器默认的滚动行为。

```js
function handleStart(e) {
  e.preventDefault();
  var touches = e.changedTouches;
  for (var i=0; i<touches.length; i++) {
    var color = 'green';
    ctx.fillStyle = color;
    ongoingTouches.push(touches[i]);
    //绘制圆形
    ctx.beginPath();
    ctx.arc(touches[i].pageX, touches[i].pageY, 5, 0, Math.PI*2);
    ctx.fill();
  }
}
```

#### touchmove回调函数

当触摸点在屏幕上移动时，会连续触发touchmove事件。在其回调函数中，我们从触摸点之前的位置(保存在ongoingTouches数组中)到当前位置绘制直线，并更新ongoingTouches数组中触摸点的信息。

```js
function handleMove(e) {
  e.preventDefault();
  var touches = e.changedTouches;
  ctx.lineWidth = 4;
  for (var i=0; i<touches.length; i++) {
    var color = 'green';
    //获取当前触摸点在ongoingTouches中的下标
    var idx = ongoingTouchIndexById(touches[i].identifier);
    ctx.strokeStyle = color;
    //绘制直线
    ctx.beginPath();
    ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
    ctx.lineTo(touches[i].pageX, touches[i].pageY);
    ctx.closePath();
    ctx.stroke();
    //更新ongoingTouches数组中对应触摸点的信息
    ongoingTouches.splice(idx, 1, touches[i]);
  }
}
```

#### touchend回调函数

当某个触摸点的触摸结束时，我们在canvas上绘制最后一段线段，并将该触摸点从ongoingTouches数组中移除。

```js
function handleEnd(e) {
  e.preventDefault();
  var touches = e.changedTouches;
  ctx.lineWidth = 4;
  for (var i=0; i<touches.length; i++) {
    var color = 'green';
    var idx = ongoingTouchIndexById(touches[i].identifier);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ongoingTouches[i].pageX, ongoingTouches[i].pageY);
    ctx.lineTo(touches[i].pageX, touches[i].pageY);
    //将触摸点移除
    ongoingTouches.splice(i, 1);
  }
}
```

到这里，我们已经完成了一个在移动设备上用手指绘制曲线的小程序。你可以打开[demo](/2016/08/13/canvas-touch/)页面，使用chrome的移动设备模拟器查看效果；或者扫描如下二维码在手机上查看。

<img src="/img/in-post/post-touch-event/canvas-touch-qrcode.png" width="150px">

## 触摸事件应用

在移动设备大行其道的今天，触摸已然成为人们每天使用频率最高的操作之一。在移动web领域，触摸事件有着广泛的应用，下面给出两个具体demo：

#### 下拉刷新效果
[scroll-to-refresh demo](/2016/08/15/scroll-to-refresh/)<br/>
移动端随处可见的下拉释放刷新功能
<img src="/img/in-post/post-touch-event/scroll-to-refresh-qrcode.png" width="150px">

#### 可滑动幻灯片效果
[touch-slider demo](/2016/08/15/touch-slide/)<br/>
各网站首页常见的幻灯片轮播效果
<img src="/img/in-post/post-touch-event/touch-slider-qrcode.png" width="150px">



