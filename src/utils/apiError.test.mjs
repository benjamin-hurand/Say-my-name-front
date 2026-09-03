import assert from "node:assert/strict";
import { test } from "node:test";

import { getApiErrorMessage, getApiStatus } from "./apiError.ts";

test("extracts the business detail from a 409 ProblemDetail", () => {
  const error = {
    message: "Request failed with status code 409",
    response: {
      status: 409,
      data: {
        title: "Conflict",
        detail: "Ce concept est déjà utilisé par un attribut de ce tenant",
      },
    },
  };

  assert.equal(
    getApiErrorMessage(error, "Erreur lors de l'enregistrement"),
    "Ce concept est déjà utilisé par un attribut de ce tenant",
  );
  assert.equal(getApiStatus(error), 409);
});

test("uses the supplied fallback instead of Axios' generic status message", () => {
  const error = {
    message: "Request failed with status code 409",
    response: { status: 409 },
  };

  assert.equal(
    getApiErrorMessage(error, "Erreur lors de l'enregistrement"),
    "Erreur lors de l'enregistrement",
  );
});
