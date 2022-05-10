import { Either } from "./types";
import { s3 } from "./aws";

/**
 * @return The key of the file that's been added.
 */
export const putDataIntoS3Bucket = async (
  Body: string,
  Key: string
): Promise<void> => {
  const params = {
    Bucket: "globe-phan-data",
    Key,
    Body,
    ContentType: "application/json",
  };

  await s3.putObject(params).promise();
};

export const getYYYYmmddDate = (date: Date) => date.toISOString().split("T")[0];

/**
 * Constructors for the Either type.
 */
export const left = <Value, Error>(error: Error): Either<Value, Error> => ({
  value: undefined,
  error,
});
export const right = <Value, Error>(value: Value): Either<Value, Error> => ({
  value,
  error: undefined,
});
