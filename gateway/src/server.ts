import app from "./app/app";
import { appConfig } from "./config";


app.listen(appConfig.port, () => {
    console.log(`Gateway running on port ${appConfig.port}`);
});