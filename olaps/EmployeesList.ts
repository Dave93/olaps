import getToken from "../token";
import { parseString } from "xml2js";
var convert = require('xml-js');

const token = await getToken();
console.log("start employees list");
const response = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/employees?key=${token}`,
  {
    method: "GET"
  }
);

//const body = await response.json();
const text = await response.text();
const data = await convert.xml2json(text);

// Преобразуйте JSON в объект
const data2object = JSON.parse(data);

let list = [];
// Извлекаем все Employeeitems элементы
const Employeeitems = data2object.elements[0]?.elements || [];
// console.log(Employeeitems);

// Проходимся по каждому Employeeitems
Employeeitems.forEach((Employeeitems: any) => {

let obj = {};

    for (let i = 0; i < Employeeitems.elements.length; i++) {
      if (!Employeeitems.elements[i].elements) {
        continue;
      }
      obj[Employeeitems.elements[i].name] = Employeeitems.elements[i].elements[0].text;
    }

    list.push(obj);
  });

console.log(list);
Bun.write("./Employees2.json", JSON.stringify(list)); // запись в файл с адаптированием массива в текстовый формат JSON
