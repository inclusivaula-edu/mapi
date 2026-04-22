import { runMAPI } from "../../packages/core/index.js";

app.post("/mapi", async (req, reply) => {
  const { input } = req.body;

  const result = runMAPI(input);

  return {
    response: result
  };
});