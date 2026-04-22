import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});