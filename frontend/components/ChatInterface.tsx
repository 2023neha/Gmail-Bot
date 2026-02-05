"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    type?: "text" | "email-list" | "draft" | "status";
    data?: any;
}

export default function ChatInterface({ token }: { token: string }) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I can check your emails, summarize them, or help you write replies. What would you like to do?", type: "text" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: "user", content: input, type: "text" };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const command = input.toLowerCase();

            if (command.includes("email") || command.includes("check") || command.includes("read")) {
                await fetchEmails();
            } else if (command.includes("reply") || command.includes("write")) {
                setMessages(prev => [...prev, { role: "assistant", content: "To reply, please click the 'Reply' button on a specific email card, or tell me which email to reply to.", type: "text" }]);
            } else if (command.includes("delete")) {
                setMessages(prev => [...prev, { role: "assistant", content: "To delete, please click the 'Delete' button on a specific email card.", type: "text" }]);
            } else {
                // Fallback for unknown commands
                setMessages(prev => [...prev, { role: "assistant", content: "I didn't quite catch that. Try saying 'Show my emails'.", type: "text" }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong processing your request.", type: "text" }]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmails = async () => {
        setMessages(prev => [...prev, { role: "assistant", content: "Fetching your recent emails...", type: "status" }]);
        try {
            const res = await axios.get("http://localhost:8001/api/recent", {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [
                ...prev.filter(m => m.type !== "status"),
                { role: "assistant", content: `Here are your last ${res.data.length} emails:`, type: "email-list", data: res.data }
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev.filter(m => m.type !== "status"),
                { role: "assistant", content: "Failed to fetch emails. Please try again.", type: "text" }
            ]);
        }
    };

    const handleGenerateReply = async (email: any) => {
        setMessages(prev => [...prev, { role: "assistant", content: `Drafting a reply to "${email.subject}"...`, type: "status" }]);
        try {
            const res = await axios.post("http://localhost:8001/api/generate-reply", {
                email_id: email.id,
                original_content: email.snippet + "\n" + (email.summary || ""),
                instructions: "positive professional"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [
                ...prev.filter(m => m.type !== "status"),
                {
                    role: "assistant",
                    content: "Here is a draft reply:",
                    type: "draft",
                    data: {
                        reply: res.data.reply,
                        email_id: email.id,
                        to: email.sender,
                        subject: `Re: ${email.subject}`,
                        threadId: email.threadId
                    }
                }
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev.filter(m => m.type !== "status"),
                { role: "assistant", content: "Failed to generate reply.", type: "text" }
            ]);
        }
    };

    const handleSendReply = async (draftData: any) => {
        setMessages(prev => [...prev, { role: "assistant", content: "Sending email...", type: "status" }]);
        try {
            await axios.post("http://localhost:8001/api/send", {
                to: draftData.to,
                subject: draftData.subject,
                body: draftData.reply,
                thread_id: draftData.threadId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [
                ...prev.filter(m => m.type !== "status"),
                { role: "assistant", content: "Reply sent successfully!", type: "text" }
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev.filter(m => m.type !== "status"),
                { role: "assistant", content: "Failed to send email.", type: "text" }
            ]);
        }
    };

    const handleDelete = async (emailId: string) => {
        if (!confirm("Are you sure you want to delete this email? This matches the 'trash' action.")) return;

        setMessages(prev => [...prev, { role: "assistant", content: "Deleting email...", type: "status" }]);
        try {
            await axios.delete(`http://localhost:8001/api/${emailId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(prev => [
                ...prev.filter(m => m.type !== "status"),
                { role: "assistant", content: "Email deleted (moved to trash).", type: "text" }
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev.filter(m => m.type !== "status"),
                { role: "assistant", content: "Failed to delete email.", type: "text" }
            ]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white rounded-xl overflow-hidden border border-gray-700 shadow-xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : msg.type === "status" ? "bg-gray-800 text-gray-400 italic" : "bg-gray-800 text-gray-200"
                            }`}>
                            {msg.type === "text" || msg.type === "status" ? (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : msg.type === "email-list" ? (
                                <div className="space-y-3">
                                    <p>{msg.content}</p>
                                    {msg.data.map((email: any) => (
                                        <div key={email.id} className="bg-gray-700 p-3 rounded border border-gray-600">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-white text-sm">{email.sender}</span>
                                                <span className="text-xs text-gray-400">{email.date}</span>
                                            </div>
                                            <p className="font-semibold text-blue-300 text-sm mb-1">{email.subject}</p>
                                            <p className="text-sm text-gray-300 mb-2 italic">"{email.summary || 'No summary available'}"</p>
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => handleGenerateReply(email)} className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded">Reply</button>
                                                <button onClick={() => handleDelete(email.id)} className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : msg.type === "draft" ? (
                                <div className="space-y-2">
                                    <p>{msg.content}</p>
                                    <div className="bg-gray-700 p-3 rounded font-mono text-sm whitespace-pre-wrap border border-gray-600">
                                        {msg.data.reply}
                                    </div>
                                    <button onClick={() => handleSendReply(msg.data)} className="w-full bg-green-600 hover:bg-green-500 py-2 rounded font-semibold text-sm">
                                        Confirm & Send
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask me to check emails..."
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={loading}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
