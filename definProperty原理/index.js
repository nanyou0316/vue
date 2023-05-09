let obj={
  name:'铁蛋儿',
  age:18
}
function observe(obj){
  if(typeof obj!=='object'||obj==null){
    return
  }
  for (const key in obj) {
    definProperty(obj,key,obj[key])
  }
}
function definProperty(obj,key,value){
  console.log(obj,key,value)

}
observe(obj)