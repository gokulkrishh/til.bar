import { describe, expect, test } from "bun:test";
import { normalizeUrl, urlVariants } from "@/lib/duplicate";

describe("urlVariants", () => {
  test("includes scheme and trailing-slash combinations", () => {
    const variants = urlVariants("https://example.com/post");

    expect(variants).toContain("https://example.com/post");
    expect(variants).toContain("https://example.com/post/");
    expect(variants).toContain("http://example.com/post");
    expect(variants).toContain("http://example.com/post/");
  });

  test("handles root URLs with and without trailing slash", () => {
    const variants = urlVariants("https://example.com");

    expect(variants).toContain("https://example.com");
    expect(variants).toContain("https://example.com/");
    expect(variants).toContain("http://example.com");
    expect(variants).toContain("http://example.com/");
  });

  test("lowercases the host", () => {
    expect(urlVariants("https://Example.COM/Post")).toContain(
      "https://example.com/Post",
    );
  });

  test("preserves query params and fragments", () => {
    const variants = urlVariants("https://example.com/post?a=1#section");

    expect(variants).toContain("http://example.com/post?a=1#section");
    expect(variants).toContain("https://example.com/post/?a=1#section");
    for (const variant of variants) {
      expect(variant).toContain("?a=1#section");
    }
  });

  test("returns only the input for non-URL strings", () => {
    expect(urlVariants("not a url")).toEqual(["not a url"]);
  });

  test("returns only the input for non-http schemes", () => {
    expect(urlVariants("ftp://example.com/file")).toEqual([
      "ftp://example.com/file",
    ]);
  });
});

describe("normalizeUrl", () => {
  test("upgrades http to https", () => {
    expect(normalizeUrl("http://example.com/post")).toBe(
      "https://example.com/post",
    );
  });

  test("strips the trailing slash", () => {
    expect(normalizeUrl("https://example.com/post/")).toBe(
      "https://example.com/post",
    );
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com");
  });

  test("lowercases the host but not the path", () => {
    expect(normalizeUrl("https://Example.COM/Post")).toBe(
      "https://example.com/Post",
    );
  });

  test("keeps query params and fragments", () => {
    expect(normalizeUrl("http://example.com/post/?a=1#s")).toBe(
      "https://example.com/post?a=1#s",
    );
  });

  test("returns non-URL input unchanged", () => {
    expect(normalizeUrl("not a url")).toBe("not a url");
  });
});
