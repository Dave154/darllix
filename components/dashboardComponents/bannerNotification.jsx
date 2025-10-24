import React from 'react'
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
const Notification = ({message}) => {
  const router = useRouter()
  return (
    <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-color3 text-white p-4 rounded-md flex justify-between items-center"
            >
              <span className='text-xs md:text-sm'>
               {message}
              </span>
              <Button className="bg-white text-black hover:bg-gray-200" onClick={()=>router.push('/dashboard/withdrawalhistory')} >
                History
              </Button>
            </motion.div>
  )
}

export default Notification