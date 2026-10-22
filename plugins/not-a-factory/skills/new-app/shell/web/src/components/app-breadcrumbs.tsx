import { Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Each route names itself for the breadcrumbs with `staticData: { title }`:
// createFileRoute("/claims")({ staticData: { title: "Claims" }, component }).
// A route with no title has no breadcrumb.
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    title?: string;
  }
}

/** Where the person is: one breadcrumb for each route that matches. */
export function AppBreadcrumbs() {
  const crumbs = useMatches().filter((match) => match.staticData.title);
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((match, index) => (
          <Fragment key={match.id}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === crumbs.length - 1 ? (
                <BreadcrumbPage>{match.staticData.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link to={match.pathname} />}>
                  {match.staticData.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
