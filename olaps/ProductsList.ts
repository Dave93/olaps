import getToken from "../token";

const token = await getToken();
console.log("start olap");
const response = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/v2/entities/products/list?key=${token}`,
  {
    method: "GET"
  }
);

const body = await response.json();
//const text = await response.text();
//Bun.write("./ProductsList.json", text);

console.log(body);
