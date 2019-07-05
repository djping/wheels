// 自己实现一个promise  掘金：https://juejin.im/post/5b2f02cd5188252b937548ab
// 规范：1 promise对象接受一个executor参数，executor接受resolve和reject 2个
          // 函数作为参数,
          
        // 2 初始状态为pending,resolve后变为fulfilled,reject后变为rejected
        // 3 resolve接受成功的值，reject接受失败的信息，executor出错时调用reject
        // then 方法接受onFulfilled和onRejected2个函数，分别对resolve和reject做处理
        // setTimeout异步时，将then的callback存储起来，得到数据后调用 
        // 链式调用 重复造轮子

class Promise {
  constructor (executor) {
    this.state = 'pending'
    this.value = ''
    this.reason = ''
    this.onResolvedCallbacks = []
    this.onRejectedCallbacks = []
    let resolved = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled'
        this.value = value
        this.onResolvedCallbacks.forEach(fn => fn())
      }
    }
    let rejected = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected'
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }
    try {
      executor(resolved, rejected)
    } catch (err) {
      rejected(err)
    }
  }
  then (onFulfilled, onRejected) {
    if (this.state === 'fulfilled') {
      onFulfilled(this.value)
    }
    if (this.state === 'rejected') {
      onRejected(this.reason)
    }
    // 解决异步问题，发布订阅模式，先把函数存储起来
    if (this.state === 'pending') {
      // 注意此处的箭头函数
      this.onResolvedCallbacks.push(() => {
        onRejected(this.value)
      })
      this.onRejectedCallbacks.push(() => {
        onRejected(this.reason)
      })
    }
  }
}


// let p = new Promise((resolved, rejected) => {
  // console.log('aaaaaaa')
  // resolve(data)
// })
// p.then(data => {console.log(data)})
