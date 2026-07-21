import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

// Isola l'SDK AWS, mai un bucket R2 reale in CI: le classi Command qui sono passthrough che
// conservano l'input passato, cosi' il test verifica esattamente cosa r2.ts costruisce.
vi.mock("@aws-sdk/client-s3", () => {
  class PutObjectCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  class DeleteObjectCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  class S3Client {
    send = sendMock;
  }
  return { S3Client, PutObjectCommand, DeleteObjectCommand };
});

const { putObject, deleteObject } = await import("./r2");

beforeEach(() => {
  sendMock.mockClear();
  process.env.R2_ACCOUNT_ID = "test-account";
  process.env.R2_ACCESS_KEY_ID = "test-key";
  process.env.R2_SECRET_ACCESS_KEY = "test-secret";
  process.env.R2_BUCKET_NAME = "test-bucket";
});

describe("putObject", () => {
  it("scrive su R2 con Bucket/Key/ContentType/Body corretti", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    await putObject("photos/abc.jpg", bytes, "image/jpeg");

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0] as { input: unknown };
    expect(command.input).toEqual({
      Bucket: "test-bucket",
      Key: "photos/abc.jpg",
      Body: bytes,
      ContentType: "image/jpeg",
    });
  });
});

describe("deleteObject", () => {
  it("cancella l'oggetto con Bucket/Key corretti", async () => {
    await deleteObject("photos/abc.jpg");

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0] as { input: unknown };
    expect(command.input).toEqual({ Bucket: "test-bucket", Key: "photos/abc.jpg" });
  });
});
