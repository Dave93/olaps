
const fetch = require("node-fetch");
const getToken = async () => {
  const response = await fetch(
    `https://les-ailes-co-co.iiko.it/resto/api/auth?login=${process.env.LOGIN}&pass=${process.env.PASS}`,
    {
      method: "GET",
    }
  );

  const body = response.text();
  return body;
}

module.exports = getToken;
