"use client"
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'

const Header = () => {
    const path = usePathname()
    useEffect(() => {
        console.log(path)
    }, [path])

    return (
        <div className='flex p-4 items-center justify-between bg-secondary shadow-md'>
            <div className='flex-shrink-0'>
                <Image src={"/logo.svg"} width={40} height={40} alt='logo' />
            </div>
            <ul className='hidden md:flex gap-8 items-center'>
                <li className={`font-medium cursor-pointer transition-all hover:text-primary ${path=='/dashboard'&&'text-primary font-bold relative text-lg'}`}>
                    Dashboard
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all group-hover:h-0.5'></span>
                </li>
                <li className={` font-medium cursor-pointer transition-all hover:text-primary ${path=='/dashboard/questions'&&'text-primary font-bold relative text-lg'}`}>
                    Questions
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all group-hover:h-0.5'></span>
                </li>
                <li className={` font-medium cursor-pointer transition-all hover:text-primary ${path=='/dashboard/upgrade'&&'text-primary font-bold relative text-lg'}`}>
                    Upgrade
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all group-hover:h-0.5'></span>
                </li>
                <li className={` font-medium cursor-pointer transition-all hover:text-primary ${path=='/dashboard/how'&&'text-primary font-bold relative text-lg'}`}>
                    How it works?
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all group-hover:h-0.5'></span>
                </li>
            </ul>
            <div className='flex-shrink-0'>
                <UserButton/>
            </div>
        </div>
    )
}

export default Header
