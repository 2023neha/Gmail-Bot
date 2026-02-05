"use client";

import Link from "next/link";

export default function Home() {
    const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? "http://localhost:8001"
        : ""; // Use relative path in production

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-700 bg-gradient-to-b from-zinc-800 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-800 lg:p-4">
                    Gmail AI Assistant
                </p>
            </div>

            <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-to-br before:from-transparent before:to-blue-700 before:opacity-10 before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-to-t after:from-sky-900 after:via-[#0141ff] after:opacity-40 after:blur-2xl after:content-[''] before:lg:h-[360px]">
                <div className="flex flex-col items-center gap-6 z-10">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-center">
                        Your Inbox, <span className="text-blue-500">Supercharged</span>
                    </h1>
                    <p className="text-lg leading-8 text-gray-400 text-center max-w-xl">
                        Read, reply, and manage your emails with the power of AI.
                        Connect your Gmail account to get started.
                    </p>

                    <div className="mt-8 flex items-center justify-center gap-x-6">
                        <Link
                            href={`${backendUrl}/auth/login`}
                            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
                        >
                            Sign in with Google
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
