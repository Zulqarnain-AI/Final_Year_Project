import React, { useState, useEffect, useRef } from "react";
import { CHATBOT_API_URL } from "../../constant.js"; 

const starterPrompts = [
  "Can you tell me about my diagnosis report?",
  "What should I care about now?",
  "Which symptoms are warning signs?",
  "Give me a daily lung care routine"
];

const createMessage = (type, text) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  text,
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
});

function Chatbot() {
  const [question, setQuestion] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);
  
  const [chatHistory, setChatHistory] = useState([
    createMessage(
      "ai",
      "Hello, I am BreatheWell, your lung health care assistant. I can explain your diagnosis report, help with symptom care, and guide you on what to monitor day by day."
    )
  ]); 
  
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
  
  // Helper component to render a single message bubble
  const ChatMessage = ({ type, text, time }) => {
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
                        : 'bg-slate-700/90 rounded-tl-sm text-slate-100 text-left border border-slate-500/40'
                  }`}
                  style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} 
              >
                  <p>{text}</p>
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
    
    // 1. Add user message and set loading state
    setChatHistory(prev => [
      ...prev, 
      createMessage("user", userQuery)
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
          chat_history: payloadHistory
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
      
      // 3. Extract AI response
      const aiResponseText = responseData.response || "Sorry, I received an empty response. Please try again.";
      
      // 4. Add AI message to the chat history
      setChatHistory(prev => [
        ...prev, 
        createMessage("ai", aiResponseText)
      ]);

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
      
      setChatHistory(prev => [
        ...prev, 
        createMessage("ai", errorMessage)
      ]);
      setError(errorMessage);

    } finally {
      // 5. Always stop loading
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="grid grid-cols-1 lg:grid-cols-5 h-[calc(100vh-120px)] min-h-0 rounded-3xl overflow-hidden border border-cyan-100/70 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white shadow-2xl">
        <div className="lg:col-span-2 xl:col-span-1 bg-slate-900/80 p-5 border-b lg:border-b-0 lg:border-r border-slate-600/40 overflow-y-auto">
          <h1 className="text-2xl font-bold tracking-tight">BreatheCare</h1>
          <p className="mt-2 text-sm text-slate-300">Respiratory Care Assistant</p>

          <div className="mt-6">
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
          </div>

          <button
            onClick={clearChat}
            className="mt-6 w-full rounded-xl bg-cyan-500/80 hover:bg-cyan-400 text-slate-950 font-semibold py-2 transition-colors"
          >
            Start New Chat
          </button>

          <div className="mt-6 text-xs text-slate-400 leading-relaxed">
            Ask about diagnosis reports, symptoms, breathing care, and warning signs. Unrelated domains are intentionally blocked.
          </div>
          {error && <div className="mt-4 p-2 bg-red-900 rounded text-xs text-red-100">{error}</div>}
        </div>

        <div className="lg:col-span-3 xl:col-span-4 flex flex-col min-h-0 p-4 md:p-6"> 
          
          {/* Chat Container */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 p-2 md:p-4">
            {chatHistory.map((msg, index) => (
              <ChatMessage key={msg.id || index} type={msg.type} text={msg.text} time={msg.time} />
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