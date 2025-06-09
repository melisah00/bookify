import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! 👋 How can I help you today?", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(''); // ← Add this line
  const messagesEndRef = useRef(null);

  // Generate session ID on component mount
  useEffect(() => {
    const generateSessionId = () => {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    setSessionId(generateSessionId());
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user"
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    const currentInput = inputValue; // Store before clearing
    setInputValue("");
    setIsTyping(true);

    try {
      // Try API call first (when backend is ready)
      const response = await fetch('http://localhost:8000/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentInput,
          session_id: sessionId,
          user_context: {
            is_logged_in: false,
            current_page: 'landing'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const newBotMessage = {
          id: messages.length + 2,
          text: data.text,
          sender: "bot",
          sources: data.sources,
          confidence: data.confidence
        };

        setMessages(prevMessages => [...prevMessages, newBotMessage]);
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.log('Using fallback responses (backend not ready)');
      
      // Fallback to local responses (current logic)
      setTimeout(() => {
        let botResponse = "";
        const userInput = currentInput.toLowerCase();

        if (userInput.includes("hello") || userInput.includes("hi")) {
          botResponse = "Hello! How can I assist you with Bookify today?";
        } else if (userInput.includes("help")) {
          botResponse = "I'm here to help! I can assist you with book searches, account questions, or general information about Bookify.";
        } else if (userInput.includes("book") || userInput.includes("search")) {
          botResponse = "Great! You can search for books by title, author, or genre. Once you create an account, you'll have access to our vast collection of books and reviews.";
        } else if (userInput.includes("account") || userInput.includes("register") || userInput.includes("sign up")) {
          botResponse = "To create an account, click the 'Sign Up' button in the top right corner. You'll be able to add books, write reviews, and connect with other book lovers!";
        } else if (userInput.includes("review") || userInput.includes("rating")) {
          botResponse = "Reviews are a great way to share your thoughts about books! After reading, you can rate books and leave detailed reviews to help other readers.";
        } else if (userInput.includes("contact") || userInput.includes("support")) {
          botResponse = "For additional support, you can email us at support@bookify.com or use the contact form in your account dashboard.";
        } else if (userInput.includes("thank") || userInput.includes("thanks")) {
          botResponse = "You're welcome! Is there anything else I can help you with regarding Bookify?";
        } else {
          botResponse = "I'd be happy to help! Could you tell me more about what you're looking for? I can assist with book searches, account setup, or general questions about Bookify.";
        }

        const newBotMessage = {
          id: messages.length + 2,
          text: botResponse,
          sender: "bot"
        };

        setMessages(prevMessages => [...prevMessages, newBotMessage]);
      }, 1500);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat bubble button */}
      <div className="chat-bubble" onClick={toggleChat}>
        <svg className="chat-bubble-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isOpen ? (
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          ) : (
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
          )}
        </svg>
      </div>

      {/* Chat container */}
      <div className={`chat-container ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div>
            <h3 className="header-title">Bookify Support</h3>
            <p className="header-subtitle">We typically reply within minutes</p>
          </div>
          <svg className="close-icon" onClick={toggleChat} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'}`}
            >
              {message.text}
            </div>
          ))}

          {isTyping && (
            <div className="message bot-message typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button className="send-button" onClick={handleSendMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatBot;