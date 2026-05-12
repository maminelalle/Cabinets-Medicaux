/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from "@jest/globals";


jest.mock("../config/redis", () => ({
  redis: {
    setEx: (jest.fn() as any).mockResolvedValue("OK"),
    get: (jest.fn() as any).mockResolvedValue(null),
    del: (jest.fn() as any).mockResolvedValue(1),
    on: jest.fn(),
    connect: (jest.fn() as any).mockResolvedValue(undefined),
    isOpen: true,
    isReady: true,
  },
  connectRedis: (jest.fn() as any).mockResolvedValue(undefined),
}));
