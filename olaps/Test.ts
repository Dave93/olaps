import getToken from "../token";
import { parseString } from "xml2js";
var convert = require('xml-js');

const token = await getToken();
console.log("start olap");
const response = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/products/?key=${token}`,
  {
    method: "GET"
  }
);

//const body = await response.json();
const text = await response.text();
const data = await convert.xml2json(text);

console.log();
Bun.write("./Test.json", data);
