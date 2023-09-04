import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Input, Telegraf } from "telegraf";
import getPoolData from "./services/connWeb3.js";
import moment from "moment";
import axios from "axios";
dotenv.config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
let chatID = [382064440, 1320370063];
bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log("Response time: %sms", ms);
});

bot.command("addbot", (ctx) => {
  const chatId = ctx.message.chat.id;
  console.log(`Chat ID ${Number(chatId)} is added to server`);
  ctx.reply("Bot is added to the group");
  if (!chatID.includes(chatId)) {
    chatID.push(chatId);
  }
});
bot.command("vault", async (ctx) => {
  const message = await getPoolData();
  if (!!message) {
    ctx.reply(message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔗 Join The Vault",
              url: "https://app.sakaivault.io/vault",
            },
          ],
        ],
      },
    });
  }
});

bot.command("ticket", async (ctx) => {
  if (ctx.update.message.from.is_bot) {
    return false;
  }

  const args = ctx.update.message.text.split(" ");

  const question = args[1];

  if (!!question) {
    ctx.sendChatAction("typing");
    console.log(question);
    await axios
      .get(`https://vault.sakaivault.io/api/metadata/56/${question}`)
      .then(async (res) => {
        const metadata = res.data;
        const { image } = metadata;
        return ctx.replyWithPhoto(Input.fromURL(image), {
          reply_to_message_id: ctx.message.message_id,
        });
      })
      .catch((err) => {
        console.log(err);
        return ctx.reply("NFT is not found.", {
          reply_to_message_id: ctx.message.message_id,
        });
      });
  }
});

bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err.message);
});
bot.start((ctx) => {
  throw new Error("Example error");
});

bot.on("text", (ctx) => {
  const chatId = ctx.message.chat.id;
  if (!chatID.includes(chatId)) {
    chatID.push(chatId);
  }
});

bot.launch();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {});
app.post("/api/buy", (req, res) => {
  const {
    tokenId,
    type,
    owner,
    timestamp,
    epoch,
    chainId,
    amountToken,
    amountUsd,
    txHash,
  } = req.body;
  if (
    !tokenId ||
    !(type === "BUY TICKET") ||
    !owner ||
    !timestamp ||
    !epoch ||
    !(chainId === 56) ||
    !amountToken ||
    !amountUsd ||
    !txHash
  ) {
    res.status(400).send({ message: "Missing fields" });
  }
  const decimals = 18;
  const amountSakai = (amountToken / 10 ** decimals).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
  const amountUSDT = (amountUsd / 10 ** decimals).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
  const _message = [
    `<u><b>NEW COMMIT</b></u>\n`,
    `${Array.from(
      { length: 1 + Math.ceil(tokenId?.length / 5) },
      () => "🎟"
    ).join("  ")}\n`,
    `🕰️${moment.utc(timestamp * 1000).format("DD/MM/YYYY HH:mm")} UTC
     \n`,

    `<b>🙍🏻From:</b> <a href="https://bscscan.com/tx/${owner}">${
      String(owner).slice(0, 4) + "..." + String(owner).slice(-4)
    }</a>`,
    `<b>⛓️Tx Hash:</b> <a href="https://bscscan.com/tx/${txHash}">${
      String(txHash).slice(0, 4) + "..." + String(txHash).slice(-4)
    }</a>`,
    `<b>🎫Ticket Count:</b> <b>🎟x ${tokenId.length}</b>`,
    `<b>#️⃣Epoch:</b> ${epoch}`,
    `<b>💵Payment:</b> ${amountSakai} SAKAI <b>($${amountUSDT})</b>`,
  ];
  const message = _message.join("\n");

  const _demo = `🎟 <b>BUY TICKET</b>\n\n👤 <b>Owner:</b> <a href="https://bscscan.com/address/${owner}">${owner}</a>\n🎫 <b>Ticket ID:</b> <a href="https://vault.sakaivault.io/ticket/${tokenId}">${tokenId}</a>\n💰 <b>Amount:</b> <a href="https://bscscan.com/tx/${txHash}">${amountSakai} SAKAI</a> ($${amountUSDT})\n🕒 <b>Time:</b> ${timestamp}\n🔗 <b>Chain:</b> <a href="https://bscscan.com/tx/${txHash}">BSC</a>`;

  chatID.forEach((id) => {
    bot.telegram.sendMessage(id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔗 Join The Vault",
              url: "https://app.sakaivault.io/vault",
            },
          ],
        ],
      },
    });
  });
  res.send({ message: "OK" });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
