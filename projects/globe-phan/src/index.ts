import fs from "fs";
import { APIGatewayProxyResult } from "aws-lambda";
import { createOkResponse } from "./lib/response";
import { putDataIntoS3Bucket } from "./lib/util";

const getOphanData = async () => {
  return JSON.parse(fs.readFileSync("./src/ophanData.json", "utf-8"));
};

export const handler = async (): Promise<APIGatewayProxyResult> => {
  console.info("Globe-phan lambda invoked");

  const ophanData = await getOphanData();

  await putDataIntoS3Bucket(JSON.stringify(ophanData), "data.json");

  console.info(`Written Ophan data to bucket`);

  return {
    statusCode: 201,
    body: JSON.stringify(createOkResponse(JSON.stringify(ophanData))),
  };
};
