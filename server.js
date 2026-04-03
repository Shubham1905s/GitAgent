import express from "express";
import { resolve } from "node:path";

const app = express();
const port = process.env.PORT || 3000;

// Serve the 'Vision Astra' app from the public folder
app.use(express.static("public"));

app.listen(port, () => {
    console.log(`\n🚀 Vision Astra (v1.0) is live at: http://localhost:${port}`);
    console.log(`📖 Ready for developers to work on features & bugs.\n`);
});
