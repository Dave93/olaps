import getToken from "../token";
import { parseString } from "xml2js";

export default async function getStore(token: string) {

  var convert = require('xml-js');


  // console.log("start store list");
  const response = await fetch(
    `https://les-ailes-co-co.iiko.it/resto/api/corporation/stores?key=${token}`,
    {
      method: "GET"
    }
  );

  // const body = await response.json();
  const text = await response.text();
  const data = await convert.xml2json(text);


  // Преобразуйте JSON в объект
  const data2object = JSON.parse(data);

  // Извлекаем все corporateItemDto элементы
  const corporateItems = data2object.elements[0]?.elements || [];
  // console.log(corporateItems);

  let stores = [];

  // Проходимся по каждому corporateItemDto
  corporateItems.forEach((corporateItem: any) => {

    let obj = {};

    for (let i = 0; i < corporateItem.elements.length; i++) {
      if (!corporateItem.elements[i].elements) {
        continue;
      }
      obj[corporateItem.elements[i].name] = corporateItem.elements[i].elements[0].text;
    }

    stores.push(obj);
  });

  const storesByParentId = stores.reduce((acc: Record<string, any>, store: Record<string, any>) => {
    const parentId = store.parentId;
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(store);
    return acc;
  }, {});


  // console.log('storesByParentId', storesByParentId);

  const storeDataForParentIdLA = storesByParentId["d955355b-c4db-3798-0163-14f6b09d000d"].map((store: Record<string, any>) => store.id);
  const storeDataForParentIdCP = storesByParentId["664eca32-e479-4860-b1bb-56bb0cee5190"].map((store: Record<string, any>) => store.id);
  // проверить отношение id складов к id ресторанов!!!
  // console.log('store', storeDataForParentIdLA);
  // console.log('store', storeDataForParentIdCP);
  return { storeDataForParentIdLA, storeDataForParentIdCP };
}