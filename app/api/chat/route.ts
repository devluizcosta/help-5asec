import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Inicializa o provedor Google Generative AI com a chave informada via GEMINI_API_KEY
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Tempo máximo de execução da rota (em segundos)
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Modelo Gemini atualizado (gemini-3.5-flash ou customizável via env)
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    const result = streamText({
      model: google(modelName),
      messages,
      system:
        `Você é o assistente virtual interno da 5àsec de Pedro Leopoldo. Seu objetivo é ajudar os operadores de caixa a utilizarem o ERP Allegro.NET. Responda de forma clara, direta e em português. Baseie-se estritamente nas regras do manual do sistema.` +
        `\n\n` +
        // ============================================================================
        // 📚 ÁREA PARA COLAR A BASE DE CONHECIMENTO DOS MANUAIS EM PDF (ALLEGRO.NET):
        // Cole abaixo todo o conteúdo de texto extraído dos manuais do ERP Allegro.NET.
        // O assistente usará esse conteúdo para responder dúvidas operacionais
        // (ex.: abertura/fechamento de caixa, cadastro de clientes, emissão de rol,
        // tabela de preços, serviços, formas de pagamento, estornos e cancelamentos).
        // ============================================================================
        `[BASE DE CONHECIMENTO - MANUAIS DO ALLEGRO.NET]
COLE AQUI O TEXTO EXTRAÍDO DOS MANUAIS EM PDF DO SISTEMA ERP ALLEGRO.NET
[FIM DA BASE DE CONHECIMENTO]`,
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Erro ao processar mensagem no chat.';
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
