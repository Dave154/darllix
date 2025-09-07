

const Breadcrumb = ({category, categories,action}) => {
  return (
    <div className="text-xs text-gray-600 mb-4 font-mono flex gap-2 ">
      <span className="">  Home </span>
      <span className="cursor-pointer" onClick={()=>action(null)}>  / Products</span>
      {
        category && 
        <span className="">/ {categories.find(c=>c.id === category).name}</span>
      }
       
    </div>
  )
}

export default Breadcrumb