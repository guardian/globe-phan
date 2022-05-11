import https from "https";
import { APIGatewayProxyResult } from "aws-lambda";
import { createOkResponse } from "./lib/response";
import { putDataIntoS3Bucket } from "./lib/util";

type MinMaxMap = Record<string, { min: number; max: number }>;

const fetchOphanData = (): Promise<OphanData> =>
  new Promise((resolve, reject) => {
    https.get(
      "https://api.ophan.co.uk/api/glophan/data?mins=10&key=NZFkS9fo6tFuAlRu",
      (response) => {
        console.log({ response });
        let body = "";
        response.on("data", (acc) => {
          console.log("data");
          body += acc;
        });
        response.on("error", reject);
        response.on("end", () => resolve(JSON.parse(body)));
      }
    );
  });

const processOphanData = (ophanData: OphanData) => {
  let min = 0;
  let max = 0;
  ophanData.forEach(({location, hits}, index) => {
    if (location === "london") {
      ophanData[index].hits = ophanData[index].hits / 3
    }
  })
  ophanData.forEach(({ hits }) => {
    if (max < hits) {
      max = hits;
    }
    if (min > hits) {
      min = hits;
    }
  });

  const range = max - min;
  const singlePercent = 100 / range;

  return ophanData.reduce((acc, { hits, location }) => {
    const value = ((hits * singlePercent) / 100);
    return {
      ...acc,
      [location]: value + (((1 / value) / 1000)),
    };
  }, {} as Record<string, number>);
};

type OphanData = Array<{ location: string; hits: number }>;

export const handler = async (): Promise<APIGatewayProxyResult> => {
  console.info("Globe-phan lambda invoked");

  const ophanData = await fetchOphanData();

  console.log({ ophanData });

  const outputData = processOphanData(ophanData);

  await putDataIntoS3Bucket(JSON.stringify(outputData), "data.json");

  console.info(`Written Ophan data to bucket`);

  console.log(outputData);

  return {
    statusCode: 201,
    body: JSON.stringify(createOkResponse(JSON.stringify(outputData))),
  };
};
