import React, { useState, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { Dashboard } from "../models";
import { useDateTimeFormatter, useSettings } from "../hooks";
import Button from "./Button";
import Search from "./Search";
import ScrollTop from "./ScrollTop";
import Table from "./Table";
import Link from "./Link";
import DropdownMenu from "../components/DropdownMenu";

const { MenuItem, MenuLink } = DropdownMenu;

interface Props {
  dashboards: Array<Dashboard>;
  onDelete: Function;
}

function DraftsTab(props: Props) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Array<Dashboard>>([]);
  const { settings } = useSettings();
  const dateFormatter = useDateTimeFormatter();
  const history = useHistory();
  const { dashboards } = props;

  const createDashboard = () => {
    history.push("/admin/dashboard/create");
  };

  const onSearch = (query: string) => {
    setFilter(query);
  };

  const onSelect = useCallback((selectedDashboards: Array<Dashboard>) => {
    setSelected(selectedDashboards);
  }, []);

  return (
    <div>
      <p>
        You have access to view, edit, and/or publish the draft dashboards in
        this table.
      </p>
      <div className="grid-row margin-y-3">
        <div className="tablet:grid-col-3 padding-top-1px">
          <Search id="search" onSubmit={onSearch} size="small" />
        </div>
        <div className="tablet:grid-col-9 text-right">
          <span>
            <DropdownMenu buttonText="Actions" variant="outline">
              <MenuLink
                href={
                  selected.length === 1
                    ? `/admin/dashboard/${selected[0].id}/history`
                    : "#"
                }
                disabled={selected.length !== 1}
              >
                View history
              </MenuLink>
              <MenuItem
                onSelect={() => props.onDelete(selected)}
                disabled={selected.length === 0}
              >
                Delete
              </MenuItem>
            </DropdownMenu>
          </span>
          <span>
            <Button onClick={createDashboard}>Create dashboard</Button>
          </span>
        </div>
      </div>
      <Table
        selection="multiple"
        initialSortByField="updatedAt"
        filterQuery={filter}
        rows={React.useMemo(() => dashboards, [dashboards])}
        screenReaderField="name"
        onSelection={onSelect}
        width="100%"
        columns={React.useMemo(
          () => [
            {
              Header: "Dashboard name",
              accessor: "name",
              Cell: (props: any) => {
                const dashboard = props.row.original as Dashboard;
                return (
                  <Link to={`/admin/dashboard/edit/${dashboard.id}`}>
                    <span className="text-bold text-base-darkest">
                      {dashboard.name}
                    </span>
                  </Link>
                );
              },
            },
            {
              Header: settings.topicAreaLabels.singular,
              accessor: "topicAreaName",
            },
            {
              Header: "Last Updated",
              accessor: "updatedAt",
              Cell: (props: any) => dateFormatter(props.value),
            },
            {
              Header: "Created by",
              accessor: "createdBy",
            },
          ],
          [dateFormatter, settings]
        )}
      />
      <div className="text-right">
        <ScrollTop />
      </div>
    </div>
  );
}

export default DraftsTab;
