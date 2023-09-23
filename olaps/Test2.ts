// import getToken from "../token"; // Импорт функции для получения токена
// import dayjs from "dayjs"; // Импорт библиотеки для работы с датами
// import convert from 'xml-js'; // Импорт библиотеки для преобразования xml в json
// import {dates} from "../GoodReportDates.json"; // Импорт дат из файла
// import getStore from "./StoreID"; // Импорт ID складов из файла
// const token = await getToken(); // Получение токена
// const {storeDataForParentIdLA, storeDataForParentIdCP} = await getStore(token);


// console.log("start olap"); // Выводит в консоль о начале скрипта
// console.log(storeDataForParentIdLA, storeDataForParentIdCP);
// const lastDate = dayjs(dates[dates.length - 1]).add(1, "month").format("YYYY-MM-DD"); // Получение последней даты из файла и добавление к ней 1 день
// if (lastDate >= "2023-09-01") {
//   console.log("Скрипт завершен по условию пороговой даты");
//   process.exit(0); // Завершение скрипта
// }
// console.log("Продолжается выполнение скрипта (Не достигнута пороговая дата)");
// const dateFrom = dayjs(lastDate).startOf("month").format("DD.MM.YYYY"); // Дата от которой нужно получить данные
// const dateTo = dayjs(lastDate).endOf("month").format("DD.MM.YYYY"); // Дата до которой нужно получить данные
// const productDetalization = "true"; //Включает и выключает детализацию по продуктам которые внутри документов
// var object = {
//   key: token, // Токен для запроса
//   dateFrom, // Дата от которой нужно получить данные
//   dateTo, // Дата до которой нужно получить данные
//   productDetalization, // Включает и выключает детализацию по продуктам которые внутри документов
//   showCostCorrections: "false", // Включает и выключает корректировки по себестоимости (Нужно при подсчете себестоимости)
//   // documentTypes: "INCOMING_INVOICE" // Типы документов которые нужно получить (добавлять в том случае если нужно получить опеределенные документы по умолчанию проспускаем чтобы получить все тип документов)
// };
// console.log(`Сформирован запрос: ${new URLSearchParams(object).toString()}`);


// import dayjs from "dayjs";
// import {dates} from "../GroupSales_DatesLog.json";


// const currentDate = dayjs().format("YYYY-MM-DD");
// const lastDate = dayjs(dates[dates.length - 1]).add(1, "day").format("YYYY-MM-DD");
// console.log(lastDate);
// if (lastDate >= currentDate) {
//   console.log("Скрипт завершен по условию пороговой даты");
//   // console.log("Скрипт завершен по условию пороговой даты");
//   process.exit(0); // Завершение скрипта
// }
// console.log("Продолжается выполнение скрипта (Не достигнута пороговая дата)");

console.log
(
  "Запуск скрипта по складам LA"
  );


  //-----------------------------------------------------------------------------------------------------------------------
// logger.info("Запрос Шаблон"); // Запрос Шаблон

// const Шаблон = await fetch(
//   `https://les-ailes-co-co.iiko.it/resto/api/v2/reports/olap?key=${token}`,
//   {
//     method: "POST",
//     body: JSON.stringify({
//       reportType: "SALES",
//       buildSummary: "false", //Включает и выключает суммирование (Промежуточные итоги)
//       groupByRowFields: [
//         "RestorauntGroup.Id",
//         "UniqOrderId.Id",
//         "OpenDate.Typed",
//         "OpenTime",
//         "CloseTime",
//         "Delivery.CloseTime",
//         "OrderNum",
//         "Delivery.Number",
//         "ExternalNumber",
//         "OrderType",
//         "Delivery.ServiceType",
//         "OriginName",
//         "Delivery.SourceKey",
//         "AuthUser.Id",
//         "Cashier.Id",
//         "CashRegisterName.Number",
//         "SessionNum",
//         "OrderComment",
//         "Delivery.DeliveryComment",
//         "PayTypes",
//         "OrderDeleted",
//         "DeletedWithWriteoff",
//       ],
//       groupByColFields: [],
//       aggregateFields: [
//         "DishDiscountSumInt",
//         "DiscountSum",
//       ],
//       filters: {
//         // Здесь вводим или какой либо шаблон дат () или опредленный период (так что сперва проверяется шаблон и если он не CUSTOM, то период дат игнорируется)
//         "OpenDate.Typed": {
//           filterType: "DateRange",
//           periodType: "CUSTOM", //Тип выборки периоды (Если не CUSTOM ингнорирует from и to)
//           from: lastDate, // Начало
//           to: lastDate, //Конец
//           includeLow: true, //Включает и выключает from
//           includeHigh: true, // Включает и выключает to
//         },
//         "OrderDeleted": {
//           "filterType": "IncludeValues",
//           "values": ["NOT_DELETED"],
//         },
//         "DeletedWithWriteoff": {
//             "filterType": "IncludeValues",
//             "values": ["NOT_DELETED"],
//         },
//       },
//     }
//     ),
//     headers: { "Content-Type": "application/json", Accept: "application/json" },
//   }
// );

//-----------------------------------------------------------------------------------------------------------------------

//вставка объекта orderdishlist в новый ключ объекта orderinfo по названием "состав" сверяя оба по "UniqOrderId.Id" 
// const orderinfo2 = orderinfo.json();
// const orderdishlist2 = orderdishlist.json();
// orderinfo.json().forEach((item) => {
//   item.состав = orderdishlist.filter((item2) => item2["UniqOrderId.Id"] === item["UniqOrderId.Id"]);
// });



// const body = await response.json();//???


// logger.info({message: 'items count', data: body.data.length})
// logger.info('started creating');


// const data = body.data as any[];

// itemsData.items.push(...data);

// logger.info('finished creating');
// // const text = await response.text();
// Bun.write(`./by_stores/GroupSalesReport_${dayjs(lastDate).format("DD.MM.YYYY")}.json`, JSON.stringify(itemsData));
// logger.info(text);