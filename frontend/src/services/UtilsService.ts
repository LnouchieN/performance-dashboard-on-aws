import {
  ChartType,
  Dashboard,
  DashboardState,
  PublicDashboard,
  PublicTopicArea,
} from "../models";

/**
 * Takes an array of dashboards and groups them by topic area.
 * Returns the list of topic areas, each with their corresponding
 * dashboards.
 */
function groupByTopicArea(
  dashboards: Array<Dashboard | PublicDashboard>
): Array<PublicTopicArea> {
  const byId: { [id: string]: PublicTopicArea } = {};
  dashboards.forEach((dashboard) => {
    let topicarea: PublicTopicArea;
    const id = dashboard.topicAreaId;
    if (byId[id]) {
      topicarea = byId[id];
      topicarea.dashboards?.push(dashboard);
    } else {
      topicarea = {
        id,
        name: dashboard.topicAreaName,
        dashboards: [dashboard],
      };
    }
    byId[id] = topicarea;
  });
  return Object.values(byId);
}

function getChartTypeLabel(chartType: string): string {
  return chartType === ChartType.PartWholeChart
    ? "Part-to-whole Chart"
    : chartType.split(/(?=[A-Z])/).join(" ");
}

function validateEmails(input: string): boolean {
  const emails = input.split(",").map((email) => email.trim());
  return emails.every(emailIsValid);
}

function emailIsValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function timeout(delay: number) {
  return new Promise((res) => setTimeout(res, delay));
}

function getLargestHeader(headers: Array<string>, data?: Array<any>) {
  return (
    data
      ?.map((d) => (d as any)[headers.length ? headers[0] : ""])
      .map((c) => c.toString().length)
      .reduce((a, b) => (a > b ? a : b), 0) || 0
  );
}

/**
 * Given a dashboard, it returns the URL path of the screen
 * where the user should be redirected: /dashboard/edit/{id},
 * /dashboard/{id}, etc. This depends on the dashboard state.
 */
function getDashboardUrlPath(dashboard?: Dashboard) {
  if (!dashboard) return "/admin/dashboards";
  switch (dashboard.state) {
    case DashboardState.Draft:
      return `/admin/dashboard/edit/${dashboard.id}`;
    case DashboardState.PublishPending:
      return `/admin/dashboard/${dashboard.id}/publish`;
    case DashboardState.Archived:
      return `/admin/dashboard/${dashboard.id}`;
    case DashboardState.Published:
      return `/admin/dashboard/${dashboard.id}`;
    default:
      return "/admin/dashboards";
  }
}

const UtilsService = {
  groupByTopicArea,
  getChartTypeLabel,
  validateEmails,
  timeout,
  getLargestHeader,
  getDashboardUrlPath,
};

export default UtilsService;
