'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Menu, Send, Plus, Trash2 } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { streamMessage, ChatMessage, Chat } from '../actions/stream-message';
import { readStreamableValue } from 'ai/rsc';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingMessageRef = useRef<ChatMessage | null>(null);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [inputStates, setInputStates] = useState<{ [key: string]: string }>({});
  const [currentInput, setCurrentInput] = useState('');
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const buttonClasses = "p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white";

  useEffect(() => {
    setMounted(true);
    const storedChats = localStorage.getItem('chats');
    if (storedChats) {
      setChats(JSON.parse(storedChats));
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name: `Chat ${chats.length + 1}`,
      messages: []
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
    setCurrentChat(newChat);
    setMessages([]); // Clear messages for new chat
    setCurrentInput('');
  };

  const handleSubmit = async () => {
    if (currentInput.trim() && currentChatId) {
      const newUserMessage: ChatMessage = {
        id: Date.now(),
        role: 'user',
        content: currentInput.trim(),
      };

      // Update chat title if it's the first message
      const updatedChats = chats.map(chat => {
        if (chat.id === currentChatId && chat.messages.length === 0) {
          const firstWord = currentInput.trim().split(' ')[0];
          return { ...chat, name: firstWord, messages: [newUserMessage] };
        }
        if (chat.id === currentChatId) {
          return { ...chat, messages: [...chat.messages, newUserMessage] };
        }
        return chat;
      });

      setChats(updatedChats);
      setCurrentChat(updatedChats.find(chat => chat.id === currentChatId) || null);

      // Update messages state
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);

      // Update chats state
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            return { ...chat, messages: [...chat.messages, newUserMessage] };
          }
          return chat;
        });
      });

      const { output } = await streamMessage([...messages, newUserMessage]);

      let fullResponse = '';
      for await (const delta of readStreamableValue(output)) {
        fullResponse += delta;
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = fullResponse;
          } else {
            updatedMessages.push({
              id: Date.now(),
              role: 'assistant',
              content: fullResponse,
            });
          }
          return updatedMessages;
        });
      }

      // After getting the full response, update the chats state again
      const newAssistantMessage: ChatMessage = {
        id: Date.now(),
        role: 'assistant',
        content: fullResponse,
      };

      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            return { ...chat, messages: [...chat.messages, newAssistantMessage] };
          }
          return chat;
        });
      });

      setCurrentInput('');
      setInputStates(prev => ({...prev, [currentChatId]: ''}));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const deleteChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setCurrentChat(null);
      setMessages([]);
    }
    setChatToDelete(null);
  };

  if (!mounted) return null;

  return (
    <div className="flex bg-gray-900 min-h-screen relative overflow-hidden">
      <div className={`w-[300px] bg-gray-800 p-4 transition-transform duration-300 ease-in-out absolute top-0 left-0 h-full ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex justify-end items-center mb-4">
          <button
            onClick={createNewChat}
            className={buttonClasses}
          >
            <Plus size={24} />
          </button>
        </div>
        {[...chats].reverse().map((chat) => (
          <div
            key={chat.id}
            className="flex items-center justify-between p-2 rounded cursor-pointer text-white hover:bg-gray-700 group"
          >
            <div
              className={`flex-grow ${chat.id === currentChatId ? 'font-bold' : ''}`}
              onClick={() => {
                if (currentChatId) {
                  setInputStates(prev => ({...prev, [currentChatId]: currentInput}));
                }
                setCurrentChatId(chat.id);
                setCurrentChat(chat);
                setMessages(chat.messages); // Set messages to the selected chat's messages
                setCurrentInput(inputStates[chat.id] || '');
              }}
            >
              {chat.name}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatToDelete(chat.id);
                  }}
                  className="p-1 hover:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the chat.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setChatToDelete(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => chatToDelete && deleteChat(chatToDelete)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`${buttonClasses} fixed top-4 left-4 z-10`}
      >
        <Menu size={24} />
      </button>
      <div className={`flex-1 flex justify-center transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'ml-[300px]' : 'ml-16'
      }`}>
        <div className="w-full max-w-[800px] p-4 flex flex-col h-screen">
          <h1 className="text-2xl font-bold text-white mb-4">
            {currentChat ? currentChat.name : 'Chat'}
          </h1>
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`mb-4 ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-2 rounded-lg ${
                    msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
                  } whitespace-pre-wrap break-words min-h-[2.5rem] min-w-[2.5rem]`}
                >
                  {msg.content}
                  {isStreaming && index === messages.length - 1 && msg.role === 'assistant' && (
                    <span className="animate-pulse">▋</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="relative mt-4">
            <TextareaAutosize
              className="w-full bg-gray-800 text-white rounded-lg p-3 pr-12 resize-none"
              minRows={1}
              maxRows={5}
              placeholder="Type your message..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className={`${buttonClasses} absolute right-2 bottom-2`}
              onClick={handleSubmit}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
