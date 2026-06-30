import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";


import { requestLogger } from "../infrastructure/logger/request-logger";
import { requestIdMiddleware } from "./middlewares/request-id.middleware";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();


//global middlewares
app.use(requestIdMiddleware);

app.use(requestLogger);

app.use(helmet());

app.use(cors());

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(notFoundMiddleware);

app.use(errorMiddleware);

//server health

app.get("/health",(_,res)=>{
    res.status(200).json({
        success:true,
        message: "gateway is running",
    });
});

export default app;