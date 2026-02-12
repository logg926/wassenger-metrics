const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });
const axios = require("axios");
async function get() {
  try {
    const res = await axios.get(
      "https://api.wassenger.com/v1/devices/691aeb1dc2ec875f268bf342",
      { headers: { Token: process.env.WASSENGER_TOKEN } },
    );
    console.log("--- SETTINGS ---");
    console.log(JSON.stringify(res.data.settings, null, 2));
  } catch (e) {
    console.log("Error:", e.message);
  }
}
get();
