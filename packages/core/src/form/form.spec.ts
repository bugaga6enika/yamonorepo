import { describe, expect, expectTypeOf, test } from "vitest";
import { form } from "./form";
import { FormControl, IFormControl } from "./form-control";

describe("form", () => {
  test("should expose nested object fields as nested form controls", () => {
    const bookForm = form({
      title: "Dune",
      author: {
        name: "Frank",
        surname: "Herbert",
      },
    });

    expect(bookForm.title).toBeInstanceOf(FormControl);
    expect(bookForm.author.name).toBeInstanceOf(FormControl);
    expect(bookForm.author.surname.value).toBe("Herbert");
  });

  test("should submit nested object values", async () => {
    const bookForm = form(
      {
        title: "Dune",
        author: {
          name: "Frank",
          surname: "Herbert",
        },
      },
      undefined,
      async (_, context) => context,
    );

    bookForm.author.name.setValue("Brian");

    await expect(
      bookForm.submit(new AbortController().signal),
    ).resolves.toEqual({
      title: "Dune",
      author: {
        name: "Brian",
        surname: "Herbert",
      },
    });
  });

  test("should resolve dot-path controls for cross-group validation", () => {
    const bookForm = form(
      {
        title: "Frank",
        author: {
          name: "Frank",
          surname: "Herbert",
        },
      },
      {
        author: {
          name: {
            validators: [
              ({ controlOf }) =>
                (value) => {
                  const titleControl = controlOf("title");
                  const surnameControl = controlOf("author.surname");

                  if (
                    titleControl &&
                    "value" in titleControl &&
                    surnameControl &&
                    "value" in surnameControl &&
                    value === titleControl.value &&
                    surnameControl.value === "Herbert"
                  ) {
                    return undefined;
                  }

                  return { crossGroup: true };
                },
            ],
          },
        },
      },
    );

    expect(bookForm.getControl("author.name")).toBe(bookForm.author.name);
    expect(bookForm.author.getControl("name")).toBe(bookForm.author.name);
    expect(bookForm.author.name.validate()).toBe(undefined);

    bookForm.title.setValue("Someone else");

    expect(bookForm.author.name.validate()).toEqual({ crossGroup: true });
  });

  test("should strongly type dot-path control lookup", () => {
    const bookForm = form({
      title: "Dune",
      author: {
        name: "Frank",
        surname: "Herbert",
      },
    });

    expectTypeOf(bookForm.getControl("title")).toEqualTypeOf<
      IFormControl<string> | undefined
    >();
    expectTypeOf(bookForm.getControl("author.name")).toEqualTypeOf<
      IFormControl<string> | undefined
    >();
    expectTypeOf(bookForm.getControl("author")).toEqualTypeOf<
      typeof bookForm.author | undefined
    >();

    if (false) {
      bookForm.getControl("author.middleName");
      bookForm.getControl("publisher");
    }
  });
});
