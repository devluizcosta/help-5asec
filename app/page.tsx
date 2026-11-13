'use client';

import { Suspense, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Send, Bot, User, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { FormattedMessage } from './components/FormattedMessage';

const SUGGESTIONS = [
  'Como abrir o caixa no início do dia?',
  'Como cadastrar um novo cliente no Allegro?',
  'Qual o procedimento para estorno ou cancelamento?',
  'Como aplicar desconto em uma comanda?',
];

function ChatUI() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    setInput,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rolagem automática suave para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <main className="flex flex-col h-[100dvh] max-w-2xl mx-auto bg-white shadow-xl relative overflow-hidden font-sans">
      {/* 1. CABEÇALHO FIXO NO TOPO */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-900 text-white font-bold text-sm shadow-xs">
            5à
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              Suporte Allegro - 5àsec
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Pedro Leopoldo • Assistente de Caixa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </div>
      </header>

      {/* 2. ÁREA DE MENSAGENS ROLÁVEL */}
      <section className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {/* Estado Inicial sem Mensagens */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 px-2">
            <div className="p-3 bg-orange-100 rounded-2xl text-[#ff5e00] mb-3 shadow-xs">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Olá! Como posso ajudar você hoje?
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Tire dúvidas operacionais sobre o ERP Allegro.NET com base nos manuais internos da 5àsec.
            </p>

            <div className="w-full mt-6 space-y-2 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#ff5e00]" />
                Dúvidas frequentes no balcão:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    type="button"
                    className="w-full p-2.5 text-xs text-left bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:border-[#ff5e00] hover:text-[#ff5e00] hover:shadow-xs transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Mensagens */}
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  5à
                </div>
              )}

              <div
                className={`text-sm px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-[75%] break-words leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-[#ff5e00] text-white rounded-br-xs font-normal'
                    : 'bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-xs font-normal'
                }`}
              >
                <FormattedMessage content={message.content} isUser={isUser} />
              </div>

              {isUser && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-orange-100 text-[#ff5e00] flex items-center justify-center shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Indicador de Digitando / Carregando */}
        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="shrink-0 w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              5à
            </div>
            <div className="bg-gray-100 text-gray-600 border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-xs text-xs flex items-center gap-2">
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              </span>
              <span>Consultando manuais do Allegro...</span>
            </div>
          </div>
        )}

        {/* Alerta de Erro */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between text-red-700 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <span>
                Não foi possível obter resposta. Verifique a chave de API no arquivo <code>.env.local</code>.
              </span>
            </div>
            <button
              onClick={() => reload()}
              type="button"
              className="flex items-center gap-1 font-semibold text-red-700 hover:text-red-900 ml-2"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar novamente
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      {/* 3. FORMULÁRIO DE ENVIO FIXO NA PARTE INFERIOR */}
      <footer className="sticky bottom-0 z-20 bg-white border-t border-gray-200 p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Digite sua dúvida sobre o Allegro.NET..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5e00] focus:border-transparent transition-all placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center w-11 h-11 bg-[#ff5e00] hover:bg-[#e05300] active:scale-95 text-white rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#ff5e00] disabled:active:scale-100"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          5àsec Pedro Leopoldo • Respostas automáticas baseadas nos manuais Allegro.NET
        </p>
      </footer>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-50 text-gray-500 font-sans text-sm">
          <div className="w-8 h-8 border-4 border-[#ff5e00] border-t-transparent rounded-full animate-spin mb-3" />
          <span>Carregando assistente Allegro...</span>
        </div>
      }
    >
      <ChatUI />
    </Suspense>
  );
}
