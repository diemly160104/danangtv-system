import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`DaNangTV server is running at http://localhost:${env.PORT}`);
});