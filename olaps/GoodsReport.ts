import getToken from "../token"; // Импорт функции для получения токена
import dayjs from "dayjs"; // Импорт библиотеки для работы с датами
import convert from 'xml-js'; // Импорт библиотеки для преобразования xml в json
import {dates} from "../GoodReportDates.json"; // Импорт дат из файла
import getStore from "./StoreID"; // Импорт ID складов из файла
const token = await getToken(); // Получение токена
const {storeDataForParentIdLA, storeDataForParentIdCP} = await getStore(token);


console.log("start olap"); // Выводит в консоль о начале скрипта
console.log(storeDataForParentIdLA, storeDataForParentIdCP);


// Функцию для изменения даты по дням в переменых dateFrom, dateTo

const lastDate = dayjs(dates[dates.length - 1]).add(1, "month").format("YYYY-MM-DD"); // Получение последней даты из файла и добавление к ней 1 день
if (lastDate >= "2023-09-01") {
  console.log("Скрипт завершен по условию пороговой даты");
  process.exit(0); // Завершение скрипта
}
console.log("Продолжается выполнение скрипта (Не достигнута пороговая дата)");
const dateFrom = dayjs(lastDate).startOf("month").format("DD.MM.YYYY"); // Дата от которой нужно получить данные
const dateTo = dayjs(lastDate).endOf("month").format("DD.MM.YYYY"); // Дата до которой нужно получить данные
const productDetalization = "true"; //Включает и выключает детализацию по продуктам которые внутри документов
var object = {
  key: token, // Токен для запроса
  dateFrom, // Дата от которой нужно получить данные
  dateTo, // Дата до которой нужно получить данные
  productDetalization, // Включает и выключает детализацию по продуктам которые внутри документов
  showCostCorrections: "false", // Включает и выключает корректировки по себестоимости (Нужно при подсчете себестоимости)
  // documentTypes: "INCOMING_INVOICE" // Типы документов которые нужно получить (добавлять в том случае если нужно получить опеределенные документы по умолчанию проспускаем чтобы получить все тип документов)
};

console.log(`Сформирован запрос: ${new URLSearchParams(object).toString()}`);


// LA Цикл для получения данных по складам
console.log("Запуск скрипта по складам LA");
for (let i = 0; i < storeDataForParentIdLA.length; i++) {
  const response = await fetch(
    `https://les-ailes-co-co.iiko.it/resto/api/reports/storeOperations?${new URLSearchParams(object).toString()}&stores=${storeDataForParentIdLA[i]}`,
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
  if (elements) {

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      let obj = {
      };
      for (let j = 0; j < element.elements.length; j++) {
        // console.log('elements', element.elements[j]);
        if (!element.elements[j].elements) {
          continue;
        }
        obj[element.elements[j].name] = element.elements[j].elements[0].text;
      } // Цикл для выделения данных из элементов и записи их в объект
  
      result.push(obj); // Добавление объекта в массив
    }
    Bun.write(`./by_stores/la/ProductsList_Data_${storeDataForParentIdLA[i]}.json`, JSON.stringify(result)); // Запись данных в файл
  }
  // console.log(body);
}


// CP Цикл для получения данных по складам
console.log("Запуск скрипта по складам CP");
for (let i = 0; i < storeDataForParentIdCP.length; i++) {
  const response = await fetch(
    `https://les-ailes-co-co.iiko.it/resto/api/reports/storeOperations?${new URLSearchParams(object).toString()}&stores=${storeDataForParentIdCP[i]}`,
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
  if (elements) {

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      let obj = {
      };
      for (let j = 0; j < element.elements.length; j++) {
        // console.log('elements', element.elements[j]);
        if (!element.elements[j].elements) {
          continue;
        }
        obj[element.elements[j].name] = element.elements[j].elements[0].text;
      } // Цикл для выделения данных из элементов и записи их в объект
  
      result.push(obj); // Добавление объекта в массив
    }
    Bun.write(`./by_stores/cp/ProductsList_Data_${storeDataForParentIdCP[i]}.json`, JSON.stringify(result)); // Запись данных в файл
  }
  // console.log(body);
}

dates.push(lastDate);

Bun.write("./GoodReportDates.json", JSON.stringify({
  dates,
}));
console.log('Выгрузка завершена успешно для LA и CP на дату: ', dayjs(lastDate).endOf("month").format("DD.MM.YYYY"));
// Bun.write("./ProductsList_Data.json", JSON.stringify(result)); // Запись данных в файл
// console.log(body);
