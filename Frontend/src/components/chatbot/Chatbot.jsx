import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { API_BASE_URL, CHATBOT_API_URL } from "../../constant.js";

const starterPrompts = [
  "Can you tell me about my diagnosis report?",
  "What should I care about now?",
  "Which symptoms are warning signs?",
  "Give me a daily lung care routine"
];

const CHATBOT_CONVERSATIONS_URL = `${API_BASE_URL}/chatbot/conversations`;

const markdownComponents = {
  h1: ({ ...props }) => <h1 className="text-lg font-bold mt-2 mb-1" {...props} />,
  h2: ({ ...props }) => <h2 className="text-base font-semibold mt-2 mb-1" {...props} />,
  h3: ({ ...props }) => <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />,
  p: ({ ...props }) => <p className="mb-1 leading-snug last:mb-0" {...props} />,
  ul: ({ ...props }) => <ul className="list-disc ml-5 mb-1 space-y-0.5" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal ml-5 mb-1 space-y-0.5" {...props} />,
  li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
  table: ({ ...props }) => <table className="w-full border-collapse text-xs md:text-sm my-2" {...props} />,
  thead: ({ ...props }) => <thead className="bg-slate-800/70" {...props} />,
  th: ({ ...props }) => <th className="border border-slate-500/40 px-2 py-1 text-left" {...props} />,
  td: ({ ...props }) => <td className="border border-slate-500/40 px-2 py-1 align-top" {...props} />,
  hr: ({ ...props }) => <hr className="border-slate-500/40 my-2" {...props} />,
  code: ({ inline, ...props }) =>
    inline ? (
      <code className="bg-slate-800 px-1 rounded text-cyan-200" {...props} />
    ) : (
      <code className="block bg-slate-900/90 p-2 rounded overflow-x-auto" {...props} />
    ),
};

const formatTimeLabel = (value) => {
  if (!value) {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const createMessage = (type, text) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  text,
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  isStreaming: false,
});

const normalizeAssistantText = (value) =>
  String(value || "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function Chatbot() {
  const [question, setQuestion] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const chatEndRef = useRef(null);
  const hasBootstrapped = useRef(false);
  
  const [chatHistory, setChatHistory] = useState([
    createMessage(
      "ai",
      "Hello, I am BreatheWell, your lung health care assistant. I can explain your diagnosis report, help with symptom care, and guide you on what to monitor day by day."
    )
  ]); 
  
  const fetchConversations = async (authToken, options = {}) => {
    const response = await fetch(CHATBOT_CONVERSATIONS_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Unable to fetch conversations (${response.status})`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.conversations) ? payload.conversations : [];
    setConversations(items);

    if (options.autoOpenLatest && items.length > 0 && !activeConversationId) {
      await loadConversation(items[0].id, authToken);
    }
  };

  const loadConversation = async (conversationId, authToken = token) => {
    if (!conversationId || !authToken) return;

    const response = await fetch(`${CHATBOT_CONVERSATIONS_URL}/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Unable to load conversation (${response.status})`);
    }

    const payload = await response.json();
    const conversation = payload?.conversation;
    const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];

    const mapped = messages.map((message) => ({
      id: message.id || `${message.role}-${Math.random().toString(36).slice(2, 8)}`,
      type: message.role === "assistant" ? "ai" : "user",
      text: message.role === "assistant" ? normalizeAssistantText(message.content) : String(message.content || ""),
      time: formatTimeLabel(message.created_at),
      isStreaming: false,
    }));

    setActiveConversationId(conversationId);
    setChatHistory(
      mapped.length > 0
        ? mapped
        : [
            createMessage(
              "ai",
              "Hello, I am BreatheWell, your lung health care assistant. Ask me about respiratory care and your diagnosis history."
            ),
          ]
    );
    setError("");
  };

  const streamAssistantText = (messageId, fullText) =>
    new Promise((resolve) => {
      const text = String(fullText || "");
      if (!text) {
        setChatHistory((prev) =>
          prev.map((message) => (message.id === messageId ? { ...message, text: "", isStreaming: false } : message))
        );
        resolve();
        return;
      }

      let index = 0;
      const chunkSize = Math.max(2, Math.ceil(text.length / 120));
      const timer = setInterval(() => {
        index = Math.min(text.length, index + chunkSize);
        const slice = text.slice(0, index);

        setChatHistory((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, text: slice, isStreaming: index < text.length } : message
          )
        );

        if (index >= text.length) {
          clearInterval(timer);
          resolve();
        }
      }, 18);
    });

  // Get auth token on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) {
      setToken(savedToken);
    } else {
      setError("Authentication token not found. Please login first.");
    }
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (!token || hasBootstrapped.current) return;

    hasBootstrapped.current = true;
    fetchConversations(token, { autoOpenLatest: true }).catch((err) => {
      setError(err.message || "Unable to load chat history");
    });
  }, [token]);
  
  // Helper component to render a single message bubble
  const ChatMessage = ({ type, text, time, isStreaming }) => {
      const isUser = type === 'user';
      return (
          <div className={`flex mb-5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="mr-3 mt-1 h-8 w-8 rounded-full bg-emerald-500/25 border border-emerald-300/30 text-emerald-100 flex items-center justify-center text-xs font-bold">
                  AI
                </div>
              )}
              <div 
                  className={`max-w-[85%] lg:max-w-2xl p-3 rounded-2xl shadow-lg text-sm md:text-base ${
                      isUser 
                        ? 'bg-cyan-500 rounded-br-sm text-slate-950' 
                        : 'bg-slate-700/90 rounded-tl-sm text-slate-100 text-left border border-slate-500/40 overflow-x-auto'
                  }`}
                  style={{ whiteSpace: isUser ? 'pre-wrap' : 'normal', wordWrap: 'break-word' }} 
              >
                  {isUser ? (
                    <p>{text}</p>
                  ) : (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {normalizeAssistantText(text)}
                      </ReactMarkdown>
                      {isStreaming && <span className="inline-block ml-1 w-2 h-4 bg-cyan-300 animate-pulse" />}
                    </div>
                  )}
                  <p className={`mt-1 text-[11px] ${isUser ? 'text-slate-800/80' : 'text-slate-300/70'}`}>
                    {time}
                  </p>
              </div>
              {isUser && (
                <div className="ml-3 mt-1 h-8 w-8 rounded-full bg-cyan-500/35 border border-cyan-300/40 text-slate-950 flex items-center justify-center text-xs font-bold">
                  You
                </div>
              )}
          </div>
      );
  };

  const addPromptToInput = (prompt) => {
    setQuestion(prompt);
  };

  const clearChat = () => {
    setActiveConversationId(null);
    setChatHistory([
      createMessage(
        "ai",
        "New chat started. Ask me about your diagnosis report, symptoms, breathing care, or warning signs."
      )
    ]);
    setError("");
  };

  const askQuestion = async () => {
    if (!question.trim() || isLoading) return;
    if (!token) {
      setError("Authentication required. Please login first.");
      return;
    }

    const userQuery = question;
    const payloadHistory = chatHistory.slice(-10).map((msg) => ({
      type: msg.type,
      text: msg.text
    }));

    const assistantMessageId = `ai-stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    // 1. Add user message and set loading state
    setChatHistory(prev => [
      ...prev, 
      createMessage("user", userQuery),
      {
        id: assistantMessageId,
        type: "ai",
        text: "",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isStreaming: true,
      },
    ]);
    setQuestion("");
    setIsLoading(true);
    setError("");

    try {
      // 2. Call backend chatbot endpoint
      let response = await fetch(CHATBOT_API_URL, {
        method: "POST",
        body: JSON.stringify({
          message: userQuery,
          include_context: true,
          chat_history: payloadHistory,
          conversation_id: activeConversationId,
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to get response from chatbot");
      }
      
      if (responseData.conversation_id) {
        setActiveConversationId(responseData.conversation_id);
      }

      // 3. Extract AI response
      const aiResponseText = normalizeAssistantText(responseData.response || "Sorry, I received an empty response. Please try again.");

      // 4. Stream AI response into the placeholder bubble
      await streamAssistantText(assistantMessageId, aiResponseText);

      // 5. Refresh sidebar conversations after successful save
      await fetchConversations(token);

    } catch (error) {
      console.error("Chatbot error:", error);
      
      // Determine appropriate error message
      let errorMessage = "Sorry, I encountered an error. ";
      
      if (error.message.includes("401") || error.message.includes("401")) {
        errorMessage += "Your session has expired. Please login again.";
      } else if (error.message.includes("403")) {
        errorMessage += "You don't have permission to use this feature.";
      } else if (error.message.includes("auth") || error.message.includes("Authentication")) {
        errorMessage += "Please ensure you're logged in.";
      } else {
        errorMessage += `Details: ${error.message}`;
      }
      
      setChatHistory((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? { ...message, text: errorMessage, isStreaming: false }
            : message
        )
      );
      setError(errorMessage);

    } finally {
      // 6. Always stop loading
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="grid grid-cols-1 lg:grid-cols-5 h-[calc(100vh-120px)] min-h-0 rounded-3xl overflow-hidden border border-cyan-100/70 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white shadow-2xl">
        <div className="lg:col-span-2 xl:col-span-1 bg-slate-900/80 p-5 border-b lg:border-b-0 lg:border-r border-slate-600/40 overflow-y-auto">
          <h1 className="text-2xl font-bold tracking-tight">BreatheCare</h1>
          {/* <p className="mt-2 text-sm text-slate-300">Respiratory Care Assistant</p> */}

          {/* <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-cyan-200/80 mb-2">Quick prompts</p>
            <div className="space-y-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => addPromptToInput(prompt)}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-cyan-800/60 border border-slate-500/30 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div> */}

          <button
            onClick={clearChat}
            className="mt-1 w-full rounded-xl bg-cyan-500/80 hover:bg-cyan-400 text-slate-950 font-semibold py-1 transition-colors"
          >
            Start New Chat
          </button>

          <div className="mt-2">
            <p className="text-xs uppercase tracking-wider text-cyan-200/80 mb-2">Recent chats</p>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {conversations.length === 0 && (
                <div className="text-xs text-slate-400">No saved conversations yet.</div>
              )}
              {conversations.map((conversation) => {
                const isActive = activeConversationId === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => loadConversation(conversation.id).catch((err) => setError(err.message || "Unable to open chat"))}
                    className={`w-full text-left px-2 py-1 rounded-xl border transition-colors ${
                      isActive
                        ? "bg-cyan-700/60 border-cyan-300/50"
                        : "bg-slate-800/80 border-slate-500/30 hover:bg-slate-700/80"
                    }`}
                  >
                    <p className="text-sm font-medium line-clamp-2">{conversation.title || "New Chat"}</p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {formatTimeLabel(conversation.updated_at)} • {conversation.message_count || 0} msgs
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-400 leading-relaxed">
            Ask about diagnosis reports, symptoms, breathing care, and warning signs. Unrelated domains are intentionally blocked.
          </div>
          {error && <div className="mt-4 p-2 bg-red-900 rounded text-xs text-red-100">{error}</div>}
        </div>

        <div className="lg:col-span-3 xl:col-span-4 flex flex-col min-h-0 p-4 md:p-6"> 
          
          {/* Chat Container */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 p-2 md:p-4">
            {chatHistory.map((msg, index) => (
              <ChatMessage
                key={msg.id || index}
                type={msg.type}
                text={msg.text}
                time={msg.time}
                isStreaming={msg.isStreaming}
              />
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-slate-700/90 p-3 rounded-xl rounded-tl-none text-white text-left border border-slate-500/30">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-300"></div>
                        <span className="text-slate-200">BreatheCare is thinking...</span>
                    </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          <div className="bg-slate-900/95 w-full p-2 text-white mx-auto flex items-center rounded-2xl border border-slate-500/40 mt-4 shadow-xl">
            <input
              className="bg-transparent w-full h-full rounded-2xl outline-none p-3 text-slate-100 placeholder:text-slate-400"
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => { 
                if (event.key === 'Enter' && !isLoading) {
                  askQuestion();
                }
              }}
              placeholder={isLoading ? "Please wait for the response..." : "Ask about your report, symptoms, or care plan..."}
              disabled={isLoading || !token}
            />
            <button 
              onClick={askQuestion} 
              className="px-5 py-2 bg-cyan-400 text-slate-950 font-semibold rounded-xl hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!question.trim() || isLoading || !token}
              title={!token ? "Please login first" : ""}
            >
              {isLoading ? 'Sending...' : 'Ask'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default Chatbot;