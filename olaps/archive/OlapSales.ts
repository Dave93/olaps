import getToken from "../../token";
import dayjs from "dayjs";
import {dates} from "../../GroupSalesReport_DatesLog.json";
import pino from "pino";
const itemsData = { items: [] };
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

logger.info("start olap GroupSales Report");
// const currentDate = dayjs().format("YYYY-MM-DD");
// const lastDate = dayjs(dates[dates.length - 1]).add(1, "day").format("YYYY-MM-DD");

if (lastDate >= currentDate) {
  logger.info("Скрипт завершен по условию пороговой даты");
  // console.log("Скрипт завершен по условию пороговой даты");
  process.exit(0); // Завершение скрипта
}
const response = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/v2/reports/olap?key=${token}`,
  {
    method: "POST",
    body: JSON.stringify({
      reportType: "SALES",
      buildSummary: "false", //Включает и выключает суммирование (Промежуточные итоги)
      groupByRowFields: [
        "Department",
        "RestorauntGroup",
        "OpenDate.Typed",
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
          from: "2018-01-01", // Начало
          to: "2023-09-20", //Конец
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
// logger.info({message:'lastDate', data:dayjs(lastDate).format("DD.MM.YYYY")});
// dates.push(lastDate);

// Bun.write("./GroupSalesReport_DatesLog.json", JSON.stringify({
//   dates,
// }
// )
// );
const body = await response.json();
logger.info({message: 'items count', data: body.data.length})
logger.info('started creating');
const data = body.data as any[];
itemsData.items.push(...data);

// logger.info('finished creating');
// const text = await response.text();
Bun.write(`./by_stores/GroupSalesReport_2023.json`, JSON.stringify(itemsData));
// logger.info(text);

