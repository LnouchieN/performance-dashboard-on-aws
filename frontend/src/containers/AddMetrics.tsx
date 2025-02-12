import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import {
  Metric,
  WidgetType,
  LocationState,
  Dataset,
  DatasetSchema,
  DatasetType,
} from "../models";
import {
  useDashboard,
  useDateTimeFormatter,
  useSettings,
  useDatasets,
} from "../hooks";
import BackendService from "../services/BackendService";
import Breadcrumbs from "../components/Breadcrumbs";
import MetricsWidget from "../components/MetricsWidget";
import TextField from "../components/TextField";
import Button from "../components/Button";
import MetricsList from "../components/MetricsList";
import OrderingService from "../services/OrderingService";
import StorageService from "../services/StorageService";
import StepIndicator from "../components/StepIndicator";
import Link from "../components/Link";
import Table from "../components/Table";
import UtilsService from "../services/UtilsService";
import Spinner from "../components/Spinner";

interface FormValues {
  title: string;
  showTitle: boolean;
  oneMetricPerRow: boolean;
  datasetType: string;
}

interface PathParams {
  dashboardId: string;
}

function AddMetrics() {
  const history = useHistory<LocationState>();
  const { state } = history.location;
  const { dashboardId } = useParams<PathParams>();
  const dateFormatter = useDateTimeFormatter();
  const { dashboard, loading } = useDashboard(dashboardId);
  const { dynamicMetricDatasets } = useDatasets();
  const { settings } = useSettings();
  const {
    register,
    errors,
    handleSubmit,
    getValues,
    reset,
  } = useForm<FormValues>();
  const [dynamicJson, setDynamicJson] = useState<Array<any>>([]);
  const [dynamicDataset, setDynamicDataset] = useState<Dataset | undefined>(
    undefined
  );
  const [fileLoading, setFileLoading] = useState(false);
  const [creatingWidget, setCreatingWidget] = useState(false);
  const [title, setTitle] = useState(
    state && state.metricTitle !== undefined ? state.metricTitle : ""
  );
  const [showTitle, setShowTitle] = useState(
    state && state.showTitle !== undefined ? state.showTitle : true
  );
  const [oneMetricPerRow, setOneMetricPerRow] = useState(
    state && state.oneMetricPerRow !== undefined ? state.oneMetricPerRow : false
  );
  const [metrics, setMetrics] = useState<Array<Metric>>(
    state && state.metrics ? [...state.metrics] : []
  );
  const [step, setStep] = useState<number>(state && state.metrics ? 1 : 0);
  const [datasetType, setDatasetType] = useState<DatasetType | undefined>(
    state && state.metrics ? DatasetType.CreateNew : undefined
  );

  useEffect(() => {
    if (datasetType) {
      reset({
        title,
        showTitle,
        oneMetricPerRow,
        datasetType,
      });
    }
  }, []);

  const rows = useMemo(() => dynamicMetricDatasets, [dynamicMetricDatasets]);
  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "fileName",
        Cell: (props: any) => {
          return (
            <div className="tooltip">
              {props.value}
              <span className="tooltiptext">Tooltip text</span>
            </div>
          );
        },
      },
      {
        Header: "Last updated",
        accessor: "updatedAt",
        Cell: (props: any) => dateFormatter(props.value),
      },
      {
        Header: "Description",
        accessor: "description",
      },
      {
        Header: "Tags",
        accessor: "tags",
      },
    ],
    [dateFormatter, settings]
  );

  const uploadDataset = async (): Promise<Dataset> => {
    setFileLoading(true);
    const uploadResponse = await StorageService.uploadMetric(
      JSON.stringify(metrics)
    );

    const newDataset = await BackendService.createDataset(
      title,
      {
        raw: uploadResponse.s3Keys.raw,
        json: uploadResponse.s3Keys.json,
      },
      DatasetSchema.Metrics
    );

    setFileLoading(false);
    return newDataset;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (datasetType) {
        let newDataset;
        if (datasetType === DatasetType.DynamicDataset) {
          newDataset = { ...dynamicDataset };
        } else {
          newDataset = await uploadDataset();
        }

        setCreatingWidget(true);
        await BackendService.createWidget(
          dashboardId,
          values.title,
          WidgetType.Metrics,
          values.showTitle,
          {
            title: values.title,
            datasetId: newDataset.id,
            s3Key: newDataset.s3Key,
            oneMetricPerRow: values.oneMetricPerRow,
            datasetType,
          }
        );
        setCreatingWidget(false);

        history.push(`/admin/dashboard/edit/${dashboardId}`, {
          alert: {
            type: "success",
            message: `"${values.title}" metrics have been successfully added`,
          },
        });
      }
    } catch (err) {
      console.log("Failed to save content item", err);
      setCreatingWidget(false);
    }
  };

  const onAddMetric = async () => {
    history.push(`/admin/dashboard/${dashboardId}/add-metric`, {
      metrics,
      showTitle,
      oneMetricPerRow,
      metricTitle: title,
      origin: history.location.pathname,
    });
  };

  const onEditMetric = async (metric: Metric, position: number) => {
    history.push(`/admin/dashboard/${dashboardId}/edit-metric`, {
      metrics,
      metric,
      position,
      showTitle,
      oneMetricPerRow,
      metricTitle: title,
      origin: history.location.pathname,
    });
  };

  const onDeleteMetric = (metric: Metric) => {
    const newMetrics = metrics.filter((m) => m !== metric);
    setMetrics(newMetrics);
  };

  const onCancel = () => {
    history.push(`/admin/dashboard/edit/${dashboardId}`);
  };

  const onMoveMetricUp = async (index: number) => {
    return setMetricOrder(index, index - 1);
  };

  const onMoveMetricDown = async (index: number) => {
    return setMetricOrder(index, index + 1);
  };

  const setMetricOrder = async (index: number, newIndex: number) => {
    const widgets = OrderingService.moveMetric(metrics, index, newIndex);

    // if no change in order ocurred, exit
    if (widgets === metrics) {
      return;
    }

    setMetrics(widgets);
  };

  const onFormChange = () => {
    const { title, showTitle, oneMetricPerRow } = getValues();
    setTitle(title);
    setShowTitle(showTitle);
    setOneMetricPerRow(oneMetricPerRow);
  };

  const goBack = () => {
    history.push(`/admin/dashboard/${dashboardId}/add-content`);
  };

  const handleChange = async (event: React.FormEvent<HTMLFieldSetElement>) => {
    const target = event.target as HTMLInputElement;
    if (target.name === "datasetType") {
      const datasetType = target.value as DatasetType;
      setDatasetType(datasetType);
      await UtilsService.timeout(0);
      if (datasetType === DatasetType.DynamicDataset) {
        setMetrics(dynamicJson);
      }
      if (datasetType === DatasetType.CreateNew) {
        setMetrics([]);
      }
    }
  };

  const selectDynamicDataset = useCallback(async (selectedDataset: Dataset) => {
    if (
      selectedDataset &&
      selectedDataset.s3Key &&
      selectedDataset.s3Key.json
    ) {
      const jsonFile = selectedDataset.s3Key.json;
      const dataset = await StorageService.downloadJson(jsonFile);
      setDynamicJson(dataset);
      setMetrics(dataset);
      setDynamicDataset(selectedDataset);
    }
  }, []);

  const onSelect = useCallback((selectedDataset: Array<Dataset>) => {
    selectDynamicDataset(selectedDataset[0]);
  }, []);

  const advanceStep = () => {
    setStep(1);
  };

  const backStep = () => {
    setStep(0);
    console.log(metrics);
    console.log(datasetType);
  };

  const crumbs = [
    {
      label: "Dashboards",
      url: "/admin/dashboards",
    },
    {
      label: dashboard?.name,
      url: `/admin/dashboard/edit/${dashboardId}`,
    },
  ];

  if (!loading) {
    crumbs.push({
      label: "Add metrics",
      url: "",
    });
  }

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <h1>Add metrics</h1>

      {fileLoading || creatingWidget ? (
        <Spinner
          className="text-center margin-top-6"
          label={`${fileLoading ? "Uploading file" : "Creating metrics"}`}
        />
      ) : (
        <div className="grid-row width-desktop">
          <form onChange={onFormChange} onSubmit={handleSubmit(onSubmit)}>
            <div className="grid-col-12">
              <div className="grid-col-6">
                <StepIndicator
                  current={step}
                  segments={[
                    {
                      label: "Choose data",
                    },
                    {
                      label: "Visualize",
                    },
                  ]}
                  showStepChart={true}
                  showStepText={false}
                />
              </div>
            </div>

            <div hidden={step !== 0}>
              <div className="grid-col-6">
                <label htmlFor="fieldset" className="usa-label text-bold">
                  Data
                </label>
                <div className="usa-hint">
                  Choose an existing dataset or create a new one to populate
                  this metrics.{" "}
                  <Link to="/admin/apihelp" target="_blank" external>
                    How do I add datasets?
                  </Link>
                </div>
              </div>
              <fieldset
                id="fieldset"
                className="usa-fieldset"
                onChange={handleChange}
              >
                <legend className="usa-sr-only">Content item types</legend>

                <div className="grid-row">
                  <div className="grid-col-4 padding-right-2">
                    <div className="usa-radio">
                      <div
                        className={`grid-row hover:bg-base-lightest hover:border-base flex-column border-base${
                          datasetType === DatasetType.CreateNew
                            ? " bg-base-lightest"
                            : "-lighter"
                        } border-2px padding-2 margin-y-1`}
                      >
                        <div className="grid-col flex-5">
                          <input
                            className="usa-radio__input"
                            id="createNew"
                            value="CreateNew"
                            type="radio"
                            name="datasetType"
                            ref={register()}
                          />
                          <label
                            className="usa-radio__label"
                            htmlFor="createNew"
                          >
                            Create new
                          </label>
                        </div>
                        <div className="grid-col flex-7">
                          <div className="usa-prose text-base margin-left-4">
                            Create a metrics group from scratch using the visual
                            editor
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid-col-4 padding-left-2">
                    <div className="usa-radio">
                      <div
                        className={`grid-row hover:bg-base-lightest hover:border-base flex-column border-base${
                          datasetType === DatasetType.DynamicDataset
                            ? " bg-base-lightest"
                            : "-lighter"
                        } border-2px padding-2 margin-y-1`}
                      >
                        <div className="grid-col flex-5">
                          <input
                            className="usa-radio__input"
                            id="dynamicDataset"
                            value="DynamicDataset"
                            type="radio"
                            name="datasetType"
                            ref={register()}
                          />
                          <label
                            className="usa-radio__label"
                            htmlFor="dynamicDataset"
                          >
                            Dynamic dataset
                          </label>
                        </div>
                        <div className="grid-col flex-7">
                          <div className="usa-prose text-base margin-left-4">
                            Choose from a list of continuously updated datasets.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div hidden={datasetType !== DatasetType.DynamicDataset}>
                  <div className="overflow-hidden">
                    <Table
                      selection="single"
                      initialSortByField="updatedAt"
                      rows={rows}
                      screenReaderField="name"
                      width="100%"
                      onSelection={onSelect}
                      columns={columns}
                    />
                  </div>
                </div>
              </fieldset>
              <br />
              <br />
              <hr />
              <Button variant="outline" type="button" onClick={goBack}>
                Back
              </Button>
              <Button
                type="button"
                onClick={advanceStep}
                disabled={
                  !datasetType ||
                  (datasetType === DatasetType.DynamicDataset &&
                    !metrics.length)
                }
              >
                Continue
              </Button>
              <Button
                variant="unstyled"
                className="text-base-dark hover:text-base-darker active:text-base-darkest"
                type="button"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>

            <div hidden={step !== 1}>
              <div className="grid-row width-desktop">
                <div className="grid-col-5">
                  <fieldset className="usa-fieldset">
                    <TextField
                      id="title"
                      name="title"
                      label="Metrics title"
                      hint="Give your group of metrics a descriptive title."
                      error={errors.title && "Please specify a content title"}
                      required
                      defaultValue={title}
                      register={register}
                    />

                    <div className="usa-checkbox">
                      <input
                        className="usa-checkbox__input"
                        id="display-title"
                        type="checkbox"
                        name="showTitle"
                        defaultChecked={showTitle}
                        ref={register()}
                      />
                      <label
                        className="usa-checkbox__label"
                        htmlFor="display-title"
                      >
                        Show title on dashboard
                      </label>
                    </div>

                    <MetricsList
                      metrics={metrics}
                      onClick={onAddMetric}
                      onEdit={onEditMetric}
                      onDelete={onDeleteMetric}
                      onMoveUp={onMoveMetricUp}
                      onMoveDown={onMoveMetricDown}
                      defaultChecked={oneMetricPerRow}
                      register={register}
                      allowAddMetric={datasetType === DatasetType.CreateNew}
                    />
                  </fieldset>
                  <br />
                  <br />
                  <hr />
                  <Button variant="outline" type="button" onClick={backStep}>
                    Back
                  </Button>
                  <Button
                    disabled={!title || creatingWidget || fileLoading}
                    type="submit"
                  >
                    Add Metrics
                  </Button>
                  <Button
                    variant="unstyled"
                    className="text-base-dark hover:text-base-darker active:text-base-darkest"
                    type="button"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="grid-col-7">
                  <div className="margin-left-4">
                    <h4 className="margin-top-4">Preview</h4>
                    <MetricsWidget
                      title={showTitle ? title : ""}
                      metrics={metrics}
                      metricPerRow={oneMetricPerRow ? 1 : 3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default AddMetrics;
