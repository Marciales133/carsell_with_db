// =====  GENERAL IMPORTS =====
import express from "express";
import cookieParser from "cookie-parser"; 
import { fileURLToPath } from "url";
import path from "path";
import db from './config/db.js';


// =====  ROUTER IMPORTS =====
import cars from "./routes/carsRoute.js";
import clients from "./routes/clientsRoute.js";
import employees from "./routes/employeesRoute.js";
import sales from "./routes/salesRoute.js";
import tasks from "./routes/tasksRoute.js";
import dashboard from "./routes/dashboardRoute.js";

// =====  GENERAL DECLARATION =====
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
db.raw('SELECT 1')
    .then(() => console.log('✅ Supabase connected'))
    .catch((err) => console.error('❌ DB connection failed:', err));



// =====  APP DECLARATION =====
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "../../frontend")));



// =====  ROUTE END-POITS =====
app.use("/api/cars", cars);
app.use("/api/clients", clients);
app.use("/api/employees", employees);
app.use("/api/sales", sales);
app.use("/api/tasks", tasks);
app.use("/api/dashboard", dashboard);





// =====  SERVER JUMP START =====
const PORT = process.env.PORT || 5501;

const startServer = async()=>{
    try{
        app.on("error", (error)=>{
            console.log("ERROR", error);
            throw error;
        });
        app.listen(PORT ,()=>{
            console.log(`Server is running on port: ${PORT}`);
        });
    }catch(error){
        console.log("DB connection Failed!!", error);
    }
};

startServer();