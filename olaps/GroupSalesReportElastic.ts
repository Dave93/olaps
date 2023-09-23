import getToken from "../token"; // Импорт библиотеки для получения токена
import dayjs from "dayjs"; // Импорт библиотеки для форматирования дат
import {dates} from "../GroupSalesReportDatesLog.json"; // Импорт библиотеки для логирования дат
import pino from "pino"; // Импорт библиотеки для логирования

//-----------------------------------------------------------------------------

const fileTransport = pino.transport(
  {
  target: 'pino/file',
  options: { destination: `${import.meta.dir}/GroupSalesReportElastic.log` },
  }
);

const logger = pino(
  {
    level: 'info',
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  fileTransport
); // Тело функции для логирования

//------------------------------ TOKEN AND DATE EXTRACTION START -----------------------------------

const token = await getToken(); // Получение токена

logger.info("Start OLAP"); // Начало!!!

const currentDate = dayjs().format("YYYY-MM-DD"); // Получение текущей даты
const lastDate = dayjs(dates[dates.length - 1]).add(1, "day").format("YYYY-MM-DD"); // Получение последней даты из файла и добавление к нему 1 день

//------------------------------- TOKEN AND DATE EXTRACTION END -----------------------------

if (lastDate >= currentDate) {
  logger.info("Скрипт завершен по условию пороговой даты");
  // console.log("Скрипт завершен по условию пороговой даты");
  process.exit(0); // Завершение скрипта
}

//-----------------------------------------------------------------------------

logger.info("Запрос 1 (Список торговых предприятий, групп и складов (Начало))"); // Запрос 1 (Список торговых предприятий и их id)

const departmentlistResponse = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/v2/reports/olap?key=${token}`,
  {
    method: "POST",
    body: JSON.stringify({
      reportType: "SALES",
      buildSummary: "false", //Включает и выключает суммирование (Промежуточные итоги)
      groupByRowFields: [
        "Department",
        "Department.Id",
        "RestorauntGroup.Id",
        "RestorauntGroup",
        "Store.Name",
        "Store.Id",
        "OrderDeleted",
        "DeletedWithWriteoff",
      ],
      groupByColFields: [],
      aggregateFields: [],
      filters: {
        // Здесь вводим или какой либо шаблон дат () или опредленный период (так что сперва проверяется шаблон и если он не CUSTOM, то период дат игнорируется)
        "OpenDate.Typed": {
          filterType: "DateRange",
          periodType: "CUSTOM", //Тип выборки периоды (Если не CUSTOM ингнорирует from и to)
          from: lastDate, // Начало
          to: lastDate, //Конец
          includeLow: true, //Включает и выключает from
          includeHigh: true, // Включает и выключает to
        },
        "OrderDeleted": {
          "filterType": "IncludeValues",
          "values": ["NOT_DELETED"],
        },
        "DeletedWithWriteoff": {
            "filterType": "IncludeValues",
            "values": ["NOT_DELETED"],
        },
      },
    }
    ),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  }
);

const departmentlist = (await departmentlistResponse.json())['data']; // Получение ответа от сер

//-----------------------------------------------------------------------------

logger.info("Запрос 2 (Отвественные сотрудники и группы) (Начало)"); // Запрос 2 (Отвественные сотрудники и группы)

const orderslistResponse = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/v2/reports/olap?key=${token}`,
  {
    method: "POST",
    body: JSON.stringify({
      reportType: "SALES",
      buildSummary: "false", //Включает и выключает суммирование (Промежуточные итоги)
      groupByRowFields: [
        "RestorauntGroup.Id",
        "UniqOrderId.Id",
        "OpenDate.Typed",
        "AuthUser.Id",
        "Cashier.Id",
        "CashRegisterName.Number",
        "SessionNum",
        "OrderDeleted",
        "DeletedWithWriteoff",
      ],
      groupByColFields: [],
      aggregateFields: [
        // "DishDiscountSumInt",
      ],
      filters: {
        // Здесь вводим или какой либо шаблон дат () или опредленный период (так что сперва проверяется шаблон и если он не CUSTOM, то период дат игнорируется)
        "OpenDate.Typed": {
          filterType: "DateRange",
          periodType: "CUSTOM", //Тип выборки периоды (Если не CUSTOM ингнорирует from и to)
          from: lastDate, // Начало
          to: lastDate, //Конец
          includeLow: true, //Включает и выключает from
          includeHigh: true, // Включает и выключает to
        },
        "OrderDeleted": {
          "filterType": "IncludeValues",
          "values": ["NOT_DELETED"],
        },
        "DeletedWithWriteoff": {
            "filterType": "IncludeValues",
            "values": ["NOT_DELETED"],
        },
      },
    }
    ),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  }
);

const orderslist = (await orderslistResponse.json())['data']; // Получение ответа от сервиса

orderslist.forEach((item) => {
  const group = departmentlist.find((item2) => item2["RestorauntGroup.Id"] === item["RestorauntGroup.Id"]);
  delete group["RestorauntGroup.Id"];
  item.group = group;
});

//-----------------------------------------------------------------------------

logger.info("Запрос 3 (Список блюд в заказе (Начало)"); // Запрос 3 (Список блюд в заказе)

const orderdishlistResponse = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/v2/reports/olap?key=${token}`,
  {
    method: "POST",
    body: JSON.stringify({
      reportType: "SALES",
      buildSummary: "false", //Включает и выключает суммирование (Промежуточные итоги)
      groupByRowFields: [
        "UniqOrderId.Id",
        "DishId",
        "DishName",
      ],
      groupByColFields: [],
      aggregateFields: [
        "DishAmountInt",
        "DishDiscountSumInt",
        "DiscountSum",
        "DishSumInt.averagePriceWithVAT"
      ],
      filters: {
        // Здесь вводим или какой либо шаблон дат () или опредленный период (так что сперва проверяется шаблон и если он не CUSTOM, то период дат игнорируется)
        "OpenDate.Typed": {
          filterType: "DateRange",
          periodType: "CUSTOM", //Тип выборки периоды (Если не CUSTOM ингнорирует from и to)
          from: lastDate, // Начало
          to: lastDate, //Конец
          includeLow: true, //Включает и выключает from
          includeHigh: true, // Включает и выключает to
        },
        "OrderDeleted": {
          "filterType": "IncludeValues",
          "values": ["NOT_DELETED"],
        },
        "DeletedWithWriteoff": {
            "filterType": "IncludeValues",
            "values": ["NOT_DELETED"],
        },
      },
    }
    ),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  }
);

const orderdishlist = (await orderdishlistResponse.json())['data']; // Получение ответа от сервиса

//-----------------------------------------------------------------------------

logger.info("Запрос 4 (Заказ)"); // Запрос 4 (Заказ)

const orderInfoResponse = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/v2/reports/olap?key=${token}`,
  {
    method: "POST",
    body: JSON.stringify({
      reportType: "SALES",
      buildSummary: "false", //Включает и выключает суммирование (Промежуточные итоги)
      groupByRowFields: [
        "UniqOrderId.Id",
        "OpenTime",
        "CloseTime",
        "Delivery.CloseTime",
        "OrderNum",
        "Delivery.Number",
        "ExternalNumber",
        "OrderType",
        "Delivery.ServiceType",
        "OriginName",
        "Delivery.SourceKey",
        "OrderComment",
        "Delivery.DeliveryComment",
        "PayTypes",
        "OrderDeleted",
        "DeletedWithWriteoff",
      ],
      groupByColFields: [],
      aggregateFields: [
        "DishDiscountSumInt",
      ],
      filters: {
        // Здесь вводим или какой либо шаблон дат () или опредленный период (так что сперва проверяется шаблон и если он не CUSTOM, то период дат игнорируется)
        "OpenDate.Typed": {
          filterType: "DateRange",
          periodType: "CUSTOM", //Тип выборки периоды (Если не CUSTOM ингнорирует from и to)
          from: lastDate, // Начало
          to: lastDate, //Конец
          includeLow: true, //Включает и выключает from
          includeHigh: true, // Включает и выключает to
        },
        "OrderDeleted": {
          "filterType": "IncludeValues",
          "values": ["NOT_DELETED"],
        },
        "DeletedWithWriteoff": {
            "filterType": "IncludeValues",
            "values": ["NOT_DELETED"],
        },
      },
    }
    ),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  }
);

const orderInfo = (await orderInfoResponse.json())['data']; // Получение ответа от сервиса

orderInfo.forEach((item) => {
  const order = orderslist.find((item2) => item2["UniqOrderId.Id"] === item["UniqOrderId.Id"]);
  delete order["UniqOrderId.Id"];
  item.orderResponsible = order;
  item.products = [...orderdishlist].filter((item2) => item2["UniqOrderId.Id"] === item["UniqOrderId.Id"]);
  item.products.forEach((item3) => {
    delete item3["UniqOrderId.Id"];
  });
});

//-----------------------------------------------------------------------------

logger.info("Сохранение");
logger.info({message: 'items count', data: orderInfo.length})
Bun.write("./Order_Total_Info.json", JSON.stringify(orderInfo));
// Bun.write(`./Order_Total_Info${dayjs(lastDate).format("DD.MM.YYYY")}.json`, JSON.stringify(orderInfo));

logger.info({message:'lastDate', data:dayjs(lastDate).format("DD.MM.YYYY")});

dates.push(lastDate);

Bun.write("./GroupSalesReportDatesLog.json", JSON.stringify(
  {
  dates,
  }
  )
); // Запись в той же директории!!!

logger.info("Сохранение завершено");

//-----------------------------------------------------------------------------

// const body = await response.json();//???


// logger.info({message: 'items count', data: body.data.length})
// logger.info('started creating');


// const data = body.data as any[];

// itemsData.items.push(...data);

// logger.info('finished creating');
// // const text = await response.text();
// Bun.write(`./by_stores/GroupSalesReport_${dayjs(lastDate).format("DD.MM.YYYY")}.json`, JSON.stringify(itemsData));
// logger.info(text);

