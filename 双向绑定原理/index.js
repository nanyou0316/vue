class Vue{
  constructor(obj_instance){
    this.$data=obj_instance.data
    Compile(obj_instance.el,this)
  }
}
//数据劫持
function Observer(data_instance){
  if(!data_instance||typeof data_instance !='object' ) return 
  const dependency=new Dependency()
  Object.keys(data_instance).forEach(key=>{
    let value= data_instance[key]
    Observer(value)
    Object.defineProperty(data_instance,key,{
      configurable:true,//是否可修改
      enumerable:true,//是否可枚举
      get(){
        console.log(`访问了属性：${key}->${value}`);
        Dependency.temp&&dependency.addSub(Dependency.temp)
        if(Dependency.temp){
          console.log(Dependency.temp);
        }
        return value
      },
      set(newValue){
        console.log(`设置了属性：${key}->${value}->${newValue}`);
        value=newValue
        Observer(newValue)
        dependency.notify()
      }
    })
  })
}
//模板解析
function Compile(element,vm){
  vm.$el=document.querySelector(element)
  // console.log("vm.$el.childNodes:",vm.$el.childNodes);
  const fragment=document.createDocumentFragment()
  let child;
  while(child=vm.$el.firstChild){
    fragment.append(child)
  }
  // console.log("fragment:",fragment);
  // console.log("fragment.childNodes:",fragment.childNodes);
  fragment_compile(fragment)
  //替换文档碎片里面的内容
  function fragment_compile(node){
    console.log("fragment_compile(node):",node.nodeValue);
    /**
     * /\{\{\s*(\S+)\s*\}\}/
     * s*=>匹配一个或者多个空格
     * **/
    const pattern=/\{\{\s*(\S+)\s*\}\}/
    if(node.nodeType===3){
      //node.nodeValue=====阿婆主:{{name}}
      const tempNodeValue=node.nodeValue
      const result_regex=pattern.exec(node.nodeValue)
      if(result_regex){
        // console.log("node.nodeValue:"+node.nodeValue)//更多:{{more.like}}
        // console.log("result_regex:",result_regex);//['{{more.like}}', 'more.like', index: 3, input: '更多:{{more.like}}', groups: undefined]
       
        const arr=result_regex[1].split('.')
        // console.log("arr:",arr);
        const value=arr.reduce(
          (total,current)=>{return total[current]},vm.$data
        )
        node.nodeValue=tempNodeValue.replace(pattern,value)
        //创建订阅者
        new Watcher(vm,result_regex[1],newValue=>{
          node.nodeValue=tempNodeValue.replace(pattern,newValue)
        })
        console.log("reduce:",value);
      }
      return
    }
    if(node.nodeType===1&&node.nodeName==='INPUT'){
      const attr=Array.from(node.attributes)
      attr.forEach(i=>{
        if(i.nodeName==='v-model'){
          const value=i.nodeValue.split('.').reduce(
            (total,current)=>{return total[current]},vm.$data
          )
          node.value=value
          //创建订阅者
          new Watcher(vm,i.nodeValue,newValue=>{
            node.value=newValue
          })
          node.addEventListener('input',  (e)=> {
            //['more','like']
            const arr1=i.nodeValue.split('.')
            //['more']
            const arr2=arr1.slice(0,arr1.length-1)
            //vm.$data.more
            const final=arr2.reduce((total,current)=>total[current],vm.$data)
            //vm.$data.more['like']
            final[arr1[arr1.length-1]]=e.target.value
          })
          
        }
      })
    }
    node.childNodes.forEach(child=>fragment_compile(child))
  }
   vm.$el.appendChild(fragment)
}
//依赖-收集和通知订阅者
class Dependency {
  constructor(){
    this.subscribers = []
  }
  addSub(sub){
    this.subscribers.push(sub)
  }
  notify(){
    this.subscribers.forEach(sub=>sub.update())
  }
}
//订阅者
class Watcher{
  constructor(vm,key,callback){
    this.vm=vm;
    this.key=key;
    this.callback=callback
    Dependency.temp=this
    console.log(`用属性${key}创建订阅者`);
    key.split('.').reduce((total,current)=>total[current],vm.$data)
    Dependency.temp=null
  }
  update(){
    const value=this.key.split('.').reduce((total,current)=>total[current],this.vm.$data)
    this.callback(value)
  }
}