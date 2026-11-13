'use client';

import React from 'react';

interface FormattedMessageProps {
  content: string;
  isUser?: boolean;
}

type Block =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: { num: string; text: string }[] }
  | { type: 'code-block'; code: string; lang?: string }
  | { type: 'quote'; text: string }
  | { type: 'divider' }
  | { type: 'spacer' };

/**
 * Renderiza a formatação inline (negrito, itálico, código inline, etc.)
 * Trata **palavra**, *palavra*, `código` e formatação parcial de streaming.
 */
function renderInline(text: string, isUser: boolean = false): React.ReactNode {
  if (!text) return null;

  // Regex para capturar:
  // 1. ***bold italic***
  // 2. **bold**
  // 3. __bold__
  // 4. `code`
  // 5. *italic*
  // 6. _italic_
  // 7. **bold sem fechar no fim da string (durante streaming)
  const TOKEN_REGEX = /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+?`|\*[^*]+?\*|_[^_]+?_|\*\*[^*]+$)/g;

  const parts = text.split(TOKEN_REGEX);

  return parts.map((part, index) => {
    if (!part) return null;

    // Negrito + Itálico (***texto***)
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      const inner = part.slice(3, -3);
      return (
        <strong
          key={index}
          className={`font-bold italic ${isUser ? 'text-white' : 'text-gray-950 font-bold'}`}
        >
          {inner}
        </strong>
      );
    }

    // Negrito (**texto**)
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={index}
          className={`font-semibold ${isUser ? 'text-white font-bold' : 'text-gray-950 font-bold'}`}
        >
          {inner}
        </strong>
      );
    }

    // Negrito alternativo (__texto__)
    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={index}
          className={`font-semibold ${isUser ? 'text-white font-bold' : 'text-gray-950 font-bold'}`}
        >
          {inner}
        </strong>
      );
    }

    // Negrito em streaming sem fechar no final da string (**texto...)
    if (part.startsWith('**') && !part.endsWith('**')) {
      const inner = part.slice(2);
      return (
        <strong
          key={index}
          className={`font-semibold ${isUser ? 'text-white font-bold' : 'text-gray-950 font-bold'}`}
        >
          {inner}
        </strong>
      );
    }

    // Código inline (`código`)
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className={`px-1.5 py-0.5 rounded text-[13px] font-mono ${
            isUser
              ? 'bg-black/20 text-white'
              : 'bg-gray-200/80 text-gray-800 border border-gray-300/60'
          }`}
        >
          {inner}
        </code>
      );
    }

    // Itálico (*texto*)
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic">
          {inner}
        </em>
      );
    }

    // Itálico alternativo (_texto_)
    if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic">
          {inner}
        </em>
      );
    }

    // Texto puro
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Converte linhas de texto em blocos estruturados de markdown.
 */
function parseBlocks(content: string): Block[] {
  const rawLines = content.split('\n');
  const blocks: Block[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Bloco de código com ```
    if (trimmed.startsWith('```')) {
      if (inCode) {
        blocks.push({
          type: 'code-block',
          code: codeBuffer.join('\n'),
          lang: codeLang,
        });
        codeBuffer = [];
        codeLang = '';
        inCode = false;
      } else {
        inCode = true;
        codeLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // 2. Linhas vazias / espaçamento
    if (trimmed === '') {
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type !== 'spacer') {
        blocks.push({ type: 'spacer' });
      }
      continue;
    }

    // 3. Divisores horizontais (--- ou ***)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'divider' });
      continue;
    }

    // 4. Cabeçalhos (#, ##, ###)
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: trimmed.slice(4) });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: trimmed.slice(3) });
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: trimmed.slice(2) });
      continue;
    }

    // 5. Citações (> citação)
    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.slice(2) });
      continue;
    }

    // 6. Lista com marcadores (- item ou * item)
    // Atenção: evita confundir com negrito inicial como **Texto**
    const bulletMatch = line.match(/^(\s*)([-*])\s+(.+)$/);
    if (bulletMatch && !line.trimStart().startsWith('**')) {
      const text = bulletMatch[3];
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type === 'bullet-list') {
        lastBlock.items.push(text);
      } else {
        blocks.push({ type: 'bullet-list', items: [text] });
      }
      continue;
    }

    // 7. Lista numerada (1. item ou 1) item)
    const numMatch = line.match(/^(\s*)(\d+)[\.\)]\s+(.+)$/);
    if (numMatch) {
      const num = numMatch[2];
      const text = numMatch[3];
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type === 'numbered-list') {
        lastBlock.items.push({ num, text });
      } else {
        blocks.push({ type: 'numbered-list', items: [{ num, text }] });
      }
      continue;
    }

    // 8. Parágrafo / texto padrão
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock && lastBlock.type === 'paragraph') {
      lastBlock.lines.push(line);
    } else {
      blocks.push({ type: 'paragraph', lines: [line] });
    }
  }

  // Bloco de código não fechado (streaming de código)
  if (inCode && codeBuffer.length > 0) {
    blocks.push({
      type: 'code-block',
      code: codeBuffer.join('\n'),
      lang: codeLang,
    });
  }

  return blocks;
}

export function FormattedMessage({ content, isUser = false }: FormattedMessageProps) {
  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-1.5 leading-relaxed">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h1
                  key={idx}
                  className={`text-base sm:text-lg font-bold mt-2 mb-1 ${
                    isUser ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {renderInline(block.text, isUser)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  className={`text-sm sm:text-base font-bold mt-2 mb-1 ${
                    isUser ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {renderInline(block.text, isUser)}
                </h2>
              );
            }
            return (
              <h3
                key={idx}
                className={`text-xs sm:text-sm font-bold mt-1.5 mb-0.5 ${
                  isUser ? 'text-white' : 'text-gray-900'
                }`}
              >
                {renderInline(block.text, isUser)}
              </h3>
            );
          }

          case 'bullet-list': {
            return (
              <ul key={idx} className="space-y-1 my-1 pl-1">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2">
                    <span
                      className={`select-none mt-1 text-xs leading-none shrink-0 ${
                        isUser ? 'text-white/80' : 'text-[#ff5e00]'
                      }`}
                    >
                      •
                    </span>
                    <span className="flex-1">
                      {renderInline(item, isUser)}
                    </span>
                  </li>
                ))}
              </ul>
            );
          }

          case 'numbered-list': {
            return (
              <ol key={idx} className="space-y-1 my-1 pl-1">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2">
                    <span
                      className={`font-bold select-none text-xs mt-0.5 min-w-[1.2rem] shrink-0 ${
                        isUser ? 'text-white' : 'text-[#ff5e00]'
                      }`}
                    >
                      {item.num}.
                    </span>
                    <span className="flex-1">
                      {renderInline(item.text, isUser)}
                    </span>
                  </li>
                ))}
              </ol>
            );
          }

          case 'code-block': {
            return (
              <pre
                key={idx}
                className="bg-gray-800 text-gray-100 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2 border border-gray-700"
              >
                <code>{block.code}</code>
              </pre>
            );
          }

          case 'quote': {
            return (
              <blockquote
                key={idx}
                className={`border-l-3 pl-3 py-1 my-1 text-xs italic ${
                  isUser
                    ? 'border-white/60 text-white/95'
                    : 'border-[#ff5e00] text-gray-700 bg-orange-50/50 rounded-r-md'
                }`}
              >
                {renderInline(block.text, isUser)}
              </blockquote>
            );
          }

          case 'divider': {
            return (
              <hr
                key={idx}
                className={`my-2 ${isUser ? 'border-white/30' : 'border-gray-200'}`}
              />
            );
          }

          case 'spacer': {
            return <div key={idx} className="h-1.5" />;
          }

          case 'paragraph':
          default: {
            return (
              <p key={idx} className="leading-relaxed">
                {block.lines.map((line, lineIdx) => (
                  <React.Fragment key={lineIdx}>
                    {lineIdx > 0 && <br />}
                    {renderInline(line, isUser)}
                  </React.Fragment>
                ))}
              </p>
            );
          }
        }
      })}
    </div>
  );
}
