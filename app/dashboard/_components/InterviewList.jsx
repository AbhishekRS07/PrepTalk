"use client"

import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { PrepTalk } from '../../../utils/schema'
import { desc, eq } from 'drizzle-orm'
import Interviewcard from "./InterviewCard"
import { db } from '../../../utils/db'


const InterviewList = () => {
    const {user}=useUser()
    const [interviews, setInterviews] = useState([])
    useEffect(()=>{
        user&&GetInterviews()
    },[user])

    const GetInterviews= async()=>{
        const result = await db.select()
        .from(PrepTalk)
        .where(eq(PrepTalk.createdBy, user?.primaryEmailAddress?.emailAddress))
        .orderBy(desc(PrepTalk.id))
        console.log(result)
        setInterviews(result)
    }
  return (
    <div>
        <h2 className='font-medium text-xl'>Previous Mock Interviews</h2>
        <div className='grid grid-col-1 md:grid-col-3 lg:grid-col-3 gap-5'>
            {interviews&&interviews.map((item,index)=>(
                <Interviewcard 
                interview={item}
                key={index}/>
            ))}
        </div>
    </div>
  )
}

export default InterviewList