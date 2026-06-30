import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

const app = express();


//global middlewares
app.use(helmet());

app.use(cors());

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


//server health

app.get("/health",(_,res)=>{
    res.status(200).json({
        success:true,
        message: "gateway is running",
    });
});

export default app;