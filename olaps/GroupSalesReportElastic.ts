const path = require("path");

const getToken = require("../token.ts"); // Импорт библиотеки для получения токена
const dayjs = require("dayjs"); // Импорт библиотеки для форматирования дат
const pino = require("pino"); // Импорт библиотеки для логирования
const {Client} = require('@elastic/elasticsearch');
const fs = require("fs");
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const { slugify } = require("transliteration");

dotenv.config();

const paymentTypes = {

};

//-----------------------------------------------------------------------------

(async () => {


    let datesRowData = fs.readFileSync(path.resolve("./GroupSalesReportDatesLog.json"));
    let datesJson = JSON.parse(datesRowData);
    const {dates} = datesJson
    const client = new Client({
        node: process.env.ELASTICSEARCH_HOST,
        auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false,
            ca: fs.readFileSync(process.env.ELASTICSEARCH_CA_FILE),
        },
    });

// Define the index name
    const indexName = 'olap_sales';

    const fileTransport = pino.transport(
        {
            target: 'pino/file',
            options: {destination: `${__dirname}/GroupSalesReportElastic.log`},
        }
    );

    const logger = pino(
        {
            level: 'info',
            formatters: {
                level: (label) => {
                    return {level: label.toUpperCase()};
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
            headers: {"Content-Type": "application/json", Accept: "application/json"},
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
                        "AuthUser",
                        "Cashier.Id",
                        "Cashier",
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
            headers: {"Content-Type": "application/json", Accept: "application/json"},
        }
    );

    const orderslist = (await orderslistResponse.json())['data']; // Получение ответа от сервиса

    orderslist.forEach((item) => {
        const group = departmentlist.find((item2) => item2["RestorauntGroup.Id"] === item["RestorauntGroup.Id"]);
        let groupObject = {};
        if (group) {
            groupObject = {...group};
            delete groupObject["RestorauntGroup.Id"];
        }
        item.group = groupObject;
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
                        "DishMeasureUnit",
                        "DishGroup",
                        "DishGroup.TopParent",
                        "DishGroup.SecondParent",
                        "DishGroup.ThirdParent",
                        "DishCategory",
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
            headers: {"Content-Type": "application/json", Accept: "application/json"},
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
                        "Delivery.Id",
                        "Delivery.Email",
                        "Delivery.IsDelivery",
                        "Conception",
                        "DayOfWeekOpen",
                        "WeekInMonthOpen",
                        "WeekInYearOpen",
                        "Mounth",
                        "YearOpen",
                        "QuarterOpen",
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
            headers: {"Content-Type": "application/json", Accept: "application/json"},
        }
    );

    let orderInfo = (await orderInfoResponse.json())['data']; // Получение ответа от сервиса

    const allOrdersData = {};

    for (let i = 0; i < orderInfo.length; i++) {
        const item = orderInfo[i];
        item.OpenTime = dayjs(item.OpenTime).toISOString();
        item.CloseTime = dayjs(item.CloseTime).toISOString();
        if (item['Delivery.CloseTime']) {
            item['Delivery.CloseTime'] = dayjs(item["Delivery.CloseTime"]).toISOString();
        }
        if (!allOrdersData[item["UniqOrderId.Id"]]) {
            allOrdersData[item["UniqOrderId.Id"]] = item;
            allOrdersData[item["UniqOrderId.Id"]].payments = [];
        }

        let paymentKey = `pay_${slugify(item["PayTypes"], {
            lowercase: true,
            separator: "_",
        })}`;

        paymentTypes[paymentKey] = paymentKey;
        allOrdersData[item["UniqOrderId.Id"]][paymentKey] = item["DishDiscountSumInt"];

        // allOrdersData[item["UniqOrderId.Id"]].payments.push({
        //     "PayTypes": item["PayTypes"],
        //     "DishDiscountSumInt": item["DishDiscountSumInt"],
        // });
    }
    orderInfo = Object.values(allOrdersData);
    orderInfo.forEach((item) => {

        const order = orderslist.find((item2) => item2["UniqOrderId.Id"] === item["UniqOrderId.Id"]);
        let orderObject = {};
        if (order) {
            orderObject = {...order};
            delete orderObject["UniqOrderId.Id"];
        }
        item.orderResponsible = orderObject;
        item.products = [...orderdishlist].filter((item2) => item2["UniqOrderId.Id"] === item["UniqOrderId.Id"]);
        item.products.forEach((item3) => {
            delete item3["UniqOrderId.Id"];
        });
    });

//-----------------------------------------------------------------------------

    logger.info("Сохранение");
    logger.info({message: 'items count', data: orderInfo.length})

    orderInfo.forEach((item) => {
        delete item['PayTypes'];
        delete item['DishDiscountSumInt'];
    });

// in orderInfo replace dot to underscore in keys
    orderInfo.forEach((item) => {
        const keys = Object.keys(item);
        keys.forEach((key) => {
            const newKey = key.replace(/\./g, "_");
            item[newKey] = item[key];
            if (key !== newKey)
                delete item[key];
        });
        item.orderResponsible.group = {...item.orderResponsible.group};
        const keys2 = Object.keys(item.orderResponsible.group);
        keys2.forEach((key) => {
            const newKey = key.replace(/\./g, "_");
            item.orderResponsible.group[newKey] = item.orderResponsible.group[key];
            if (key !== newKey)
                delete item.orderResponsible.group[key];
        });

        item.orderResponsible = {...item.orderResponsible};
        const keys3 = Object.keys(item.orderResponsible);
        keys3.forEach((key) => {
            const newKey = key.replace(/\./g, "_");
            item.orderResponsible[newKey] = item.orderResponsible[key];
            if (key !== newKey)
                delete item.orderResponsible[key];
        });

        item.products.forEach((item2) => {
            const keys4 = Object.keys(item2);
            keys4.forEach((key) => {
                const newKey = key.replace(/\./g, "_");
                item2[newKey] = item2[key];
                if (key !== newKey)
                    delete item2[key];
            });
        });
    });

    fs.writeSync(fs.openSync(`./Order_Total_Info.json`, 'w'), JSON.stringify(orderInfo));
// Bun.write(`./Order_Total_Info${dayjs(lastDate).format("DD.MM.YYYY")}.json`, JSON.stringify(orderInfo));


    /**
     * Start ElasticSection
     */


// check if index exists
    const indexExists = await client.indices.exists({index: indexName});
    console.log('indexExists', indexExists)
    if (!indexExists) {

        const mappings = {
            properties: {
                "UniqOrderId_Id": {type: "keyword"},
                "OpenTime": {type: "date"},
                "CloseTime": {type: "date"},
                "Delivery_CloseTime": {type: "date"},
                "OrderNum": {type: "keyword"},
                "Delivery_Number": {type: "keyword"},
                "ExternalNumber": {type: "keyword"},
                "OrderType": {type: "keyword"},
                "Delivery_ServiceType": {type: "keyword"},
                "OriginName": {type: "keyword"},
                "Delivery_SourceKey": {type: "keyword"},
                "OrderComment": {type: "keyword"},
                "Delivery_DeliveryComment": {type: "keyword"},
                "Delivery_Id": {type: "keyword"},
                "Delivery_Email": {type: "keyword"},
                "Delivery_IsDelivery": {type: "keyword"},
                "Conception": {type: "keyword"},
                "DayOfWeekOpen": {type: "keyword"},
                "WeekInMonthOpen": {type: "keyword"},
                "WeekInYearOpen": {type: "keyword"},
                "Mounth": {type: "keyword"},
                "YearOpen": {type: "keyword"},
                "QuarterOpen": {type: "keyword"},
                // "PayTypes": {type: "keyword"},
                // "OrderDeleted": { type: "keyword" },
                // "DeletedWithWriteoff": { type: "keyword" },
                // "DishDiscountSumInt": {type: "integer"},
                // "payments": {
                //     properties: {
                //         "PayTypes": {type: "keyword"},
                //         "DishDiscountSumInt": {type: "integer"},
                //     }
                // },
                "orderResponsible": {
                    properties: {
                        "group": {
                            properties: {
                                "Department": {type: "keyword"},
                                "Department_Id": {type: "keyword"},
                                "RestorauntGroup": {type: "keyword"},
                                "Store_Name": {type: "keyword"},
                                "Store_Id": {type: "keyword"},
                            }
                        },
                        "RestorauntGroup_Id": {type: "keyword"},
                        "OpenDate_Typed": {type: "date"},
                        "AuthUser_Id": {type: "keyword"},
                        "AuthUser": {type: "keyword"},
                        "Cashier_Id": {type: "keyword"},
                        "Cashier": {type: "keyword"},
                        "CashRegisterName_Number": {type: "keyword"},
                        "SessionNum": {type: "keyword"},

                    }
                },
                "products": {
                    type: "nested",
                    properties: {
                        "DishId": {type: "keyword"},
                        "DishName": {type: "keyword"},
                        "DishAmountInt": {type: "integer"},
                        "DishDiscountSumInt": {type: "integer"},
                        "DiscountSum": {type: "integer"},
                        "DishSumInt_averagePriceWithVAT": {type: "integer"},
                        "DishMeasureUnit": {type: "keyword"},
                        "DishGroup": {type: "keyword"},
                        "DishGroup_TopParent": {type: "keyword"},
                        "DishGroup_SecondParent": {type: "keyword"},
                        "DishGroup_ThirdParent": {type: "keyword"},
                        "DishCategory": {type: "keyword"},
                    }
                }
            }
        }

        Object.keys(paymentTypes).forEach((key) => {
            mappings.properties[key] = {type: "integer"};
        });

        // create index
        await client.indices.create({
            index: indexName, body: {
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 1
                },
                mappings
            }
        });
    } else {
        // get mapping of index
        const {body: mapping} = await client.indices.getMapping({index: indexName});

        // find payment types which not exist in mapping
        const newPaymentTypes = Object.keys(paymentTypes).filter((key) => {
            return !mapping[indexName].mappings.properties.hasOwnProperty(key);
        });

        // add new payment types to mapping
        if (newPaymentTypes.length > 0) {
            const newPaymentTypesMapping = {};
            newPaymentTypes.forEach((key) => {
                newPaymentTypesMapping[key] = {type: "integer"};
            });
            await client.indices.putMapping({
                index: indexName,
                body: {
                    properties: newPaymentTypesMapping
                }
            });
        }
    }

    for (let i = 0; i < orderInfo.length; i++) {
      const item = orderInfo[i];
      try {

          await client.index({
              index: indexName,
              id: item["UniqOrderId_Id"],
              body: item
          });
      } catch (e) {

          console.log(item["UniqOrderId_Id"]);
          console.log(e);
      }
    }


    logger.info({message: 'lastDate', data: dayjs(lastDate).format("DD.MM.YYYY")});

    dates.push(lastDate);

    // Bun.write("./GroupSalesReportDatesLog.json", JSON.stringify(
    //         {
    //           dates,
    //         }
    //     )
    // ); // Запись в той же директории!!!

    fs.writeSync(fs.openSync(path.resolve(`./GroupSalesReportDatesLog.json`), 'w'), JSON.stringify(
        {
            dates,
        }
    ));

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
})();
