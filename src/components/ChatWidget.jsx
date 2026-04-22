'use client';
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// Generate or retrieve a unique user ID (SSR-safe)
function getUserId() {
  if (typeof window === 'undefined') return null; // Guard against SSR
  let userId = localStorage.getItem('chat_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem('chat_user_id', userId);
  }
  return userId;
}

// Example stickers (emoji-based for demo - replace with your images)
const STICKERS = [
  { id: 1, emoji: "❤️", name: "heart" },
  { id: 2, emoji: "👍", name: "thumbsup" },
  { id: 3, emoji: "😊", name: "smile" },
  { id: 4, emoji: "😂", name: "laugh" },
  { id: 5, emoji: "🎉", name: "party" },
  { id: 6, emoji: "🔥", name: "fire" },
  { id: 7, emoji: "💯", name: "hundred" },
  { id: 8, emoji: "👏", name: "clap" },
];

export default function ChatWidget({ isAdmin = false, selectedUserId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);

  // For attachments
  const [pendingFile, setPendingFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize user ID
  useEffect(() => {
    if (!isAdmin) {
      setUserId(getUserId());
    } else if (selectedUserId) {
      setUserId(selectedUserId);
    } else {
      // For admin, load list of users
      loadAvailableUsers();
    }
  }, [isAdmin, selectedUserId]);

  // Load available users for admin
  const loadAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("user_id, sender_name, message, created_at, is_admin, read, sticker")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading users:", error);
        return;
      }

      // Group by user_id and get latest message
      const usersMap = new Map();
      data.forEach(msg => {
        if (!usersMap.has(msg.user_id)) {
          const userMessages = data.filter(m => m.user_id === msg.user_id);
          const unread = userMessages.filter(m => !m.is_admin && !m.read).length;
          usersMap.set(msg.user_id, {
            userId: msg.user_id,
            senderName: msg.sender_name,
            lastMessage: msg.sticker || msg.message || '📎 Attachment',
            lastMessageTime: msg.created_at,
            unreadCount: unread
          });
        }
      });

      setAvailableUsers(Array.from(usersMap.values()));
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  // Load messages and subscribe to real-time
  useEffect(() => {
    if (!userId) return;

    loadMessages();

    if (!isAdmin) {
      const savedName = localStorage.getItem('chat_sender_name');
      const savedEmail = localStorage.getItem('chat_sender_email');
      if (savedName) setSenderName(savedName);
      if (savedEmail) setSenderEmail(savedEmail);
    }

    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new]);
            if (!isOpen && ((isAdmin && !payload.new.is_admin) || (!isAdmin && payload.new.is_admin))) {
              setUnreadCount((prev) => prev + 1);
            }
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isOpen, isAdmin, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Count unread messages
  useEffect(() => {
    if (isAdmin) {
      const unread = messages.filter((m) => !m.is_admin && !m.read).length;
      setUnreadCount(unread);
    }
  }, [messages, isAdmin]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }
      if (data) setMessages(data);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  // Handle file selection with preview
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setShowAttachMenu(false);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Send message with optional file or sticker
  const sendMessage = async () => {
    if (!newMessage.trim() && !pendingFile) return;

    // Guard: userId must exist before sending (can be null briefly on mobile during hydration)
    if (!userId) {
      const freshId = getUserId();
      if (!freshId) return;
      setUserId(freshId);
      // Small delay to let state update, then retry
      setTimeout(() => sendMessage(), 100);
      return;
    }

    if (!isAdmin && !senderName.trim() && messages.filter(m => !m.is_admin).length === 0) {
      alert("Please enter your name");
      return;
    }

    let fileUrl = null;

    // Upload file if selected
    if (pendingFile) {
      try {
        const fileName = `${userId}/${Date.now()}_${pendingFile.name}`;
        const { data, error } = await supabase.storage
          .from("chat-files")
          .upload(fileName, pendingFile);

        if (error) {
          console.error("File upload error:", error);
          alert("Failed to upload file: " + error.message);
          return;
        }
        fileUrl = fileName;
      } catch (err) {
        console.error("File upload exception:", err);
        alert("Failed to upload file");
        return;
      }
    }

    const messageData = {
      user_id: userId,
      message: newMessage.trim() || null,
      sticker: null,
      file: fileUrl,
      sender_name: isAdmin ? "Support Team" : senderName.trim(),
      sender_email: isAdmin ? null : (senderEmail.trim() || null),
      is_admin: isAdmin,
      read: false,
    };

    try {
      const { error } = await supabase.from("messages").insert([messageData]);

      if (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
        return;
      }

      setNewMessage("");
      setPendingFile(null);
      setFilePreview(null);
      setShowStickers(false);
      
      if (!isAdmin && senderName.trim()) {
        localStorage.setItem('chat_sender_name', senderName.trim());
        if (senderEmail.trim()) {
          localStorage.setItem('chat_sender_email', senderEmail.trim());
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  const sendSticker = async (sticker) => {
    if (!isAdmin && !senderName.trim() && messages.filter(m => !m.is_admin).length === 0) {
      alert("Please enter your name");
      return;
    }

    const messageData = {
      user_id: userId,
      message: null,
      sticker: sticker.emoji,
      file: null,
      sender_name: isAdmin ? "Support Team" : senderName.trim(),
      sender_email: isAdmin ? null : (senderEmail.trim() || null),
      is_admin: isAdmin,
      read: false,
    };

    try {
      const { error } = await supabase.from("messages").insert([messageData]);

      if (error) {
        console.error("Error sending sticker:", error);
        alert("Failed to send sticker: " + error.message);
        return;
      }

      setShowStickers(false);
      if (!isAdmin && senderName.trim()) {
        localStorage.setItem('chat_sender_name', senderName.trim());
        if (senderEmail.trim()) {
          localStorage.setItem('chat_sender_email', senderEmail.trim());
        }
      }
    } catch (err) {
      console.error("Error sending sticker:", err);
      alert("Failed to send sticker");
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);

    if (isAdmin) {
      if (!userId) {
        loadAvailableUsers();
        setShowUserList(true);
      } else {
        // Mark messages as read
        messages.filter(m => !m.is_admin && !m.read).forEach((msg) => {
          supabase.from("messages").update({ read: true }).eq("id", msg.id).then();
        });
      }
    }
  };

  const selectUser = (selectedUserId) => {
    setUserId(selectedUserId);
    setShowUserList(false);
    setMessages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    return supabase.storage.from("chat-files").getPublicUrl(filePath).data.publicUrl;
  };

  return (
    <>
      {/* Chat button — hidden when chat is open so it doesn't block the send button on mobile */}
      {!isOpen && (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-50"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {(isAdmin ? availableUsers.reduce((sum, u) => sum + u.unreadCount, 0) : unreadCount) > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {isAdmin ? availableUsers.reduce((sum, u) => sum + u.unreadCount, 0) : unreadCount}
          </span>
        )}
      </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-0 left-0 mx-3 sm:left-auto sm:mx-0 sm:right-6 sm:w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          
          {/* Show user list for admin */}
          {isAdmin && showUserList ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">Customer Chats</h3>
                  <p className="text-xs opacity-90">{availableUsers.length} conversations</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full p-2 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {availableUsers.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-sm">No customer chats yet</p>
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => selectUser(user.userId)}
                      className="w-full bg-white p-4 rounded-lg hover:shadow-lg transition border border-gray-200 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                            {user.senderName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.senderName || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{user.userId}</p>
                          </div>
                        </div>
                        {user.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {user.unreadCount}
                          </span>
                        )}
                      </div>
                      {user.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {user.lastMessage}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowUserList(true);
                        setUserId(null);
                        loadAvailableUsers();
                      }}
                      className="hover:bg-white/20 rounded-full p-2 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{isAdmin ? "Customer Chat" : "Support Chat"}</h3>
                    <p className="text-xs opacity-90">
                      {isAdmin && userId ? userId : "Online"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full p-2 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Name input (only for first message) */}
              {!isAdmin && messages.filter(m => !m.is_admin).length === 0 && (
                <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                  <input
  type="text"
  placeholder="Enter your name to start chatting..."
  value={senderName}
  onChange={(e) => setSenderName(e.target.value)}
  className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm
                           bg-white text-gray-900 placeholder:text-gray-500
                           focus:ring-2 focus:ring-green-500 focus:border-green-500
                           dark:bg-white dark:text-gray-900"
/>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d4d4' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Send a message to start the conversation!</p>
                  </div>
                ) : messages.map((msg) => {
                  const isMyMessage = isAdmin ? msg.is_admin : !msg.is_admin;
                  return (
                    <div key={msg.id} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg shadow-sm ${isMyMessage ? "bg-green-500 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}`}>
                        {!isMyMessage && (
                          <div className="px-3 pt-2 pb-1">
                            <p className="text-xs font-semibold text-green-600">{msg.sender_name}</p>
                          </div>
                        )}
                        
                        {/* Sticker */}
                        {msg.sticker && (
                          <div className="px-3 py-2">
                            <div className="text-6xl">{msg.sticker}</div>
                          </div>
                        )}
                        
                        {/* File attachment */}
                        {msg.file && (
                          <div className="px-3 py-2">
                            <a 
                              href={getFileUrl(msg.file)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2 p-3 rounded-lg ${isMyMessage ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-100 hover:bg-gray-200'} transition`}
                            >
                              <div className="text-2xl">📎</div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isMyMessage ? 'text-white' : 'text-gray-800'}`}>
                                  {msg.file.split('/').pop()}
                                </p>
                              </div>
                            </a>
                          </div>
                        )}
                        
                        {/* Text message */}
                        {msg.message && !msg.sticker && (
                          <div className="px-3 py-2">
                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <div className="px-3 pb-1">
                          <p className={`text-xs text-right ${isMyMessage ? "text-green-100" : "text-gray-400"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* File preview bar */}
              {pendingFile && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {filePreview ? (
                      <img src={filePreview} alt="preview" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="text-2xl">📎</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{pendingFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(pendingFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPendingFile(null);
                      setFilePreview(null);
                    }}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Sticker picker */}
              {showStickers && (
                <div className="px-4 py-3 bg-white border-t border-gray-200">
                  <div className="grid grid-cols-8 gap-2">
                    {STICKERS.map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => sendSticker(sticker)}
                        className="text-3xl hover:scale-125 transition-transform duration-200"
                        title={sticker.name}
                      >
                        {sticker.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <form onSubmit={handleFormSubmit} className="p-3 border-t border-gray-200 bg-white rounded-b-2xl">
                <div className="flex items-end gap-2">
                  {/* Attach button with menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    
                    {showAttachMenu && (
                      <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-40 z-10">
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowAttachMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <span>📎</span>
                          <span>Attach File</span>
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx,.txt"
                    />
                  </div>

                  {/* Text input */}
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                     className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg
                             text-gray-900 text-sm placeholder:text-gray-500
                             focus:ring-2 focus:ring-green-500 focus:border-green-500
                             dark:bg-white dark:text-gray-900 dark:border-gray-500"
             />

                  {/* Sticker button */}
                  <button
                    type="button"
                    onClick={() => setShowStickers(!showStickers)}
                    className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-xl">😊</span>
                  </button>

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!newMessage.trim() && !pendingFile}
                    className="bg-green-500 text-white p-2.5 rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}