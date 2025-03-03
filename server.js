const express = require("express");
const mysql = require("mysql2");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.DB_PASSWORD, // Store in .env file
    database: "stocks",
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL database");
});

// Fetch Stock Data from Yahoo Finance (via RapidAPI)
app.get("/stock/:symbol", async (req, res) => {
    try {
        let { symbol } = req.params;
        symbol = symbol.toUpperCase() + ".NS"; // Ensure NSE format

        console.log(`🔍 Fetching stock data for: ${symbol}`);

        const response = await axios.get(
            `https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/${symbol}`,
            {
                headers: {
                    "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "your_actual_rapidapi_key",
                    "X-RapidAPI-Host": "yahoo-finance15.p.rapidapi.com",
                },
            }
        );

        console.log("🔍 FULL API RESPONSE:", JSON.stringify(response.data, null, 2));

        // Ensure we have a valid response
        if (!response.data || !response.data.body || !response.data.body.length) {
            return res.status(404).json({ error: "Stock data not found" });
        }

        const stock = response.data.body[0]; // Correctly extract the stock data

        const stockData = {
            Symbol: stock.symbol || "N/A",
            Name: stock.shortName || "N/A",
            Price: stock.regularMarketPrice || "N/A",
            Change: stock.regularMarketChange || "N/A",
            PercentageChange: stock.regularMarketChangePercent || "N/A",
            volume: stock.regularMarketVolume || "N/A",
            MarketCap: stock.marketCap || "N/A",
            High: stock.regularMarketDayHigh || "N/A",
            Low: stock.regularMarketDayLow || "N/A",
            Open: stock.regularMarketOpen || "N/A",
            PreviousClose: stock.regularMarketPreviousClose || "N/A",
            Currency: stock.currency || "N/A",
        };

        console.log("✅ Stock data fetched successfully:", stockData);
        res.json(stockData);
    } catch (error) {
        console.error("❌ Error fetching stock data:", error.message);
        res.status(500).json({ error: "Failed to fetch stock data. Try again later." });
    }
});

// Root route
app.get("/", (req, res) => {
    res.send("✅ Stock Market API is Running! Use /stock/{symbol} to get data.");
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
