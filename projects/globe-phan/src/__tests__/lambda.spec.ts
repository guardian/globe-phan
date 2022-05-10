import { handler } from "../index";

describe("s3 event handler", () => {
  it("should read globe-phan data", async () => {
    const response = await handler();

    expect(response.statusCode).toBe(201);
  });
});
