---
layout:     post
title:      "聊聊nodejs的错误处理"
subtitle:   ""
show:       "true"
date:       2020-07-05
author:     "sch"
header-img: ""
catalog: true
tags:
    - 前端开发
    - nodejs
---

在开发过程中，我们不可避免的要和程序中的错误打交道。尤其是使用nodejs进行服务端开发时，涉及到文件系统交互、数据库交互等，出现错误的场景更多。因此，正确认识和处理错误，对于我们写出健壮优雅的程序来说非常重要。


## 为什么要进行错误（Error）处理


首先我们需要明确，为什么要对错误进行处理，如果不处理会造成什么后果呢？


- 程序崩溃退出
- HTTP请求无响应（web程序）
- 数据被修改了一半，出现不一致
- 无法定位和排查错误



显然，这些后果是我们无法接受的。一套有效的错误处理机制应当实现如下效果：


- 避免程序崩溃或无响应
- 控制错误终端的位置，必要的情况执行回滚操作，保证数据一致性
- 记录错误的信息、调用栈、上下文等，能够快速发现、定位和解决问题



## javascript语法中的Error对象


> 通过Error的构造器可以创建一个错误对象。当运行时错误产生时，Error的实例对象会被抛出。



#### 构造函数


`new Error([message])`


#### 实例属性


- message 错误的描述信息
- name 错误名称
- stack 错误的调用堆栈信息（非标准属性）



> stack属性在ECMA标准中并未定义，但堆栈信息对错误来说非常重要，大多数javascript引擎均提供了该属性。nodejs使用著名的v8引擎，可以放心使用该属性。



#### Example


```javascript
function catchit() {
  try {
    throw new Error('whoops');
  } catch(err) {
    console.log(err);
  }
}

catchit();

// Error: whoops
//    at catchit (VM199 test:3)
//    at VM214 test:9
```


#### Error的派生对象


- SyntaxError: 解析代码时发生的语法错误
- ReferenceError: 引用一个不存在的变量
- RangeError: 值超出有效范围
- TypeError: 变量或参数不符合预期类型
- URIError: URI相关函数的参数不正确
- EvalError: eval函数没有被正确执行



#### 自定义Error


除了JavaScript原生提供的七种错误对象，还可以定义自己的错误对象


```
class CustomError extends Error {
  constructor(message, ext) {
    super();
    this.name = 'CustomError';
    this.ext = ext;
  }
}

throw new CustomError('customError', {id: 111});
// VM927:1 Uncaught CustomError
//    at <anonymous>:1:7
```


## 如何捕获异步产生的错误


如上一节例子所示，对于同步代码，只需要使用try catch即可捕获错误。但对于异步代码，try catch好像失去了效果：


```javascript
try {
  setTimeout(() => {
    throw new Error('asyncError');
  }, 0)
} catch(err) {
  console.log(err);
}

// Uncaught Error: asyncError
//    at <anonymous>:3:11
```


显然，setTimeout回调中抛出的异常并没有被捕获到。究其原因，javascript语言内建的异常是基于调用栈的，而异步任务是基于事件循环机制实现的，当事件队列中的回调函数执行时，任务创建时的堆栈早已不存在了。换句话说，此时try catch相关的逻辑已经执行完了，自然无法捕获错误。因此，对于异步代码，我们需要使用其他方式来处理错误。


#### error-first callback


Nodejs早期的异步处理方式，回调函数的第一个参数保留给错误对象，调用者需要检查该对象判断是否发生了错误，然后对错误进行处理


```
fs.readFile('./image.png', (err, buffer) => {
    if (err) {
       console.log(err)
    }
    ...
});
```


#### EventEmitter


EventEmitter对象产生的错误，可以通过监听对象的'error'事件进行捕获和处理


```
var input = fs.createReadStream('lines.txt');
input.on('error', (err) => {
    console.log(err);
})
```


#### Promise


Promise标准出现后，js的异步流程处理实现了跨越式的进步。对于异步代码产生的错误，Promise提供了标准的处理方法Promise.prototype.catch


```
fetch('http://www.google.com')
.then(res => {
    //todo
})
.catch(err => {
  console.log(err);
})
```


#### async/await


作为当前javascript异步处理方案的终极形态，async/await意在抹平同步和异步之间的差异（写法上），期望使用同步的方式书写异步代码，因此对于async函数的错误处理和同步代码是一致的


```
async function test() {
  try {
    await fetch('http://www.google.com');
  }catch(err) {
    console.log(err);
  }
}

test();
```


对于错误处理而言，async/await无疑是最友好的，我们可以使用try catch统一处理同步和异步代码产生的错误。因此，在nodejs实际开发过程中推荐大家尽量使用async/await进行异步处理。async/await是Generator和Promise的语法糖，Promise逻辑可以无痛转换为async/await写法；至于callback和EventEmitter，只需要稍作处理，封装为Promise模式即可。


## 错误的分类


#### 按发生阶段划分


- 编译时错误   
编译时错误指的是源代码在编译成可执行代码之前产生的错误，也可以理解为语法错误。上文提到过的SyntaxError就是典型的编译时错误。编译时错误在开发阶段就会被发现，因此通常不会造成什么问题。
- 运行时错误   
运行时错误指的是可执行代码被装载到内存中，执行过程中产生的错误。相对于编译时错误，运行时错误更加难以发现，本文讨论的错误处理，实际上针对的就是这类错误。



#### 按错误的来源划分


按照错误的来源，我们将错误划分为编码错误和操作错误。


- 编码错误   
编码错误是程序员失误导致的bug。比如读取undefined的一个属性、调用了不存在的函数、传递了错误的参数类型等。这类错误实际上无法被有效处理，只能通过修改代码解决
- 操作错误   
操作错误是程序正常运行过程中产生的异常情况。比如用户输入不合法、请求第三方服务失败、访问的文件不存在等，这些错误并非程序的bug，而是正常运行的程序需要处理的特殊场景。



由于javascript语法只提供了一个统一的错误对象（Error），开发者常常将这两种错误混为一谈，实际上这两种错误的性质是完全不同的：编码错误是程序员导致的bug，而操作错误是程序正常操作的一部分。例如File not found是一种操作错误，但这不意味着哪里出错了，这可能仅仅表示程序应该先创建文件。为了方便区分这两类错误，我们倾向于将操作错误称为异常（Exception）。正确区分错误和异常很重要，有助于我们使用合适的策略分别处理它们。


## 错误的处理策略


#### 错误的传播


异常的传播类似于浏览器DOM事件冒泡机制，当一个异常被抛出后，会沿着函数调用栈向上传播，直到遇到第一个catch语句。如果开发者没有手动catch，node进程最终会抛出uncaughtException事件。如果uncaughtException没有被监听，那么node进程会打印错误信息并退出。
基于异常传播的机制，我们实际上可以在调用链任意位置捕获错误。当我们在堆栈的某一层捕获到错误时，我们应当选择怎样的策略去处理它呢？


#### 错误的处理策略


- 直接处理



对于预期内的错误，且当前具备处理条件时，直接进行处理。上文提到的异常（操作错误）通常符合上述条件。例如访问第三方服务超时，我们可以等待几秒后重试。这种场景下，异常是在开发者考虑范围内的，且异常类型和处理方案都是明确的。


- 抛给上层



对于当前没有能力处理的错误，最好的方式就是抛给上层。这和设计模式中的职责链模式类似，每个处理者只处理自己职责范围内的请求，其他的传递给下一个处理者即可。


- 直接crash



对于预期之外、无法处理的错误，直接crash可能是最好的做法。这种情况通常是由于编码错误，也就是预期外的bug导致。强行从这种错误中恢复可能会导致内存泄漏等意想不到的问题，让应用继续运行在不稳定的状态下。因此，更好的做法是让当前进程直接crash，并通过一个守护程序重启一个新的进程。


- 什么都不做



尽量不要采用这种处理策略，它可能会导致你无法排查应用出现的问题；如果你提供的是底层服务，会给调用方带来很大困扰，因为调用方完全不知道哪里出错了。这是进行错误处理时的重要原则，不要吞掉你不能处理的错误。


## web应用错误处理实践


具体到nodejs实现的web应用，错误处理会有一些更细化的处理策略，下面会以eggjs框架为例进行讨论。


#### 错误的分类


在前面的章节我们将错误划分为错误和异常两类，分别对应编码错误和操作错误。web应用需要与客户端进行大量交互，一部分异常需要反馈给客户端，这类异常和应用内部的异常有必要进一步区分。以一个工单系统为例，`创建工单失败`是一个异常，需要直接反馈提示信息给用户，也就是说这种异常具有业务含义；对应的，在创建工单时写入数据库失败，“数据库写入失败”这个异常就不具备业务含义，只能算一个底层的通用异常。基于这种考虑，我们把web应用的错误进行如下分类：

| / | 错误 | 系统异常 | 业务异常 |
| --- | --- | --- | --- |
| 类 | Error | Exception | BizException |
| 继承关系 | / | 继承Error | 继承Exception |
| 说明 | js内置错误 | 自己抛出的底层通用异常 | 自己抛出的业务相关异常 |
| 新增属性 | / | info | code/resMsg |



通过前文对Error语法的介绍可知，javascript支持自定义Error类型，因此我们可以很容易地定义Exception和BizException。对于Exception类型，我们新增info属性来携带异常发生时有价值的上下文信息；对于BizException类型，我们进一步新增code、resMsg属性来表示接口错误码和提示信息。


#### 何时抛出错误或异常


- 编码错误（js引擎自动抛出错误）
- 操作失败，如访问第三方接口超时、文件读取失败、数据库写入失败等
- 程序没有出错，但没有按照预期的流程执行。比如调用方传递了错误的参数，第三方接口返回了调用失败的错误码。
不过对于这种处理方式，在程序员中存在一定的分歧。就拿`第三方接口返回错误码`来说，我们也可以选择不抛出异常，而是直接将错误码作为结果返回调用方。这就是很多人讨论过的`抛出异常还是返回错误` `异常是否可以用来进行流程控制`问题。



#### 异常 or 返回


从代码编写角度来说，异常相对于返回值具备一些天然的优势：


- 异常如果没有被处理，会自动中断后续流程；而返回的错误如果不处理则默认忽略，程序会继续运行，可能造成更多严重错误
- 异常具有“冒泡”机制，可以自动沿调用链传递；返回值需要开发者手动逐层传递，有时还需要对上一层的返回进行包装，以适配当前函数的返回
- 异常默认携带调用堆栈，方便定位问题



因此，我们更推荐使用抛出异常而非返回错误的方式处理程序中不符合预期的情况。当然，异常的开销比返回要大一些，不过目前软件开发的趋势是开发效率>运行效率，跟机器节省的那点性能相比，早点写完代码下班不是更好吗:)


#### 何时处理错误或异常


对于web应用，以eggjs为例，一次普通的请求过程涉及到controller、service、db操作等，service之间也存在互相调用的情况，因此整个调用链可能会很长。那么，我们应该在调用链的哪个位置处理错误或异常呢？


I. 就近处理   
调用方直接处理被调方可能产生的错误，如果处理不了，添加相关信息后抛给上层。就近处理的优点在于，需要处理的错误类型很明确、错误处理逻辑能够获得足够的上下文信息。但是，由于web应用的异常一般要反馈到客户端，就近处理大多数情况下也就等同于逐层处理，会导致大量冗余代码，处理过程非常繁琐。


II. controller层统一处理   
在controller层对错误集中处理，可以避免逐层处理的繁琐问题。在web应用框架中，controller通常负责解析用户的输入并返回相应的结果，在这里进行错误处理，可以方便地根据错误类型返回给客户端相应的文案。
但是，这种方案仍然存在一些问题。首先，每个controller函数都需要编写错误处理逻辑，代码上仍然存在重复和冗余的问题；另外，在controller集中处理错误，意味着需要枚举可能发生的所有错误，要实现这一点成本很高。


III. 中间件统一处理+全局错误码   
综合考虑前面的问题，我们期望错误处理达到这样的效果：不需要编写大量try catch语句，可以在任意位置抛出特定类型的错误或异常，能够反馈合理的提示信息给客户端。参考Java web系统普遍使用的方案，我们可以通过中间件+全局错误码实现这一效果。


- 定义一份全局的错误码枚举



```javascript
module.exports = {
    OFFLINEPKG_PROJECT_EXIST: {
        code: 12001,
        message: '项目已存在'
    },
    PUBLISH_OFFLINEPKG_OUTOFLIMIT: {
        code: 12005,
        message: '发布过于频繁',
        resMsg: '发布过于频繁，请1分钟后再试'
    },
    ....
}
```


- 基于Error对象定义系统异常(Exception)和业务异常(BizException)对象。Exception根据name属性区分类型；BizException包含code和resMsg属性，分别承载业务错误码和提示信息



```javascript
class Exception extends Error {
    constructor({ name, message, info }) {
        super();
        this.name = name;
        this.message = message;
        this.info = info;
    }
}

class BizException extends Exception {
    constructor(errEnum, info) {
        super({
            ...errEnum,
            name: 'bizError',
            info
        });
        this.code = errEnum.code;
        this.resMsg = errEnum.resMsg;
    }
}
```


- 业务处理异常分支时，直接构造BizException，填充相应的错误码枚举值并抛出；遇到底层的系统异常时，则构造特定name的Exception对象



```javascript
// 示例：一个新增项目的方法，当项目已存在时抛出异常
async add() {
    ...
    if (existRecord) {
        const exception = new this.app.BizException(this.app.enum.error.PROJECT_EXIST, {
            projectId: existRecord.projectId
        })
        return Promise.reject(exception);
    }
    ...
}
```


```javascript
// 示例：一个刷新cdn的方法
async refreshFile(filePath) {
    const refreshRes = await this.app.curl(REFRESH_URL, {
        method: 'post',
        dataType: 'json',
        data: {
            filePath
        }
    }).then(res => {
        return res.data;
    })
    // 当返回码未10999时，表示刷新过于频繁
    if (refreshRes.code === 10999) {
        return Promise.reject(new this.app.Exception({
            name: 'refreshCdnFileOutOfLimitError',
            message: `refresh cdn file fail: ${refreshRes.msg}`
        }))
    }
    ...
}
```


- 一般没有必要catch BizException，直接向上传递；对于Exception，可以在业务层根据类型包装成相应的BizException，并继续抛出



```javascript
// 示例：一个发布项目的方法，内部需要调用refreshFile
async publish(config) {
    ...
    try {
        var refreshRes = await this.service.common.refreshFile(filePath);
    } catch (err) {
      	// 对refreshFile的异常进行包装
        if (err.name === 'refreshCdnFileOutOfLimitError') {
            throw new this.app.BizException(this.app.enum.error.PUBLISH_OUTOFLIMIT)
        }
        throw err;
    }
    ...
}
```


- 定义exceptionHandler中间件处理Exception及BizException，返回错误码、提示文案等信息给客户端



`middleware/exceptionHandler.js`


```javascript
module.exports = options => {
    return async function exceptionHandler(ctx, next) {
        try {
            await next();
        } catch (err) {
            ctx.logger.error(err);
            if (err instanceof BizException) {
                ctx.body = {
                    code: err.code,
                    message: err.resMsg || err.message
                }
            } else if (err instanceof Exception) {
                ctx.body = {
                    code: 500,
                    message: '服务器异常'
                }
            } else {
                throw err;
            }
        }
    };
};
```


## 小结


- 对于一个健壮的系统而言，一套有效的错误处理机制是十分必要的。
- Javascript在语言层面提供了对错误处理的支持。
- 简单的try-catch无法直接捕获异步流程产生的错误，需要使用一些特殊的方式进行处理。
- 按照错误的来源，我们将错误划分为编码错误和操作错误（我们称之为异常）。正确区分错误和异常很重要，有助于我们使用合适的策略分别处理它们。
- 对于当前没有能力处理的错误，可以直接抛出，由上层业务处理；对于预期之外、无法处理的错误，直接crash可能是最好的做法。
- 永远不要吞掉你不能处理的错误，除非你明确知道自己在做什么
- 在web系统中，我们建议将错误划分为编码错误、系统异常、业务异常三类，并使用`中间件统一处理 + 全局错误码`的方案对错误进行高效处理。

