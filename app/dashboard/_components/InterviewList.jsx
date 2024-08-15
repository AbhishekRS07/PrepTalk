"use client"

import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { PrepTalk } from '../../../utils/schema'
import { desc, eq } from 'drizzle-orm'
import Interviewcard from "./InterviewCard"
import { db } from '../../../utils/db'

const InterviewList = () => {
  const { user } = useUser()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      GetInterviews()
    }
  }, [user])

  const GetInterviews = async () => {
    try {
      const result = await db.select()
        .from(PrepTalk)
        .where(eq(PrepTalk.createdBy, user?.primaryEmailAddress?.emailAddress))
        .orderBy(desc(PrepTalk.id))

      console.log(result)
      setInterviews(result)
    } catch (err) {
      console.error("Error fetching interviews:", err)
      setError("Failed to load interviews")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (mockId) => {
    setInterviews(interviews.filter(interview => interview.mockId !== mockId));
  };

  return (
    <div>
      <h2 className='font-medium text-xl mb-4'>Previous Mock Interviews</h2>

      {loading ? (
        <p>Loading interviews...</p>
      ) : error ? (
        <p className='text-red-500'>{error}</p>
      ) : interviews.length === 0 ? (
        <p>No interviews found.</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          {interviews.map((item, index) => (
            <Interviewcard 
              interview={item}
              key={index} 
              onDelete={handleDelete}
              />
          ))}
        </div>
      )}
    </div>
  )
}

export default InterviewList
