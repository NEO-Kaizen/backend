import { app } from "./app.ts";
import Config from "./configs.ts";

const PORT = Config.PORT;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});