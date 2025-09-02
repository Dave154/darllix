import Image from "next/image"



const Loader = ()=>{
    return (
         <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 backdrop-blur-md bg-blue-200/30"></div>

      <div className="relative">
        <Image
          src="/darllix_logo.png"
          alt="App Logo"
          width={100}
          height={100}
          className="animate-pulse drop-shadow-lg"
          priority
        />
      </div>
    </div>
    )
}

export default Loader