import Web3 from "web3";
import { ERC20_ABI, VAULT_ABI, ROUTERV2_ABI } from "./../constants/abi.js";
import moment from "moment";

const JSON_RPC_URL = "https://bsc-dataseed.binance.org";
const VAULT_ADDRESS = "0xEbB30b32E74AD446b00B6333C372c5a1ccabda7D";
const SAKAI_ADDRESS = "0x43b35e89d15b91162dea1c51133c4c93bdd1c4af";
const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const USD_ADDRESS = "0x55d398326f99059ff775485246999027b3197955";

export const getPoolData = async () => {
  try {
    const web3 = new Web3(new Web3.providers.HttpProvider(JSON_RPC_URL));
    const vaultContract = new web3.eth.Contract(VAULT_ABI, VAULT_ADDRESS);
    const sakaiContract = new web3.eth.Contract(ERC20_ABI, SAKAI_ADDRESS);
    const routerContract = new web3.eth.Contract(ROUTERV2_ABI, ROUTER_ADDRESS);
    const [decimal, periodEligible, endingAt] = await Promise.all([
      sakaiContract.methods.decimals().call(),
      vaultContract.methods.periodEligible().call(),
      vaultContract.methods.endingAt().call(),
    ]);

    const endTime = moment(Number(endingAt) * 1000).utc();
    const periodAccumulateAmount = await vaultContract.methods
      .periodAccumulateAmount(periodEligible)
      .call();

    const price = await routerContract.methods
      .getAmountsOut(periodAccumulateAmount, [SAKAI_ADDRESS, USD_ADDRESS])
      .call();
    const rows = [
      `<u>Pool Data:</u>\n${moment.utc().format("DD/MM/YYYY HH:mm")} UTC\n`,
      `<b>#️⃣Current Epoch:</b> ${Number(periodEligible)}`,
      `<b>💰Pool Weight:</b> ${(
        Number(periodAccumulateAmount) /
        10 ** Number(decimal)
      ).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })} SAKAI (<b>${(Number(price[1]) / 10 ** Number(decimal)).toLocaleString(
        "en-US",
        {
          maximumFractionDigits: 2,
          style: "currency",
          currency: "USD",
        }
      )})</b>`,
      `<b>⏰Pool End:</b> ${endTime.format(
        "DD/MM/YYYY HH:mm"
      )} UTC | ${endTime.fromNow()}
      `,
      `\n<u>Estimated Prize:</u>\n`,
      `<b>🥇1st Winner:</b> ${(
        (Number(price[1]) * 0.3) /
        10 ** Number(decimal)
      ).toLocaleString("en-US", {
        maximumFractionDigits: 2,
        style: "currency",
        currency: "USD",
      })}`,
      `<b>🥈2nd Winner:</b> ${(
        (Number(price[1]) * 0.1) /
        10 ** Number(decimal)
      ).toLocaleString("en-US", {
        maximumFractionDigits: 2,
        style: "currency",
        currency: "USD",
      })}`,
      `<b>🥉3rd Winner:</b> ${(
        (Number(price[1]) * 0.08) /
        10 ** Number(decimal)
      ).toLocaleString("en-US", {
        maximumFractionDigits: 2,
        style: "currency",
        currency: "USD",
      })}`,
      `<b>🪨4th Winner:</b> ${(
        (Number(price[1]) * 0.05) /
        10 ** Number(decimal)
      ).toLocaleString("en-US", {
        maximumFractionDigits: 2,
        style: "currency",
        currency: "USD",
      })}`,
    ];
    const message = rows.join("\n");

    return message;
  } catch (error) {
    console.log("error", error);
    return;
  }
};

export default getPoolData;
