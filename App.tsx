import React, { useState, useRef, useEffect } from 'react';
import { AgentType, ChatMessage } from './types';
import { routeUserIntent, generateAgentResponse } from './services/geminiService';
import { AgentBadge, MessageBubble, ChatInput } from './components/UIComponents';
import { Activity } from 'lucide-react';
import { AGENTS } from './constants';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init-1',
  role: 'model',
  content: "Selamat datang di MediCore AIS. Saya adalah Sang Orkestrator. Bagaimana saya dapat membantu Anda dengan operasional rumah sakit hari ini? Saya dapat mengarahkan Anda ke Manajemen Pasien, Penjadwalan, Rekam Medis, atau Penagihan.",
  agent: AgentType.ORCHESTRATOR,
  timestamp: new Date()
};

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.ORCHESTRATOR);
  const [orchestrationStatus, setOrchestrationStatus] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, orchestrationStatus]);

  const handleSendMessage = async (text: string) => {
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsProcessing(true);
    setOrchestrationStatus("Orkestrator sedang menganalisis permintaan...");
    setActiveAgent(AgentType.ORCHESTRATOR);

    try {
      // 1. Prepare history context for the API
      // Mapping internal ChatMessage to Gemini content structure
      const apiHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      // 2. Determine Intent (Orchestration Step)
      // We pass simple string history to the router for efficiency
      const historyStrings = messages.map(m => `${m.role === 'user' ? 'User' : 'System'}: ${m.content}`);
      const targetAgent = await routeUserIntent(text, historyStrings);
      
      setActiveAgent(targetAgent);
      
      // Update status based on routing
      if (targetAgent === AgentType.ORCHESTRATOR) {
        setOrchestrationStatus("Orkestrator meminta klarifikasi...");
      } else {
        setOrchestrationStatus(`Mengarahkan ke ${AGENTS[targetAgent].name}...`);
      }

      // Short artificial delay to make the UI feel like it's "switching" lines (UX best practice for agent handoffs)
      await new Promise(resolve => setTimeout(resolve, 800));
      setOrchestrationStatus("Menghasilkan respons...");

      // 3. Generate Response (Execution Step)
      // Pass the *updated* history including the user's latest message
      const responseText = await generateAgentResponse(
        targetAgent, 
        text, 
        [...apiHistory, { role: 'user', parts: [{ text: text }] }] 
      );

      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        agent: targetAgent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newAiMsg]);

    } catch (error) {
      console.error("App error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'model',
        content: "Maaf, kami mengalami kesalahan sistem internal. Silakan coba lagi.",
        agent: AgentType.ORCHESTRATOR,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      setOrchestrationStatus("");
      // Reset back to orchestrator "listening" mode visually after interaction
      // (Optional, but kept activeAgent as last speaker is often clearer)
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Sidebar - System Control Panel */}
      <aside className="w-80 bg-white border-r border-gray-200 hidden md:flex flex-col z-10">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">MediCore AIS</h1>
              <p className="text-xs text-gray-500 font-medium">Sistem Orkestrasi</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="mb-4 px-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Agen Aktif</h3>
            {Object.values(AgentType).map((type) => (
              <AgentBadge 
                key={type} 
                agentType={type} 
                isActive={activeAgent === type} 
              />
            ))}
          </div>
          
          <div className="px-4 py-4 mt-8 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-500">
            <p className="font-semibold mb-2">Status Sistem:</p>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Semua sistem beroperasi</span>
            </div>
            <div className="mt-2 text-[10px] text-gray-400">
              ID Sesi: {Date.now().toString().slice(-6)}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center space-x-2">
             <Activity className="w-5 h-5 text-blue-600" />
             <span className="font-bold text-gray-800">MediCore AIS</span>
          </div>
          <div className="text-xs font-medium text-blue-600 px-2 py-1 bg-blue-50 rounded-md">
            {AGENTS[activeAgent].name}
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 scrollbar-hide">
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            
            {/* Orchestration Status Indicator */}
            {isProcessing && (
              <div className="flex justify-start mb-6 animate-pulse">
                 <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">{orchestrationStatus}</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-gray-200 z-20">
          <div className="max-w-3xl mx-auto w-full">
            <ChatInput onSend={handleSendMessage} disabled={isProcessing} />
            <p className="text-center text-[10px] text-gray-400 mt-3">
              Konten dibuat oleh AI. Verifikasi detail medis dan keuangan penting dengan staf rumah sakit.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;