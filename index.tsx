/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from '@google/genai';

// --- Helper Functions ---
const formatCurrency = (value, showCents = false) => {
    const number = Number(value) || 0;
    const options = {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0,
    };
    return new Intl.NumberFormat('en-US', options).format(number);
};

// --- SVG Icon Components ---
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-gray-400 ml-1 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

const DownArrowIcon = () => (
    <svg className="w-4 h-4 ml-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
);

const ProductIcons = {
    Checking: () => <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>,
    CreditCards: () => <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>,
    Savings: () => <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>,
    HomeLoans: () => <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>,
    Retirement: () => <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1-5h2v2h-2v-2z"></path></svg>,
    AutoLoans: () => <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>,
    PersonalLoans: () => <svg className="w-8 h-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V5M12 20v-1m0 1v.01M12 18v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m-3 .01v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1V8m0-1V7m0-1V6m0-1V5m0-1V4m6 .01V5m0 1V6m0 1V7m0 1V8m0 1v1m0 1v1m0 1v1m0 1v1m0 1v1m0 1v1m0 1v1m0 1v1m0 1v1m0 1v1m0 1v1" /></svg>,
    BusinessServices: () => <svg className="w-8 h-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Investments: () => <svg className="w-8 h-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
};


// --- Navigational Components ---

const MegaMenu = ({ onNavigate }) => (
    <div className="absolute top-full left-0 w-full bg-white shadow-lg z-40">
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-800">
            <div>
                <h3 className="font-bold text-sm mb-4 border-b pb-2">BANKING</h3>
                <ul className="space-y-3 text-sm">
                    <li><a href="#" className="hover:underline">Checking</a></li>
                    <li><a href="#" className="hover:underline">Savings</a></li>
                    <li><a href="#" className="hover:underline">Credit Cards</a></li>
                    <li><a href="#" className="hover:underline">Online & Mobile Banking</a></li>
                    <li><a href="#" className="hover:underline">ATM Banking</a></li>
                    <li className="pt-2 border-t mt-2"><a href="#" className="hover:underline">Student Banking</a></li>
                    <li><a href="#" className="hover:underline">Military Banking</a></li>
                    <li><a href="#" className="hover:underline">PNC WorkPlace Banking®</a></li>
                </ul>
            </div>
            <div>
                <h3 className="font-bold text-sm mb-4 border-b pb-2">BORROWING</h3>
                <ul className="space-y-3 text-sm">
                    <li><a href="#" className="hover:underline">Home Lending Center</a></li>
                    <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('mortgage'); }} className="hover:underline cursor-pointer">Mortgage Purchase & Refinance</a></li>
                    <li><a href="#" className="hover:underline">Home Equity Loans</a></li>
                    <li><a href="#" className="hover:underline">Auto Loans</a></li>
                    <li><a href="#" className="hover:underline">Personal Loans</a></li>
                    <li><a href="#" className="hover:underline">Student Loans</a></li>
                    <li><a href="#" className="hover:underline">Student Loan Refinancing</a></li>
                    <li className="pt-2"><a href="#" className="text-orange-600 hover:underline">Explore Options in the Lending Portal »</a></li>
                </ul>
            </div>
            <div>
                <h3 className="font-bold text-sm mb-4 border-b pb-2">INVESTING & MANAGING WEALTH</h3>
                <ul className="space-y-3 text-sm">
                    <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('investments'); }} className="hover:underline cursor-pointer">PNC Investments</a></li>
                    <li><a href="#" className="hover:underline">PNC Private Bank</a></li>
                </ul>
            </div>
        </div>
    </div>
);

const Header = ({ onNavigate, onSignInClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-white text-gray-800 shadow-sm sticky top-0 z-50">
            {/* Top Bar */}
            <div className="bg-[#3c4a54] text-white">
                <div className="container mx-auto px-4 flex justify-between items-center text-xs">
                    <div className="flex items-center">
                        <nav className="hidden md:flex items-center">
                            <a href="#" className="bg-orange-500 px-4 py-2 font-bold">PERSONAL</a>
                            <a href="#" className="px-4 py-2 hover:bg-gray-700">SMALL BUSINESS</a>
                            <a href="#" className="px-4 py-2 hover:bg-gray-700">CORPORATE & INSTITUTIONAL</a>
                            <a href="#" className="px-4 py-2 hover:bg-gray-700">ABOUT</a>
                        </nav>
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        <a href="#" className="hover:underline">Español</a>
                        <a href="#" className="hover:underline">Customer Service</a>
                        <a href="#" className="hover:underline">Locations</a>
                        <a href="#" className="hover:underline">Security</a>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="bg-[#263139] text-white relative">
                <div className="container mx-auto px-4 flex justify-between items-center py-3">
                    <nav className="flex items-center space-x-6 text-sm font-semibold">
                         <div onMouseEnter={() => setIsMenuOpen(true)} onMouseLeave={() => setIsMenuOpen(false)}>
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="text-white border-b-4 border-orange-500 pb-4 pt-3 relative">
                                PRODUCTS & SERVICES
                                <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
                            </a>
                            {isMenuOpen && <MegaMenu onNavigate={onNavigate} />}
                        </div>
                        <a href="#" className="text-gray-300 hover:text-white pb-3 pt-3">LEARNING</a>
                        <a href="#" className="text-gray-300 hover:text-white pb-3 pt-3">SUPPORT</a>
                        <a href="#" className="text-gray-300 hover:text-white pb-3 pt-3">OFFERS</a>
                    </nav>
                    <div className="flex items-center space-x-4 text-sm font-semibold">
                        <a href="#" className="flex items-center text-gray-300 hover:text-white"><SearchIcon /> SEARCH</a>
                        <button onClick={onSignInClick} className="bg-white border-2 border-white text-gray-800 font-bold py-2 px-5 rounded-md hover:bg-gray-200 transition-colors">
                            SIGN ON
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const LoggedInHeader = ({ onNavigate, username, onLogout, currentPage }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const activeClasses = "block py-4 px-4 bg-[#00529B] border-b-4 border-orange-500";
    const inactiveClasses = "block py-4 px-4 hover:bg-[#00529B]";
    
    return (
        <header className="bg-white text-gray-800 shadow-sm sticky top-0 z-50">
            <div className="bg-[#004165] text-white">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <nav className="flex-1">
                        <ul className="flex items-center text-sm font-semibold">
                            <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('accounts'); }} className={currentPage === 'accounts' ? activeClasses : inactiveClasses}>Accounts</a></li>
                            <li><a href="#" className={inactiveClasses}>Pay and Transfer</a></li>
                            <li><a href="#" className={inactiveClasses}>Cards</a></li>
                            <li><a href="#" className={inactiveClasses}>Rewards</a></li>
                             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('financial-advisor'); }} className={currentPage === 'financial-advisor' ? activeClasses : inactiveClasses}>ENA</a></li>
                        </ul>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <a href="#" className="hover:underline text-sm">Help</a>
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center space-x-2 p-2 rounded-md hover:bg-[#00529B]">
                                <UserIcon />
                                <span className="font-semibold">{username}</span>
                                <DownArrowIcon />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border text-gray-800">
                                    <button
                                        onClick={() => {
                                            onLogout();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

// --- Login Page Component ---

const LoginPage = ({ onLogin, onNavigate }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (userId.toLowerCase() === 'lahari' && password === 'password') {
            setIsLoggingIn(true);
            await onLogin('Lahari');
            setIsLoggingIn(false);
        } else {
            setError('Invalid User ID or Password.');
        }
    };

    return (
        <div className="bg-gray-100 flex-grow">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-md mx-auto bg-white p-8 border rounded-lg shadow-md">
                    <h1 className="text-2xl font-light text-gray-800 mb-6">Sign On to Online Banking</h1>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="userId">User ID</label>
                            <input
                                type="text"
                                id="userId"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={isLoggingIn}
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={isLoggingIn}
                            />
                        </div>
                        <div className="flex items-center mb-6">
                             <input type="checkbox" id="rememberMe" className="h-4 w-4 text-blue-600 border-gray-300 rounded" disabled={isLoggingIn}/>
                             <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">Remember User ID</label>
                        </div>
                        <button type="submit" className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400" disabled={isLoggingIn}>
                             {isLoggingIn ? 'Signing On...' : 'Sign On'}
                        </button>
                        <div className="text-center mt-4 text-sm text-blue-600">
                             <a href="#" className="hover:underline">Forgot ID or Password?</a>
                             <span className="mx-2">|</span>
                             <a href="#" className="hover:underline">Enroll in Online Banking</a>
                        </div>
                    </form>
                </div>
            </div>
            <div className="text-center py-6 text-xs text-gray-500">
                <p>This is a simulated sign-on page. Use username 'lahari' and password 'password' to proceed.</p>
            </div>
        </div>
    );
};


// --- Home Page Components ---

const HeroSection = () => (
    <section className="bg-gray-100 relative overflow-hidden">
        <div className="absolute -right-40 -top-20 w-96 h-96 bg-orange-500 rounded-full opacity-90"></div>
        <div className="absolute -right-60 top-40 w-96 h-96 bg-orange-400 rounded-full opacity-80"></div>
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
            <div className="text-gray-800 lg:w-1/2">
                <h1 className="text-5xl lg:text-6xl font-light mb-4">Checking & Savings. Together.</h1>
                <div className="w-24 h-1 bg-orange-500 mb-6"></div>
                <p className="text-xl mb-8">
                    <span className="font-bold">Earn up to $400</span> as a new checking customer when you set up qualifying direct deposit(s) to a <a href="#" className="text-blue-600 hover:underline">Virtual Wallet®</a> spend account.
                </p>
                <button className="bg-[#00529B] hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-md text-lg transition-colors">
                    Get Started
                </button>
            </div>
        </div>
    </section>
);

const ProductsServicesSection = () => {
    const products = [
        { name: 'Checking', icon: 'Checking', link: '#' },
        { name: 'Credit Cards', icon: 'CreditCards', link: '#' },
        { name: 'Savings', icon: 'Savings', link: '#' },
        { name: 'Home Loans', icon: 'HomeLoans', link: '#' },
        { name: 'Retirement', icon: 'Retirement', link: '#' },
        { name: 'Auto Loans', icon: 'AutoLoans', link: '#' },
    ];
    return (
        <section className="py-20 text-center">
            <div className="container mx-auto px-4">
                <h2 className="text-4xl font-light text-gray-800 mb-2">Products & Services</h2>
                <div className="w-20 h-1 bg-orange-500 mx-auto mb-6"></div>
                <p className="text-gray-600 mb-12 text-lg">Explore and apply online.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    {products.map(product => {
                        const Icon = ProductIcons[product.icon];
                        return (
                            <div key={product.name} className="flex flex-col items-center">
                                <div className="p-4 mb-4">
                                    <Icon />
                                </div>
                                <a href={product.link} className="font-semibold text-blue-600 hover:underline">
                                    {product.name} <ArrowRightIcon />
                                </a>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
};

const FinancialWellnessSection = () => (
    <section className="bg-cover bg-center text-white" style={{backgroundImage: "url('https://www.pnc.com/content/dam/pnc-com/images/background/fw-bkgd-2448x500.jpg')"}}>
        <div className="bg-gray-800 bg-opacity-50">
            <div className="container mx-auto px-4 py-16">
                <div className="bg-white text-gray-800 p-8 rounded-lg max-w-lg">
                    <h2 className="text-3xl font-light mb-4">Financial Wellness</h2>
                    <p className="mb-6">We can help you get a clear picture of where you are today and help you plan for the future you want with manageable, actionable steps.</p>
                    <a href="#" className="font-semibold text-blue-600 hover:underline">Learn more and schedule your Financial Wellness conversation today <ArrowRightIcon /></a>
                </div>
            </div>
        </div>
    </section>
);


const HomePage = () => (
    <>
        <HeroSection />
        <ProductsServicesSection />
        <FinancialWellnessSection />
    </>
);

// --- Mortgage Page Components ---

const HomeLendingHero = () => (
    <section className="text-center py-20 bg-gradient-to-b from-blue-100 to-white">
        <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-light text-gray-800 mb-4">Start Your Home Lending Journey Today</h1>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6"></div>
            <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-md text-lg transition-colors mb-4">
                Apply Now
            </button>
            <br/>
            <a href="#" className="text-blue-600 font-semibold hover:underline">Resume Your Application</a>
        </div>
    </section>
);

const HomeInsightPlanner = () => (
    <section className="bg-white py-16">
        <div className="container mx-auto px-4">
            <div className="bg-white p-10 rounded-lg shadow-lg text-center max-w-4xl mx-auto border">
                 <h2 className="text-3xl font-light text-gray-800 mb-4">Explore Mortgage Possibilities with Home Insight® Planner</h2>
                <div className="w-24 h-1 bg-orange-500 mx-auto mb-6"></div>
                <p className="text-gray-700 mb-6 max-w-2xl mx-auto">With Home Insight® Planner Dashboard you can create, compare, and save personalized plans to find a mortgage loan option that works best for you.</p>
                <a href="#" className="font-semibold text-blue-600 hover:underline">Try Home Insight® Planner Dashboard <ArrowRightIcon /></a>
            </div>
        </div>
    </section>
);

const CheckRatesSection = ({ inputs, onInputChange, onGetRates }) => (
     <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-light text-gray-800 mb-4">Check Current Rates</h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6"></div>
            <div className="max-w-4xl mx-auto bg-white p-8 border rounded-md shadow-sm text-left">
                <div className="mb-6 border-b">
                    <button className="text-blue-700 font-semibold py-2 px-4 border-b-2 border-blue-700">
                        Purchase a home
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label htmlFor="home-value" className="block text-sm font-medium text-gray-700">Home Value</label>
                        <input type="text" name="homeValue" id="home-value" value={inputs.homeValue} onChange={onInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div className="lg:col-span-1">
                        <label htmlFor="down-payment" className="block text-sm font-medium text-gray-700">Down Payment</label>
                        <input type="text" name="downPayment" id="down-payment" value={inputs.downPayment} onChange={onInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                     <div className="lg:col-span-1">
                        <label htmlFor="percentage" className="block text-sm font-medium text-gray-700">Percentage</label>
                        <input type="text" name="percentage" id="percentage" value={inputs.percentage} onChange={onInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm" readOnly/>
                    </div>
                    <div className="lg:col-span-1">
                        <label htmlFor="loan-amount" className="block text-sm font-medium text-gray-700">Loan Amount</label>
                        <input type="text" name="loanAmount" id="loan-amount" value={inputs.loanAmount} onChange={onInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm" readOnly/>
                    </div>
                    <div className="lg:col-span-1">
                        <label htmlFor="credit-score" className="block text-sm font-medium text-gray-700">Credit Score</label>
                        <select name="creditScore" id="credit-score" value={inputs.creditScore} onChange={onInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            <option>740+</option>
                            <option>720-739</option>
                            <option>700-719</option>
                            <option>680-699</option>
                            <option>660-679</option>
                            <option>640-659</option>
                            <option>620-639</option>
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                         <label htmlFor="zip-code" className="block text-sm font-medium text-gray-700">Zip Code</label>
                        <div className="flex">
                           <input type="text" name="zipCode" id="zip-code" value={inputs.zipCode} onChange={onInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                           <button onClick={onGetRates} className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-r-md">
                                Get Rates
                           </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const CurrentRates = ({ rates, inputs }) => {
    if (!rates) return null;

    return (
        <div className="container mx-auto px-4 -mt-16 pb-20">
            <div className="max-w-4xl mx-auto bg-white p-8 border rounded-md shadow-sm text-left">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-light text-gray-800">Current Rates</h3>
                    <p className="text-sm text-gray-500">Friday {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}. Your actual rate, payment and costs could be higher. Get an official Loan Estimate before choosing a loan. Click "Get Rates" to refresh results.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead>
                            <tr className="border-b">
                                <th className="py-3 px-2"></th>
                                {rates.map(rate => <th key={rate.name} className="py-3 px-2 text-center font-bold text-gray-800">{rate.name}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="py-3 px-2 font-semibold">Interest Rate <InfoIcon/></td>
                                {rates.map(rate => <td key={rate.name} className="py-3 px-2 text-center text-xl font-light text-gray-900">{rate.interestRate}%</td>)}
                            </tr>
                            <tr className="border-b">
                                <td className="py-3 px-2 font-semibold">APR <InfoIcon/></td>
                                {rates.map(rate => <td key={rate.name} className="py-3 px-2 text-center">{rate.apr}%</td>)}
                            </tr>
                            <tr className="border-b">
                                <td className="py-3 px-2 font-semibold">Monthly Payment <InfoIcon/></td>
                                {rates.map(rate => <td key={rate.name} className="py-3 px-2 text-center text-xl font-light text-gray-900">{formatCurrency(rate.monthlyPayment)}<p className="text-xs">Principal and Interest</p></td>)}
                            </tr>
                            <tr>
                                <td className="py-3 px-2 font-semibold">Down Payment <InfoIcon/></td>
                                {rates.map(rate => (
                                    <td key={rate.name} className="py-3 px-2 text-center">
                                        {inputs.percentage}% / {formatCurrency(inputs.downPayment)}
                                        <p className="text-xs">Assumes purchase price of {formatCurrency(inputs.homeValue)}</p>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HomeLendingPage = ({ rateInputs, onInputChange, onGetRates, currentRates }) => (
    <>
      <HomeLendingHero />
      <HomeInsightPlanner />
      <CheckRatesSection inputs={rateInputs} onInputChange={onInputChange} onGetRates={onGetRates} />
      <CurrentRates rates={currentRates} inputs={rateInputs} />
      <ScrollToTopButton />
    </>
);

// --- Investments Page Components ---

const InvestmentsHero = () => (
    <section className="bg-cover bg-center" style={{backgroundImage: "url('https://i.imgur.com/k2m2s2j.png')"}}>
        <div className="container mx-auto px-4 py-24 text-center">
            <div className="bg-white bg-opacity-90 p-10 rounded-lg max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-light text-gray-800 mb-4">PNC Investments</h1>
                <p className="text-gray-700 text-lg mb-8">Wherever you find yourself on your investing journey, our focus on advice and planning can help put your goals within reach at every life stage.</p>
            </div>
        </div>
    </section>
);

const InvestmentsPage = () => (
    <>
        <InvestmentsHero />
    </>
);

// --- Accounts Page Components ---
const AccountsPage = ({ username }) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const accounts = [
        { name: 'Spend', balance: 4280.15 },
        { name: 'Reserve', balance: 15500.00 },
        { name: 'Growth', balance: 87342.50 },
    ];

    const products = [
        { name: 'Open A Checking Account', icon: 'Checking' },
        { name: 'Find The Right Credit Card', icon: 'CreditCards' },
        { name: 'Explore Auto Loan Options', icon: 'AutoLoans' },
        { name: 'Browse Personal Loans And Rates', icon: 'PersonalLoans' },
        { name: 'Start The Home Lending Process', icon: 'HomeLoans' },
        { name: 'Open A Savings Account', icon: 'Savings' },
        { name: 'Discover Business Products And Services', icon: 'BusinessServices' },
        { name: 'Learn About Investment Products', icon: 'Investments' },
    ];

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="bg-[#004165] text-white">
                <div className="container mx-auto px-4 py-8">
                    <p className="text-sm">{formattedDate}</p>
                    <h1 className="text-3xl font-light">Welcome Back, {username}</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-8">
                 <h2 className="text-2xl font-light text-gray-800 mb-4">Your Accounts</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2">
                         <div className="bg-white p-6 rounded-lg shadow-sm border">
                             <h3 className="text-lg font-semibold mb-4 text-gray-700">Virtual Wallet Accounts <span className="text-sm font-normal text-gray-500">(3 Accounts)</span></h3>
                             <div className="space-y-4">
                                {accounts.map(acc => (
                                    <div key={acc.name} className="flex justify-between items-center border-b pb-4 last:border-b-0">
                                        <div>
                                            <p className="font-semibold text-blue-600">{acc.name}</p>
                                            <p className="text-xs text-gray-500">Account ending in ****</p>
                                        </div>
                                        <p className="font-light text-2xl text-gray-800">{formatCurrency(acc.balance, true)}</p>
                                    </div>
                                ))}
                             </div>
                         </div>
                     </div>
                     <div className="space-y-8">
                         <div className="bg-white p-6 rounded-lg shadow-sm border">
                             <h3 className="text-lg font-semibold mb-2 text-gray-700">Reminders</h3>
                             <p className="text-sm text-gray-600">Great job staying on top of things! You have no new Reminders right now.</p>
                         </div>
                         <div className="bg-white p-6 rounded-lg shadow-sm border">
                             <h3 className="text-lg font-semibold mb-4 text-gray-700">Products and Services</h3>
                             <ul className="space-y-3">
                                {products.map(p => {
                                    const Icon = ProductIcons[p.icon];
                                    return (
                                        <li key={p.name} className="border-b pb-3 last:border-0">
                                            <a href="#" className="flex items-center text-sm text-blue-600 hover:underline">
                                               <Icon />
                                               <span className="ml-3">{p.name}</span>
                                            </a>
                                        </li>
                                    );
                                })}
                             </ul>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};

// --- Financial Advisor Page ---
const InteractivePieChart = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const svgRef = useRef(null);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativeAngle = 0;

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const slices = data.map((item, index) => {
        const percent = item.value / total;
        const [startX, startY] = getCoordinatesForPercent(cumulativeAngle / 360);
        cumulativeAngle += percent * 360;
        const [endX, endY] = getCoordinatesForPercent(cumulativeAngle / 360);
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        const pathData = [
            `M ${startX * 45 + 50} ${startY * 45 + 50}`, // Move
            `A 45 45 0 ${largeArcFlag} 1 ${endX * 45 + 50} ${endY * 45 + 50}`, // Arc
            'L 50 50', // Line
        ].join(' ');

        return { ...item, pathData, percentage: (percent * 100).toFixed(1) };
    });

    const activeSlice = activeIndex !== null ? slices[activeIndex] : null;

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full" ref={svgRef}>
                <g transform="rotate(-90 50 50)">
                    {slices.map((slice, index) => (
                        <path
                            key={index}
                            d={slice.pathData}
                            fill={slice.color}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            className="cursor-pointer transition-transform duration-200"
                            style={{ transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)', transformOrigin: '50% 50%' }}
                        />
                    ))}
                </g>
            </svg>
            {activeSlice && (
                <div className="absolute bg-white p-2 rounded-lg shadow-lg border text-xs pointer-events-none">
                    <p className="font-bold">{activeSlice.label}</p>
                    <p>{formatCurrency(activeSlice.value)} ({activeSlice.percentage}%)</p>
                </div>
            )}
        </div>
    );
};

const InteractiveLineChart = ({ data }) => {
    const [tooltip, setTooltip] = useState(null);
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    const width = 500;
    const height = 180;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const allValues = data.flatMap(d => [d.income, d.expenses, d.net]);
    const yMax = Math.max(...allValues);
    const yMin = Math.min(...allValues);

    const xScale = (index) => margin.left + (index / (data.length - 1)) * chartWidth;
    const yScale = (value) => margin.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

    const incomePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.income)}`).join(' ');
    const expensesPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.expenses)}`).join(' ');
    const netPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.net)}`).join(' ');

    const handleMouseMove = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x > margin.left && x < width - margin.right) {
            const index = Math.round(((x - margin.left) / chartWidth) * (data.length - 1));
            if (data[index]) {
                setTooltip({
                    x: xScale(index),
                    data: data[index],
                });
            }
        } else {
             setTooltip(null);
        }
    };
    
    return(
        <div className="relative" ref={containerRef} onMouseLeave={() => setTooltip(null)}>
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} onMouseMove={handleMouseMove} className="w-full h-auto">
                {/* Y-axis grid lines and labels */}
                {[...Array(5)].map((_, i) => {
                    const y = margin.top + (i / 4) * chartHeight;
                    const value = yMin + (1 - i / 4) * (yMax - yMin);
                    return (
                        <g key={i}>
                            <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="#e5e7eb" />
                            <text x={margin.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#6b7280">{formatCurrency(value)}</text>
                        </g>
                    )
                })}

                {/* X-axis labels */}
                {data.map((d, i) => {
                    if(data.length > 12 && i % 3 !== 0) return null;
                    if(data.length > 6 && data.length <=12 && i % 2 !== 0) return null;
                     return(
                        <text key={i} x={xScale(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="#6b7280">{d.month}</text>
                     )
                })}
               
                <path d={incomePath} fill="none" stroke="#22c55e" strokeWidth="2" />
                <path d={expensesPath} fill="none" stroke="#ef4444" strokeWidth="2" />
                <path d={netPath} fill="none" stroke="#3b82f6" strokeWidth="2" />

                {tooltip && (
                     <g>
                        <line x1={tooltip.x} y1={margin.top} x2={tooltip.x} y2={height - margin.bottom} stroke="#4b5563" strokeDasharray="4" />
                        <circle cx={tooltip.x} cy={yScale(tooltip.data.income)} r="4" fill="#22c55e" stroke="white" strokeWidth="2"/>
                        <circle cx={tooltip.x} cy={yScale(tooltip.data.expenses)} r="4" fill="#ef4444" stroke="white" strokeWidth="2"/>
                        <circle cx={tooltip.x} cy={yScale(tooltip.data.net)} r="4" fill="#3b82f6" stroke="white" strokeWidth="2"/>
                    </g>
                )}
            </svg>
            {tooltip && (
                <div className="absolute p-2 bg-white border rounded-md shadow-lg text-xs pointer-events-none" style={{ left: `${(tooltip.x / width) * 100}%`, top: '0', transform: `translateX(${tooltip.x > width / 2 ? '-110%' : '10%'})` }}>
                     <p className="font-bold mb-1">{tooltip.data.month} {tooltip.data.year}</p>
                    <p><span className="font-semibold text-green-500">Income:</span> {formatCurrency(tooltip.data.income)}</p>
                    <p><span className="font-semibold text-red-500">Expenses:</span> {formatCurrency(tooltip.data.expenses)}</p>
                    <p><span className="font-semibold text-blue-500">Net Flow:</span> {formatCurrency(tooltip.data.net)}</p>
                </div>
            )}
        </div>
    );
};

const FinancialAdvisorPage = ({ financialData, setFinancialData }) => {
    const { income, expenses, currentDeposits, investments, borrowings, insurances } = financialData;
    const netCashFlow = income - expenses;
    const [timeline, setTimeline] = useState(12);

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFinancialData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) || 0 : value,
        }));
    };

    const expenseBreakdownData = [
        { label: 'Housing', value: expenses * 0.45, color: '#3b82f6' },
        { label: 'Food', value: expenses * 0.20, color: '#10b981' },
        { label: 'Transport', value: expenses * 0.15, color: '#ef4444' },
        { label: 'Utilities', value: expenses * 0.10, color: '#f97316' },
        { label: 'Entertainment', value: expenses * 0.10, color: '#8b5cf6' },
    ];
    
    const generateForecastData = (months) => {
        const data = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const today = new Date();
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();

            const monthIncome = income * (1 + (Math.random() - 0.5) * 0.1); // +/- 5% variation
            const monthExpenses = expenses * (1 + (Math.random() - 0.5) * 0.15); // +/- 7.5% variation
            
            data.push({
                month,
                year,
                income: monthIncome,
                expenses: monthExpenses,
                net: monthIncome - monthExpenses
            });
        }
        return data;
    }
    const forecastData = generateForecastData(timeline);
    
    return(
        <div className="bg-gray-50">
            <div className="bg-white border-b">
                 <div className="container mx-auto px-4 py-2">
                    <h1 className="text-xl font-bold text-gray-800">ENA: Your AI Financial Advisor</h1>
                    <p className="text-sm text-gray-500">Your personalized financial analysis from ENA</p>
                 </div>
            </div>
            <div className="container mx-auto px-4 py-2">
                <div className="bg-white p-3 rounded-lg shadow-sm border mb-2">
                     <h3 className="font-semibold text-gray-700 mb-2 border-b pb-2">Your Financial Snapshot</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {/* Column 1: Cash Flow */}
                        <div className="space-y-1">
                            <h4 className="font-semibold text-gray-600 mb-2">Monthly Cash Flow</h4>
                            <div>
                                 <label className="text-sm text-gray-600 block mb-1">Income</label>
                                 <input type="number" name="income" value={income} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                            <div>
                                 <label className="text-sm text-gray-600 block mb-1">Expenses</label>
                                 <input type="number" name="expenses" value={expenses} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                             <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
                                 <label className="text-sm text-gray-600 block">Net Cash Flow</label>
                                 <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netCashFlow)}</p>
                            </div>
                        </div>

                        {/* Column 2: Assets */}
                        <div className="space-y-1">
                            <h4 className="font-semibold text-gray-600 mb-2">Assets</h4>
                             <div>
                                 <label className="text-sm text-gray-600 block mb-1">Current Deposits (Checking, Savings)</label>
                                 <input type="number" name="currentDeposits" value={currentDeposits} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                            <div>
                                 <label className="text-sm text-gray-600 block mb-1">Investments (Stocks, 401k, etc.)</label>
                                 <input type="number" name="investments" value={investments} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                        </div>

                        {/* Column 3: Liabilities & Insurance */}
                        <div className="space-y-1">
                            <h4 className="font-semibold text-gray-600 mb-2">Liabilities & Coverage</h4>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Borrowings (Loans, Credit Cards)</label>
                                 <input type="number" name="borrowings" value={borrowings} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Insurance Policies</label>
                                 <input type="text" name="insurances" value={insurances} onChange={handleInputChange} placeholder="e.g., Life, Auto, Home" className="w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                        </div>
                     </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Analytics Dashboard</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
                        <div className="lg:col-span-3 bg-white p-2 rounded-lg shadow-sm border">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-gray-700">Cash Flow Forecast</h3>
                                <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
                                    {[6, 12, 24].map(t => (
                                        <button key={t} onClick={() => setTimeline(t)} className={`px-3 py-1 text-sm rounded-md transition-colors ${timeline === t ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-200'}`}>{t}M</button>
                                    ))}
                                </div>
                            </div>
                            <div><InteractiveLineChart data={forecastData} /></div>
                             <div className="flex justify-center space-x-4 text-xs mt-2">
                                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Income</span>
                                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Expenses</span>
                                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Net</span>
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white p-2 rounded-lg shadow-sm border">
                            <h3 className="font-semibold text-gray-700 mb-1">Expense Breakdown</h3>
                            <div className="h-44"><InteractivePieChart data={expenseBreakdownData} /></div>
                            <div className="text-xs grid grid-cols-2 gap-1 mt-1">
                                {expenseBreakdownData.map(item => (
                                    <span key={item.label} className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: item.color}}></span>
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Chatbot Components ---

const ChatbotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const MicrophoneIcon = ({ isListening }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors ${isListening ? 'text-red-500' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"/>
    </svg>
);

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
);

const ExpandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
    </svg>
);

const CollapseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H4v4m12 12h4v-4M8 20H4v-4m12-12h4V4" />
    </svg>
);

const NewChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const MessageContent = ({ text }) => {
    // This component parses simple markdown-like syntax from the bot's response
    // and renders it as HTML. It handles bolding (**) and list items (*).
    const processText = (rawText) => {
        return rawText
            // 1. Replace **text** with <strong>text</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // 2. Replace "* " at the start of a line (with optional indentation) with a bullet point.
            .replace(/^\s*\*\s/gm, '&bull; ');
    };

    return (
        <div
            className="text-sm whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: processText(text) }}
        />
    );
};

const pageContent = `
HomePage:
- Hero: "Checking & Savings. Together. Earn up to $400 as a new checking customer when you set up qualifying direct deposit(s) to a Virtual Wallet® spend account."
- Products & Services: Explore and apply online for Checking, Credit Cards, Savings, Home Loans, Retirement, and Auto Loans.
- Financial Wellness: "We can help you get a clear picture of where you are today and help you plan for the future you want with manageable, actionable steps."

Mortgage Page:
- Hero: "Start Your Home Lending Journey Today. Apply Now or Resume Your Application."
- Services: Tools to determine your home buying budget (Affordability), learn about the basics of home buying (Home Purchase), and learn about refinancing (Home Refinance).
- Home Insight Planner: "Explore Mortgage Possibilities with Home Insight® Planner Dashboard you can create, compare, and save personalized plans to find a mortgage loan option that works best for you."
- Rates: A tool to check current rates for purchasing a home.
- Required Documents for Loan Application: To process your loan application, you will typically need to provide the following documents:
  - Personal Identification: Government-issued photo ID (like a driver's license or passport) and your Social Security number.
  - Income Verification: Recent pay stubs (last 30 days), W-2 forms for the past two years, and federal tax returns for the past two years. If you are self-employed, you may need to provide profit and loss statements.
  - Asset Verification: Bank statements for all checking and savings accounts for the last two to three months, as well as statements for any investment accounts (like 401(k)s, stocks, or mutual funds).
  - Debt Information: A list of all your monthly debts, such as credit card statements, auto loans, student loans, and any other loan statements.
- Prepayment Penalties: PNC does not charge a prepayment penalty for closing a loan early.
- Interest Rate Types: For Mortgages: We offer both Fixed-Rate Mortgages and Adjustable-Rate Mortgages (ARMs).

Investments Page:
- Focus: "Our focus on advice and planning can help put your goals within reach at every life stage."
- Retirement Planning: Information for users at all stages of their retirement journey.
- Investment Solutions: Lists various products like IRAs, Stocks, Bonds, Mutual Funds, Brokerage Accounts, and more.
`;

const fillMortgageRateFormFunctionDeclaration: FunctionDeclaration = {
    name: 'fillMortgageRateForm',
    parameters: {
      type: Type.OBJECT,
      description: 'Fills the mortgage rate calculator on the page with user-provided details and calculates the rates.',
      properties: {
        homeValue: { type: Type.NUMBER, description: 'The total value of the home.' },
        downPayment: { type: Type.NUMBER, description: 'The initial down payment amount.' },
        creditScore: { type: Type.STRING, description: 'The user\'s credit score range, e.g., "720-739". Must be one of the available options.' },
        zipCode: { type: Type.STRING, description: 'The 5-digit zip code of the property.' },
        loanAmount: { type: Type.NUMBER, description: 'Optional. The specific amount the user wants to borrow. If not provided, it will be calculated as home value minus down payment.' },
      },
      required: ['homeValue', 'downPayment', 'creditScore', 'zipCode'],
    },
};

const navigateToPageFunctionDeclaration: FunctionDeclaration = {
  name: 'navigateToPage',
  parameters: {
    type: Type.OBJECT,
    description: 'Navigates the user to a specific page within the application.',
    properties: {
      page: {
        type: Type.STRING,
        description: 'The name of the page to navigate to. Must be either "home", "mortgage", or "investments".',
      },
    },
    required: ['page'],
  },
};

const getLoggedOutSystemInstruction = () => `You are a friendly and helpful banking assistant for PNC Bank. You are an expert on the content of the PNC website.
Answer user questions based ONLY on the following information:
${pageContent}

Your conversational flow should follow these rules:
1.  **Direct Answers First**: If a user asks a specific question that can be answered directly from the information provided (like "what documents are needed for a loan?" or "are there pre-closure charges?"), you MUST provide the detailed answer directly in the chat.
2.  **Navigation**: After providing a direct answer, or if a user's request is more general (e.g., "tell me about mortgages"), you can offer to navigate them to a relevant page for more information. When offering to navigate, you must first ask for their permission. For example: "You can find more details on our mortgage page. Is it okay if I navigate you there?"
3.  **Confirmation & Execution**: Only if the user gives a positive confirmation (e.g., "yes", "sure", "ok"), you must respond ONLY with the navigateToPage function call. Do not add any text to your response, as the application will show the confirmation message.
4.  **Context Awareness**: You will be told which page the user is currently on in brackets, like [Current Page: home]. If you are about to suggest navigating to the page the user is ALREADY on, do not ask to navigate. Instead, acknowledge their location and point out relevant features on that page. For example: "You're already on our mortgage page! It has some great resources, including an affordability calculator and our Home Insight® Planner. What are you looking for specifically?"
5.  **Financial Advice & Savings Plans**: You must politely decline when asked for financial advice, to create a savings plan, or calculate an EMI, as you are an AI assistant.
    - If the user asks for a **savings plan for a down payment**, you should first perform a simple calculation to be helpful. Acknowledge the user's goal (e.g., home value and timeframe). Calculate a 20% down payment, and then calculate the required monthly savings. Present this as a simple calculation, not advice. For example: "As an AI assistant, I can't offer financial advice, but I can do some math to help you frame your goal. A 20% down payment on a $400,000 home is $80,000. To save that in 2 years, you'd need to put aside about $3,333 per month."
    - After providing the calculation (or if the query is just about general advice/EMI), you must then pivot to offering help with the website's tools. Mention the "Home Insight® Planner" for planning or the "Rates" tool for calculations.
    - Finally, offer to navigate to the mortgage page to use these tools. For example: "Our mortgage page has tools like the Home Insight® Planner that can help you explore possibilities. Would you like me to navigate you there?"
6.  **Rate Calculation**: If the user agrees to the rate calculation, you must ask for their Home Value, Down Payment, Credit Score, and Zip Code if they haven't provided them already. Once you have this information, you must call the \`fillMortgageRateForm\` function. Do not ask for percentage or loan amount, as the system will calculate them.
7.  **Page Mapping**:
    - For general questions about checking, savings, credit cards, or how to get started, direct them to the 'home' page.
    - For questions about home loans, mortgages, refinancing, or buying a house, direct them to the 'mortgage' page.
    - For questions about investments, wealth management, retirement, IRAs, or stocks, direct them to the 'investments' page.
8.  **Knowledge Limit**: Do not make up information. If you don't know the answer, say so.
`;

const getLoggedInSystemInstruction = (financialData, insightsSummary) => `You are ENA, an expert PNC AI Assistant. Your primary goal is to provide personalized, actionable financial guidance based on the user's data.

**User's Financial Snapshot:**
- Monthly Income: ${formatCurrency(financialData.income)}
- Monthly Expenses: ${formatCurrency(financialData.expenses)}
- Net Cash Flow: ${formatCurrency(financialData.income - financialData.expenses)}
- Current Deposits (Savings, Checking): ${formatCurrency(financialData.currentDeposits)}
- Total Investments: ${formatCurrency(financialData.investments)}
- Total Borrowings (Loans, Credit Cards): ${formatCurrency(financialData.borrowings)}
- Current Insurances: ${financialData.insurances || 'Not specified'}

**Your Core Directives:**

1.  **Analysis on Request (Numbered List First):**
    - Do NOT provide a financial analysis until the user asks for it.
    - When the user asks for an analysis, an overview, or a similar broad question, you MUST first provide a high-level summary of key points.
    - Start with a sentence acknowledging a strength from their data.
    - Then, present the summary as a short, numbered list of topics for discussion. Users may refer to these topics by number.
    - Conclude by stating you can provide in-depth information on any of these points and ask the user which one they would like to explore.
    - **Example Summary Response:** "Based on your data, your strong monthly cash flow of ${formatCurrency(financialData.income - financialData.expenses)} is a great asset. Here are a few key areas we could analyze:

    1. Optimizing your existing cash deposits to ensure your ${formatCurrency(financialData.currentDeposits)} is working for you.
    2. Strategic use of your net cash flow to effectively direct your surplus.
    3. Accelerating debt repayment to reduce your ${formatCurrency(financialData.borrowings)} in borrowings and save on interest.
    4. Reviewing spending habits to find potential savings in your monthly expenses.

    I can give you in-depth information on any of these points. Which one would you like to focus on?"

2.  **User-Led Layered Deep Dive:**
    - Your in-depth analysis must be a two-step process.
    - **Step A: Provide a Concise Summary.** When the user selects a topic (e.g., "tell me about 3" or "debt repayment"), your first response must be a brief, 1-2 sentence summary of that topic.
    - **Step B: Offer to Expand.** After providing the summary, ask the user if they would like a more detailed breakdown or want to explore specific strategies.
    - **Step C: Give Full Detail on Request.** Only after the user confirms they want more information should you provide the full, actionable advice, including specific strategies, calculations, or product suggestions.
    - **Example of Layered Interaction:**
        - **User:** "Tell me more about number 3."
        - **Your Summary Response:** "Accelerating debt repayment means using some of your extra cash flow to pay down your ${formatCurrency(financialData.borrowings)} in borrowings faster. This can save you a significant amount in interest over time."
        - **Your Follow-up Question:** "Would you like me to explain common strategies for this, or calculate how quickly you could pay it off?"
        - **User:** "Explain the strategies."
        - **Your Detailed Response:** "Two popular strategies are the 'avalanche' method, where you pay off the highest-interest debt first to save the most money, and the 'snowball' method, where you pay off the smallest debt first for a motivational win..." (and so on).

3.  **Educational Role:**
    - Explain financial concepts simply (e.g., what an ETF is, the difference between a Roth and Traditional IRA).
    - Frame your advice as educational guidance. Always include a disclaimer to encourage users to do their own research or consult a human expert for major decisions. For example: "While I can provide guidance based on your data, it's always a good idea to consult with a certified financial planner for personalized advice."

${insightsSummary ? `
**Welcome Back Flow:**
If the user responds positively (e.g., "yes", "show me", "take a look") to the welcome back message about new insights, you MUST present the following summary and then ask which point they want to discuss further. Do not add any preamble like "Sure, here are the insights". Just present the summary directly.

**PRE-GENERATED SUMMARY:**
${insightsSummary}
` : ''}

4.  **Constraints:**
    - Do NOT offer to navigate pages or fill out forms. Your role is purely advisory.
    - Base your analysis ONLY on the provided financial data. Do not invent or assume information.
`;

const Chatbot = ({ isOpen, onToggle, onNavigate, currentPage, onFillRateForm, isLoggedIn, financialData, messages, setMessages, chatRef, onNewChat, insightsSummary }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const recognitionRef = useRef<any>(null); // Using 'any' for SpeechRecognition to support webkit prefix

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel any ongoing speech
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        // FIX: Cast window to any to access vendor-prefixed SpeechRecognition API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition && 'speechSynthesis' in window) {
            setVoiceSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                submitMessage(transcript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            
            recognitionRef.current = recognition;
        }
    }, []);
    
    useEffect(() => {
        if(isOpen) {
            scrollToBottom();
        } else {
            setIsExpanded(false); // Reset expanded state on close
        }
    }, [messages, isOpen]);

    const initializeChat = async () => {
        if (chatRef.current) return;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const systemInstruction = isLoggedIn ? getLoggedInSystemInstruction(financialData, insightsSummary) : getLoggedOutSystemInstruction();
            const tools = isLoggedIn ? [] : [{functionDeclarations: [navigateToPageFunctionDeclaration, fillMortgageRateFormFunctionDeclaration]}];
            
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction,
                    tools,
                },
            });
        } catch (error) {
            console.error("Failed to initialize Generative AI:", error);
            const errorMsg = 'Sorry, I am unable to connect right now. Please try again later.';
            setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
        }
    };
    
    // Initialize chat when opened or when login state changes while open
    useEffect(() => {
        if (isOpen) {
            initializeChat();
        }
    }, [isLoggedIn, financialData, isOpen, insightsSummary]);

    const submitMessage = async (messageText: string, isHidden: boolean = false) => {
        if (messageText.trim() === '' || isLoading) return;
    
        const userMessage = messageText;
        const messageWithContext = isLoggedIn ? userMessage : `[Current Page: ${currentPage}] ${userMessage}`;
        
        if (!isHidden) {
            setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        }
        setIsLoading(true);
    
        try {
            if (!chatRef.current) {
                await initializeChat(); // Ensure chat is initialized before sending
                if (!chatRef.current) {
                    throw new Error("Chat could not be initialized.");
                }
            }
    
            const result = await chatRef.current.sendMessage({ message: messageWithContext });
    
            if (!isLoggedIn && result.functionCalls && result.functionCalls.length > 0) {
                const fc = result.functionCalls[0]; 
                
                if (fc.name === 'navigateToPage') {
                    const page = fc.args.page as string;
                    if (page === 'home' || page === 'mortgage' || page === 'investments') {
                        const botMessage = `Great, I'm taking you to the ${page} page now.`;
                        setMessages(prev => [...prev, { sender: 'bot', text: botMessage }]);
                        onNavigate(page);
                    } else {
                        const botMessage = `Sorry, I can't navigate to a page called '${page}'.`;
                        setMessages(prev => [...prev, { sender: 'bot', text: botMessage }]);
                    }
                } else if (fc.name === 'fillMortgageRateForm') {
                    const formData = fc.args;
                    const calculatedRates = onFillRateForm(formData);
                    
                    const ratesSummary = calculatedRates.map(rate => 
                        `- ${rate.name}: ${rate.interestRate}% Interest Rate, ${formatCurrency(rate.monthlyPayment)}/month`
                    ).join('\n');
                    
                    const summary = `I've filled out the form with your details and calculated the rates, which you can see on the page under "Current Rates". Here's a quick summary:\n\n${ratesSummary}`;
                    
                    setMessages(prev => [...prev, { sender: 'bot', text: summary }]);
                } else {
                    const botMessage = `Sorry, I encountered an unexpected tool request.`;
                    setMessages(prev => [...prev, { sender: 'bot', text: botMessage }]);
                }
            } else if (result.text) {
                setMessages(prev => [...prev, { sender: 'bot', text: result.text }]);
            }
    
        } catch (error) {
            console.error("Error sending message:", error);
            let errorMessage = 'Sorry, something went wrong. Please try again.';
            if (error && typeof error === 'object' && 'message' in error) {
                const message = String(error.message);
                if (message.includes('API key not valid')) {
                    errorMessage = 'There is an issue with the chatbot configuration. Please contact support.';
                } else if (message.includes('400')) {
                     errorMessage = 'I had a problem understanding that. Could you please rephrase your request?';
                } else if (message.includes('503') || message.includes('fetch failed')) {
                    errorMessage = 'I am having trouble connecting to my services right now. Please try again in a moment.';
                }
            }
            setMessages(prev => [...prev, { sender: 'bot', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            submitMessage(inputText);
            setInputText('');
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="fixed bottom-5 right-5 bg-orange-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 transition-colors z-50"
                aria-label="Open chatbot"
            >
                <ChatbotIcon />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-5 right-5 ${isExpanded && isLoggedIn ? 'w-[40rem] h-[80vh]' : 'w-80 sm:w-96 h-[32rem]'} bg-white rounded-lg shadow-2xl flex flex-col z-50 font-sans transition-all duration-300`} role="dialog" aria-modal="true" aria-labelledby="chatbot-title">
            {/* Header */}
            <div className="bg-[#00529B] text-white p-4 flex justify-between items-center rounded-t-lg">
                <h3 id="chatbot-title" className="font-bold text-lg">ENA</h3>
                <div className="flex items-center space-x-3">
                    {isLoggedIn && (
                        <>
                            <button onClick={onNewChat} aria-label="Start new chat" className="text-white hover:text-gray-200">
                                <NewChatIcon />
                            </button>
                            <button onClick={() => setIsExpanded(!isExpanded)} aria-label={isExpanded ? "Collapse chatbot" : "Expand chatbot"} className="text-white hover:text-gray-200">
                                {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                            </button>
                        </>
                    )}
                    <button onClick={onToggle} aria-label="Close chatbot" className="text-white hover:text-gray-200">
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg shadow-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                            {msg.sender === 'bot' ? (
                                <MessageContent text={msg.text} />
                            ) : (
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            )}
                        </div>
                        {msg.sender === 'bot' && (
                             <button onClick={() => speakText(msg.text)} aria-label="Read message aloud" className="ml-2 p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-100">
                                <SpeakerIcon />
                             </button>
                        )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-end justify-start">
                        <div className="max-w-[80%] px-4 py-3 rounded-lg shadow-sm bg-white text-gray-800 rounded-bl-none">
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-2 bg-white rounded-b-lg">
                <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Ask a question..."}
                        className="flex-1 w-full px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        disabled={isLoading || isListening}
                        aria-label="Chat input"
                    />
                     {voiceSupported && (
                        <button
                            type="button"
                            onClick={toggleListening}
                            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                            aria-label={isListening ? "Stop listening" : "Start voice input"}
                            disabled={isLoading}
                        >
                            <MicrophoneIcon isListening={isListening} />
                        </button>
                    )}
                    <button
                        type="submit"
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-300"
                        aria-label="Send message"
                        disabled={isLoading || !inputText.trim()}
                    >
                        <SendIcon />
                    </button>
                </form>
                {!voiceSupported && <p className="text-xs text-center text-gray-500 mt-2">Voice input is not supported by your browser.</p>}
            </div>
        </div>
    );
};


const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <button
            onClick={scrollToTop}
            className={`${isVisible ? 'opacity-100' : 'opacity-0'} fixed bottom-24 right-5 bg-orange-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-opacity duration-300 z-50`}
            aria-label="Go to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
        </button>
    );
};

// --- Main Application ---
const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [currentPage, setCurrentPage] = useState('home'); // 'home', 'login', 'mortgage', 'investments', or post-login pages
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [financialData, setFinancialData] = useState({
        income: 5500,
        expenses: 3200,
        currentDeposits: 25000,
        investments: 75000,
        borrowings: 8000,
        insurances: 'Auto Insurance, Health Insurance',
    });
    const [messages, setMessages] = useState([
        { sender: 'bot', text: "Hello! I'm ENA, your PNC Assistant. Ask a question or tap the microphone to speak." }
    ]);
    const chatRef = useRef<Chat | null>(null);
    const [insightsSummary, setInsightsSummary] = useState('');
    
    useEffect(() => {
        // Persist messages for the logged-in user to localStorage
        if (isLoggedIn && username) {
            const userKey = `chatHistory_${username.toLowerCase()}`;
            localStorage.setItem(userKey, JSON.stringify(messages));
        }
    }, [messages, isLoggedIn, username]);

    const handleLogin = async (name: string) => {
        return new Promise<void>((resolve) => {
            setUsername(name);
            setIsLoggedIn(true);
            setCurrentPage('accounts');
            // Reset chat for logged-in experience
            chatRef.current = null; 
            
            const userKey = `chatHistory_${name.toLowerCase()}`;
            const storedMessages = localStorage.getItem(userKey);
            
            if (storedMessages) {
                const parsedMessages = JSON.parse(storedMessages);
                const lastUserMessage = parsedMessages.filter(m => m.sender === 'user').pop();
                
                if (lastUserMessage) {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const model = 'gemini-2.5-flash';
                    const prompt = `Based on the user's financial data:
                    - Income: ${formatCurrency(financialData.income)}
                    - Expenses: ${formatCurrency(financialData.expenses)}
                    - Deposits: ${formatCurrency(financialData.currentDeposits)}
                    - Investments: ${formatCurrency(financialData.investments)}
                    - Borrowings: ${formatCurrency(financialData.borrowings)}
                    ...and their last conversation point about "${lastUserMessage.text}", generate a one-sentence insight or a follow-up question that ENA could present upon login. Phrase it as a suggestion. For example: 'I was just reviewing your conversation and had a thought about [topic]. Would you like to take a look?' or 'Last time we spoke about [topic]. Are you interested in exploring that further?'`;

                    ai.models.generateContent({model, contents: prompt}).then(response => {
                        const insight = response.text;
                        setInsightsSummary(insight);
                         setMessages([
                            { sender: 'bot', text: `Welcome back, ${name}! It looks like you have new insights waiting for you. ${insight}` }
                        ]);
                    });
                } else {
                     setMessages(JSON.parse(storedMessages));
                }

            } else {
                 setMessages([
                    { sender: 'bot', text: `Hello ${name}, I'm ENA, your PNC Assistant. Now that you're logged in, I can provide an analysis of your financial snapshot or answer specific questions about your finances.` }
                ]);
            }
            resolve();
        });
    };
    
    const handleNewChat = (forceLogout = false) => {
        chatRef.current = null;
        setInsightsSummary('');
        const loggedInState = !forceLogout && isLoggedIn;
        const initialMessage = loggedInState 
            ? { sender: 'bot', text: `Hello ${username}, how can I help you with your finances today?` }
            : { sender: 'bot', text: "Hello! I'm ENA, your PNC Assistant. Ask a question or tap the microphone to speak." };
        setMessages([initialMessage]);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUsername('');
        setCurrentPage('home');
        // Reset chat for logged-out experience
        handleNewChat(true);
    };
    
    const navigate = (page: string) => {
        if (page === 'login') {
            setIsChatbotOpen(false); // Close chatbot when navigating to login
        }
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    const [rateInputs, setRateInputs] = useState({
        homeValue: '400000',
        downPayment: '80000',
        percentage: '20',
        loanAmount: '320000',
        creditScore: '740+',
        zipCode: '15222',
    });
    const [currentRates, setCurrentRates] = useState(null);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        let newInputs = { ...rateInputs, [name]: value };
    
        if(name === 'homeValue' || name === 'downPayment') {
            const homeValue = parseFloat(newInputs.homeValue.replace(/[^0-9.-]+/g,"")) || 0;
            const downPayment = parseFloat(newInputs.downPayment.replace(/[^0-9.-]+/g,"")) || 0;
            
            if (homeValue > 0) {
                const percentage = ((downPayment / homeValue) * 100).toFixed(0);
                if (!isNaN(percentage as any)) {
                    newInputs.percentage = percentage;
                }
            }
            const loanAmount = homeValue - downPayment;
            newInputs.loanAmount = loanAmount > 0 ? loanAmount.toString() : '0';
        }
        
        const formattedInputs = {...newInputs};
        if(name === 'homeValue' || name === 'downPayment') {
            const numericValue = parseFloat(value.replace(/[^0-9.-]+/g,""));
            if(!isNaN(numericValue)){
                 formattedInputs[name] = formatCurrency(numericValue);
            }
        }
        
        setRateInputs(formattedInputs);
    };
    
    const getRates = () => {
        const creditScore = rateInputs.creditScore;
        let baseRate = 6.875; // Base rate for 740+ credit score
        if (creditScore.startsWith('720')) baseRate += 0.125;
        if (creditScore.startsWith('700')) baseRate += 0.250;
        if (creditScore.startsWith('680')) baseRate += 0.375;
        if (creditScore.startsWith('660')) baseRate += 0.500;
        if (creditScore.startsWith('640')) baseRate += 0.750;
        if (creditScore.startsWith('620')) baseRate += 1.000;

        const loanAmount = parseFloat(rateInputs.loanAmount) || 0;
        const calculateMonthlyPayment = (rate) => {
             const monthlyRate = rate / 100 / 12;
             const termInMonths = 30 * 12;
             return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termInMonths));
        };

        const fixed30 = {
            name: '30-Year Fixed',
            interestRate: baseRate.toFixed(3),
            apr: (baseRate + 0.152).toFixed(3),
            monthlyPayment: calculateMonthlyPayment(baseRate)
        };
        const fixed15 = {
            name: '15-Year Fixed',
            interestRate: (baseRate - 0.750).toFixed(3),
            apr: (baseRate - 0.750 + 0.215).toFixed(3),
            monthlyPayment: calculateMonthlyPayment(baseRate - 0.750)
        };
        setCurrentRates([fixed30, fixed15]);
    };
    
    const fillRateForm = (formData) => {
        const { homeValue, downPayment, creditScore, zipCode } = formData;
        
        const loanAmount = homeValue - downPayment;
        const percentage = ((downPayment / homeValue) * 100).toFixed(0);

        const newInputs = {
            homeValue: formatCurrency(homeValue),
            downPayment: formatCurrency(downPayment),
            percentage: percentage,
            loanAmount: loanAmount.toString(),
            creditScore: creditScore,
            zipCode: zipCode,
        };
        setRateInputs(newInputs);
        
        // Use a timeout to ensure state update has rendered before calculating
        setTimeout(() => {
            getRates(); // Calculate rates based on the new inputs
        }, 100);

        // Return calculated rates for chatbot summary
        let baseRate = 6.875; // Base rate for 740+ credit score
        if (creditScore.startsWith('720')) baseRate += 0.125;
        if (creditScore.startsWith('700')) baseRate += 0.250;
        if (creditScore.startsWith('680')) baseRate += 0.375;
        if (creditScore.startsWith('660')) baseRate += 0.500;
        if (creditScore.startsWith('640')) baseRate += 0.750;
        if (creditScore.startsWith('620')) baseRate += 1.000;

        const calculateMonthlyPayment = (rate) => {
             const monthlyRate = rate / 100 / 12;
             const termInMonths = 30 * 12;
             return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termInMonths));
        };
        return [
            { name: '30-Year Fixed', interestRate: baseRate.toFixed(3), monthlyPayment: calculateMonthlyPayment(baseRate) },
            { name: '15-Year Fixed', interestRate: (baseRate - 0.750).toFixed(3), monthlyPayment: calculateMonthlyPayment(baseRate - 0.750) }
        ];
    };
    
    const renderPage = () => {
        switch (currentPage) {
            case 'home': return <HomePage />;
            case 'login': return <LoginPage onLogin={handleLogin} onNavigate={navigate}/>;
            case 'mortgage': return <HomeLendingPage rateInputs={rateInputs} onInputChange={handleInputChange} onGetRates={getRates} currentRates={currentRates} />;
            case 'investments': return <InvestmentsPage />;
            case 'accounts': return <AccountsPage username={username} />;
            case 'financial-advisor': return <FinancialAdvisorPage financialData={financialData} setFinancialData={setFinancialData} />;
            default: return <HomePage />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen font-sans">
            {isLoggedIn ?
                <LoggedInHeader onNavigate={navigate} username={username} onLogout={handleLogout} currentPage={currentPage} /> :
                <Header onNavigate={navigate} onSignInClick={() => navigate('login')} />
            }
            <main className="flex-grow">
                {renderPage()}
            </main>
            <Chatbot 
                isOpen={isChatbotOpen} 
                onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
                onNavigate={navigate}
                currentPage={currentPage}
                onFillRateForm={fillRateForm}
                isLoggedIn={isLoggedIn}
                financialData={financialData}
                messages={messages}
                setMessages={setMessages}
                chatRef={chatRef}
                onNewChat={handleNewChat}
                insightsSummary={insightsSummary}
            />
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);