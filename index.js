import express from "express";
import { config } from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";

config();
const app = express();
const PORT = process.env.PORT || 3030;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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

const newMessage = async (systemPrompt, prompt, model = "grok-beta") => {
  console.log([systemPrompt, { role: "user", content: `${prompt}` }], model);

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROK_KEY}`, // Use environment variable for security
    },
    body: JSON.stringify({
      messages: [systemPrompt, { role: "user", content: `${prompt}` }],
      model: model,
      stream: false,
      temperature: 0.6,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
};

client.on("messageCreate", async (message) => {
  console.log("Message received:", message.content);

  if (message.author.bot) return;

  let messageText;
  let phrase;
  let model;

  if (message.content.startsWith("!explain: ")) {
    messageText = message.content.slice(10);
    phrase = "explain";
  } else if (message.content.startsWith("!translate:")) {
    messageText = message.content.slice(11);
    phrase = "translate";
  } else if (message.content.startsWith("!fix my english: ")) {
    messageText = message.content.slice(16);
    phrase = "fixEnglish";
  } else if (message.content.startsWith("!pronounce: ")) {
    messageText = message.content.slice(12);
    phrase = "pronounce";
  } else if (message.content.startsWith("!metaphor:")) {
    messageText = message.content.slice(10);
    phrase = "metaphor";
  }

  if (messageText) {
    model = "grok-beta";

    const reply = await newMessage(
      prompts[phrase].systemPrompt,
      `${prompts[phrase].prompt}${messageText}.`,
      model
    );

    console.log("Replying with:", reply);
    message.reply(reply);
  }
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
  client.login(process.env.DISCORD_TOKEN);
  console.log("Chatbot started!");
});
