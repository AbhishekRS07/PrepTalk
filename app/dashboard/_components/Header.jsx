"use client"
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const Header = () => {
    const path = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        console.log(path)
    }, [path])

    const toggleMenu = () => {
        setIsOpen(!isOpen)
    }

    return (
        <div className='flex p-4 items-center justify-between bg-secondary shadow-md'>
            <div className='md:hidden'>
                <button onClick={toggleMenu} className='text-primary'>
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>
            <div className='hidden md:block'>
                <Image src={"/logo.svg"} width={40} height={40} alt='logo' />
            </div>
            <ul className={`md:flex gap-8 items-center ${isOpen ? 'block' : 'hidden'} md:block absolute md:static bg-secondary top-16 left-0 w-full md:w-auto z-20 md:z-auto`}>
                <li className={`font-medium cursor-pointer transition-all hover:text-primary ${path == '/dashboard' && 'text-primary font-bold relative text-lg'} p-4 md:p-0`}>
                    Dashboard
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all group-hover:h-0.5'></span>
                </li>
                <li className={` font-medium cursor-pointer transition-all hover:text-primary ${path == '/dashboard/questions' && 'text-primary font-bold relative text-lg'} p-4 md:p-0`}>
                    Questions
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all group-hover:h-0.5'></span>
                </li>
                <li className={` font-medium cursor-pointer transition-all hover:text-primary ${path == '/dashboard/upgrade' && 'text-primary font-bold relative text-lg'} p-4 md:p-0`}>
                    Upgrade
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all group-hover:h-0.5'></span>
                </li>
                <li className={` font-medium cursor-pointer transition-all hover:text-primary ${path == '/dashboard/how' && 'text-primary font-bold relative text-lg'} p-4 md:p-0`}>
                    How it works?
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all group-hover:h-0.5'></span>
                </li>
            </ul>
            <div className='flex-shrink-0'>
                <UserButton />
            </div>
        </div>
    )
}

export default Header
