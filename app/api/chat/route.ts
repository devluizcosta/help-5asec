import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import fs from 'fs';
import path from 'path';

// Inicializa o provedor Google Generative AI com a chave informada via GEMINI_API_KEY
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Tempo máximo de execução da rota (em segundos no Vercel)
export const maxDuration = 30;

/**
 * Lê automaticamente todos os manuais (.txt e .md) da pasta /manuais
 * e compila como base de conhecimento para o assistente.
 */
function loadManuals(): string {
  try {
    const manualsDir = path.join(process.cwd(), 'manuais');
    if (!fs.existsSync(manualsDir)) {
      return '';
    }

    const files = fs.readdirSync(manualsDir);
    const textFiles = files.filter(
      (file) =>
        (file.endsWith('.txt') || file.endsWith('.md')) &&
        file.toLowerCase() !== 'readme.md'
    );

    if (textFiles.length === 0) {
      return '';
    }

    const contents = textFiles.map((file) => {
      const fullPath = path.join(manualsDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      return `--- INÍCIO DO MANUAL [${file}] ---\n${content}\n--- FIM DO MANUAL [${file}] ---`;
    });

    return contents.join('\n\n');
  } catch (err) {
    console.error('Erro ao ler manuais do diretório:', err);
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Modelo com alta disponibilidade e resposta instantânea
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    // Carrega a base de conhecimento dinâmica da pasta /manuais
    const dynamicManuals = loadManuals();

    const systemPrompt =
      `Você é o assistente virtual interno da 5àsec de Pedro Leopoldo. Seu objetivo é ajudar os operadores de caixa a utilizarem o ERP Allegro.NET. Responda de forma clara, direta e em português. Baseie-se estritamente nas regras do manual do sistema. Formate suas respostas com Markdown: use negrito (**termo**) para destacar nomes de telas, menus, botões e campos do Allegro.NET, e utilize passos numerados ou listas com marcadores para instruções práticas e fáceis de seguir no balcão.` +
      `\n\n` +
      `======================================================================\n` +
      `BASE DE CONHECIMENTO OFICIAL (ERP ALLEGRO.NET / 5àsec):\n` +
      `======================================================================\n` +
      (dynamicManuals
        ? dynamicManuals
        : `[Base padrão do sistema ativa. Manuais específicos adicionados na pasta /manuais.]`) +
      `\n======================================================================`;

    const result = streamText({
      model: google(modelName),
      messages,
      system: systemPrompt,
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error ? error.message : 'Erro ao processar mensagem no chat.';
    console.error('Erro na rota de chat:', error);
    return new Response(
      JSON.stringify({
        error: errMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
