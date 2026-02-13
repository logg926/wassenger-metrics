"use client";

import { Refine } from "@refinedev/core";
import { ThemedLayout, ThemedTitle, useNotificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/nextjs-router";
import dataProvider from "@refinedev/simple-rest";
import "@refinedev/antd/dist/reset.css";
import React, { Suspense } from "react";
import { ConfigProvider, App as AntApp } from "antd";

const API_URL = "/api/crm";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <AntApp>
        <Suspense fallback={<div>Loading App...</div>}>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider(API_URL)}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "school",
                list: "/crm/schools",
                show: "/crm/schools/show/:id",
                create: "/crm/schools/create",
                edit: "/crm/schools/edit/:id",
                meta: { label: "Schools", idColumnName: "school_id" },
              },
              {
                name: "department",
                list: "/crm/departments",
                show: "/crm/departments/show/:id",
                create: "/crm/departments/create",
                edit: "/crm/departments/edit/:id",
                meta: { label: "Departments" },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              disableTelemetry: true,
            }}
          >
            <ThemedLayout
              Title={(props) => <ThemedTitle {...props} text="School CRM" />}
            >
              {children}
            </ThemedLayout>
          </Refine>
        </Suspense>
      </AntApp>
    </ConfigProvider>
  );
}
