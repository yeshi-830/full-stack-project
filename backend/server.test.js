const assert = require("node:assert/strict");
const { after, before, describe, it } = require("node:test");
const { app, db, validateUser } = require("./server");

describe("member API validation", () => {
  let server;
  let baseUrl;

  before(async () => {
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.end();
  });

  it("normalizes valid member names and email addresses", () => {
    assert.deepEqual(validateUser({ name: "  Alex Morgan  ", email: "  ALEX@example.com " }), {
      value: { name: "Alex Morgan", email: "alex@example.com" },
    });
  });

  it("rejects missing, invalid, and oversized member details", () => {
    assert.ok(validateUser(null).error);
    assert.ok(validateUser({ name: "A", email: "alex@example.com" }).error);
    assert.ok(validateUser({ name: "Alex Morgan", email: "not-an-email" }).error);
    assert.ok(validateUser({ name: "A".repeat(101), email: "alex@example.com" }).error);
    assert.ok(validateUser({ name: "Alex Morgan", email: `${"a".repeat(250)}@example.com` }).error);
  });

  it("returns a helpful validation error without querying the database", async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "invalid" }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /valid email address/);
  });

  it("rejects malformed member IDs before reaching the database", async () => {
    for (const method of ["PUT", "DELETE"]) {
      const response = await fetch(`${baseUrl}/api/users/not-an-id`, {
        method,
        ...(method === "PUT" ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Alex Morgan", email: "alex@example.com" }),
        } : {}),
      });
      assert.equal(response.status, 400);
      assert.match((await response.json()).message, /valid member ID/);
    }
  });

  it("returns a clear error for malformed JSON", async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid",
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /valid JSON/);
  });
});
