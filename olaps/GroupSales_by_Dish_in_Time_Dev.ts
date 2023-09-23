import getToken from "../token";
import dayjs from "dayjs";
import {dates} from "../GroupSales_DatesLog.json";
import { Prisma, PrismaClient } from "@prisma/client";
import pino from "pino";

const fileTransport = pino.transport({
  target: 'pino/file',
  options: { destination: `${import.meta.dir}/GroupSales.log` },
});

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
);

const token = await getToken();
logger.info("start olap");


const prisma = new PrismaClient();

await prisma.sales.deleteMany({
  where: {
    startDate: {
      gte: dayjs('2023-09-15 07:00:00').toISOString(),
    }
  },
  
});

const lastDate = dayjs(dates[dates.length - 1]).add(1, "day").format("YYYY-MM-DD");
const response = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/v2/reports/olap?key=${token}`,
  {
    method: "POST",
    body: JSON.stringify({
      reportType: "SALES",
      buildSummary: "false", //Включает и выключает суммирование (Промежуточные итоги)
      groupByRowFields: [
        "RestorauntGroup.Id",
        "OpenTime",
        "DishId",
        "DishName",
        "OrderType",
        "OriginName",
        "UniqOrderId.Id",
        "OrderDeleted",
        "DeletedWithWriteoff",

      ],
      groupByColFields: [],
      aggregateFields: [
        "DishAmountInt",
        "ItemSaleEventDiscountType.DiscountAmount",
        "DishDiscountSumInt",
        "DiscountSum",
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
        //OpenTime: {
        //  filterType: "DateRange",
        //  periodType: "YESTERDAY",
        //  from: "2022-06-29T12:59:00.000",
        //  to: "2022-06-29T13:59:59.000",
        //  includeLow: true,
        //  includeHigh: true,
        //}, 
        // "Delivery.IsDelivery": {
        //   filterType: "IncludeValues",
        //   values: ["ORDER_WITHOUT_DELIVERY"],
        // },
      },
    }),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  }
);
logger.info({message:'lastDate', data:dayjs(lastDate).format("DD.MM.YYYY")});
dates.push(lastDate);

Bun.write("./GroupSales_DatesLog.json", JSON.stringify({
  dates,
}));


const body = await response.json();
logger.info({message: 'items count', data: body.data.length})
logger.info('started creating');

// split body.data by 5000 items

const chunkSize = 5000;
const chunks: any[] = [];

for (let i = 0; i < body.data.length; i += chunkSize) {
  const chunk = body.data.slice(i, i + chunkSize);
  chunks.push(chunk);
}


// for (let chunk of chunks) {
//   // logger.info('chunk', chunk);
//   await prisma.sales.createMany({
//     data: chunk.map((row) => ({
//           groupId: row['RestorauntGroup.Id'],
//           orderId: row['UniqOrderId.Id'],
//           productId: row['DishId'],
//           startDate: dayjs(row['OpenTime']).toISOString(),
//           orderType: row['OrderType'],
//           orderSource: row['OriginName'] || 'Основной',
//           productCount: row['DishAmountInt'],
//           productSaleCount: row['ItemSaleEventDiscountType.DiscountAmount'],
//           totalPrice: row['DishDiscountSumInt'],
//           salePrice: row['DiscountSum'],
//           isOrderDeleted: row['OrderDeleted'],
//           isProductDeleted: row['DeletedWithWriteoff'],
//         }))
//   });
// }



logger.info('finished creating');
// const text = await response.text();
// Bun.write("./ProductsList2.json", text);
// logger.info(text);
