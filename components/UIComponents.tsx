import React from 'react';
import { Activity, Calendar, Users, FileText, CreditCard, Network, Send, User } from 'lucide-react';
import { AgentType, ChatMessage } from '../types';
import { AGENTS } from '../constants';

// --- Icons ---
export const AgentIcon = ({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
  switch (name) {
    case 'Users': return <Users className={className} />;
    case 'Calendar': return <Calendar className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'CreditCard': return <CreditCard className={className} />;
    case 'Network': return <Network className={className} />;
    default: return <Activity className={className} />;
  }
};

// --- Agent Badge (Sidebar) ---
interface AgentBadgeProps {
  agentType: AgentType;
  isActive: boolean;
}

export const AgentBadge: React.FC<AgentBadgeProps> = ({ agentType, isActive }) => {
  const agent = AGENTS[agentType];
  return (
    <div className={`flex items-center p-3 rounded-lg mb-2 transition-all duration-300 border ${isActive ? `${agent.bgColor} ${agent.borderColor} shadow-md` : 'bg-white border-transparent hover:bg-gray-50'}`}>
      <div className={`p-2 rounded-full mr-3 text-white ${agent.color}`}>
        <AgentIcon name={agent.iconName} />
      </div>
      <div>
        <h4 className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{agent.name}</h4>
        <p className="text-xs text-gray-400">{agent.role}</p>
      </div>
      {isActive && (
        <div className="ml-auto">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${agent.color}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${agent.color}`}></span>
          </span>
        </div>
      )}
    </div>
  );
};

// --- Message Bubble ---
interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const agent = message.agent ? AGENTS[message.agent] : AGENTS[AgentType.ORCHESTRATOR];

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`flex-shrink-0 mr-3 mt-1 h-8 w-8 rounded-full flex items-center justify-center text-white ${agent.color}`}>
          <AgentIcon name={agent.iconName} className="w-4 h-4" />
        </div>
      )}
      
      <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
        isUser 
          ? 'bg-blue-600 text-white rounded-br-none' 
          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
      }`}>
        {!isUser && (
           <div className={`text-xs font-bold mb-1 uppercase tracking-wider ${agent.textColor}`}>
             {agent.name}
           </div>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div className={`text-[10px] mt-2 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 ml-3 mt-1 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

// --- Input Area ---
interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Bagaimana kami dapat membantu operasional rumah sakit hari ini?"
        className="w-full pl-6 pr-14 py-4 rounded-full bg-white border border-gray-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-gray-700 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};