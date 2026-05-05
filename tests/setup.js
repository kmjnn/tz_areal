jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
  };
  return { Pool: jest.fn(() => mockPool) };
});