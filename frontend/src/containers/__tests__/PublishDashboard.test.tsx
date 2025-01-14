import React from "react";
import {
  render,
  fireEvent,
  act,
  screen,
  waitFor,
} from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import BackendService from "../../services/BackendService";
import PublishDashboard from "../PublishDashboard";

jest.mock("../../services/BackendService");
jest.mock("../../hooks");

beforeEach(() => {
  const history = createMemoryHistory();
  history.push("/admin/dashboard/123/publish");

  render(
    <Router history={history}>
      <Route path="/admin/dashboard/:dashboardId/publish">
        <PublishDashboard />
      </Route>
    </Router>
  );
});

test("renders dashboard title", () => {
  expect(
    screen.getByRole("heading", {
      name: "My AWS Dashboard",
    })
  ).toBeInTheDocument();
});

test("renders topic area", () => {
  expect(screen.getByText("Bananas")).toBeInTheDocument();
});

test("renders step indicator in step 1", () => {
  expect(
    screen.getByRole("heading", { name: "Step 1 of 3 Internal version notes" })
  ).toBeInTheDocument();
});

test("continue button advances to step 2 and saves releaseNotes", async () => {
  fireEvent.input(screen.getByLabelText("Internal release notes"), {
    target: {
      value: "Some release notes",
    },
  });

  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue",
      })
    );
  });

  expect(BackendService.publishPending).toBeCalledWith(
    "123",
    expect.anything(),
    "Some release notes"
  );

  expect(
    screen.getByRole("heading", {
      name: "Step 2 of 3 Confirm URL",
    })
  ).toBeInTheDocument();
});

test("publish button invokes BackendService", async () => {
  fireEvent.input(screen.getByLabelText("Internal release notes"), {
    target: {
      value: "Some release notes",
    },
  });

  // Move to step 2
  fireEvent.click(
    screen.getByRole("button", {
      name: "Continue",
    })
  );

  // Move to step 3, but wait for release notes to be saved first
  await waitFor(() => expect(BackendService.publishPending).toHaveBeenCalled());
  fireEvent.click(
    screen.getByRole("button", {
      name: "Continue",
    })
  );

  await act(async () => {
    fireEvent.click(screen.getByTestId("AcknowledgementCheckboxLabel"));
  });

  expect(
    screen.getByRole("heading", {
      name: "Step 3 of 3 Review and publish",
    })
  ).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Publish",
      })
    );
  });

  expect(BackendService.publishDashboard).toBeCalled();
});

test("return to draft button invokes BackendService", async () => {
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Return to draft",
      })
    );
  });
  expect(BackendService.moveToDraft).toBeCalled();
});
