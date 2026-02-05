"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? "http://localhost:8001"
        : "/api";

    useEffect(() => {
        const urlToken = searchParams.get("token");
        let token = urlToken || localStorage.getItem("token");

        if (urlToken) {
            localStorage.setItem("token", urlToken);
            window.history.replaceState({}, document.title, "/dashboard");
        }

        if (!token) {
            router.push("/");
            return;
        }

        fetch(`${backendUrl}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Unauthorized");
                return res.json();
            })
            .then((data) => {
                setUser(data);
                setLoading(false);
            })
            .catch(() => {
                localStorage.removeItem("token");
                router.push("/");
            });
    }, [router, searchParams, backendUrl]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col p-6 bg-gray-900 text-white">
            <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <h1 className="text-xl font-bold">Gmail AI Assistant</h1>
                <div className="flex items-center gap-4">
                    <img
                        src={user.picture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-gray-700"
                    />
                    <div className="text-sm">
                        <p className="font-semibold">{user.name}</p>
                        <button
                            onClick={() => {
                                localStorage.removeItem("token");
                                router.push("/");
                            }}
                            className="text-gray-400 hover:text-white"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <section className="flex-1 flex flex-col items-center justify-center">
                <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 max-w-2xl w-full text-center">
                    <h2 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h2>
                    <p className="text-gray-400 mb-6">
                        I am your AI assistant. I can help you read, summarize, and reply to your emails.
                    </p>

                    <div className="mt-8 border-t border-gray-700 pt-8 w-full h-[600px]">
                        <ChatInterface token={localStorage.getItem("token") || ""} />
                    </div>
                </div>
            </section>
        </main>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                <p>Loading...</p>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
