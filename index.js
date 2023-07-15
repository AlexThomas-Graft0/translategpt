const express = require("express");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3030;

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

const prompts = {
  explain: {
    systemPrompt: {
      role: "system",
      content:
        "You are a language expert. Your goal is to explain the meaning of the word provided. Give a short explaination of the meaning and if necessary how the word translates.",
    },
    prompt: "Explain this word: ",
  },
  translate: {
    systemPrompt: {
      role: "system",
      content:
        "You are a language translator. Your goal is to translate the text provided. If the text is in English then translate it to Spanish. If the text is in Spanish then translate it to English. Give a short explaination of the meaning and if necessary how the word translates. If the sentence is more than 6 words, break the sentence into smaller chunks so it's easy to see which parts translate to which.",
    },
    prompt: "Translate this text: ",
  },
  fixEnglish: {
    systemPrompt: {
      role: "system",
      content:
        "You are a language expert. Your goal is to fix the broken English provided. Give a short explaination of the meaning and if necessary how the word translates.",
    },
    prompt: "Fix this broken English: ",
  },
  pronounce: {
    systemPrompt: {
      role: "system",
      content:
        "You are a pronunciation expert. Your goal is to provide the pronunciation of the word provided. Give a short explaination of the pronunciation and if necessary how the word is pronounced. Break down the pronunciation into syllables.",
    },
    prompt: "Explain how to pronounce this word: ",
  },
  metaphor: {
    systemPrompt: {
      role: "system",
      content:
        "You are a metaphor expert. Your goal is to explain the metaphor provided. Give a short explaination of the meaning and if necessary how the word translates. If the sentence is long, break the sentence into smaller chunks so it's easy to see which words translate to which. If there is a similar metaphor in the opposite language, provide that as well.",
    },
    prompt: "Explain this metaphor: ",
  },
};

client.on("ready", () => {
  console.log("Ready!");
});

const newMessage = async (systemPrompt, prompt, model = "gpt-3.5-turbo") => {
  console.log([systemPrompt, { role: "user", content: `${prompt}` }], model);
  const response = await openai.createChatCompletion({
    model: model,
    messages: [systemPrompt, { role: "user", content: `${prompt}` }],
    temperature: 0.6,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    n: 1,
    stream: false,
  });
  return response.data.choices[0].message.content;
};

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  let messageText;
  let phrase;
  let model;

  if (message.content.startsWith("!explain: ")) {
    messageText = message.content.slice(10);
    phrase = "explain";
  }

  if (message.content.startsWith("!translate:")) {
    messageText = message.content.slice(11);
    phrase = "translate";
  }

  if (message.content.startsWith("!fix my english: ")) {
    messageText = message.content.slice(16);
    phrase = "fixEnglish";
  }

  if (message.content.startsWith("!pronounce: ")) {
    messageText = message.content.slice(12);
    phrase = "pronounce";
  }

  if (message.content.startsWith("!metaphor:")) {
    messageText = message.content.slice(10);
    phrase = "metaphor";
  }

  if (messageText) {
    if (message.content.toLowerCase().includes("gpt4")) {
      console.log("here");
      messageText = message.content.replace("GPT4", "");
      messageText = message.content.replace("gpt4", "");
      console.log({ messageText });
      model = "gpt-4";
    }

    const reply = await newMessage(
      prompts[phrase].systemPrompt,
      `${prompts[phrase].prompt}${messageText}.`,
      model
    );

    message.reply(reply);
  }
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
  client.login(process.env.DISCORD_TOKEN);
  console.log("Chatbot started!");
});
