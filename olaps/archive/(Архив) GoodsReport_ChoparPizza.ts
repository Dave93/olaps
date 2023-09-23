import getToken from "../../token"; // Импорт функции для получения токена
import dayjs from "dayjs"; // Импорт библиотеки для работы с датами
import convert from 'xml-js'; // Импорт библиотеки для преобразования xml в json
import {dates} from "../../GroupSales_DatesLog.json"; // Импорт дат из файла
const token = await getToken(); // Получение токена
console.log("start olap"); // Выводит в консоль о начале скрипта

// Функцию для изменения даты по дням в переменых dateFrom, dateTo
const lastDate = dayjs(dates[dates.length - 1]).add(1, "day").format("YYYY-MM-DD"); // Получение последней даты из файла и добавление к ней 1 день
if (lastDate >= "2023-01-01") {
  console.log("Скрипт завершен по условию if");
  process.exit(0); // Завершение скрипта
}
console.log("Работает дальше");
const dateFrom = dayjs(lastDate).format("DD.MM.YYYY"); // Дата от которой нужно получить данные
const dateTo = dayjs(lastDate).format("DD.MM.YYYY"); // Дата до которой нужно получить данные
const productDetalization = "true"; //Включает и выключает детализацию по продуктам которые внутри документов
const storesID=[
"6cd986d1-d79e-40d8-981d-65e7a2d93328",// Филиал 19001 - Склад Les Ойбек
"416b21c7-e2ed-42a2-8837-d4f6baacf34b",// Филиал 19002 - Склад Les Чиланзар
"d95e632c-8c3c-4c52-9802-6b1123908ea1",// Филиал 19003 - Склад Les Андижан ТРЦ Узбегим
"7e0661d8-0b59-4d57-a66e-6434a9895559",// Филиал 19004 - Склад Les Юнусабад
"ae0a8831-bb5c-4419-8b84-861aad1f5af0",// Филиал 19005 - Склад Les Максим Горький
"693253c3-aa58-4e82-9629-4c8f84d497ef",// Филиал 19006 - Склад Les Парус
"357e28d4-2330-4b4d-bb92-b8510df2a099",// Филиал 19007 - Склад Les Азия
"94b9dfa0-bb2f-403e-af0a-14ac011c56ac",// Филиал 19008 - Склад Les Фергана
"5185cdd3-1a5c-44ca-9909-16d63df4b722",// Филиал 19009 - Склад Les Андижан Стационарный
"8f9e9a1f-758a-485f-baf9-9706c6078adc",// Филиал 19010 - Склад Les Next
"f2964059-af9d-4290-8722-bd927cbfe222",// Филиал 19011 - Склад Les Ц5
"45624628-b9b7-4aec-b141-f3d2254f1412",// Филиал 19012 - Склад Les Самарканд  ( 1 ) 
"97d3a92c-b5cb-4861-b849-26fa5230ebd4",// Филиал 19013 - Склад Les Ривьера
"7b10d069-3a86-4908-b334-eb32af74c0df",// Филиал 19014 - Склад Les Анхор Локомотив
"f4260bca-253f-457e-94fe-5e5c99c4a06d",// Филиал 19015 - Склад Les Депо
"4d5312d2-56af-4ee0-9613-5b561dd84345",// Филиал 19016 - Склад Les Ailes Бухара
"ec186700-49b5-4124-aa42-4762669315ba",// Филиал 19017 - Склад Les Новые сергили
"3106d94b-84fc-4c7a-b895-517b39c762d9",// Филиал 19018 - Склад Les Фархадский
"62f01a9a-7164-4b4d-8d6a-548d741b0689",// Филиал 19019 - Склад Les Ko'kcha
"700d5a87-af28-4524-ad42-6cc75234887c",// Филиал 19020 - Склад Les Бухара Chinor mall
"eae88251-8bb0-404a-ae51-0930354e1805",// Филиал 19021 - Склад Les Бочка
]; // ID складов (При добавлении нового склада нужно добавить его ID в массив)

var object = {
  key: token, // Токен для запроса
  dateFrom, // Дата от которой нужно получить данные
  dateTo, // Дата до которой нужно получить данные
  productDetalization, // Включает и выключает детализацию по продуктам которые внутри документов
  showCostCorrections: "false", // Включает и выключает корректировки по себестоимости (Нужно при подсчете себестоимости)
  // documentTypes: "INCOMING_INVOICE" // Типы документов которые нужно получить (добавлять в том случае если нужно получить опеределенные документы по умолчанию проспускаем чтобы получить все тип документов)
};

console.log(new URLSearchParams(object).toString());

const response = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/reports/storeOperations?${new URLSearchParams(object).toString()}&stores=${storesID[0]}&stores=${storesID[1]}&stores=${storesID[2]}&stores=${storesID[3]}&stores=${storesID[4]}&stores=${storesID[5]}&stores=${storesID[6]}&stores=${storesID[7]}&stores=${storesID[8]}&stores=${storesID[9]}&stores=${storesID[10]}&stores=${storesID[11]}&stores=${storesID[12]}&stores=${storesID[13]}&stores=${storesID[14]}&stores=${storesID[15]}&stores=${storesID[16]}&stores=${storesID[17]}&stores=${storesID[18]}&stores=${storesID[19]}&stores=${storesID[20]}`,
  {
    method: "GET"
  }
); // Итоговый запрос с параметрами

// const body = await response.json();
const text = await response.text(); // Получение текста из xml
const data = await convert.xml2json(text); // Преобразование xml в json
// console.log(data);
const json = await JSON.parse(data); // Преобразование json в объект

const elements = json.elements[0].elements; // Получение массива элементов из объекта

const result = []; // Массив для записи данных

for (let i = 0; i < elements.length; i++) {
  const element = elements[i];
  let obj = {
  };
  for (let j = 0; j < element.elements.length; j++) {
    obj[element.elements[j].name] = element.elements[j].elements[0].text;
  } // Цикл для выделения данных из элементов и записи их в объект

  result.push(obj); // Добавление объекта в массив
}
dates.push(lastDate);

Bun.write("./GroupSales_DatesLog.json", JSON.stringify({
  dates,
})); // Запись дат в файл
Bun.write("./ProductsList_Data.json", JSON.stringify(result)); // Запись данных в файл
// console.log(body);
