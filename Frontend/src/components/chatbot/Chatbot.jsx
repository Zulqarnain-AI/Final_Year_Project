import React, { useState } from "react";
// Assuming constant.js has a valid URL
import { URL } from "../../constant.js"; 

function Chatbot() {
  const [question, setQuestion] = useState(""); 
  const [isLoading, setIsLoading] = useState(false); // New state for loading indicator
  
  const [chatHistory, setChatHistory] = useState([
    { type: 'ai', text: "Hello! I am your health AI assistant. Ask me anything about fitness, nutrition, or general wellness." }
  ]); 
  
  // Helper component to render a single message bubble (kept from previous response)
  const ChatMessage = ({ type, text }) => {
      const isUser = type === 'user';
      return (
          <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div 
                  className={`max-w-xs lg:max-w-md p-3 rounded-xl shadow-lg text-sm md:text-base ${
                      isUser 
                        ? 'bg-blue-600 rounded-br-none text-white' 
                        : 'bg-zinc-700 rounded-tl-none text-white text-left'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }} 
              >
                  {text}
              </div>
          </div>
      );
  };

  const askquestion = async () => {
    if (!question.trim() || isLoading) return; 

    const userQuery = question;
    
    // 1. Add user message and set loading state
    setChatHistory(prev => [
      ...prev, 
      { type: 'user', text: userQuery }
    ]);
    setQuestion("");
    setIsLoading(true);

    // 2. Construct the API payload using the user's question
    const payload = {
      "contents": [
        {
          "parts": [
            {
              "text": userQuery 
            }
          ]
        }
      ]
    };

    try {
      let response = await fetch(URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(responseData);
      
      // 3. **CRITICAL DATA EXTRACTION:** // This path assumes a common structure for LLM APIs (like the Gemini API):
      // responseData.candidates[0].content.parts[0].text
      const aiResponseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text 
                             || "Sorry, I received an empty or malformed response from the server.";
      
      // 4. Add AI message to the chat history
      setChatHistory(prev => [
        ...prev, 
        { type: 'ai', text: aiResponseText }
      ]);

    } catch (error) {
      console.error("Error asking question:", error);
      // Display a user-friendly error message
      setChatHistory(prev => [
        ...prev, 
        { type: 'ai', text: `ERROR: Could not fetch response. Please check the URL or API key. Details: ${error.message}` }
      ]);

    } finally {
      // 5. Always stop loading regardless of success or failure
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="grid grid-cols-5 h-screen bg-black text-center text-white">
        <div className="col-span-1 bg-zinc-800 p-4 border-r border-zinc-700">
          <h1 className="text-xl font-bold mb-4">Chat History</h1>
          <div className="text-sm text-zinc-400">Past chats will appear here.</div>
        </div>

        <div className="col-span-4 flex flex-col justify-end p-4"> 
          
          {/* Chat Container */}
          <div className="container flex-grow overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, index) => (
              <ChatMessage key={index} type={msg.type} text={msg.text} />
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-zinc-700 p-3 rounded-xl rounded-tl-none text-white text-left">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>AI is thinking...</span>
                    </div>
                </div>
              </div>
            )}
            
            {/* Optional: Use a hidden element to scroll to the bottom */}
            <div id="scroll-to-bottom" ref={(el) => { 
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }} />
          </div>

          <div className="bg-zinc-800 w-full md:w-3/4 lg:w-1/2 pr-5 p-1 h-[56px] text-white mx-auto flex items-center rounded-3xl border border-zinc-400 mt-4">
            <input
              className="bg-zinc-800 w-full h-full rounded-3xl outline-none p-3"
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => { 
                if (event.key === 'Enter') {
                  askquestion();
                }
              }}
              placeholder={isLoading ? "Please wait for the response..." : "Ask me anything..."}
              disabled={isLoading}
            />
            <button 
              onClick={askquestion} 
              className="px-4 py-2 bg-blue-500 rounded-2xl hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={!question.trim() || isLoading} // Disable when empty or loading
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