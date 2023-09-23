import getToken from "../token";

const token = await getToken();
console.log("start olap");
const response = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/v2/reports/olap?key=${token}`,
  {
    method: "POST",
    body: JSON.stringify({
      reportType: "TRANSACTIONS",
      buildSummary: "false", //Включает и выключает суммирование (Промежуточные итоги)
      groupByRowFields: [
        "Product.Type",
        "Product.Id",
        "Product.Name",
      ],
      groupByColFields: [],
      aggregateFields: [],
      filters: {
        // Здесь вводим или какой либо шаблон дат () или опредленный период (так что сперва проверяется шаблон и если он не CUSTOM, то период дат игнорируется)
        "DateTime.OperDayFilter": {
          filterType: "DateRange",
          periodType: "LAST_MONTH", //Тип выборки периоды (Если не CUSTOM ингнорирует from и to)
          from: "2023-08-31", // Начало
          to: "2023-08-31", //Конец
          includeLow: true, //Включает и выключает from
          includeHigh: true, // Включает и выключает to
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

const body = await response.json();

console.log(body);
