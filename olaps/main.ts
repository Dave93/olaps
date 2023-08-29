import getToken from "../token";

const token = await getToken();
console.log("start olap");
const response = await fetch(
  `https://les-ailes-co-co.iiko.it/resto/api/v2/reports/olap?key=${token}`,
  {
    method: "POST",
    body: JSON.stringify({
      reportType: "SALES",
      buildSummary: "true",
      groupByRowFields: ["Department", "Department.Id"],
      groupByColFields: [],
      aggregateFields: ["UniqOrderId", "DishDiscountSumInt", "VAT.Sum"],
      filters: {
        "OpenDate.Typed": {
          filterType: "DateRange",
          periodType: "YESTERDAY",
          from: "2022-06-29",
          to: "2022-06-29",
          includeLow: true,
          includeHigh: true,
        },
        OpenTime: {
          filterType: "DateRange",
          periodType: "YESTERDAY",
          from: "2022-06-29T12:59:00.000",
          to: "2022-06-29T13:59:59.000",
          includeLow: true,
          includeHigh: true,
        }, // "Delivery.IsDelivery": {
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
