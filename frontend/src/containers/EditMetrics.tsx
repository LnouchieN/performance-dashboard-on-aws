import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import {
  Metric,
  LocationState,
  Dataset,
  DatasetSchema,
  DatasetType,
} from "../models";
import { useDashboard, useWidget } from "../hooks";
import BackendService from "../services/BackendService";
import Breadcrumbs from "../components/Breadcrumbs";
import MetricsWidget from "../components/MetricsWidget";
import TextField from "../components/TextField";
import Button from "../components/Button";
import MetricsList from "../components/MetricsList";
import OrderingService from "../services/OrderingService";
import StorageService from "../services/StorageService";
import Spinner from "../components/Spinner";

interface FormValues {
  title: string;
  showTitle: boolean;
  oneMetricPerRow: boolean;
}

interface PathParams {
  dashboardId: string;
  widgetId: string;
}

function EditMetrics() {
  const history = useHistory<LocationState>();
  const { state } = history.location;
  const { dashboardId, widgetId } = useParams<PathParams>();
  const { dashboard, loading } = useDashboard(dashboardId);
  const {
    register,
    errors,
    handleSubmit,
    getValues,
    reset,
  } = useForm<FormValues>();
  const [fileLoading, setFileLoading] = useState(false);
  const [editingWidget, setEditingWidget] = useState(false);
  const { widget, currentJson } = useWidget(dashboardId, widgetId);

  const [title, setTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [oneMetricPerRow, setOneMetricPerRow] = useState(false);
  const [metrics, setMetrics] = useState<Array<Metric>>([]);

  useEffect(() => {
    if (widget && currentJson) {
      const title =
        state && state.metricTitle !== undefined
          ? state.metricTitle
          : widget.content.title;
      const showTitle =
        state && state.showTitle !== undefined
          ? state.showTitle
          : widget.showTitle;
      const oneMetricPerRow =
        state && state.oneMetricPerRow !== undefined
          ? state.oneMetricPerRow
          : widget.content.oneMetricPerRow;
      reset({
        title,
        showTitle,
        oneMetricPerRow,
      });
      setTitle(title);
      setShowTitle(showTitle);
      setOneMetricPerRow(oneMetricPerRow);
      setMetrics(
        state && state.metrics
          ? [...state.metrics]
          : (currentJson as Array<Metric>)
      );
    }
  }, [widget, currentJson, state, reset]);

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
    if (!widget) {
      return;
    }

    try {
      let newDataset = await uploadDataset();

      setEditingWidget(true);
      await BackendService.editWidget(
        dashboardId,
        widgetId,
        values.title,
        values.showTitle,
        {
          title: values.title,
          datasetId: newDataset.id,
          s3Key: newDataset.s3Key,
          oneMetricPerRow: values.oneMetricPerRow,
          datasetType: DatasetType.CreateNew,
        },
        widget.updatedAt
      );
      setEditingWidget(false);

      history.push(`/admin/dashboard/edit/${dashboardId}`, {
        alert: {
          type: "success",
          message: `"${values.title}" metrics have been successfully edited`,
        },
      });
    } catch (err) {
      console.log("Failed to save content item", err);
      setEditingWidget(false);
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

  if (!loading && widget) {
    crumbs.push({
      label: "Edit metrics",
      url: "",
    });
  }

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <h1>Edit metrics</h1>

      {loading || !widget || !currentJson || fileLoading || editingWidget ? (
        <Spinner
          className="text-center margin-top-9"
          label={`${
            fileLoading
              ? "Uploading file"
              : editingWidget
              ? "Editing metrics"
              : "Loading"
          }`}
        />
      ) : (
        <div className="grid-row width-desktop">
          <div className="grid-col-6">
            <form
              className="usa-form usa-form--large"
              onChange={onFormChange}
              onSubmit={handleSubmit(onSubmit)}
            >
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
                  allowAddMetric
                />
              </fieldset>
              <br />
              <br />
              <hr />
              <Button
                disabled={!title || editingWidget || fileLoading}
                type="submit"
              >
                Save
              </Button>
              <Button
                variant="unstyled"
                className="text-base-dark hover:text-base-darker active:text-base-darkest"
                type="button"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </form>
          </div>
          <div className="grid-col-6">
            <h4 className="margin-top-4">Preview</h4>
            <MetricsWidget
              title={showTitle ? title : ""}
              metrics={metrics}
              metricPerRow={oneMetricPerRow ? 1 : 3}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default EditMetrics;
