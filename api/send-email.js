// api/send-email.js
// Usando CommonJS (require/module.exports) para garantir compatibilidade no Vercel

const fetch = require('node-fetch');
const Buffer = require('buffer').Buffer;

module.exports = async (req, res) => {
    // 1. Verificação de Método HTTP (Segurança básica)
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método não permitido.' });
    }

    // 2. Acessa as Chaves Secretas (Apenas no Servidor Vercel)
    const API_KEY = process.env.MAILJET_API_KEY;
    const SECRET_KEY = process.env.MAILJET_SECRET_KEY;
    const TO_EMAIL = process.env.DESTINO_EMAIL_LEADS; 

    // 3. Extrai Dados do Frontend
    const { nome, email, telefone, assunto, mensagem, detalhes } = req.body;

    // Verificação mínima de dados
    if (!nome || !email || !assunto) {
        return res.status(400).json({ success: false, message: 'Dados incompletos (nome, email, assunto são obrigatórios).' });
    }

    // 4. Constrói o Corpo do E-mail para o Mailjet
    const textContent = `
        Novo Lead Recebido: ${assunto}
        -------------------------------------
        Nome: ${nome}
        Email: ${email}
        Telefone/WhatsApp: ${telefone || 'Não Informado'}
        Destalhes do Lead: ${detalhes || 'N/A'}
        Mensagem do Cliente: ${mensagem || 'N/A'}
        -------------------------------------
        Data/Hora do Envio: ${new Date().toLocaleString('pt-BR')}
    `;

    const mailjetData = {
        Messages: [
            {
                From: {
                    Email: "no-reply@seu-dominio-autorizado.com", 
                    Name: "Rota Inesquecível - Leads"
                },
                To: [{
                    Email: TO_EMAIL,
                    Name: "Time de Vendas"
                }],
                Subject: `[LEAD] ${assunto} - ${nome}`,
                TextPart: textContent,
                ReplyTo: {
                    Email: email, 
                    Name: nome
                }
            }
        ]
    };

    // 5. Autentica e Envia a Requisição para o Mailjet
    try {
        // Gera a string de autenticação (API_KEY:SECRET_KEY) em Base64
        const auth = Buffer.from(`${API_KEY}:${SECRET_KEY}`).toString('base64');
        
        const response = await fetch('https://api.mailjet.com/v3.1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}` 
            },
            body: JSON.stringify(mailjetData)
        });

        // 6. Verifica a Resposta e Retorna para o Frontend
        if (response.ok) {
            return res.status(200).json({ success: true, message: 'Lead capturado e email enviado com sucesso.' });
        } else {
            const errorText = await response.text();
            console.error('Erro Mailjet no Servidor:', errorText);
            return res.status(500).json({ success: false, message: 'Erro ao processar o envio de e-mail no servidor. Verifique o console Vercel.' });
        }
    } catch (error) {
        console.error('Erro Interno do Servidor:', error);
        return res.status(500).json({ success: false, message: 'Erro interno de conexão. Tente novamente mais tarde.' });
    }
};
