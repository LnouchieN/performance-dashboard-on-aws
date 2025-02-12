import React from "react";
import {
  Widget,
  WidgetType,
  ChartWidget,
  TableWidget,
  ImageWidget,
  MetricsWidget,
} from "../models";
import { useWidgetDataset, useImage } from "../hooks";
import ChartWidgetComponent from "../components/ChartWidget";
import TableWidgetComponent from "../components/TableWidget";
import TextWidget from "../components/TextWidget";
import ImageWidgetComponent from "../components/ImageWidget";
import MetricsWidgetComponent from "../components/MetricsWidget";

interface Props {
  widget: Widget;
}

function WidgetRender({ widget }: Props) {
  switch (widget.widgetType) {
    case WidgetType.Text:
      return <TextWidget widget={widget} />;
    case WidgetType.Chart:
      return <ChartWidgetComponent widget={widget as ChartWidget} />;
    case WidgetType.Table:
    case WidgetType.Metrics:
      return <WidgetWithDataset widget={widget} />;
    case WidgetType.Image:
      return <WidgetWithImage widget={widget as ImageWidget} />;
    default:
      return null;
  }
}

function WidgetWithImage({ widget }: Props) {
  const imageWidget = widget as ImageWidget;
  const content = imageWidget.content;
  const file = useImage(content.s3Key.raw);

  return (
    <ImageWidgetComponent
      title={imageWidget.showTitle ? content.title : ""}
      summary={content.summary ? content.summary : ""}
      summaryBelow={content.summaryBelow}
      file={file.file}
      altText={content.imageAltText}
    />
  );
}

function WidgetWithDataset({ widget }: Props) {
  const { json, jsonHeaders } = useWidgetDataset(widget);
  switch (widget.widgetType) {
    case WidgetType.Table:
      const tableWidget = widget as TableWidget;
      return (
        <TableWidgetComponent
          title={tableWidget.showTitle ? tableWidget.content.title : ""}
          summary={tableWidget.content.summary}
          headers={jsonHeaders}
          data={json}
          summaryBelow={tableWidget.content.summaryBelow}
        />
      );
    case WidgetType.Metrics:
      const metricsWidget = widget as MetricsWidget;
      return (
        <MetricsWidgetComponent
          title={metricsWidget.showTitle ? metricsWidget.content.title : ""}
          metrics={json}
          metricPerRow={metricsWidget.content.oneMetricPerRow ? 1 : 3}
        />
      );
    default:
      return null;
  }
}

export default WidgetRender;
