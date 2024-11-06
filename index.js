require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { IamAuthenticator } = require('ibm-watson/auth');
const AssistantV2 = require('ibm-watson/assistant/v2');

// Configuração do Watson Assistant
const assistant = new AssistantV2({
  version: '2021-06-14',
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_API_KEY,
  }),
  serviceUrl: process.env.WATSON_URL,
});

const app = express();
app.use(express.json());

// Rota para interagir com o Watson e a API de Futebol
app.post('/mensagem', async (req, res) => {
  const { message } = req.body;

  try {
    // Envie a mensagem do usuário para o Watson Assistant
    const response = await assistant.message({
      assistantId: process.env.WATSON_ASSISTANT_ID,
      sessionId: await getSessionId(),
      input: {
        'message_type': 'text',
        'text': message,
      },
    });

    const intent = response.result.output.intents[0]?.intent;
    let reply;

    if (intent === 'Consultar_Tabela') {
      reply = await consultarTabela();
    } else if (intent === 'Proximos_Jogos') {
      reply = await consultarProximosJogos();
    } else {
      reply = response.result.output.generic[0]?.text || 'Não entendi sua pergunta.';
    }

    res.json({ reply });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    res.status(500).send('Erro ao processar a mensagem.');
  }
});

// Função para obter Session ID do Watson Assistant
async function getSessionId() {
  const session = await assistant.createSession({
    assistantId: process.env.WATSON_ASSISTANT_ID,
  });
  return session.result.session_id;
}

// Função para consultar a tabela
async function consultarTabela() {
  try {
    const response = await axios.get(`${process.env.API_FUTEBOL_URL}/tabela`, {
      headers: { 'Authorization': `X-Auth-Token ${process.env.API_FUTEBOL_TOKEN}` },
    });
    const tabela = response.data;
    return tabela.map((time) => `${time.posicao}º ${time.nome} - ${time.pontos} pontos`).join('\n');
  } catch (error) {
    console.error('Erro ao consultar tabela:', error);
    return 'Não foi possível consultar a tabela no momento.';
  }
}

// Função para consultar próximos jogos
async function consultarProximosJogos() {
  try {
    const response = await axios.get(`${process.env.API_FUTEBOL_URL}/proximos-jogos`, {
      headers: { 'Authorization': `X-Auth-Token ${process.env.API_FUTEBOL_TOKEN}` },
    });
    const jogos = response.data;
    return jogos.map((jogo) => `${jogo.data} - ${jogo.timeCasa} vs ${jogo.timeVisitante}`).join('\n');
  } catch (error) {
    console.error('Erro ao consultar próximos jogos:', error);
    return 'Não foi possível consultar os próximos jogos no momento.';
  }
}

// Inicie o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});








// const AssistantV2 = require('ibm-watson/assistant/v2');
// const { IamAuthenticator } = require('ibm-watson/auth');

// const assistant = new AssistantV2({
//   version: 'lite',
//   authenticator: new IamAuthenticator({
//     apikey: 'F0dryEQQpvQmFuq6kFnMQFuHx90HDxFcoNatFXMiqcai',
//   }),
//   serviceUrl: 'https://api.au-syd.assistant.watson.cloud.ibm.com/instances/199a53d3-0457-40e5-8da1-96ddf738384a',
// });
