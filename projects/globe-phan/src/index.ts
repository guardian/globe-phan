import https from "https";
import { APIGatewayProxyResult } from "aws-lambda";
import { createOkResponse } from "./lib/response";
import { putDataIntoS3Bucket } from "./lib/util";

const bucketAtIndex = (ophanData: OphanData, index: number) =>
  ophanData.aggregations.snapshots_over_time.buckets[index];

const getNormalisedValue = (
  location: string,
  value: number,
  minMaxMap: MinMaxMap
) => {
  const { min, max } = minMaxMap[location];
  const range = max - min;
  const singlePercent = 100 / range;
  return ((value - min) * singlePercent) / 100;
};

type MinMaxMap = Record<string, { min: number; max: number }>;

const fetchOphanData = () =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.ophan.co.uk",
        port: 443,
        path: "/api/map",
      },
      (response) => {
        let body = "";
        response.on("data", (acc) => (body += acc));
        response.on("error", reject);
        response.on("end", () => resolve(body));
      }
    );
  });

const processOphanData = (ophanData: OphanData) => {
  const minMaxMap: MinMaxMap = {};
  for (
    let i = 0;
    i < ophanData.aggregations.snapshots_over_time.buckets.length;
    i++
  ) {
    const { key_as_string, key, doc_count, ...locations } = bucketAtIndex(
      ophanData,
      i
    );

    Object.entries(locations).map(([locationName, value]) => {
      const docCount = value.buckets[0].doc_count;
      const locationMinMax = minMaxMap[locationName];
      if (locationMinMax) {
        if (locationMinMax.max < docCount) {
          locationMinMax.max = docCount;
        }
        if (locationMinMax.min > docCount) {
          locationMinMax.min = docCount;
        }
      } else {
        minMaxMap[locationName] = {
          min: docCount,
          max: docCount,
        };
      }
    });
  }

  const latestBucketIndex =
    ophanData.aggregations.snapshots_over_time.buckets.length - 1;

  const { key_as_string, key, doc_count, ...locations } = bucketAtIndex(
    ophanData,
    latestBucketIndex
  );

  return Object.fromEntries(
    Object.entries(locations).map(([locationName, value]) => [
      locationName,
      getNormalisedValue(locationName, value.buckets[0].doc_count, minMaxMap),
    ])
  );
};

type OphanData = {
  aggregations: {
    snapshots_over_time: {
      buckets: Array<
        {
          key_as_string: string;
          key: number;
          doc_count: number;
        } & Record<
          string,
          {
            buckets: Array<{
              doc_count: number;
            }>;
          }
        >
      >;
    };
  };
};

export const handler = async (): Promise<APIGatewayProxyResult> => {
  console.info("Globe-phan lambda invoked");

  const ophanData = await fetchOphanData();

  const outputData = processOphanData(ophanData as any);

  await putDataIntoS3Bucket(JSON.stringify(outputData), "data.json");

  console.info(`Written Ophan data to bucket`);

  console.log(outputData);

  return {
    statusCode: 201,
    body: JSON.stringify(createOkResponse(JSON.stringify(outputData))),
  };
};
