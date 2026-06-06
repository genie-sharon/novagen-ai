import "@testing-library/jest-dom";

beforeEach(() => {
  // Mock crypto.randomUUID
  if (typeof globalThis.crypto === "undefined") {
    Object.defineProperty(globalThis, "crypto", {
      value: {
        randomUUID: () =>
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }),
      },
      writable: true,
    });
  }

  if (typeof globalThis.crypto.randomUUID === "undefined") {
    globalThis.crypto.randomUUID = () =>
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
  }
});

afterEach(() => {
  document.body.innerHTML = "";
});
