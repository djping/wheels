// import { say } from './CompilerUtil.js'
const CompilerUtil = {
  getValue (vm, expr) {
    // 处理对象的值
    let value = expr.split('.').reduce((data, current) => {
      return data[current]
    }, vm.$data)
    return value
  },
  // 把input的值同步
  setValue (vm, expr, value) {
    expr.split('.').reduce((data, current, index, arr) => {
      if (index == arr.length - 1) {
        data[current] = value
      }
      return data[current]
    }, vm.$data)
  },
  model (node, expr, vm) { // value- shcool.name // vm--$data
    let fn = this.updater['modelUpdater']
    let val = this.getValue(vm, expr)
    // 给输入框加观察者
    new Watcher(vm, expr, (newValue) => {
      fn(node, newValue)
    })
    node.addEventListener('input', (e) => {
      // console.log(1)
      let value = e.target.value
      this.setValue(vm, expr, value)
    })
    fn(node, val)
  },
  getContentValue (vm, expr) {// 自己取最新的值
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      let key = args[0].replace('{{', '').replace('}}', '')
      return this.getValue(vm, key)
    })
  },
  text (node, expr, vm) { // expr -- {{shcool.name}}  {{shcool.age}}
    // 处理有多个{{xxx}} 的情况
    let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      console.log(args[1])
      let key = args[0].replace('{{', '').replace('}}', '')
      new Watcher(vm, key, () => {
        fn(node, this.getContentValue(vm, expr))
      })
      let val = this.getValue(vm, key)
      return val
    })
    var fn = this.updater['textUpdater']
    fn(node, content)
  },
  html () {

  },
  updater: {
    modelUpdater (node, value) {
      node.value = value
    },
    htmlUpdater () {},
    textUpdater (node, value) {
      node.textContent = value
    }
  }
}
class Compiler {
  constructor (el, vm) {
    this.el = this.isElementNode(el) ? el
      : document.querySelector(el)
    this.vm = vm
    console.log(this.el)
    let fragment = this.createFragment(this.el)
    this.compile(fragment)
    this.el.appendChild(fragment)
  }
  isElementNode (el) {
    return el.nodeType === 1
  }
  createFragment (node) {
    let fragment = document.createDocumentFragment()
    // let childNodes = [...node.childNodes]
    // childNodes.forEach(child => {
    //   fragment.appendChild(child)
    // })
    let firstChild
    while (firstChild = node.firstChild) {
      // console.log(firstChild)
      fragment.appendChild(firstChild)
    }
    return fragment
  }
  isDirective (attrName) {
    return attrName.startsWith('v-')
  }
  compileElement (node) {
    let attributes = [...node.attributes]
    // console.log('attributes', attributes)
    attributes.forEach(attr => {
      let { name, value} = attr
      if (this.isDirective(name)) {
        console.log(node)
        CompilerUtil['model'](node, value, this.vm)
      }
      // console.log(name, value)
    })
  }
  compileText (node) {
    let content = node.textContent
    // 不懂这个正则
    let reg = /\{\{(.+?)\}\}/  
    if (reg.test(content)) {
      console.log(content)
      CompilerUtil['text'](node, content, this.vm)
    }
  }
  compile (node) {
    let childNodes = [...node.childNodes]
    childNodes.forEach(child => {
      // console.log('child', child)
      if (this.isElementNode(child)) {
        this.compileElement(child)
        this.compile(child)
      } else {
        this.compileText(child)
      }
    })
  }
}
class Observer { // 数据劫持
  constructor (data) {
    // console.log(data)
    this.observe(data)
  }
  observe (data) {
    if (data && typeof data == 'object') {
      for (let key in data) {
        this.defineReactive(data, key, data[key])
      }
    }
  }
  defineReactive (obj, key, value) {
    // console.log(obj[key])
    let dep = new Dep()
    console.log(dep)
    this.observe(value)
    Object.defineProperty(obj, key, {
      get () {
        Dep.target && dep.addSubs(Dep.target)
        return value
      },
      set: (newVal) => {
        // if (typeof newVal === 'obejct')
        if (value !== newVal) {
          // console.log('this', this)
          this.observe(newVal)
          value = newVal
          dep.notify()
        }
      }
    })
  }
}
class Vue {
  constructor (options) {
    this.$el = options.el
    this.$data = options.data
    console.log(this.$el)
    if (this.$el) {
      // Obeject.defineProperty(obj, key, {})
      new Observer(this.$data)
      new Compiler(this.$el, this)
    }
  }
}
class Watcher { // 观察者与被观察者
  constructor (vm, expr, cb) {
    this.vm = vm
    this.expr = expr
    this.cb = cb
    this.oldValue = this.get()
  }
  get () { // 调用shcool.name
    Dep.target = this
    let value = CompilerUtil['getValue'](this.vm, this.expr)
    Dep.target = null
    return value
  }
  update () {
    let newValue = CompilerUtil['getValue'](this.vm, this.expr)
    if (newValue !== this.oldValue) {
      this.cb(newValue)
    }
  }
}
class Dep {
  constructor () {
    // 存储watcher
    this.subs = []
  }
  // 订阅
  addSubs (watcher) {
    this.subs.push(watcher)
  }
  // 发布
  notify () {
    this.subs.forEach(watcher => {
      watcher.update()
    })
  }
}