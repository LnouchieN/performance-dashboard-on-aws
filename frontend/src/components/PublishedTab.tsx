import React, { useState } from "react";
import { Dashboard } from "../models";
import Button from "./Button";
import Search from "./Search";
import DashboardsTable from "./DashboardsTable";
import ScrollTop from "./ScrollTop";
import AlertContainer from "../containers/AlertContainer";

interface Props {
  dashboards: Array<Dashboard>;
}

function PublishedTab(props: Props) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Array<Dashboard>>([]);
  const [canUpdateOnly, setCanUpdateOnly] = useState<boolean>(false);

  const onSearch = (query: string) => {
    setFilter(query);
  };

  const onSelect = (selectedDashboards: Array<Dashboard>) => {
    setSelected(selectedDashboards);
  };

  const filterDashboards = (dashboards: Array<Dashboard>): Array<Dashboard> => {
    return dashboards.filter((dashboard) => {
      const name = dashboard.name.toLowerCase().trim();
      const query = filter.toLowerCase();
      return name.includes(query);
    });
  };

  const sortDashboards = (dashboards: Array<Dashboard>): Array<Dashboard> => {
    return [...dashboards].sort((a, b) => {
      return a.updatedAt > b.updatedAt ? -1 : 1;
    });
  };

  return (
    <div>
      <p>
        These are all of the published dashboards. You can view all dashboards
        but you need editor access in order to update a published dashboard.
      </p>
      <div className="grid-row margin-y-3">
        <div className="tablet:grid-col-7 text-left padding-top-1px">
          <ul className="usa-button-group">
            <li className="usa-button-group__item">
              <span>
                <Search id="search" onSubmit={onSearch} size="small" />
              </span>
            </li>
            <li className="usa-button-group__item padding-top-1 margin-left-1">
              <span>
                <input
                  id="can-update-only"
                  type="checkbox"
                  checked={canUpdateOnly}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setCanUpdateOnly(e.target.checked);
                  }}
                />
                <label htmlFor="can-update-only" className="margin-left-1">
                  Show only dashboards I can update
                </label>
              </span>
            </li>
          </ul>
        </div>
        <div className="tablet:grid-col-5 text-right">
          <span>
            <Button variant="base" disabled={selected.length === 0}>
              Archive
            </Button>
          </span>
          <span>
            <Button variant="base" disabled={selected.length === 0}>
              Update
            </Button>
          </span>
        </div>
      </div>
      <AlertContainer />
      <DashboardsTable
        dashboards={sortDashboards(filterDashboards(props.dashboards))}
        onSelect={onSelect}
      />
      <div className="text-right">
        <ScrollTop />
      </div>
    </div>
  );
}

export default PublishedTab;